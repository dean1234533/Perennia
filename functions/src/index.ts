/**
 * Perennia Compatibility Fusion System — Cloud Functions entry point.
 *
 * Three functions live here:
 *   - getCompatibility          callable, any signed-in user, rate-limited
 *   - syncCompatibilityManual   callable, admin-only, for on-demand re-sync
 *   - syncCompatibilityScheduled  pubsub schedule, runs every 6 hours
 *
 * All business logic lives in services/ and repositories/ — this file is
 * intentionally thin: auth checks, input validation, and wiring only.
 */
import { initializeApp } from 'firebase-admin/app'
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onObjectFinalized } from 'firebase-functions/v2/storage'

import {
  googleServiceAccountEmail,
  googleServiceAccountKey,
  googleSheetId,
  rangeWesternSun,
  rangeWesternMoon,
  rangeWesternRising,
  rangeChineseAnimal,
  rangeChineseElement,
  rangeChineseYinYang,
  rangeInsightsLibrary,
  rangeFactorInsights,
  rateLimitMaxRequests,
  rateLimitWindowSeconds,
  cacheTtlSeconds,
  stripeSecretKey,
  stripeWebhookSecret,
  likeRateLimitMaxRequests,
  likeRateLimitWindowSeconds,
} from './config/env'
import { getCompatibilityInputSchema, computeNatalChartInputSchema } from './validation/compatibility.validation'
import { createFoundingCheckoutInputSchema, updateFounding500ConfigInputSchema } from './validation/founding500.validation'
import { likeUserInputSchema } from './validation/matching.validation'
import { resolveCompatibility, syncCompatibilityFromSheet } from './services/compatibility.service'
import { recordLike } from './repositories/matching.repository'
import { assertWithinRateLimit } from './services/rateLimit.service'
import { createVerificationSession, constructWebhookEvent, handleVerificationWebhookEvent } from './services/identity.service'
import { createFoundingCheckoutSession as createFoundingCheckoutSessionService, handleFoundingCheckoutCompleted } from './services/founding500.service'
import { ensureConfigSeeded as ensureFounding500ConfigSeeded, updateConfig as updateFounding500ConfigDoc } from './repositories/founding500.repository'
import { processUploadedVideo } from './services/videoProcessing.service'
import { computeFullNatalChart, AstrologyError } from './services/astrology.service'
import { invalidArgument, unauthenticated, permissionDenied, internal } from './utils/errors'
import { log } from './utils/logger'
import type { FusionTable } from './types/compatibility'

initializeApp()

const SHEET_SECRETS = [googleServiceAccountEmail, googleServiceAccountKey, googleSheetId]

function buildSyncParams() {
  const auth = {
    clientEmail: googleServiceAccountEmail.value(),
    privateKey: googleServiceAccountKey.value(),
    sheetId: googleSheetId.value(),
  }
  const scoreRanges: Record<FusionTable, string> = {
    sun: rangeWesternSun.value(),
    moon: rangeWesternMoon.value(),
    rising: rangeWesternRising.value(),
    animal: rangeChineseAnimal.value(),
    element: rangeChineseElement.value(),
    yinYang: rangeChineseYinYang.value(),
  }
  return {
    auth,
    scoreRanges,
    factorInsightsRange: rangeFactorInsights.value(),
    insightsLibraryRange: rangeInsightsLibrary.value(),
  }
}

// ---------------------------------------------------------------------------
// getCompatibility — the ONLY way the frontend ever touches this data.
// Input: { personA, personB } birth profiles. Output: score + band + a
// short blurb per factor + the six overall narrative sections. Never the
// underlying tables.
// ---------------------------------------------------------------------------
export const getCompatibility = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw unauthenticated('Sign in to check compatibility.')
    }

    await assertWithinRateLimit(
      request.auth.uid,
      Number(rateLimitMaxRequests.value()),
      Number(rateLimitWindowSeconds.value())
    )

    const parsed = getCompatibilityInputSchema.safeParse(request.data)
    if (!parsed.success) {
      throw invalidArgument(parsed.error.issues.map((i) => i.message).join('; '))
    }

    try {
      const result = await resolveCompatibility(parsed.data, Number(cacheTtlSeconds.value()))
      log.info('compatibility_resolved', { uid: request.auth.uid })
      return result
    } catch (err) {
      if (err instanceof HttpsError) throw err
      throw internal('getCompatibility failed', err)
    }
  }
)

// ---------------------------------------------------------------------------
// syncCompatibilityManual — admin-only, on-demand re-sync from the sheet.
// Requires a custom claim `admin: true` on the caller's auth token; see
// functions/README.md for how to grant it.
// ---------------------------------------------------------------------------
export const syncCompatibilityManual = onCall(
  { secrets: SHEET_SECRETS, timeoutSeconds: 300 },
  async (request) => {
    if (!request.auth) {
      throw unauthenticated()
    }
    if (request.auth.token.admin !== true) {
      throw permissionDenied('Admin access required.')
    }

    try {
      const summary = await syncCompatibilityFromSheet(buildSyncParams())
      log.info('manual_sync_triggered', { uid: request.auth.uid, errorCount: summary.errors.length })
      return summary
    } catch (err) {
      throw internal('Manual sync failed', err)
    }
  }
)

// ---------------------------------------------------------------------------
// syncCompatibilityScheduled — runs automatically every 6 hours. No HTTP
// surface at all; only Cloud Scheduler (internal to the GCP project) can
// invoke it, so there's nothing here for a client to call even by accident.
// ---------------------------------------------------------------------------
export const syncCompatibilityScheduled = onSchedule(
  { schedule: 'every 6 hours', secrets: SHEET_SECRETS, timeoutSeconds: 300 },
  async () => {
    try {
      await syncCompatibilityFromSheet(buildSyncParams())
    } catch (err) {
      log.error('scheduled_sync_failed', { message: err instanceof Error ? err.message : String(err) })
      throw err
    }
  }
)

// ---------------------------------------------------------------------------
// computeNatalChart — real Sun/Moon/Rising sign + Chinese zodiac from an
// actual birth date/time/place (ephemeris + geocoding + timezone math; see
// services/astrology.service.ts). No hardcoded/placeholder signs.
// ---------------------------------------------------------------------------
export const computeNatalChart = onCall({}, async (request) => {
  if (!request.auth) {
    throw unauthenticated('Sign in to compute your cosmic profile.')
  }
  const parsed = computeNatalChartInputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join('; '))
  }
  try {
    const chart = computeFullNatalChart(parsed.data.birthDate, parsed.data.birthTime, parsed.data.birthPlace)
    log.info('natal_chart_computed', { uid: request.auth.uid, city: chart.matchedCity })
    return chart
  } catch (err) {
    if (err instanceof AstrologyError) throw invalidArgument(err.message)
    throw internal('computeNatalChart failed', err)
  }
})

// ---------------------------------------------------------------------------
// createIdentityVerificationSession — starts a REAL Stripe Identity check.
// Returns a client_secret the frontend hands to Stripe.js's
// `verifyIdentity()`, which renders Stripe's own hosted document + selfie +
// liveness capture UI. We never see or store raw ID/biometric data — Stripe
// does the verification and tells us the result via the webhook below.
// ---------------------------------------------------------------------------
export const createIdentityVerificationSession = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw unauthenticated('Sign in to verify your identity.')
    }
    try {
      return await createVerificationSession({ uid: request.auth.uid, secretKey: stripeSecretKey.value() })
    } catch (err) {
      if (err instanceof HttpsError) throw err
      throw internal('createIdentityVerificationSession failed', err)
    }
  }
)

// ---------------------------------------------------------------------------
// stripeIdentityWebhook — one shared Stripe webhook endpoint for this app.
// Handles both identity-verification session results AND Founding 500
// checkout completions, dispatched by event type. Signature-verified
// against STRIPE_WEBHOOK_SECRET so only Stripe can trigger either — the
// client can never set verification status or membership itself.
// ---------------------------------------------------------------------------
export const stripeIdentityWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (request, response) => {
    const signature = request.headers['stripe-signature']
    if (typeof signature !== 'string') {
      response.status(400).send('Missing Stripe-Signature header')
      return
    }
    try {
      const event = constructWebhookEvent({
        rawBody: request.rawBody,
        signature,
        secretKey: stripeSecretKey.value(),
        webhookSecret: stripeWebhookSecret.value(),
      })

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as { metadata?: Record<string, string> }
        if (session.metadata?.founding500 === 'true') {
          await handleFoundingCheckoutCompleted(
            event.data.object as Parameters<typeof handleFoundingCheckoutCompleted>[0],
            stripeSecretKey.value()
          )
        }
      } else {
        await handleVerificationWebhookEvent(event)
      }

      response.status(200).send('ok')
    } catch (err) {
      log.error('stripe_webhook_failed', { message: err instanceof Error ? err.message : String(err) })
      response.status(400).send('Webhook error')
    }
  }
)

// ---------------------------------------------------------------------------
// Founding 500 — config read/bootstrap, admin update, and real Stripe
// subscription checkout. See services/founding500.service.ts and
// repositories/founding500.repository.ts.
// ---------------------------------------------------------------------------
// Deliberately no auth check: the Founding 500 pricing page is public (shown
// pre-signup), and this bootstrap is safe to expose unauthenticated — it
// only ever writes the fixed default config, and only if the doc doesn't
// already exist yet (see ensureConfigSeeded). It can't be used to reset or
// tamper with real config once seeded.
export const ensureFounding500Config = onCall({}, async () => {
  return ensureFounding500ConfigSeeded()
})

export const updateFounding500Config = onCall({}, async (request) => {
  if (!request.auth) throw unauthenticated()
  if (request.auth.token.admin !== true) throw permissionDenied('Admin access required.')
  const parsed = updateFounding500ConfigInputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join('; '))
  }
  const updated = await updateFounding500ConfigDoc(parsed.data)
  log.info('founding500_config_updated', { uid: request.auth.uid, fields: Object.keys(parsed.data) })
  return updated
})

export const createFoundingCheckoutSession = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  if (!request.auth) throw unauthenticated('Sign in to join the Founding 500.')
  const parsed = createFoundingCheckoutInputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join('; '))
  }
  try {
    return await createFoundingCheckoutSessionService({
      uid: request.auth.uid,
      email: request.auth.token.email,
      tier: parsed.data.tier,
      successUrl: parsed.data.successUrl,
      cancelUrl: parsed.data.cancelUrl,
      secretKey: stripeSecretKey.value(),
    })
  } catch (err) {
    if (err instanceof HttpsError) throw err
    throw internal('createFoundingCheckoutSession failed', err)
  }
})

// ---------------------------------------------------------------------------
// likeUser — the ONLY way a like is ever recorded, and the ONLY place a real
// mutual match (and its conversation) is ever created. A client can never
// read another user's likedIds, so reciprocity can only be established here,
// server-side, inside one transaction — see repositories/matching.repository.ts.
// ---------------------------------------------------------------------------
export const likeUser = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw unauthenticated('Sign in to like someone.')
  }

  const parsed = likeUserInputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join('; '))
  }

  const { targetUid } = parsed.data
  if (targetUid === request.auth.uid) {
    throw invalidArgument('You cannot like yourself.')
  }

  await assertWithinRateLimit(
    request.auth.uid,
    Number(likeRateLimitMaxRequests.value()),
    Number(likeRateLimitWindowSeconds.value()),
    'like'
  )

  try {
    const result = await recordLike(request.auth.uid, targetUid)
    log.info('like_recorded', { uid: request.auth.uid, matched: result.matched })
    return result
  } catch (err) {
    if (err instanceof HttpsError) throw err
    throw internal('likeUser failed', err)
  }
})

// ---------------------------------------------------------------------------
// processVideoUpload — triggers on every file finalized under
// users/{uid}/media/{mediaId}/incoming.*, runs real ffmpeg transcoding
// (480p/720p/1080p + poster), and updates the media doc when done.
// ---------------------------------------------------------------------------
export const processVideoUpload = onObjectFinalized(
  { memory: '2GiB', timeoutSeconds: 540, cpu: 2 },
  async (event) => {
    const filePath = event.data.name
    if (!filePath.includes('/incoming.')) return
    await processUploadedVideo(filePath, event.data.bucket)
  }
)
