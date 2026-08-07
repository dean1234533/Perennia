# Perennia Compatibility Fusion System — Backend

Secure Cloud Functions backend that keeps the proprietary compatibility
matrix in a private Google Sheet, mirrors it into a server-only Firestore
collection, and exposes exactly one narrow read path to the frontend: a
single `{ compatibility }` number for a given pair. Nothing else — not the
matrix, not other pairs, not the sheet — is ever reachable from the client
or from an AI model.

## Architecture

```
Google Sheet (private, service-account access only)
        │
        │  syncCompatibilityScheduled (every 6h)
        │  syncCompatibilityManual (admin-only, on-demand)
        ▼
Firestore: compatibilityMatrix/{pairKey}      ← client reads/writes: DENIED
        │
        │  getCompatibility(personalityA, personalityB)
        ▼
{ compatibility: 92 }                          ← the only thing the client ever sees
        │
        ▼
React app  →  (optional) AI explanation call, given ONLY the resolved score
```

### Module layout

```
functions/src/
  config/env.ts                    typed config + Secret Manager params
  types/compatibility.ts           shared domain types
  validation/compatibility.validation.ts   zod schemas (input + sheet rows)
  services/
    googleSheets.service.ts        reads the sheet via a service account
    compatibility.service.ts       orchestrates lookup / sync, owns the
                                    "only return { compatibility }" boundary
    rateLimit.service.ts           Firestore-backed fixed-window limiter
    cache.service.ts               best-effort in-memory cache
  repositories/
    compatibility.repository.ts    the ONLY module allowed to touch
                                    the compatibilityMatrix collection
  utils/
    pairKey.ts, errors.ts, logger.ts
  index.ts                         the 3 exported Cloud Functions
```

## One-time setup

### 1. Create the Google Sheet

Create a sheet with a tab (default name `CompatibilityMatrix`) with these
columns, one header row, then data from row 2:

| A            | B            | C             |
|--------------|--------------|---------------|
| personalityA | personalityB | compatibility |
| Aries        | Leo          | 92            |
| ...          | ...          | ...           |

Valid values for personalityA/personalityB are the 12 Western zodiac signs
(Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius,
Capricorn, Aquarius, Pisces) — case-insensitive, normalized to uppercase
on import. You only need one row per pair — lookups are order-independent
(`Aries`/`Leo` resolves the same as `Leo`/`Aries`), so don't duplicate
both directions.

### 2. Create a Google Service Account

1. In the [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts)
   for the **same project as Firebase** (`perennia-43763`), create a service
   account, e.g. `perennia-sheets-sync`.
2. Grant it no project-level roles — it only needs Sheet-level access (next step).
3. Create a JSON key for it and download it. You'll need `client_email` and
   `private_key` from that file.
4. Enable the **Google Sheets API** for the project if not already enabled.
5. Open the Sheet, click **Share**, and add the service account's email as a
   **Viewer**. This is what actually grants read access — the IAM role in
   step 2 is irrelevant to Sheets sharing.

### 3. Install dependencies

```bash
cd functions
npm install
```

### 4. Set secrets

```bash
firebase functions:secrets:set GOOGLE_SHEETS_CLIENT_EMAIL
firebase functions:secrets:set GOOGLE_SHEETS_PRIVATE_KEY
firebase functions:secrets:set GOOGLE_SHEET_ID
```

Paste the values when prompted. For the private key, paste it with literal
`\n` sequences intact (that's how it comes out of the downloaded JSON) —
`normalizePrivateKey()` converts them back to real newlines at runtime.

### 5. Grant yourself admin access (for manual sync)

`syncCompatibilityManual` requires a custom claim `admin: true` on the
caller's Firebase Auth token. Grant it with the included script (never
deployed — local use only):

```bash
cd functions
node scripts/grant-admin.js <firebase-auth-uid>
```

The user must sign out/in (or force-refresh their ID token) for the new
claim to take effect client-side. Revoke with `--revoke`.

## Local development

```bash
cd functions
cp .env.example .env.local   # fill in the same three secret values
npm run serve                 # builds + starts the emulator suite
```

The emulator reads `.env.local` automatically for `defineSecret` values
when running locally — you do not need real Secret Manager access to
develop against the emulator.

## Deployment

```bash
firebase deploy --only functions
firebase deploy --only firestore:rules
```

Deploy rules whenever `firestore.rules` changes — Cloud Functions
deployment does not touch security rules.

## Calling it from the frontend

```ts
import { getCompatibility } from '@/lib/compatibilityApi'

const { compatibility } = await getCompatibility({
  personalityA: 'Aries',
  personalityB: 'Leo',
})
// compatibility === 92 — nothing else is available from this call.
```

The caller must be signed in (`request.auth` is required) — this is also
what makes per-user rate limiting possible. Unauthenticated calls are
rejected with `unauthenticated` before any Firestore access happens.

## Sending the result to an AI model

If you add an AI explanation step, construct its input explicitly from the
resolved result — never pass the callable's surrounding context, never
loop in multiple pairs, never forward anything from Firestore directly:

```ts
const aiInput = {
  personalityA: 'Aries',
  personalityB: 'Leo',
  compatibility: result.compatibility, // just the number
}
```

The AI's job is to narrate a number it's handed, not to see (or infer) the
table that number came from.

## Security summary

- `compatibilityMatrix` and `rateLimits` are denied to the client SDK
  entirely in `firestore.rules` (`allow read, write: if false`) — only the
  Admin SDK, running inside these Cloud Functions, can touch them.
- `getCompatibility` requires Firebase Auth, validates input with zod
  (rejecting anything that isn't a well-formed 4-letter code before it
  touches Firestore), and rate-limits per uid via a Firestore transaction.
- `syncCompatibilityManual` additionally requires an `admin` custom claim.
- `syncCompatibilityScheduled` has no HTTP surface at all — only Cloud
  Scheduler can invoke it.
- Service account credentials live in Secret Manager, never in source,
  never in a deployed bundle, never logged (`utils/logger.ts` redacts
  anything shaped like matrix data on the way to Cloud Logging).
- Sync is idempotent (upsert by `pairKey`) and partial-failure-tolerant
  (one malformed row is skipped and reported, not fatal to the whole sync).
