#!/usr/bin/env node
/**
 * One-off local diagnostic: signs in as you (prompts locally, never sent
 * anywhere but Firebase's own auth servers), calls syncCompatibilityManual,
 * and prints the full SyncSummary — including per-row parsing errors,
 * which is what tells us if any sheet range/tab-name guess was wrong.
 *
 * Usage: node scripts/test-sync.mjs
 * Requires your account to already have the admin custom claim (see
 * scripts/grant-admin.js) and VITE_FIREBASE_* values in ../.env (the
 * frontend's env file — this script reads the same one).
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import fs from 'node:fs'
import path from 'node:path'

const envPath = path.resolve(import.meta.dirname, '../../.env')
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').trim().split('\n').map((l) => l.split('='))
)

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)
const functions = getFunctions(app)

const rl = createInterface({ input: stdin, output: stdout })
const email = await rl.question('Email: ')
const password = await rl.question('Password: ')
rl.close()

console.log('\nSigning in...')
await signInWithEmailAndPassword(auth, email, password)
console.log('Signed in. Calling syncCompatibilityManual (this can take a minute)...\n')

const sync = httpsCallable(functions, 'syncCompatibilityManual')
try {
  const result = await sync()
  console.log(JSON.stringify(result.data, null, 2))
} catch (err) {
  console.error('Call failed:', err.code, err.message)
}

process.exit(0)
