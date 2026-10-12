#!/usr/bin/env node
/**
 * One-off local script: creates a `publicProfiles/{uid}` document for every
 * existing member. New and edited members are handled automatically by the
 * syncPublicProfileOnWrite trigger; this only covers members who existed
 * before it was deployed. Safe to re-run.
 *
 * Needs the functions built (`npm run build`, which `firebase deploy` does)
 * and Application Default Credentials with Firestore access to the project:
 *
 *   gcloud auth application-default login
 *   cd functions
 *   GOOGLE_CLOUD_PROJECT=perennia-982a6 node scripts/backfill-public-profiles.js
 */
const { initializeApp } = require('firebase-admin/app')
const { backfillPublicProfiles } = require('../lib/services/publicProfile.service')

initializeApp()

backfillPublicProfiles()
  .then(({ processed }) => {
    console.log(`Created/updated ${processed} public profile(s).`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('Backfill failed:', err)
    process.exit(1)
  })
