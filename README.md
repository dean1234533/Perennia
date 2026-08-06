# Perennia

A premium, fully interactive prototype for Perennia — a compatibility-first dating
platform. React + TypeScript + Tailwind CSS v4 + Framer Motion, with a real
Firebase (Auth + Firestore) backend and Vercel deploy config.

## Screens

Welcome · Sign Up · Log In · Identity Verification · Birth Details · Cosmic Profile ·
Discovery · Profile Detail · Match · Messaging · Compatibility Report · Settings.

## Running locally

```bash
npm install
npm run dev
```

The app works immediately with **no Firebase project configured** — it falls back to
local mock data (6 curated profiles, simulated auth, in-memory messages), so you can
demo the full flow with zero setup.

## Connecting a real Firebase project

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication → Email/Password**.
3. Enable **Firestore Database** (start in production mode).
4. Deploy the security rules in `firestore.rules` (Firebase console → Firestore → Rules,
   or `firebase deploy --only firestore:rules` if you have the CLI set up).
5. Copy `.env.example` to `.env` and fill in your web app config (Project settings →
   General → Your apps → SDK setup and configuration):

   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

6. Restart `npm run dev`. Once `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_PROJECT_ID`
   are set, the app automatically switches from mock data to Firebase: Sign Up/Log In
   create real accounts, the six curated profiles are seeded into a `profiles`
   collection on first load, likes/passes/matches persist to each user's `users/{uid}`
   document, and messaging is real-time via Firestore `onSnapshot`.

Note: `firestore.rules` leaves `profiles` writable by any signed-in user so the client
can seed the curated collection on first run. Before opening this up to real users,
move that seeding to the Admin SDK / a Cloud Function and remove the open write rule.

## Deploying to Vercel

`vercel.json` is already configured (Vite framework preset, SPA rewrites). Push to a
repo, import it in Vercel, and add the same `VITE_FIREBASE_*` variables in the
project's Environment Variables settings.

```bash
npm run build   # outputs to dist/
```
# Perennia
