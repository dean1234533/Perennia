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
  googleSheetRange,
  rateLimitMaxRequests,
  rateLimitWindowSeconds,
  cacheTtlSeconds,
} from './config/env'
import { getCompatibilityInputSchema } from './validation/compatibility.validation'
import { resolveCompatibility, syncCompatibilityFromSheet } from './services/compatibility.service'
import { assertWithinRateLimit } from './services/rateLimit.service'
import { invalidArgument, unauthenticated, permissionDenied, internal } from './utils/errors'
import { log } from './utils/logger'

initializeApp()

const SHEET_SECRETS = [googleServiceAccountEmail, googleServiceAccountKey, googleSheetId]

// ---------------------------------------------------------------------------
// getCompatibility — the ONLY way the frontend ever touches this data.
// Input: { personalityA, personalityB }. Output: { compatibility }. Nothing else.
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
      const summary = await syncCompatibilityFromSheet({
        clientEmail: googleServiceAccountEmail.value(),
        privateKey: googleServiceAccountKey.value(),
        sheetId: googleSheetId.value(),
        range: googleSheetRange.value(),
      })
      log.info('manual_sync_triggered', { uid: request.auth.uid, rowsImported: summary.rowsImported })
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
      await syncCompatibilityFromSheet({
        clientEmail: googleServiceAccountEmail.value(),
        privateKey: googleServiceAccountKey.value(),
        sheetId: googleSheetId.value(),
        range: googleSheetRange.value(),
      })
    } catch (err) {
      log.error('scheduled_sync_failed', { message: err instanceof Error ? err.message : String(err) })
      throw err
    }
  }
)
