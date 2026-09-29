# Perennia: for love that fits, naturally

**A compatibility-first dating app that combines structured matching with astrological insight (natal charts and Chinese zodiac) to introduce people with real long-term potential.**

[![Live demo](https://img.shields.io/badge/live-perennia--coral.vercel.app-c9a14a?style=flat-square)](https://perennia-coral.vercel.app/)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

**Live demo:** [perennia-coral.vercel.app](https://perennia-coral.vercel.app/)

---

## Screenshots

<!-- Add images to docs/screenshots/ and uncomment. -->
<!--
| Welcome | Cosmic profile | Discovery | Compatibility report |
|---|---|---|---|
| ![](docs/screenshots/welcome.png) | ![](docs/screenshots/cosmic.png) | ![](docs/screenshots/discovery.png) | ![](docs/screenshots/report.png) |
-->

_Screenshots coming soon. For now, see the [live demo](https://perennia-coral.vercel.app/)._

---

## Features

- **Guided onboarding.** Birth details, values, lifestyle, interests,
  relationship goals, your story, and a profile photo.
- **Cosmic profile.** Natal chart computed on the server, a zodiac wheel, and
  Chinese astrology.
- **Compatibility engine.** Per-match compatibility reports that are synced on
  a schedule and on demand through Cloud Functions.
- **Discovery and matching.** Likes, matches, a match celebration screen, and
  distance-aware preferences with city search and geocoding.
- **Real-time messaging** with Firestore listeners, plus friends and friend
  requests.
- **Safety.** Stripe Identity verification, block and report, and one-time-code
  re-verification before birth details can be changed.
- **Founding 500 membership.** A limited founding-member offer with Stripe
  Checkout, a billing portal, and cancellation.
- **Media.** Photo and video uploads, with video processed by a Storage trigger.
- Push notifications, a service worker, and account deletion.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS 4, Framer Motion, Radix UI, lucide-react |
| Backend | Firebase Auth, Firestore, Storage, and Cloud Functions (callables, a scheduled job, a Storage trigger) |
| Payments & identity | Stripe Checkout, Billing Portal, and Stripe Identity |
| Email | Resend (one-time codes) |
| Hosting | Vercel |

---

## Getting started

```bash
git clone https://github.com/dean1234533/Perennia.git
cd Perennia
npm install
cp .env.example .env   # add your VITE_FIREBASE_* web config
npm run dev
```

### Firebase setup
1. Create a Firebase project and enable **Email/Password auth**, **Firestore**,
   and **Storage**.
2. Deploy the rules: `firebase deploy --only firestore:rules,storage`
3. Deploy the functions: `cd functions && npm install && firebase deploy --only functions`
4. Set the function secrets (Stripe, Resend, and GeoNames) with
   `firebase functions:secrets:set`.

### Deploy the frontend
`vercel.json` is already set up for Vite with SPA rewrites. Import the repo in
Vercel and add the same `VITE_FIREBASE_*` environment variables.

```bash
npm run build   # outputs to dist/
npm run lint    # oxlint
```

---

## Project structure

```
src/
  screens/     onboarding steps, Discovery, Matches, Messages, CompatibilityReport, Founding500 …
  lib/         Firebase init, matching/compatibility/privacy APIs, natal chart, Chinese astrology
  context/     Auth + App context
  data/        values, interests, lifestyle options, story prompts
functions/src/ Cloud Functions: compatibility, natal chart, identity, Stripe, safety, media
firestore.rules, storage.rules
```

---

## Author

Built by **Dean Da Dev**, a UK full-stack developer building web apps, websites,
and AI tools.

🌐 [dean-da-dev.co.uk](https://www.dean-da-dev.co.uk/) · 💼 [More projects](https://www.dean-da-dev.co.uk/portfolio) · 🐙 [GitHub](https://github.com/dean1234533)
