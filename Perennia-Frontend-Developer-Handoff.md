# Perennia Frontend Developer Handoff

Prepared from the current working tree on 29 September 2026. Repository: `/Users/family/Documents/GitHub/Perennia`.

## 1. Executive summary

Martallus is handing over a substantially developed and visually reviewed React/Vite frontend on `martallus-frontend`. The working tree contains a coherent set of uncommitted changes spanning the approved landing and onboarding presentation, the restored 12-step onboarding sequence, owner and visitor profiles, astrology presentation, Explore, mutual matches, compatibility, navigation, accessibility, reduced motion, safety surfaces, and local design previews.

The frontend is visually advanced and its current TypeScript/build state is healthy. The production app components are real components rather than disconnected mock-ups; the local design-preview system injects typed in-memory fixtures into those components so they can be reviewed without Firebase. My Profile, Visitor Profile, the Explore feed, Your Matches, Cosmic Profile, the profile media experience, the profile action sheets, and onboarding screens have received repeated responsive review. The approved image assets and new source files are still untracked and must be deliberately included in the eventual handoff commit.

The project is **not production-ready without backend/security work**. The most urgent issues are the current Firestore rule allowing any authenticated member to read an entire `users/{uid}` document; permissive user-document creation and client-set onboarding completion; client-provided compatibility inputs with no Premium enforcement; and the absence of a production Search Area candidate service returning sanitised public projections. Several visible surfaces are intentionally preview-only: gifting, the dedicated Safeguarding screen controls, profile viewers, and Search Area candidate results. Stripe and Firebase flows are implemented in parts but were not contacted during this handoff and require controlled emulator/test-project validation.

Dean is receiving:

- the full intentional working tree, compared against `HEAD` `664394c331544dd0fc599c34c75625374350c75c`;
- 48 modified tracked files and 6 deleted tracked files;
- 119 untracked application/source/asset files that belong to the work;
- one untracked machine-local `.pnpm-store/v11/index.db` that must not be handed over;
- this brief, stored outside the repository.

## 2. Repository and branch state

### Baseline

- Branch: `martallus-frontend`
- Current commit: `664394c331544dd0fc599c34c75625374350c75c`
- Commit summary: `Phase 3 Batch 2: migrate profile buttons and require completion`
- Comparison basis: current working tree versus `HEAD` above, using `git diff`, `git status --short`, and `git ls-files --others --exclude-standard`.
- Staged files: **0**.
- Tracked changes: **48 modified**, **6 deleted**.
- Untracked: **120 files total**: **119 application/source/public-asset files** plus **1 machine-local file**.
- Dependency and lockfile changes: **none**. `package.json`, `package-lock.json`, `functions/package.json`, and `functions/package-lock.json` are unchanged.
- Existing changes were treated as intentional. No checkout, restore, reset, formatting pass, staging, or project-file edit was performed for this report.

### Current `git status --short`

```text
 M src/App.tsx
 M src/components/founding500/MemberCounter.tsx
 M src/components/layout/AppShell.tsx
 M src/components/layout/OnboardingShell.tsx
 M src/components/layout/RequireFoundingMembership.tsx
 D src/components/layout/RequireVerifiedIdentity.tsx
 D src/components/shared/CompatibilitySnapshot.tsx
 M src/components/shared/FullscreenMediaViewer.tsx
 D src/components/shared/MasonryGallery.tsx
 M src/components/shared/MatchingPreferencesPanel.tsx
 M src/components/shared/ProductMockups.tsx
 M src/components/shared/ProfileActionsMenu.tsx
 M src/components/shared/ProfileCosmicWheel.tsx
 D src/components/shared/ProfileDetailSections.tsx
 D src/components/shared/ProfileExperience.tsx
 M src/components/shared/ProfileOrbit.tsx
 M src/components/shared/ZodiacWheel.tsx
 M src/components/ui/button.tsx
 M src/components/ui/dialog.tsx
 M src/components/ui/onboarding-buttons.tsx
 M src/components/ui/progress-ring.tsx
 M src/components/ui/switch.tsx
 M src/context/AppContext.tsx
 M src/data/interests.ts
 M src/data/lifestyleOptions.ts
 M src/data/selfProfile.ts
 M src/index.css
 M src/lib/developmentVerification.ts
 M src/lib/firestore.ts
 M src/lib/founding500.ts
 M src/screens/AboutYouDetails.tsx
 M src/screens/BirthDetails.tsx
 D src/screens/CompatibilityHub.tsx
 M src/screens/CompatibilityReport.tsx
 M src/screens/CosmicProfile.css
 M src/screens/CosmicProfile.tsx
 M src/screens/CosmicZodiacWheel.tsx
 M src/screens/Discovery.css
 M src/screens/Discovery.tsx
 M src/screens/InterestsStep.tsx
 M src/screens/MatchScreen.tsx
 M src/screens/Matches.tsx
 M src/screens/MessageThread.tsx
 M src/screens/MyProfile.tsx
 M src/screens/Preferences.tsx
 M src/screens/ProfileDetail.tsx
 M src/screens/ProfilePhoto.tsx
 M src/screens/RelationshipGoalsStep.tsx
 M src/screens/Settings.tsx
 M src/screens/SignUp.tsx
 M src/screens/Verify.tsx
 M src/screens/Welcome.tsx
 M src/screens/YourStoryStep.tsx
 M src/types/media.ts
?? .pnpm-store/
?? public/approved-symbol-cards-v4/
?? public/astrology/
?? public/celestial-placement-symbols-v1/
?? public/celestial-placement-symbols/
?? public/chinese-astrology-v1/
?? public/perennia-constellation-heart.png
?? public/perennia-crescent.png
?? public/perennia-double-heart-connection.png
?? public/perennia-double-heart-them-mask.png
?? public/perennia-double-heart-you-mask.png
?? public/perennia-wordmark-ornament-approved.png
?? public/perennia-wordmark-ornament.png
?? public/relationship-goal-icons/
?? public/western-zodiac-v1/
?? src/components/layout/RequireOnboardingStep.tsx
?? src/components/shared/CompatibilityWhyDialog.tsx
?? src/components/shared/ConnectionHeartsIcon.tsx
?? src/components/shared/InterestHeartsIcon.css
?? src/components/shared/InterestHeartsIcon.tsx
?? src/components/shared/ProfileAboutFacts.tsx
?? src/components/shared/ProfileAstrologyIdentity.tsx
?? src/data/chineseAstrologyPresentation.ts
?? src/data/compatibilityExperience.ts
?? src/data/designPreviewDiscoverySearch.ts
?? src/data/designPreviewProfile.ts
?? src/data/designPreviewVisitorProfile.ts
?? src/data/giftPreview.ts
?? src/data/onboardingOptions.ts
?? src/data/profileAbout.ts
?? src/data/profileAstrologyAssets.ts
?? src/data/values.ts
?? src/hooks/
?? src/lib/designPreviewAccess.ts
?? src/lib/discoveryAreaSearch.ts
?? src/lib/onboardingFlow.ts
?? src/screens/CompatibilityReport.css
?? src/screens/DesignPreview.tsx
?? src/screens/GiftToMePreview.css
?? src/screens/GiftToMePreview.tsx
?? src/screens/LifestyleStep.tsx
?? src/screens/Safeguarding.css
?? src/screens/Safeguarding.tsx
?? src/screens/ValuesStep.tsx
```

### Exclude from handoff

- `.pnpm-store/` is a generated machine-local package store. It is not ignored by the current `.gitignore` and must not be committed. Add an ignore rule in a separate maintenance change if desired.
- `/private/tmp/perennia-handoff-build/` is the out-of-repository build output created for this report.
- `/private/tmp/perennia-untracked-files.txt` and `/private/tmp/perennia-tracked-changes.txt` are temporary audit inventories, not project artifacts.
- Any other scripts/screenshots created under `/private/tmp` during browser verification are local verification artifacts, not handoff source.

## 3. Completed frontend work

### Landing and onboarding presentation

- The production Landing Page is reused in design preview. Its approved constellation/crescent artwork remains separate from the approved combined wordmark/ornament PNG. Main files: `src/screens/Welcome.tsx`, `src/index.css`, `public/perennia-constellation-heart.png`, `public/perennia-crescent.png`, `public/perennia-wordmark-ornament-approved.png`.
- The onboarding shell, celestial presentation, progress UI, shared buttons, spacing, responsive behavior, and reduced-motion handling were consolidated. Main files: `src/components/layout/OnboardingShell.tsx`, `src/components/ui/onboarding-buttons.tsx`, `src/components/ui/progress-ring.tsx`, `src/components/ui/button.tsx`, `src/index.css`.
- Source-confirmed and previously browser-reviewed. Production authentication/remote persistence remains integration-dependent.

### Exact 12-step onboarding order and navigation

The authoritative sequence is in `src/lib/onboardingFlow.ts:33-268` and routes are wired in `src/App.tsx:41-82`:

1. Sign Up — `/signup`
2. Identity Verification — `/verify`
3. Birth Details — `/birth-details`
4. Gender Preferences — `/preferences`
5. Relationship Goals — `/relationship-goals`
6. Interests — `/interests`
7. About You — `/about-you`
8. Lifestyle — `/lifestyle`
9. Values — `/values`
10. Profile Photo — `/profile-photo`
11. Your Story — `/your-story`
12. Cosmic Profile — `/cosmic-profile`

`RequireOnboardingStep` prevents forward skipping, redirects to the earliest incomplete step, and preserves completed-user revisit rules. Interests require recognised selections; Lifestyle is single-choice; Values requires at least one; Story enforces biography/prompt limits; profile-photo completion verifies the URL belongs to the member (or a local data URL in the explicit preview bypass). Browser-reviewed forward/back flow exists, but server-side enforcement is still required; see section 7.

### Shared button system

Shared button heights, disabled states, onboarding Continue/Back behavior, focus treatment, and minimum touch sizing were adjusted in `src/components/ui/button.tsx`, `src/components/ui/onboarding-buttons.tsx`, `src/components/ui/switch.tsx`, `src/screens/ValuesStep.tsx`, `src/screens/LifestyleStep.tsx`, and `src/index.css`. Values changes its disabled label to “Choose at least one value” and enabled label to “Continue.” Source-confirmed and browser-reviewed.

### My Profile

- The active owner profile is `src/screens/MyProfile.tsx`; the old profile experience/components were removed.
- Current sections include the hero/orbit, identity/status, public astrology badges, Premium strip, Cosmic Profile card, photos/videos, edit controls, About Me, Bio/story, Interests, Lifestyle, Travel, profile viewers empty state, upload dialog, action menu, and fullscreen media.
- The About Me card is full width and exposes all eight optional fields in Edit Profile. Travel uses the same saved fields later consumed by the visitor view.
- Cosmic Profile CTA/wheel sizing, mobile wheel center alignment, identity badge artwork, touch targets, modal accessibility, and reduced motion are preserved.
- Browser-reviewed at 390, 768, 1024, and 1280 widths during the working session; backend save/reload still requires Dean’s environment.

### Visitor Profile

- The active visitor route is `/profile/:id` and renders `src/screens/ProfileDetail.tsx` through the shared `AppShell`.
- It uses the real visitor profile component for Explore, Matches, and preview navigation. It includes member identity, media, public astrology, message/friend/like controls, gift preview entry in preview mode only, shared Cosmic Profile card, About Me, Interests & Lifestyle, dynamic “[Name]’s Story,” Travel, fullscreen media, and Report/Block/Mute action sheet.
- Empty optional rows are omitted. Travel is omitted when both lists are empty. Partial and empty visitor fixtures exist.
- Browser-reviewed with complete, partial, and empty fixtures. Production direct-message/like/friend/safety behavior requires controlled multi-account tests.

### Shared About Me fields and Edit Profile controls

- Shared renderer: `src/components/shared/ProfileAboutFacts.tsx`.
- Shape helper: `src/data/profileAbout.ts`.
- Owner edit UI: `src/screens/MyProfile.tsx:464-538`.
- Visitor mapping: `src/screens/ProfileDetail.tsx:177-193,318-337`.
- Display order is Education, Languages, Job title, Height, Children, Wants children, Faith or beliefs, Marital background. Values wrap naturally; empty rows disappear.
- Source-confirmed and browser-reviewed. Public/private projection is not yet safe; see section 7.

### Travel information

- `favoritePlaces` (American spelling in code) and `dreamDestinations` live in `SelfProfile`/`profileExtras`.
- Owner editing and display: `src/screens/MyProfile.tsx:670-704`.
- Visitor display after story: `src/screens/ProfileDetail.tsx:364-382`.
- Local complete/partial/empty fixtures are in `src/data/designPreviewProfile.ts` and `src/data/designPreviewVisitorProfile.ts`.
- Source-confirmed and browser-reviewed. There is no separate onboarding Travel collection step.

### Media and stories

- Owner upload, reorder, caption/category edits, profile-photo replacement, photo/video galleries, and processing states use the existing media service/Firestore structures.
- Visitor media uses the same `MediaDoc` conversion and fullscreen viewer. Story uses root `storyPrompts` and falls back to `profileExtras.about`.
- Files: `src/screens/MyProfile.tsx`, `src/screens/ProfileDetail.tsx`, `src/components/shared/FullscreenMediaViewer.tsx`, `src/components/shared/ProfileOrbit.tsx`, `src/lib/firestore.ts`, `src/lib/media/*`, `src/types/media.ts`.
- The frontend and video-processing function exist; full upload/transcode/delete verification was not performed in this handoff.

### Cosmic Profile and astrology presentation

- The full Cosmic Profile screen uses the existing natal-wheel implementation and approved Western/Chinese presentation assets. Chinese rows preserve five horizontally readable result rows on mobile.
- Files: `src/screens/CosmicProfile.tsx`, `src/screens/CosmicProfile.css`, `src/screens/CosmicZodiacWheel.tsx`, `src/components/shared/ZodiacWheel.tsx`, `src/data/chineseAstrologyPresentation.ts`, and astrology assets under `public/`.
- The shared owner/visitor promotional card wheel is `src/components/shared/ProfileCosmicWheel.tsx`; it uses the approved transparent wheel PNG and shared responsive CSS in `src/index.css`. Desktop placement is protected from text; mobile aligns the wheel center with the card’s right edge. Owner CTA is “View Cosmic Profile”; visitor CTA is “Check Our Compatibility.” Both retain at least a 44px target.
- Public astrology identity cards are data-driven via `src/components/shared/ProfileAstrologyIdentity.tsx` and `src/data/profileAstrologyAssets.ts`, support all 12 Western signs and all 12 Chinese animals, and map Sheep to `goat.png`.
- Browser-reviewed on owner/visitor/profile/Cosmic previews. Astrology calculation correctness was not re-proven here.

### Explore feed, ordering, action rail, and Search Area

- `src/screens/Discovery.tsx` and `src/screens/Discovery.css` implement a full-screen, media-led, vertically snapping feed with name/location overlay, profile action, approved double-heart interest state, Western badge, Chinese badge, video play/pause, free compatibility percentage, and no X/pass control.
- Member name and profile icon route to `/profile/:id`; preview handlers route to the visitor preview without backend writes.
- Default production candidates are client-sorted nearest-to-farthest by calculated distance (`Discovery.tsx:214-221`) and not by compatibility. This uses complete user documents and exact coordinates today, which is a launch blocker.
- Search Area has a typed backend boundary in `src/lib/discoveryAreaSearch.ts`; the production implementation intentionally throws “not available yet.” The preview has local area resolution/results in `src/data/designPreviewDiscoverySearch.ts`.
- High Compatibility Only is presented only to Premium users, but the production server query, entitlement enforcement, classification threshold, and sanitised projection do not yet exist.
- Main feed states were browser-reviewed at desktop/mobile. Search Area behavior beyond previews is unavailable by design.

### Interest and mutual-match heart states

- `src/components/shared/InterestHeartsIcon.tsx` layers exact fill masks beneath the approved double-heart foundation asset. Neutral = approved illuminated outlines/no fill; Interested = smaller “You” interior fill; Matched = rose larger fill plus violet smaller fill, with the original artwork above both.
- `src/components/shared/InterestHeartsIcon.css` disables the completion pulse under reduced motion.
- Explore’s visual captions were removed while accessible names remain: Express romantic interest, Romantic interest sent, Mutual match, and dynamic astrology names. Your Matches uses the same completed artwork.
- Preview examples: `explore`, `exploreInterested`, `exploreMatched`, and `matches`.
- Source-confirmed and previously browser-reviewed. Mutuality still depends on the existing server match record.

### Your Matches

- `src/screens/Matches.tsx` displays mutual match documents only, profile/message actions, pair-specific compatibility percentages, the completed double-heart, and Premium-gated “Why you matched.”
- Loading, successful empty, initial error, retry recovery, and retained-results/live-error previews exist. The implementation cleans up subscriptions, guards stale async results, and does not replace already-loaded matches after a later subscription error.
- Preview entries: `matches`, `matchesPremium`, `matchesLoading`, `matchesEmpty`, `matchesRetry`, `matchesLiveError`.
- Browser-reviewed with fixtures; production subscription, membership, profile fetch, and compatibility failure behavior still needs emulator/multi-account testing.

### Compatibility report and explanation dialog

- Standalone Compatibility Hub code/route/preview was removed. `/compatibility/:id` remains for the detailed report used from visitor profiles.
- `src/screens/CompatibilityReport.tsx`, `src/screens/CompatibilityReport.css`, and `src/data/compatibilityExperience.ts` present the full six-dimension report or a locked teaser preview.
- `src/components/shared/CompatibilityWhyDialog.tsx` gives Premium matches a concise natural-language explanation using existing result narratives; free members are sent to the upgrade route.
- Header identities use member profile photos; Chinese animal artwork remains in the Chinese compatibility dimension.
- Visual/source confirmed. Production direct-route Premium enforcement is currently missing and is a high-priority issue.

### Tablet and mobile navigation

- `src/components/layout/AppShell.tsx` uses the existing shared nav: bottom navigation below 1280px; desktop sidebar from 1280px. The active route, safe-area padding, content bottom spacing, focus states, and profile/compatibility page backgrounds were corrected.
- Onboarding does not use AppShell and therefore does not inherit app navigation.
- Previously browser-reviewed at 390×844, 768×1024, 1024×768, 1279×900, and 1280×900.

### Modal and media-viewer accessibility

- Shared focus management lives in `src/hooks/useModalAccessibility.ts`: focus entry, Tab/Shift+Tab containment, Escape, exact trigger restoration, background inerting, body/document scroll lock, nested/topmost overlay handling, and cleanup.
- Used by CompatibilityWhyDialog, profile action sheets, fullscreen viewer, profile viewers, and upload modal.
- Fullscreen media provides Close/Previous/Next names, disabled states, and media position announcement.
- Source-confirmed and previously keyboard/browser-reviewed. A formal screen-reader matrix has not been run.

### Touch-target corrections

- Visitor Message/Friends/Like, match message buttons, Profile Orbit shortcuts, Values pills, Lifestyle switch/label, modal controls, and profile CTAs were brought to or wrapped in at least 44×44 CSS px targets without enlarging core artwork.
- Main files: `src/screens/ProfileDetail.tsx`, `src/screens/Matches.tsx`, `src/components/shared/ProfileOrbit.tsx`, `src/screens/ValuesStep.tsx`, `src/screens/LifestyleStep.tsx`, `src/index.css`.
- Browser measurements were performed in the working session; source remains the current evidence.

### Reduced-motion support

- Global Framer Motion preference propagation is in `src/App.tsx` via `MotionConfig reducedMotion="user"`.
- Targeted `useReducedMotion`/CSS media rules cover app navigation, onboarding, landing/product mockups, orbit/wheels, media viewer, Explore videos and transitions, Match, messaging, settings, Founding 500, safeguarding, gifting, compatibility, and double-heart pulse.
- Meaningful loading indicators remain. Explore video autoplay stops under reduced motion.
- Source-confirmed and previously verified by preference emulation on representative screens.

### Identity Verification mobile overflow

- The real production Verify component retains five internal stages. Its responsive progress row/shell/card styles were corrected in `src/screens/Verify.tsx` and `src/index.css` rather than applying a global overflow hack.
- Browser-reviewed at 390, 768, 1024, and 1280 widths. Stripe Identity itself still requires test-mode integration.

### Dead legacy profile cleanup

- Confirmed legacy components were removed: `ProfileExperience.tsx`, `ProfileDetailSections.tsx`, `MasonryGallery.tsx`, and `CompatibilitySnapshot.tsx`.
- The old `CompatibilityHub.tsx` and superseded `RequireVerifiedIdentity.tsx` were also deleted.
- Active routes resolve only to MyProfile/ProfileDetail and current shared components. Production build passed with no broken imports.

### Safeguarding, gifting, and Premium surfaces

- `src/screens/Safeguarding.tsx` is a polished production-routed surface, but its Safe Mode, Pause, No Longer Interested, Block, Report, support, and subscription controls currently produce preview-only notices/local state. It is **not** a complete production safety workflow. The separate My Profile action menu does call current Safe Mode/Block/Report/Mute/account APIs where implemented.
- `GiftToMePreview.tsx` is a fully navigable in-memory category → fictional partner → offering → review and recipient acceptance preview. It is only reachable through design preview; the visitor Send Gift call-to-action is rendered only with `previewData`. No merchant, payment, fulfillment, address persistence, or gift route exists in production.
- Founding 500 membership/checkout/cancellation/billing surfaces are production code and use callable functions, but credentials and webhooks were not exercised here. Profile Viewers remains an honest empty “not available yet” panel. Gift to Me on owner Premium strip does not yet open a production gifting flow.

## 4. Current profile data contract

### Field mapping

| Visible field | Current storage/type source | Optional | Owner edit UI | Visitor behavior |
|---|---|---:|---:|---|
| Education | `UserDoc.profileExtras.education` / `SelfProfile.education` | Yes | Select in My Profile | Row hidden when empty |
| Languages | `profileExtras.languages: string[]` | Yes | Comma-separated input; onboarding uses approved language selector | Row hidden when empty |
| Job title | `profileExtras.profession` | Yes | Text input | Row hidden when empty |
| Height | root `UserDoc.heightCm` | Yes after onboarding/edit | Numeric cm input | Formatted feet/inches + cm; hidden when absent |
| Children | `profileExtras.children` | Yes | Existing approved option select | Hidden when empty |
| Wants children | `profileExtras.wantsChildren` | Yes | Existing approved option select | Hidden when empty |
| Faith or beliefs | root `UserDoc.religion` | Yes | Text input | Hidden when empty |
| Marital background | `profileExtras.maritalBackground` | Yes | Never married/Divorced/Widowed select | Hidden when empty |
| Favourite Places | `profileExtras.favoritePlaces: string[]` | Yes | Comma-separated input | Separate Travel row; hidden when empty |
| Dream Destinations | `profileExtras.dreamDestinations: string[]` | Yes | Comma-separated input | Separate Travel row; hidden when empty |
| Interests | `profileExtras.interests: string[]` | Onboarding requires configured minimum | Onboarding/edit shared object | Exact onboarding labels displayed |
| Lifestyle | `profileExtras.lifestyleVibe` | Onboarding requires one | Standalone Lifestyle step | One selected title; empty hidden |
| Values | `profileExtras.values: string[]` | Onboarding requires at least one | Standalone Values step | Displayed with Lifestyle on visitor view |
| Story biography | `profileExtras.about` | Onboarding completion requires configured length | Your Story/Edit data object | Used if no answered prompts |
| Story prompts | root `UserDoc.storyPrompts` | Onboarding requires two valid answers | Your Story step | Dynamic “[Name]’s Story” |
| Media | separate `media/{mediaId}` documents and Storage paths | Yes | My Profile media controls | Ready public media only |
| Western identity | root `sunSign`, `moonSign`, `risingSign` | Derived from confirmed birth data | Not free-form | Dynamic approved assets |
| Chinese identity | root `chineseAnimal`, `chineseElement`, `yinYang` | Derived | Not free-form | Dynamic approved assets |

`SelfProfile` is defined in `src/data/selfProfile.ts:4-24`; defaults are intentionally empty. `profileExtras` is a nested object on the main user document and is updated wholesale by `updateProfileExtrasRemote` (`src/lib/firestore.ts:461-463`). Height, faith, story prompts, media, and astrology use the root/related structures shown above.

`ProfileAboutFacts` omits each unusable value. Visitor Travel is omitted when both arrays are empty (`ProfileDetail.tsx:193,364-382`). Owner view shows a deliberate empty prompt in non-preview mode and editing fields in edit mode.

Dean must verify in a separate Firebase development project:

1. Account A edits all fields, saves, reloads, and sees exactly the persisted values.
2. Account B opens A’s visitor profile and sees only intended public values.
3. Empty and partial fields remain omitted after real serialization/deserialization.
4. Older documents missing new `SelfProfile` keys merge safely with `emptySelfProfile`.
5. No private fields are copied into a public projection.

Privacy warning: the current main `users/{uid}` document includes `profileExtras` and all root user fields and is readable in full by every authenticated user. Optional display does not provide field-level privacy. Public-profile projection must be redesigned before production.

## 5. Preview architecture and production boundaries

### Access controls

The route `/dev/design-preview` is registered in `src/App.tsx`. `src/lib/designPreviewAccess.ts` allows it only when all of these are true:

- Vite is in development mode;
- `VITE_ENABLE_DESIGN_PREVIEW=true`;
- hostname is `localhost` or `127.0.0.1`;
- Firebase is not configured.

This is a strong local gate. Dean should nevertheless ensure the environment flag is absent from deployed builds and consider moving the route registration itself behind the same compile-time condition for defence in depth.

### Current selector entries

`landingPage`, `signup`, `verification`, `birthDetails`, `preferences`, `relationshipGoals`, `interests`, `aboutYou`, `lifestyle`, `values`, `profilePhoto`, `yourStory`, `cosmicProfile`, `myProfile`, `safeguarding`, `explore`, `exploreInterested`, `exploreMatched`, `exploreAreaFree`, `exploreAreaPremium`, `matches`, `matchesPremium`, `matchesLoading`, `matchesEmpty`, `matchesRetry`, `matchesLiveError`, `visitorProfile`, `giftSend`, `giftReceive`, `compatibilityTeaser`, `compatibilityFull`.

The old Compatibility Hub selector entry is gone.

### Fixtures and behavior

- `src/data/designPreviewProfile.ts`: owner profile fixture.
- `src/data/designPreviewVisitorProfile.ts`: complete, partial, empty/distant visitor candidates, media, and pair results.
- `src/data/designPreviewDiscoverySearch.ts`: local area resolver/search and server-shaped sanitized result examples.
- `src/data/compatibilityExperience.ts`: compatibility report fixture.
- `src/data/giftPreview.ts`: fictional categories, partners, offerings, sender/recipient data.
- `src/screens/DesignPreview.tsx`: provider setup, selector, local handlers, loading/error scenarios.

Explore/gifting/match-list previews are intentionally interactive but local-only. Other preview screens are wrapped in an inert container. Anchor navigation is intercepted in interactive previews; explicit preview callbacks use the preview query route. `AppProvider` receives `designPreview`, `initialOnboarding`, and `initialProfileExtras`, so no Firebase writes are made.

Production components rendered with fixtures: Welcome, all onboarding screens, CosmicProfile, MyProfile, Safeguarding, Discovery, Matches, ProfileDetail, CompatibilityReport, and AppShell. GiftToMePreview is a preview-specific component rather than a production fulfillment feature.

Production-unavailable states:

- Search Area candidate service throws a typed unavailable error (`src/lib/discoveryAreaSearch.ts:67-76`).
- Gifting has no production data/service/route.
- Profile viewers has no collection or loader and displays an empty availability message.
- Safeguarding screen actions are local notices.

No fixture import was found in normal production routes/components other than explicit `previewData`/`preview` prop paths and the development-only preview screen. Risk remains if a future change imports fixture modules into production logic or enables the design-preview flag in a deployed development build; add a build/CI assertion.

## 6. Verification already completed

### Fresh checks performed for this handoff

- TypeScript application config: **passed** with `tsc -p tsconfig.app.json --noEmit --incremental false` using the installed bundled Node runtime.
- TypeScript Vite config: **passed** with `tsc -p tsconfig.node.json --noEmit --incremental false`.
- Lint: **passed with two warnings, no errors**. Warnings are `react(only-export-components)` in `src/context/AppContext.tsx:490` and `src/context/AuthContext.tsx:112`.
- Production Vite bundle: **passed**, written to `/private/tmp/perennia-handoff-build` so no project output was changed. Vite transformed 2,359 modules. It warned that the lazy `AuthContext` chunk is 586.40 kB (173.32 kB gzip), above 500 kB.
- `git diff --check`: **passed**.
- Broken imports: none detected by TypeScript/build.
- Dependency installation/update: none.

### Browser evidence from the current working session

The following were previously inspected in the local design preview and are not claims about backend correctness:

- Owner and visitor profiles at 390×844 and 1280×900, with intermediate 768×1024 and 1024×768 checks for recent profile/about/travel work.
- Complete, partial, and empty profile field behavior; Travel separated from About Me.
- Cosmic promotional wheel and CTA collision/cropping on owner and visitor profiles.
- Chinese Cosmic Profile rows remaining horizontally readable at mobile width.
- Explore neutral/interested/matched states; profile name/icon navigation into visitor preview.
- Your Matches ready/Premium/loading/empty/retry/live-error fixture states.
- Navigation handoff at 1279/1280, safe-area padding, and desktop/mobile exclusivity.
- Modal focus entry/trap/Escape/restore and background scroll lock on available preview overlays.
- Minimum touch targets for the requested profile/match/orbit/onboarding controls.
- Reduced-motion preference on representative continuous, entrance, media, and heart animations.
- Identity Verification overflow at 390, 768, 1024, and 1280 widths.

Horizontal overflow was not observed in the reviewed final previews. There is no automated screenshot/e2e suite in the repository proving every route. The build verifies imported source/assets; public assets referenced by string paths still require deployed-case-sensitive smoke tests.

Console evidence: local preview has shown the expected “Firebase not configured” development warning. Earlier stale HMR import errors were cleared by restarting the Vite server and did not recur in subsequent preview work. This handoff did not run an exhaustive console capture across every selector entry.

Backend behavior was **not** proven by in-memory preview tests. No Firebase, Stripe, email, GeoNames, push-notification, or production service was contacted.

## 7. Backend, security and integration work for Dean

| Severity | Area / impact | Current evidence | Owner | Recommended correction |
|---|---|---|---|---|
| **Critical** | Public/private user separation: any authenticated user can read another member’s complete document, including email, phone, legal name, full birth data, exact current/birth coordinates, push tokens, relationship/safety-adjacent arrays, and all `profileExtras`. | `firestore.rules:13-37`; `src/lib/firestore.ts:52-121,198-206,279-294` | Backend/security | Split private account/identity/location/push-token data from a sanitised public profile document. Deny cross-user reads of private docs. Return candidate/profile DTOs from server queries; migrate existing data. |
| **Critical** | User-document creation can include arbitrary fields, including forged verified/onboarding-complete/membership-adjacent state. | `firestore.rules:37` only checks owner uid; no create schema/allowlist. | Backend/security | Enforce exact allowed keys/default values and unverified status on create, or create documents only via a callable/Admin SDK. Add emulator rule tests for forged fields. |
| **Critical** | Onboarding completion is written directly by the client and is not blocked in the update rule. A user can set it without completing prerequisites. | `src/lib/firestore.ts:218-220`; `src/context/AppContext.tsx:442-445`; `firestore.rules:38-47` | Backend | Replace with a callable transaction that reads the canonical user/profile/media/verification records and validates all prerequisites server-side. Block client writes to `onboardingComplete` and other derived completion state. |
| **High** | Identity/onboarding/membership prerequisites are primarily route guards. They are not a security boundary for backend operations such as compatibility, liking, search, or checkout. | `RequireOnboardingStep.tsx`, `RequireFoundingMembership.tsx`, callable auth checks in `functions/src/index.ts` | Backend/integration | Add reusable server assertions for verified identity, completed onboarding, active membership, not paused/banned, and target eligibility to every protected callable. Use custom claims only if securely synchronized. |
| **High** | Bilateral block enforcement is good inside `recordLike`, but direct document/profile/discovery reads remain possible after either party blocks. | `matching.repository.ts:31-54`; `privacy.service.ts:35-53`; broad read at `firestore.rules:36`; ProfileDetail uses `getUserDoc` | Backend/security | Move profile/candidate retrieval behind server projection queries that check both private block lists. Prevent direct full-document reads. Test A-blocks-B and B-blocks-A for search, profile URL, messages, compatibility, friendships, and media. |
| **High** | Safe Mode is stored but not enforced in production candidate/match services. Dedicated Safeguarding screen’s switch is local-only and its copy promises hiding behavior. | `AppContext.tsx:432-435`; `privacy.service.ts:10-32`; `Safeguarding.tsx:55-121`; `Discovery.tsx:126-143` has no Safe Mode check | Backend + product | Define exact Safe Mode eligibility, then enforce it server-side for general Explore, compatibility discovery, direct profile lookup, and new interactions. Wire the screen to the canonical setting only after policy is settled. |
| **Medium** | Muting writes only the viewer’s private safety list. Messaging/notification delivery does not consult it. | `src/lib/firestore.ts:260-265`; `AppContext.tsx:422-430`; no mute reads in messaging/functions | Backend | Define whether mute suppresses push, in-app unread badges, thread visibility, or only alerts. Enforce in notification/message delivery and query projections. |
| **High** | Production Safeguarding route presents nonfunctional Pause/No Longer Interested/Block/Report/support controls; users may believe an action occurred because the route is production-visible. | `/safeguarding` in `App.tsx:93`; `Safeguarding.tsx:55-68,124-221` | Frontend + backend | Until each action exists, label/disable it honestly or restrict screen to preview. Reuse actual profile safety APIs for block/report; implement connection termination, pause state, support links, and confirmations server-side. |
| **Medium** | Report API records only a hardcoded `other-misconduct` category and no description/evidence; no moderation/review lifecycle is visible. | `privacy.service.ts:62-69`; `privacyApi.ts:22-24` | Backend/product | Define categories, evidence/privacy retention, moderator access, notifications, audit trail, rate limits, and emergency escalation. Validate payload server-side. |
| **Medium** | Pause Account has no backend state, allowance tracking, scheduling, expiry, or visibility enforcement. | `Safeguarding.tsx:124-153` | Backend/product | Add canonical pause records and server-side query enforcement only after duration/billing/interaction rules are approved. |
| **High** | Account deletion is implemented, but Stripe cancellation failure is logged and deletion continues, potentially leaving billing active. Cleanup uses one Firestore batch with a noted 500-write limit and report cleanup only covers reports made by the user. | `functions/src/services/account.service.ts:21-41,44-135` | Backend | Use a resumable/idempotent deletion job, reconcile Stripe before irreversible Auth deletion or create an operations queue, chunk writes, define report retention, and add retry/alerting. Test large accounts. |
| **Critical** | Full compatibility report is available to any onboarded paid member through direct `/compatibility/:id`; production `CompatibilityReport` defaults to `access='full'`. Premium is enforced only in Matches UI. | `CompatibilityReport.tsx:159-183`; `Matches.tsx:251,270-278`; route `App.tsx:90` | Backend + frontend | Server must derive entitlement and return teaser/full DTOs. Route loader must enforce Premium. Never rely on the button/lock icon. |
| **High** | `getCompatibility` accepts arbitrary client-provided Person A/B placements and returns the full score, factors, and narratives to any authenticated user. It does not bind either chart to authenticated/eligible member IDs. | `functions/src/index.ts:98-124`; `compatibility.validation.ts:53-69`; `src/lib/compatibilityApi.ts:58-70` | Backend/security | Accept a target uid, read both canonical charts server-side, enforce bilateral blocks/eligibility/Premium access, and return only the level allowed for the caller. Keep tables server-only. |
| **High** | Production Search Area candidate query is unimplemented. | `src/lib/discoveryAreaSearch.ts:67-76` | Backend/integration | Implement authenticated geospatial search (geohash/managed index), radius/eligibility/visibility/bilateral-block filters, pagination, and sanitised public DTOs. Return coarse distance only. |
| **High** | Default Explore fetches up to 50 complete user docs, then filters and sorts by exact coordinates client-side. This leaks data, does not scale, and can omit nearer candidates outside the arbitrary first 50. | `src/lib/firestore.ts:279-294`; `Discovery.tsx:115-143,214-221` | Backend | Replace with paginated nearest-first candidate endpoint. Never send exact coordinates. Specify deterministic tie-breaking/cursors. |
| **High** | High Compatibility Only Premium state and classification are not server-owned in production. Preview data sorts by score only when the toggle is active, while normal Explore is proximity-ordered. | `Discovery.tsx:223-234,629-647`; `designPreviewDiscoverySearch.ts:76-95` | Backend/product | Define threshold/classification and keep it server-owned. Enforce Premium entitlement in candidate query. Decide whether high-only results order by score or still proximity; current preview uses score then distance. |
| **High** | Public candidate/profile data is not sanitised; the safe DTO is only a type boundary for the missing area service. | `src/lib/discoveryAreaSearch.ts:13-42`; broad `DiscoveryCandidate = UserDoc & uid` in `firestore.ts:203-206` | Backend | Create explicit public-profile documents/DTOs with approved fields; exclude direct contacts, full DOB, precise coordinates, legal identity, push tokens, internal flags, and private preferences. |
| **High** | Stripe checkout success/cancel and billing return URLs accept any valid URL and are forwarded to Stripe. | `founding500.validation.ts:3-13`; `functions/src/index.ts:352-365,393-400`; `founding500.service.ts:60-84,235-251` | Backend/security | Validate allowed HTTPS origins/paths server-side; construct redirects from trusted configuration rather than accepting arbitrary origins. Add emulator/unit tests for malicious URLs. |
| **High** | Checkout checks authentication and offer capacity but not verified identity/onboarding completion; membership assignment trusts uid/tier metadata from the server-created session, which is good, but prerequisite policy is absent. | `functions/src/index.ts:352-370`; `founding500.service.ts:43-55` | Backend/product | Define purchase eligibility and enforce it server-side before creating Checkout. Recheck at webhook time where necessary. |
| **High** | Membership sync handles `checkout.session.completed` only. Subscription updates/deletes, invoice failures, refunds/disputes, schedule failures, and canceled-outside-app states are not synchronized. Paid-after-capacity cases are logged for manual reconciliation. | `functions/src/index.ts:290-323`; `founding500.service.ts:138-183` | Backend/operations | Handle full Stripe lifecycle idempotently, store event IDs, reconcile scheduled jobs, implement refund/waitlist automation, and alert on schedule/capacity failures. Test webhook retries/out-of-order delivery. |
| **Medium** | Cancellation and billing portal are implemented; cancellation is immediate, not period-end, and the product behavior requires confirmation. | `founding500.service.ts:186-255`; `ProfileActionsMenu.tsx:173-255,349-358` | Product/backend | Decide immediate vs period-end cancellation, access grace period, reactivation, proration/refund policy, and copy. Validate against Stripe test mode. |
| **High** | Media rules allow any authenticated user to read all media and do not validate immutable ownership/allowed fields on update. Storage is path-owner restricted but broadly readable to any authenticated user. Client video cap (500 MB) conflicts with Storage rule cap (200 MB). | `firestore.rules:120-130`; `storage.rules:6-27`; `mediaService.ts:14`; `firestore.ts:406-446` | Backend/security | Use public/protected media policy, validate document schema and immutable `userId`, reconcile size limits, scan/validate MIME, enforce readiness server-side, and add cleanup/retry for partial uploads/transcodes/deletes. |
| **Medium** | Messaging works for conversation participants with read receipts, but messages lack server-side text length/shape/rate validation and there is no push-delivery implementation visible. | `firestore.rules:101-117`; `firestore.ts:331-389`; `MessageThread.tsx` | Backend/product | Validate message keys/type/length, rate-limit/spam-control, block/mute checks, notification fan-out, abuse reporting, retention, and pagination. Decide free-message limits. |
| **Medium** | Profile Viewers has only a Premium empty UI; no view event schema, consent/privacy rule, deduplication, or loader exists. | `MyProfile.tsx:432-437,709-744`; no viewers collection/function | Product/backend | Decide if/when views are collected, who is visible, incognito behavior, retention, and opt-out. Implement server events and Premium-projected reads only after approval. |
| **High** | Visitor gifting is preview-only. Private address inputs exist only in local state, which is safe now, but no production privacy/merchant/payment/acceptance/fulfillment model exists. | `GiftToMePreview.tsx`, `giftPreview.ts`, DesignPreview entries; visitor CTA only under `previewData` | Product/backend/security | Design consent, encrypted/private fulfillment data, partner authorization, retention/deletion, acceptance/expiry, availability, payment/refund, fraud, webhook, and audit flows. Sender must never receive private delivery data. |
| **Low** | SPA direct URL rewriting is configured for Vercel. Firebase Hosting is not configured in `firebase.json`. | `vercel.json`; `firebase.json` | Deployment | Confirm actual host. Keep Vercel rewrite or add equivalent host rewrite, CSP/security headers, cache policy, and asset case-sensitivity checks. |
| **High** | New profile fields persist in the public `profileExtras` object, but no sanitized public projection or server validation exists. Whole-object updates can accept arbitrary strings/arrays. | `selfProfile.ts`; `firestore.ts:461-463`; MyProfile edit controls | Backend/integration | Add schema validation, length/enumeration limits, migration/versioning, and an explicit public projection. Verify save/reload/cross-account rendering using a dev project. |

## 8. Product decisions still required

1. **One-sided interest and conversations.** Current `recordLike` creates a shared `connection` and readable `conversation` on the first one-sided like (`matching.repository.ts:13-17,65-85`). That can make the sender discoverable to the recipient through inbox/conversation behavior before mutual interest. Decide whether messaging starts on one-sided interest or only after reciprocity; then align copy, privacy, query visibility, and server writes.
2. **Free messaging limits.** No free-message quota or eligibility limit was found. Decide whether messaging is match-only, connection/introduction-based, Premium-only after a limit, or unlimited. Define server enforcement and user-facing counters/errors.
3. **Premium compatibility access.** Current product intent appears to be: percentage visible in Explore/Matches, natural-language “Why you matched” Premium-gated on mutual matches, detailed route available from visitor profile. Decide exactly what teaser/detail each tier may receive and enforce server-side.
4. **Profile Viewers.** Decide whether this feature will exist, what constitutes a view, whether repeat views are aggregated, how incognito/private mode affects visibility, retention, and whether both viewer and viewed member can opt out.
5. **Gift to Me.** Decide partner commercial model, supported categories/regions, sender fees, recipient acceptance window, fulfillment, alternate partner/refund behavior, address custody, partner access, retention, disputes, and safety cancellation.
6. **Safe Mode.** The approved copy says hidden from general Explore while potentially available to high-compatibility results and existing connections. Confirm the exact visibility matrix, whether direct URLs work, who may initiate contact, and how Safe Mode interacts with matches, friends, gifts, and notifications.
7. **Public optional About Me fields.** Confirm whether Education, Languages, Job title, Height, Children, Wants children, Faith/beliefs, Marital background, Travel, Values, and Story are universally public to signed-in eligible members or need per-field visibility controls.
8. **High Compatibility Only.** Define the server-owned classification threshold and ordering. The frontend intentionally has no threshold; the preview’s high-only mode sorts score descending then distance. Decide whether proximity should remain primary.
9. **Compatibility scoring assumptions.** Current weights are hardcoded as Sun 20%, Moon 20%, Rising 10%, Animal 20%, Element 15%, Yin/Yang 15% (`functions/src/types/compatibility.ts:43-51`). Per-factor Low/Medium/High cutoffs are explicitly labelled an unverified assumption (0–49, 50–79, 80–100 at lines 59-69). Overall qualitative bands come from a mockup rather than the sheet (lines 72-86). Martallus must approve or provide authoritative values before launch.
10. **Cancellation/refund access.** Decide immediate versus period-end cancellation, paid-after-capacity handling, schedule failure remediation, refunds, and access grace periods.

## 9. Recommended implementation order for Dean

### Launch blockers

1. **Create the public/private member data model and migrate it.** This is the dependency for safe profiles, Explore, Matches, compatibility, blocking, media, and new About/Travel fields.
2. **Lock Firestore/Storage rules with emulator tests.** Deny cross-user private reads, reject forged create/update fields, validate media ownership/schema, and block direct onboarding/verification/derived-state writes.
3. **Move onboarding completion and protected-operation prerequisites server-side.** Require verified identity, complete onboarding, active membership, non-paused status, and target eligibility consistently.
4. **Harden compatibility.** Accept member IDs, read canonical charts, apply bilateral blocks and entitlement, return teaser/full DTOs, and remove direct full-report bypass.
5. **Implement server candidate search.** Return sanitised public profiles, coarse distance, pagination, bilateral blocks, Safe Mode/incognito/eligibility, and Premium high-compat classification. Replace `fetchDiscoveryCandidates` full-doc reads.
6. **Complete Stripe security/lifecycle.** Trusted redirects, prerequisite checks, full webhook state synchronization, idempotency/reconciliation, refund/capacity handling, and test-mode coverage.

### Backend integrations needed to make visible frontend functional

7. Implement Safe Mode, mute, pause, no-longer-interested, report workflow, and support links; make Safeguarding route honest until complete.
8. Confirm one-sided interest/conversation policy, then enforce it in match/message services and privacy rules.
9. Harden messaging: message validation, block/mute checks, pagination, spam/rate controls, push notifications, and any free-tier limit.
10. Harden media upload/transcode/delete, reconcile caps, and add cleanup/retry/state integrity.
11. Add validated persistence/public projection for new About Me/Travel fields and cross-account tests.
12. Either implement Profile Viewers/Gift to Me from approved specs or keep them explicitly unavailable/preview-only in production.

### Production verification

13. Run Firebase emulator rules tests and two-account integration tests.
14. Run Stripe test-mode checkout, webhook retry/out-of-order, cancellation, portal, failed payment, refund, and account-deletion reconciliation.
15. Deploy to a staging host and verify direct URL rewrites, CSP/security headers, asset case sensitivity, public/private projections, and responsive/accessibility matrix.

### Optional polish and optimisation

16. Split the 586 kB AuthContext chunk, address two Fast Refresh warnings, add automated component/e2e/accessibility tests, and add `.pnpm-store/` to ignore rules in a separate reviewed change.

## 10. Reproducible verification checklist

Use a separate Firebase development project or the configured Auth/Firestore/Functions/Storage emulators, Stripe test mode, and synthetic accounts only.

### Setup

- [ ] Clone/branch from the intended baseline and apply/include every handoff file except `.pnpm-store/` and `/private/tmp` artifacts.
- [ ] Configure emulator/test environment variables; do not use production credentials or real identity documents.
- [ ] Seed compatibility tables with approved non-production fixtures.
- [ ] Create two test accounts A/B, plus a third blocked/ineligible account.
- [ ] Create Free/Essential and Premium membership records only through test webhook/admin fixtures.

### Onboarding

- [ ] Direct-load every onboarding route and confirm earliest-incomplete redirection.
- [ ] Complete the exact 12-step sequence forwards/backwards; reload between steps.
- [ ] Confirm verification cannot be forged by client writes and Stripe test verification is required.
- [ ] Confirm Lifestyle one-choice, Values min-one, Interests configured minimum, story validation, profile-photo ownership, and final server completion.
- [ ] Test 390×844, 768×1024, 1024×768, 1280×900; verify no Identity Verification overflow.

### Profiles and persistence

- [ ] A edits all eight About Me values and both Travel lists, reloads, and sees persisted values.
- [ ] B views A and sees only approved public fields; empty/partial rows collapse.
- [ ] Query Firestore as B and prove A’s email, phone, legal name, full DOB/birth/current coordinates, push tokens, and private settings are inaccessible.
- [ ] Verify older/missing-field documents migrate/merge safely.
- [ ] Upload image/video, await test transcode, reorder/edit/delete, replace profile photo, and check orphan cleanup.
- [ ] Verify owner/visitor Cosmic cards, astrology assets, stories, actions, media viewer, keyboard focus, and reduced motion.

### Explore, Search Area, interest, and blocking

- [ ] Seed candidates at known coarse distances. Confirm nearest-first pagination and farther candidates remain reachable.
- [ ] Confirm compatibility never changes normal ordering.
- [ ] Search 5/10/25/50 mile radii and confirm no exact coordinates/addresses are returned.
- [ ] Toggle Premium High Compatibility Only; prove server entitlement and server classification.
- [ ] Test neutral → one-sided → mutual heart states; ensure compatibility never fills hearts.
- [ ] Decide/test whether one-sided interest creates a visible conversation.
- [ ] Test A blocks B and B blocks A: no discovery, direct profile, compatibility, messaging, friend, gift, or media access in either direction.
- [ ] Test Safe Mode/incognito and direct URL behavior.

### Matches, compatibility, and messaging

- [ ] Confirm only mutual matches appear; loading/empty/initial error/retry/live error all settle correctly with no duplicate subscriptions.
- [ ] Verify pair-specific percentages differ between seeded pairs.
- [ ] Free account sees locked “Why you matched”; direct detail URL does not bypass entitlement.
- [ ] Premium sees only permitted narratives; raw tables/weights are never returned.
- [ ] Test send/read receipt, pagination, message length/rate errors, block/mute behavior, and push notification opt-in/out.

### Safety/account

- [ ] Verify report categories/evidence/moderation record, block/unblock, mute/unmute, no-longer-interested, and Safe Mode.
- [ ] Verify Pause duration/expiry/allowance and visibility if implemented.
- [ ] Delete an account with many media/messages/matches and an active Stripe test subscription; verify idempotent complete cleanup and no continued billing.

### Stripe

- [ ] Reject off-origin success/cancel/return URLs.
- [ ] Reject checkout without approved onboarding/identity/membership eligibility.
- [ ] Test successful checkout, duplicate/out-of-order webhook, subscription update/delete, failed invoice, cancel, portal, refund/dispute, capacity race, and schedule failure.

### Gifting/viewers if implemented

- [ ] Sender never sees address/postcode/contact details.
- [ ] Only Perennia and the authorized fulfillment partner can access accepted delivery data; test expiry/deletion/audit.
- [ ] Test alternative partner/refund path.
- [ ] Verify viewer privacy/incognito/deduplication/retention and Premium access.

### Routing/accessibility/responsive

- [ ] Reload every production route directly on staging; confirm SPA rewrite and guards.
- [ ] Test shared nav at 390, 768, 1024, 1279, and 1280; exactly one nav is visible and content is not covered.
- [ ] Keyboard-test every dialog: entry, cycle, Escape, close button, trigger restoration, inert background, scroll lock.
- [ ] Test screen-reader labels/states, visible focus, 44×44 targets, contrast, normal and reduced motion.
- [ ] Confirm no horizontal overflow and no console/network errors at all four standard viewports.

## 11. Known limitations of this handoff

- No production service was contacted. No production Firebase, Stripe, GeoNames, Resend, push-notification, or merchant call was made.
- Preview fixtures prove presentation/state handling only; they do not prove Firestore rules, Cloud Functions, webhooks, entitlements, cross-account privacy, fulfillment, or persistence.
- Authentication/membership-gated production routes require Dean’s configured environment for end-to-end verification.
- Stripe Identity, checkout, portal, webhook, cancellation, refund, and membership synchronization require controlled test-mode testing.
- Search Area production candidates, gifting, profile viewers, and most dedicated Safeguarding actions are unavailable/preview-only.
- This report did not perform a fresh exhaustive browser pass of every selector entry; it records prior local visual evidence and fresh source/build checks.
- There is no repository e2e/accessibility/rules-test suite covering the full matrix.
- Public assets referenced by URL strings need staging/deployment smoke testing on a case-sensitive host.
- The build warning for the 586.40 kB AuthContext chunk remains.
- Two non-failing Fast Refresh lint warnings remain in AppContext/AuthContext.

## 12. Complete changed-file inventory

“Include” means include in the developer handoff/change set after review. Asset-family rows enumerate every file in that family.

### Modified tracked files (48)

| File path | Status | Feature or purpose | Include | Special review note |
|---|---|---|---:|---|
| `src/App.tsx` | Modified | Lazy routes, 12-step onboarding, current app routes, preview route, reduced motion | Yes | Compatibility Hub route removed; preview route relies on runtime gate |
| `src/components/founding500/MemberCounter.tsx` | Modified | Reduced-motion behavior | Yes | Visual-only |
| `src/components/layout/AppShell.tsx` | Modified | Shared sidebar/bottom nav, surface backgrounds, breakpoints, motion | Yes | Verify 1279/1280 handoff |
| `src/components/layout/OnboardingShell.tsx` | Modified | 12-step progress and responsive/motion layout | Yes | Central onboarding presentation |
| `src/components/layout/RequireFoundingMembership.tsx` | Modified | Auth/onboarding/member route gate | Yes | Client guard is not a backend authorization boundary |
| `src/components/shared/FullscreenMediaViewer.tsx` | Modified | Dialog semantics, focus trap, media navigation, reduced motion | Yes | Retest screen readers |
| `src/components/shared/MatchingPreferencesPanel.tsx` | Modified | Touch/motion/layout refinements | Yes | Existing business rules preserved |
| `src/components/shared/ProductMockups.tsx` | Modified | Reduced-motion alternatives | Yes | Landing visuals |
| `src/components/shared/ProfileActionsMenu.tsx` | Modified | Accessible action sheets, safety/membership/account controls | Yes | Stripe/safety operations need integration tests |
| `src/components/shared/ProfileCosmicWheel.tsx` | Modified | Shared transparent promotional wheel | Yes | Used by owner and visitor |
| `src/components/shared/ProfileOrbit.tsx` | Modified | Profile shortcuts, touch targets, reduced motion | Yes | Verify no overlapping hit areas |
| `src/components/shared/ZodiacWheel.tsx` | Modified | Reduced-motion wheel behavior | Yes | Full Cosmic component |
| `src/components/ui/button.tsx` | Modified | Shared touch/button sizing | Yes | Check global impact |
| `src/components/ui/dialog.tsx` | Modified | Dialog motion/accessibility adjustment | Yes | Radix behavior retained |
| `src/components/ui/onboarding-buttons.tsx` | Modified | Shared onboarding action sizing | Yes | 44px minimum |
| `src/components/ui/progress-ring.tsx` | Modified | Reduced-motion progress behavior | Yes | Status remains visible |
| `src/components/ui/switch.tsx` | Modified | Switch touch sizing | Yes | Radix semantics retained |
| `src/context/AppContext.tsx` | Modified | Profile extras, safety, likes/matches, persistence, onboarding state | Yes | Fast Refresh warning; server trust gaps documented |
| `src/data/interests.ts` | Modified | Approved interest labels/options | Yes | Shared onboarding/profile source |
| `src/data/lifestyleOptions.ts` | Modified | Expanded Lifestyle choices | Yes | Shared source, single-choice |
| `src/data/selfProfile.ts` | Modified | Owner/visitor public editable profile contract | Yes | Needs validated public projection |
| `src/index.css` | Modified | Shared profile/onboarding/nav/responsive/accessibility styling | Yes | Large central diff; regression review important |
| `src/lib/developmentVerification.ts` | Modified | Explicit local verification bypass constraints | Yes | Confirm never deploy-enabled |
| `src/lib/firestore.ts` | Modified | Profile, discovery, match, message, media, private lifestyle data access | Yes | Major security/integration review required |
| `src/lib/founding500.ts` | Modified | Membership cancel/portal client functions | Yes | Trusted return URL needed server-side |
| `src/screens/AboutYouDetails.tsx` | Modified | About You fields/navigation | Yes | Shared profile data |
| `src/screens/BirthDetails.tsx` | Modified | Birth/current location and onboarding flow | Yes | Sensitive data separation required |
| `src/screens/CompatibilityReport.tsx` | Modified | Detailed/teaser compatibility experience | Yes | Production defaults full; fix entitlement |
| `src/screens/CosmicProfile.css` | Modified | Western/Chinese rows and responsive layout | Yes | Key visual approval |
| `src/screens/CosmicProfile.tsx` | Modified | Cosmic data/presentation/preview injection | Yes | Preserve calculations |
| `src/screens/CosmicZodiacWheel.tsx` | Modified | Natal wheel presentation | Yes | Separate from promo wheel |
| `src/screens/Discovery.css` | Modified | Full-screen Explore and Search Area styling | Yes | Verify safe areas |
| `src/screens/Discovery.tsx` | Modified | Feed, ordering, interest states, compatibility, Search Area UI | Yes | Replace full-doc client candidate path |
| `src/screens/InterestsStep.tsx` | Modified | Interests-only onboarding, icon tiles | Yes | Lifestyle is separate step |
| `src/screens/MatchScreen.tsx` | Modified | Match completion/reduced motion | Yes | Preserve mutual logic |
| `src/screens/Matches.tsx` | Modified | Mutual matches, compatibility gate, retry/error states | Yes | Production async integration tests needed |
| `src/screens/MessageThread.tsx` | Modified | Read receipts/reduced motion | Yes | Message policy/security still required |
| `src/screens/MyProfile.tsx` | Modified | Active owner profile, edit/media/About/Travel/modals | Yes | Core handoff file |
| `src/screens/Preferences.tsx` | Modified | Gender preference step/navigation | Yes | 12-step flow |
| `src/screens/ProfileDetail.tsx` | Modified | Active visitor profile and actions | Yes | Core handoff file; message may create one-sided like |
| `src/screens/ProfilePhoto.tsx` | Modified | Onboarding photo navigation/validation | Yes | Storage integration tests needed |
| `src/screens/RelationshipGoalsStep.tsx` | Modified | Copy/icons/navigation | Yes | Uses supplied SVGs |
| `src/screens/Settings.tsx` | Modified | Safety/account/profile settings and motion | Yes | Backend behavior review |
| `src/screens/SignUp.tsx` | Modified | Onboarding route/validation/presentation | Yes | Auth integration required |
| `src/screens/Verify.tsx` | Modified | Five-stage identity flow and overflow fix | Yes | Stripe test-mode required |
| `src/screens/Welcome.tsx` | Modified | Landing page/approved logo/reduced motion | Yes | Approved art |
| `src/screens/YourStoryStep.tsx` | Modified | Story validation/navigation | Yes | Root prompt + profile biography fields |
| `src/types/media.ts` | Modified | Unified media display typing | Yes | Used owner/visitor |

### Deleted tracked files (6)

| File path | Status | Feature or purpose | Include | Special review note |
|---|---|---|---:|---|
| `src/components/layout/RequireVerifiedIdentity.tsx` | Deleted | Superseded route guard | Yes | Replaced by central `RequireOnboardingStep` |
| `src/components/shared/CompatibilitySnapshot.tsx` | Deleted | Legacy compatibility profile block | Yes | No active consumers |
| `src/components/shared/MasonryGallery.tsx` | Deleted | Legacy profile gallery | Yes | Replaced by active media rows/viewer |
| `src/components/shared/ProfileDetailSections.tsx` | Deleted | Legacy visitor sections | Yes | Active ProfileDetail renders current sections |
| `src/components/shared/ProfileExperience.tsx` | Deleted | Unused legacy profile experience | Yes | Repository tracing found no consumer before deletion |
| `src/screens/CompatibilityHub.tsx` | Deleted | Removed standalone Hub | Yes | Keep `/compatibility/:id` detail route |

### Untracked application/source files (29)

| File path | Status | Feature or purpose | Include | Special review note |
|---|---|---|---:|---|
| `src/components/layout/RequireOnboardingStep.tsx` | Untracked | Central 12-step guard | Yes | Security is still backend responsibility |
| `src/components/shared/CompatibilityWhyDialog.tsx` | Untracked | Premium match explanation dialog | Yes | Uses modal hook |
| `src/components/shared/ConnectionHeartsIcon.tsx` | Untracked | Semantic double-heart explanation art | Yes | Decorative image |
| `src/components/shared/InterestHeartsIcon.css` | Untracked | Interest state glow/pulse/reduced motion | Yes | Requires mask assets |
| `src/components/shared/InterestHeartsIcon.tsx` | Untracked | Neutral/interested/matched masked icon states | Yes | Exact approved artwork foundation |
| `src/components/shared/ProfileAboutFacts.tsx` | Untracked | Shared eight-row About renderer | Yes | Owner and visitor |
| `src/components/shared/ProfileAstrologyIdentity.tsx` | Untracked | Dynamic Western/Chinese profile badges | Yes | Owner and visitor |
| `src/data/chineseAstrologyPresentation.ts` | Untracked | Chinese row/card data and assets | Yes | Preserve five-row semantics |
| `src/data/compatibilityExperience.ts` | Untracked | Compatibility presentation adapter/fixture | Yes | Preview percentages marked sample |
| `src/data/designPreviewDiscoverySearch.ts` | Untracked | In-memory Search Area results | Yes | Never production query |
| `src/data/designPreviewProfile.ts` | Untracked | Owner preview fixture | Yes | Local sample only |
| `src/data/designPreviewVisitorProfile.ts` | Untracked | Visitor/candidate/match fixtures | Yes | Complete/partial/empty local data |
| `src/data/giftPreview.ts` | Untracked | Fictional gift marketplace fixture | Yes | Preview only |
| `src/data/onboardingOptions.ts` | Untracked | Shared approved options | Yes | Used validation and screens |
| `src/data/profileAbout.ts` | Untracked | Shared About field shape/helper | Yes | Public projection still needed |
| `src/data/profileAstrologyAssets.ts` | Untracked | All-sign/all-animal asset mapping | Yes | Sheep maps to goat |
| `src/data/values.ts` | Untracked | Shared Values options | Yes | Onboarding source |
| `src/hooks/useModalAccessibility.ts` | Untracked | Focus/inert/scroll-lock modal stack | Yes | Important accessibility utility |
| `src/lib/designPreviewAccess.ts` | Untracked | Local-only preview gate | Yes | Review deployed-env defense |
| `src/lib/discoveryAreaSearch.ts` | Untracked | Safe DTO/interface and unavailable production boundary | Yes | Backend implementation required |
| `src/lib/onboardingFlow.ts` | Untracked | 12-step metadata, validation, progress | Yes | Core flow contract |
| `src/screens/CompatibilityReport.css` | Untracked | Detailed compatibility styling | Yes | Responsive review |
| `src/screens/DesignPreview.tsx` | Untracked | Local selector and fixtures | Yes | Must stay development-only |
| `src/screens/GiftToMePreview.css` | Untracked | Gift preview styling | Yes | Preview only |
| `src/screens/GiftToMePreview.tsx` | Untracked | Send/receive in-memory gift flow | Yes | No production integration |
| `src/screens/LifestyleStep.tsx` | Untracked | Standalone Lifestyle onboarding | Yes | Single-choice + separate toggle |
| `src/screens/Safeguarding.css` | Untracked | Safeguarding presentation | Yes | Screen currently production-routed |
| `src/screens/Safeguarding.tsx` | Untracked | Safety/support visual surface | Yes | Most actions local-only |
| `src/screens/ValuesStep.tsx` | Untracked | Standalone Values onboarding | Yes | Min-one validation |

### Untracked approved public assets (90 files)

| File path(s) | Status | Feature or purpose | Include | Special review note |
|---|---|---|---:|---|
| `public/approved-symbol-cards-v4/western-placements-dark/{jupiter,mars,mercury,moon,neptune,pluto,rising-ascendant,saturn,sun,uranus,venus}.png` | Untracked (11) | Approved dark Western placement cards | Yes | Runtime URL assets; verify case-sensitive deploy |
| `public/approved-symbol-cards-v4/zodiac-white/{aquarius,aries,cancer,capricorn,gemini,leo,libra,pisces,sagittarius,scorpio,taurus,virgo}.png` | Untracked (12) | Approved white Western sign cards | Yes | Profile/Cosmic mapping |
| `public/astrology/perennia-martallus-natal-wheel.svg` | Untracked | Full Cosmic natal wheel | Yes | Do not confuse with promo wheel |
| `public/astrology/perennia-zodiac-wheel-blue-approved.png` | Untracked | Shared profile promotional wheel | Yes | Transparent artwork |
| `public/astrology/perennia-zodiac-wheel-gold.png` | Untracked | Alternate/approved gold wheel asset | Yes | Confirm whether both wheel variants are required |
| `public/celestial-placement-symbols-v1/{jupiter,mars,mercury,moon,neptune,pluto,rising-ascendant,saturn,sun,uranus,venus}.png` | Untracked (11) | PNG placement symbols | Yes | Confirm no redundant family can be removed later |
| `public/celestial-placement-symbols/{jupiter,mars,mercury,moon,neptune,pluto,rising,saturn,sun,uranus,venus}.svg` | Untracked (11) | SVG placement symbols | Yes | Existing/full Cosmic assets |
| `public/chinese-astrology-v1/animals/{dog,dragon,goat,horse,monkey,ox,pig,rabbit,rat,rooster,snake,tiger}.png` | Untracked (12) | Approved Chinese animals | Yes | Sheep aliases goat in mapping |
| `public/chinese-astrology-v1/elements/{earth,fire,metal,water,wood}.png` | Untracked (5) | Chinese element cards | Yes | Cosmic rows |
| `public/chinese-astrology-v1/polarity/{yang,yin}.png` | Untracked (2) | Chinese polarity cards | Yes | Cosmic rows |
| `public/perennia-constellation-heart.png` | Untracked | Landing constellation heart | Yes | Approved art |
| `public/perennia-crescent.png` | Untracked | Landing crescent | Yes | Approved art |
| `public/perennia-double-heart-connection.png` | Untracked | Approved heart foundation/semantic connection icon | Yes | Do not redraw |
| `public/perennia-double-heart-them-mask.png` | Untracked | Exact larger-heart fill mask | Yes | Required by InterestHeartsIcon |
| `public/perennia-double-heart-you-mask.png` | Untracked | Exact smaller-heart fill mask | Yes | Required by InterestHeartsIcon |
| `public/perennia-wordmark-ornament-approved.png` | Untracked | Approved combined landing wordmark | Yes | Primary current asset |
| `public/perennia-wordmark-ornament.png` | Untracked | Additional wordmark variant | Yes, review | Confirm whether this duplicate/variant is intentionally retained |
| `public/relationship-goal-icons/{exploring-compass,marriage-rings,not-sure-question,serious-heart-shield}.svg` | Untracked (4) | Approved relationship-goal icons | Yes | Imported directly |
| `public/western-zodiac-v1/{aquarius,aries,cancer,capricorn,gemini,leo,libra,pisces,sagittarius,scorpio,taurus,virgo}.png` | Untracked (12) | Additional Western zodiac image set | Yes, review | Confirm active vs approved-card family before later deduplication |

### Untracked machine-local file (1)

| File path | Status | Feature or purpose | Include | Special review note |
|---|---|---|---:|---|
| `.pnpm-store/v11/index.db` | Untracked | Local package-manager cache database | **No** | Exclude; preferably add `.pnpm-store/` to `.gitignore` separately |

Inventory totals: 48 modified + 6 deleted + 29 untracked source + 90 untracked public assets + 1 untracked local file = **174 files represented**.

## 13. Dean’s acceptance checklist

- [ ] Confirm branch/commit baseline and preserve the intentional working tree.
- [ ] Exclude `.pnpm-store/` and every `/private/tmp` artifact.
- [ ] Review and include all 119 untracked application/source/assets; ensure no required runtime image is omitted.
- [ ] Re-run TypeScript, lint, production build, and `git diff --check` in Dean’s environment.
- [ ] Confirm deleted legacy files have no consumer and Compatibility Hub remains removed while `/compatibility/:id` remains.
- [ ] Approve the exact 12-step onboarding metadata and test server-enforced completion.
- [ ] Accept the owner/visitor profile data contract and decide visibility for every optional field.
- [ ] Replace full user-document reads with sanitised public/private projections before staging with real data.
- [ ] Lock user creation/update rules and onboarding/verification derived state; add emulator rule tests.
- [ ] Implement bilateral block, Safe Mode, mute, pause, and profile visibility enforcement server-side.
- [ ] Enforce compatibility entitlement and canonical pair inputs server-side.
- [ ] Implement scalable proximity Search Area and High Compatibility Only server-side.
- [ ] Validate/construct trusted Stripe redirects and complete lifecycle synchronization.
- [ ] Resolve one-sided conversation, free messaging, Safe Mode, viewers, gifting, high-compat threshold, and compatibility scoring decisions with Martallus.
- [ ] Run two-account Firebase/Stripe test-mode checklist without real identity/payment/personal data.
- [ ] Verify media upload/transcode/delete and reconcile the 500 MB client vs 200 MB Storage cap.
- [ ] Verify My Profile/Visitor Profile save, reload, cross-account display, and empty/partial cases.
- [ ] Verify Explore/Matches profile navigation, interest privacy, direct-route blocking, and Premium gating.
- [ ] Verify keyboard, screen-reader, touch-target, reduced-motion, and responsive matrices.
- [ ] Verify staging direct URL rewrites, assets, console/network, CSP/security headers, and no fixture leakage.
- [ ] Decide whether to retain duplicate/alternate astrology and wordmark asset families before later cleanup; do not remove approved assets casually.
- [ ] Address or accept the two Fast Refresh warnings and AuthContext chunk-size warning.
- [ ] Record sign-off from Martallus on product decisions before enabling incomplete production surfaces.
