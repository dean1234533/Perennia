#!/usr/bin/env node
/**
 * One-off local script to grant the `admin` custom claim used by
 * syncCompatibilityManual. NOT deployed as a Cloud Function — run it
 * from your machine with Application Default Credentials that have
 * Firebase Admin rights on the project (e.g. after `gcloud auth
 * application-default login` as an owner/editor of the project).
 *
 * Usage:
 *   node scripts/grant-admin.js <firebase-auth-uid>
 *   node scripts/grant-admin.js <firebase-auth-uid> --revoke
 */
const admin = require('firebase-admin')

const uid = process.argv[2]
const revoke = process.argv.includes('--revoke')

if (!uid) {
  console.error('Usage: node scripts/grant-admin.js <uid> [--revoke]')
  process.exit(1)
}

admin.initializeApp()

admin
  .auth()
  .setCustomUserClaims(uid, revoke ? {} : { admin: true })
  .then(() => {
    console.log(`${revoke ? 'Revoked' : 'Granted'} admin claim for uid: ${uid}`)
    console.log('The user must sign out and back in for this to take effect.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Failed to set custom claim:', err)
    process.exit(1)
  })
