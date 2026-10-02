// Firestore rules tests. Needs Java + the emulator:
//   npm i -D @firebase/rules-unit-testing
//   firebase emulators:exec --only firestore --project demo-perennia "node tests/firestore.rules.test.mjs"
// NOTE: written on a machine with no Java, so these have never been executed.
// Run them before deploying the rules.
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

const env = await initializeTestEnvironment({
  projectId: 'demo-perennia',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
})

const base = {
  name: 'A', email: 'a@x.com', onboardingComplete: false, verification: { status: 'unverified' },
  likedIds: [], matchedIds: [], blockedIds: [], birthCity: '',
}
let pass = 0
let fail = 0
const t = async (name, p) => {
  try { await p; pass++; console.log('ok  ', name) } catch (e) { fail++; console.log('FAIL', name, String(e).slice(0, 120)) }
}
const as = (uid) => env.authenticatedContext(uid).firestore()
const a = as('a')

// --- users: create ---
await t('create pristine doc', assertSucceeds(setDoc(doc(a, 'users/a'), base)))
await t('forge verified on create', assertFails(setDoc(doc(as('b'), 'users/b'), { ...base, verification: { status: 'verified' } })))
await t('forge onboardingComplete on create', assertFails(setDoc(doc(as('c'), 'users/c'), { ...base, onboardingComplete: true })))
await t('forge matchedIds on create', assertFails(setDoc(doc(as('d'), 'users/d'), { ...base, matchedIds: ['x'] })))

// --- users: update ---
await t('skip onboarding while unverified', assertFails(updateDoc(doc(a, 'users/a'), { onboardingComplete: true })))
await t('edit ordinary field', assertSucceeds(updateDoc(doc(a, 'users/a'), { city: 'London' })))
await t('self-verify blocked', assertFails(updateDoc(doc(a, 'users/a'), { verification: { status: 'verified' } })))

await env.withSecurityRulesDisabled(async (ctx) => {
  const fs = ctx.firestore()
  await setDoc(doc(fs, 'users/v'), { ...base, verification: { status: 'verified' }, birthCity: 'London' })
  await setDoc(doc(fs, 'users/nv'), { ...base, verification: { status: 'verified' }, birthCity: '' })
  await setDoc(doc(fs, 'conversations/m1'), { participants: ['a', 'z'] })
  await setDoc(doc(fs, 'media/m1'), { userId: 'a', id: 'm1', type: 'image', processingStatus: 'ready' })
  await setDoc(doc(fs, 'media/vid'), { userId: 'a', id: 'vid', type: 'video', processingStatus: 'processing' })
})
await t('complete when verified + birth city', assertSucceeds(updateDoc(doc(as('v'), 'users/v'), { onboardingComplete: true })))
await t('cannot un-complete', assertFails(updateDoc(doc(as('v'), 'users/v'), { onboardingComplete: false })))
await t('complete without birth city blocked', assertFails(updateDoc(doc(as('nv'), 'users/nv'), { onboardingComplete: true })))

// --- public profiles / private user docs ---
await env.withSecurityRulesDisabled(async (ctx) => {
  const fs = ctx.firestore()
  await setDoc(doc(fs, 'users/migrated'), { ...base, email: 'm@x.com' })
  await setDoc(doc(fs, 'publicProfiles/migrated'), { name: 'M', age: 30 })
  await setDoc(doc(fs, 'users/legacy'), { ...base, email: 'l@x.com' })
})
await t('read own private doc', assertSucceeds(getDoc(doc(as('migrated'), 'users/migrated'))))
await t('others cannot read migrated private doc', assertFails(getDoc(doc(as('a'), 'users/migrated'))))
await t('others can read unmigrated doc (transitional)', assertSucceeds(getDoc(doc(as('a'), 'users/legacy'))))
await t('others can read public profile', assertSucceeds(getDoc(doc(as('a'), 'publicProfiles/migrated'))))
await t('client cannot write public profile', assertFails(setDoc(doc(as('migrated'), 'publicProfiles/migrated'), { name: 'Hacked' })))
await t('signed-out cannot read public profile', assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'publicProfiles/migrated'))))

// --- messages ---
const msg = { id: 'x1', senderId: 'a', text: 'hi', createdAt: new Date(), read: false }
await t('send valid message', assertSucceeds(setDoc(doc(a, 'conversations/m1/messages/x1'), msg)))
await t('message with extra field', assertFails(setDoc(doc(a, 'conversations/m1/messages/x2'), { ...msg, id: 'x2', admin: true })))
await t('message too long', assertFails(setDoc(doc(a, 'conversations/m1/messages/x3'), { ...msg, id: 'x3', text: 'a'.repeat(2001) })))
await t('empty message', assertFails(setDoc(doc(a, 'conversations/m1/messages/x4'), { ...msg, id: 'x4', text: '' })))
await t('spoofed sender', assertFails(setDoc(doc(a, 'conversations/m1/messages/x5'), { ...msg, id: 'x5', senderId: 'z' })))
await t('message created pre-read', assertFails(setDoc(doc(a, 'conversations/m1/messages/x6'), { ...msg, id: 'x6', read: true })))

// --- conversations ---
await t('update inbox preview', assertSucceeds(updateDoc(doc(a, 'conversations/m1'), { lastMessagePreview: 'hi', lastMessageSenderId: 'a', lastMessageAt: new Date() })))
await t('spoof preview sender', assertFails(updateDoc(doc(a, 'conversations/m1'), { lastMessagePreview: 'hi', lastMessageSenderId: 'z' })))
await t('edit participants blocked', assertFails(updateDoc(doc(a, 'conversations/m1'), { participants: ['a'] })))
await t('non-participant blocked', assertFails(updateDoc(doc(as('q'), 'conversations/m1'), { lastMessagePreview: 'x', lastMessageSenderId: 'q' })))

// --- media ---
await t('edit own caption', assertSucceeds(updateDoc(doc(a, 'media/m1'), { caption: 'x' })))
await t('reassign userId blocked', assertFails(updateDoc(doc(a, 'media/m1'), { userId: 'b' })))
await t('create video as ready blocked', assertFails(setDoc(doc(a, 'media/v2'), { userId: 'a', id: 'v2', type: 'video', processingStatus: 'ready' })))
await t('create video as processing', assertSucceeds(setDoc(doc(a, 'media/v3'), { userId: 'a', id: 'v3', type: 'video', processingStatus: 'processing' })))
await t('create image as ready', assertSucceeds(setDoc(doc(a, 'media/i1'), { userId: 'a', id: 'i1', type: 'image', processingStatus: 'ready' })))
await t('mark video ready blocked', assertFails(updateDoc(doc(a, 'media/vid'), { processingStatus: 'ready' })))

console.log(pass, 'passed', fail, 'failed')
await env.cleanup()
process.exit(fail ? 1 : 0)
