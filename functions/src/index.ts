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
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'

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
  rangeSunInsights,
  rangeMoonInsights,
  rangeRisingInsights,
  rangeAnimalInsights,
  rangeElementInsights,
  rangeYinYangInsights,
  rateLimitMaxRequests,
  rateLimitWindowSeconds,
  cacheTtlSeconds,
} from './config/env'
import { getCompatibilityInputSchema } from './validation/compatibility.validation'
import { resolveCompatibility, syncCompatibilityFromSheet } from './services/compatibility.service'
import { assertWithinRateLimit } from './services/rateLimit.service'
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
  const factorInsightRanges: Record<FusionTable, string> = {
    sun: rangeSunInsights.value(),
    moon: rangeMoonInsights.value(),
    rising: rangeRisingInsights.value(),
    animal: rangeAnimalInsights.value(),
    element: rangeElementInsights.value(),
    yinYang: rangeYinYangInsights.value(),
  }
  return { auth, scoreRanges, factorInsightRanges, insightsLibraryRange: rangeInsightsLibrary.value() }
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
