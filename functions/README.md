# Perennia Compatibility Fusion System — Backend

Secure Cloud Functions backend for the real Fusion System: a weighted
combination of six independent zodiac factors, reduced to one score, with
narrative text attached both per-factor and overall. The proprietary
tables live in a private Google Sheet, synced into server-only Firestore
collections that Firestore Security Rules deny to the client SDK
entirely — every access goes through Cloud Functions using the Admin SDK.

## The formula

```
final = sun×0.20 + moon×0.20 + rising×0.10 + animal×0.20 + element×0.15 + yinYang×0.15
```

Each of the six factors is its own pairwise lookup (e.g. Sun sign A + Sun
sign B → a 0-100 score), read from its own table in the sheet. The final
score also gets a qualitative band (Excellent / Very Good / Good /
Challenging / Difficult — a fixed legend, not sheet-driven) and selects a
row of six narrative paragraphs (Understanding, Emotional Connection,
Communication, Relationship Growth, Challenges, Long Term Potential) from
a score-range "insights library". Each individual factor also gets its
own short blurb, chosen from a tiered table for that factor (Low/Medium/
High for the five score-based factors, or Complementary/Similar for
Yin/Yang, since that one is inherently binary).

### ⚠️ Assumptions that need verifying against your real sheet

I built this from screenshots, not the live sheet, so treat these as a
first draft to test and correct, not ground truth:

- **Column ranges** for the six score tables (`Western Zodiac!B:D`,
  `F:H`, `J:L` for Sun/Moon/Rising; `Chinese Zodiac!B:D`, `F:H`, `J:L`
  for Animal/Element/Yin-Yang) — read directly off screenshots, but
  double-check against the live sheet.
- **Tab names** for the six per-factor insight tables (`Sun Sign
  Insights`, `Moon Sign Insights`, `Rising Sign Insights`, `Animal
  Insights`, `Heavenly Stem Insights`, `Yin Yang Insights`) — guessed
  from your description, not confirmed.
- **Low/Medium/High thresholds** (currently 0-49 / 50-79 / 80-100 on that
  factor's own score) — not read from the sheet at all; this is a
  hardcoded guess in `types/compatibility.ts` (`SCORE_TIER_THRESHOLDS`).
- **Complementary/Similar** for Yin-Yang is inferred structurally
  (same polarity = Similar, opposite = Complementary), not from a
  threshold — should be correct regardless of the above.

All of these are overridable via env vars (ranges) or a one-line constant
change (thresholds) — no architectural changes needed once we test
against the real sheet. See "Local development" below for how to run a
sync against the emulator and see exactly what got parsed.

## Architecture

```
Google Sheet (private, service-account access only)
  ├─ Western Zodiac   (Sun / Moon / Rising pair tables)
  ├─ Chinese Zodiac    (Animal / Element / Yin-Yang pair tables)
  ├─ Compatibility Insights Library   (score-bucket → 6 narrative texts)
  ├─ Sun/Moon/Rising/Animal/Heavenly Stem/Yin Yang Insights  (tier → blurb)
        │
        │  syncCompatibilityScheduled (every 6h) / syncCompatibilityManual (admin)
        ▼
Firestore (13 server-only collections, client read/write DENIED):
  fusionSunScores, fusionMoonScores, fusionRisingScores,
  fusionAnimalScores, fusionElementScores, fusionYinYangScores,
  fusionInsightsLibrary, fusionFactorInsights
        │
        │  getCompatibility({ personA, personB })
        ▼
{ compatibility, band, factors: {...6}, insights: {...6} }   ← the only thing the client ever sees
```

### Module layout

```
functions/src/
  config/env.ts                     secrets + all sheet ranges (overridable)
  types/compatibility.ts            fusion weights, tiers, bands, result shapes
  validation/compatibility.validation.ts   zod schemas for every input/row shape
  services/
    googleSheets.service.ts         pattern-based sheet parsing (see below)
    compatibility.service.ts        fusion math + sync orchestration
    rateLimit.service.ts            Firestore-backed fixed-window limiter
    cache.service.ts                best-effort in-memory cache
  repositories/
    compatibility.repository.ts     the ONLY module allowed to touch
                                     any fusion* Firestore collection
  utils/  pairKey.ts, errors.ts, logger.ts
  index.ts                          the 3 exported Cloud Functions
```

### How the sheet gets parsed

The Western/Chinese Zodiac tabs are human-formatted (repeating blocks of
a header row + ~12 data rows + a blank separator, one block per base
sign/animal) rather than a clean one-row-per-record table. Instead of
assuming exact row offsets — fragile if a row gets inserted — the parser
scans every row in a given column range and pulls out only rows shaped
`"SignA + SignB"` | `score` where **both** captured tokens are known-valid
values. Header rows (`"Aries + Signs = Sun"` — "Signs" isn't a valid
sign) and blank rows are simply skipped because they don't match. This
was verified against the actual block layout from your screenshots — see
the test in the PR/commit history if you want to see it directly.

The Insights Library's header row is found dynamically by searching for
the six known category names (rather than assuming fixed columns), so
column order/spacing in that tab doesn't matter.

## One-time setup

### 1. Google Sheet

You already have this — just confirm tab names match `config/env.ts`
defaults (or override them, see below).

### 2. Google Service Account

Same as before:

1. In [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts)
   for project `perennia-43763`, create a service account (e.g.
   `perennia-sheets-sync`), no IAM roles needed.
2. Create + download a JSON key. You need `client_email` and `private_key`.
3. Enable the [Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com).
4. Share the Google Sheet with the service account's email as **Viewer**.

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

### 5. Override ranges/tab names if they don't match the defaults

Create `functions/.env.perennia-43763` (this file IS deployed — it's for
non-secret config, not credentials) with any of the `RANGE_*` vars from
`config/env.ts`, e.g.:

```
RANGE_SUN_INSIGHTS=Sun Insights!A2:B5
```

Only include the ones that differ from the defaults.

### 6. Grant yourself admin access (for manual sync)

```bash
cd functions
node scripts/grant-admin.js <firebase-auth-uid>
```

Sign out/in afterward for the claim to take effect. Revoke with `--revoke`.

## Local development

```bash
cd functions
cp .env.example .env.local   # fill in the three secret values
npm run serve                 # builds + starts the emulator suite
```

Then call `syncCompatibilityManual` from the emulator UI or
`firebase functions:shell` and check the returned `SyncSummary` — it
reports `rowsRead`/`rowsImported` per table plus an `errors` array with
one message per row that failed validation (including which table and
row number), which is the fastest way to spot a range/tab-name mismatch
without digging through logs.

## Deployment

```bash
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## Calling it from the frontend

```ts
import { getCompatibility } from '@/lib/compatibilityApi'

const result = await getCompatibility({
  personA: {
    sunSign: 'Pisces', moonSign: 'Virgo', risingSign: 'Leo',
    chineseAnimal: 'Rat', chineseElement: 'Wood', yinYang: 'Yang',
  },
  personB: {
    sunSign: 'Cancer', moonSign: 'Taurus', risingSign: 'Libra',
    chineseAnimal: 'Pig', chineseElement: 'Wood', yinYang: 'Yin',
  },
})
// result.compatibility  -> 87
// result.band            -> "Very Good"
// result.factors.sun     -> { score: 88, tier: 'HIGH', insight: '...' }
// result.insights.communication -> '...'
```

The caller must be signed in — this is also what makes per-user rate
limiting possible.

## Security summary

- Every `fusion*` collection is denied to the client SDK entirely in
  `firestore.rules` — only the Admin SDK, running inside these Cloud
  Functions, can touch them.
- `getCompatibility` requires Firebase Auth, validates every field of
  both birth profiles with zod before touching Firestore, and
  rate-limits per uid via a Firestore transaction.
- The final `compatibility` number is a strict lookup — if any of the
  six sub-tables is missing that pair, the call fails loudly rather than
  guessing. The narrative text is treated as enrichment: a missing
  tier/bucket blurb degrades to an empty string (logged as a warning)
  rather than blocking the numeric result.
- `syncCompatibilityManual` requires an `admin` custom claim.
  `syncCompatibilityScheduled` has no HTTP surface at all.
- Service account credentials live in Secret Manager, never in source,
  never logged.
- Sync is idempotent (upsert by key) and partial-failure-tolerant — one
  malformed row anywhere is skipped and reported, not fatal to the rest.
