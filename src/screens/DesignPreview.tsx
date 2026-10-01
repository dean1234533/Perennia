import { useMemo, type MouseEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { AppProvider, type OnboardingData } from '@/context/AppContext'
import { DESIGN_PREVIEW_PROFILE, DESIGN_PREVIEW_PROFILE_PHOTO_URL } from '@/data/designPreviewProfile'
import type { SelfProfile } from '@/data/selfProfile'
import { PARTNER_VALUE_OPTIONS, RELATIONSHIP_GOALS } from '@/data/relationshipGoals'
import { STORY_PROMPTS } from '@/data/storyPrompts'
import { firebaseConfigured } from '@/lib/firebase'
import { isDesignPreviewAccessAllowed } from '@/lib/designPreviewAccess'
import { Welcome } from '@/screens/Welcome'
import { SignUp } from '@/screens/SignUp'
import { Verify } from '@/screens/Verify'
import { BirthDetails } from '@/screens/BirthDetails'
import { Preferences } from '@/screens/Preferences'
import { RelationshipGoalsStep } from '@/screens/RelationshipGoalsStep'
import { InterestsStep } from '@/screens/InterestsStep'
import { AboutYouDetails } from '@/screens/AboutYouDetails'
import { LifestyleStep } from '@/screens/LifestyleStep'
import { ValuesStep } from '@/screens/ValuesStep'
import { ProfilePhoto } from '@/screens/ProfilePhoto'
import { YourStoryStep } from '@/screens/YourStoryStep'
import { CosmicProfile } from '@/screens/CosmicProfile'
import { MyProfile } from '@/screens/MyProfile'
import { Safeguarding } from '@/screens/Safeguarding'
import { Discovery } from '@/screens/Discovery'
import { Matches } from '@/screens/Matches'
import { ProfileDetail } from '@/screens/ProfileDetail'
import { CompatibilityReport } from '@/screens/CompatibilityReport'
import { GiftToMePreview } from '@/screens/GiftToMePreview'
import { AppShell } from '@/components/layout/AppShell'
import { DESIGN_PREVIEW_COMPATIBILITY } from '@/data/compatibilityExperience'
import { resolveDesignPreviewDiscoveryArea, searchDesignPreviewDiscoveryArea } from '@/data/designPreviewDiscoverySearch'
import {
  DESIGN_PREVIEW_AREA_HIGH_COMPATIBILITY,
  DESIGN_PREVIEW_AREA_HIGH_PROFILE,
  DESIGN_PREVIEW_AREA_HIGHER_COMPATIBILITY,
  DESIGN_PREVIEW_AREA_HIGHER_PROFILE,
  DESIGN_PREVIEW_AREA_STANDARD_COMPATIBILITY,
  DESIGN_PREVIEW_AREA_STANDARD_PROFILE,
  DESIGN_PREVIEW_DISTANT_COMPATIBILITY,
  DESIGN_PREVIEW_DISTANT_PROFILE,
  DESIGN_PREVIEW_VISITOR_COMPATIBILITY,
  DESIGN_PREVIEW_VISITOR_LIFESTYLE,
  DESIGN_PREVIEW_VISITOR_MEDIA,
  DESIGN_PREVIEW_VISITOR_PROFILE,
} from '@/data/designPreviewVisitorProfile'

const DESIGN_PREVIEW_FLAG = import.meta.env.VITE_ENABLE_DESIGN_PREVIEW === 'true'
const COSMIC_PROFILE_WESTERN_SAMPLE = {
  sunSign: 'Pisces',
  moonSign: 'Virgo',
  risingSign: 'Taurus',
  mercurySign: 'Aries',
  venusSign: 'Pisces',
  marsSign: 'Scorpio',
  jupiterSign: 'Capricorn',
  saturnSign: 'Scorpio',
  uranusSign: 'Sagittarius',
  neptuneSign: 'Capricorn',
  plutoSign: 'Scorpio',
} as const

const COSMIC_PROFILE_CHINESE_SAMPLE = {
  animal: 'Rat',
  heavenlyStem: 'Jia',
  stemElement: 'Wood',
  earthlyBranch: 'Zi',
  polarity: 'Yang',
} as const

function CosmicProfileDesignPreview() {
  return (
    <CosmicProfile
      previewWesternValues={COSMIC_PROFILE_WESTERN_SAMPLE}
      previewChineseProfile={COSMIC_PROFILE_CHINESE_SAMPLE}
    />
  )
}

function MyProfileDesignPreview() {
  return (
    <AppShell activeNavPath="/my-profile" surface="profile">
      <MyProfile preview />
    </AppShell>
  )
}

function SafeguardingDesignPreview() {
  return <Safeguarding preview />
}

function ExploreDesignPreview({
  interestState = 'neutral',
  isPremium = false,
  initialAreaDialogOpen = false,
}: {
  interestState?: 'neutral' | 'interested' | 'matched'
  isPremium?: boolean
  initialAreaDialogOpen?: boolean
}) {
  const navigate = useNavigate()
  return (
    <AppShell activeNavPath="/discovery">
      <Discovery
        previewData={{
          candidates: [
            DESIGN_PREVIEW_VISITOR_PROFILE,
            DESIGN_PREVIEW_AREA_HIGH_PROFILE,
            DESIGN_PREVIEW_AREA_HIGHER_PROFILE,
            DESIGN_PREVIEW_AREA_STANDARD_PROFILE,
            DESIGN_PREVIEW_DISTANT_PROFILE,
          ],
          scores: {
            [DESIGN_PREVIEW_VISITOR_PROFILE.uid]: DESIGN_PREVIEW_VISITOR_COMPATIBILITY,
            [DESIGN_PREVIEW_AREA_HIGH_PROFILE.uid]: DESIGN_PREVIEW_AREA_HIGH_COMPATIBILITY,
            [DESIGN_PREVIEW_AREA_HIGHER_PROFILE.uid]: DESIGN_PREVIEW_AREA_HIGHER_COMPATIBILITY,
            [DESIGN_PREVIEW_AREA_STANDARD_PROFILE.uid]: DESIGN_PREVIEW_AREA_STANDARD_COMPATIBILITY,
            [DESIGN_PREVIEW_DISTANT_PROFILE.uid]: DESIGN_PREVIEW_DISTANT_COMPATIBILITY,
          },
          lifestyles: {
            [DESIGN_PREVIEW_VISITOR_PROFILE.uid]: DESIGN_PREVIEW_VISITOR_LIFESTYLE,
            [DESIGN_PREVIEW_AREA_HIGH_PROFILE.uid]: DESIGN_PREVIEW_VISITOR_LIFESTYLE,
            [DESIGN_PREVIEW_AREA_HIGHER_PROFILE.uid]: DESIGN_PREVIEW_VISITOR_LIFESTYLE,
            [DESIGN_PREVIEW_AREA_STANDARD_PROFILE.uid]: DESIGN_PREVIEW_VISITOR_LIFESTYLE,
            [DESIGN_PREVIEW_DISTANT_PROFILE.uid]: DESIGN_PREVIEW_VISITOR_LIFESTYLE,
          },
          interestStates: {
            [DESIGN_PREVIEW_VISITOR_PROFILE.uid]: interestState,
          },
          isPremium,
          resolveArea: resolveDesignPreviewDiscoveryArea,
          searchArea: searchDesignPreviewDiscoveryArea,
          initialAreaDialogOpen,
          onViewProfile: (profile) => navigate(`/dev/design-preview?screen=visitorProfile&member=${profile.uid}`),
        }}
      />
    </AppShell>
  )
}

function ExploreInterestedDesignPreview() {
  return <ExploreDesignPreview interestState="interested" />
}

function ExploreMatchedDesignPreview() {
  return <ExploreDesignPreview interestState="matched" />
}

function ExploreAreaFreeDesignPreview() {
  return <ExploreDesignPreview initialAreaDialogOpen />
}

function ExploreAreaPremiumDesignPreview() {
  return <ExploreDesignPreview isPremium initialAreaDialogOpen />
}

type MatchesPreviewScenario = 'ready' | 'loading' | 'empty' | 'retry' | 'live-error'

function createMatchesPreviewSubscription(
  scenario: Exclude<MatchesPreviewScenario, 'ready'>,
  successfulMatches: Array<{ matchId: string; profile: typeof DESIGN_PREVIEW_VISITOR_PROFILE }>,
) {
  let deliveredInitialFailure = false

  return (
    onMatches: (matches: Array<{ matchId: string; profile: typeof DESIGN_PREVIEW_VISITOR_PROFILE }>) => void,
    onError: (error: Error) => void,
  ) => {
    const timers: number[] = []
    const schedule = (callback: () => void, delay: number) => {
      timers.push(window.setTimeout(callback, delay))
    }

    if (scenario === 'loading') {
      schedule(() => onMatches(successfulMatches), 60_000)
    } else if (scenario === 'empty') {
      schedule(() => onMatches([]), 450)
    } else if (scenario === 'retry') {
      if (!deliveredInitialFailure) {
        schedule(() => {
          deliveredInitialFailure = true
          onError(new Error('Local preview initial-load failure.'))
        }, 450)
      } else {
        schedule(() => onMatches(successfulMatches), 450)
      }
    } else {
      schedule(() => onMatches(successfulMatches), 300)
      schedule(() => onError(new Error('Local preview live-update failure.')), 1_100)
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }
}

function MatchesDesignPreview({ isPremium = false, scenario = 'ready' }: { isPremium?: boolean; scenario?: MatchesPreviewScenario }) {
  const navigate = useNavigate()
  const previewMatches = useMemo(() => [
    { matchId: 'local-preview-match', profile: DESIGN_PREVIEW_VISITOR_PROFILE },
    { matchId: 'local-distant-preview-match', profile: DESIGN_PREVIEW_DISTANT_PROFILE },
  ], [])
  const subscribeMatches = useMemo(() => scenario === 'ready'
    ? undefined
    : createMatchesPreviewSubscription(scenario, previewMatches), [previewMatches, scenario])
  return (
    <AppShell activeNavPath="/matches">
      <Matches
        previewData={{
          matches: previewMatches,
          scores: {
            [DESIGN_PREVIEW_VISITOR_PROFILE.uid]: DESIGN_PREVIEW_VISITOR_COMPATIBILITY,
            [DESIGN_PREVIEW_DISTANT_PROFILE.uid]: DESIGN_PREVIEW_DISTANT_COMPATIBILITY,
          },
          isPremium,
          subscribeMatches,
          onViewProfile: (profile) => navigate(`/dev/design-preview?screen=visitorProfile&member=${profile.uid}`),
          onMessage: () => undefined,
        }}
      />
    </AppShell>
  )
}

function MatchesPremiumDesignPreview() {
  return <MatchesDesignPreview isPremium />
}

function MatchesLoadingDesignPreview() {
  return <MatchesDesignPreview scenario="loading" />
}

function MatchesEmptyDesignPreview() {
  return <MatchesDesignPreview scenario="empty" />
}

function MatchesRetryDesignPreview() {
  return <MatchesDesignPreview scenario="retry" />
}

function MatchesLiveErrorDesignPreview() {
  return <MatchesDesignPreview scenario="live-error" />
}

function VisitorProfileDesignPreview() {
  const [searchParams] = useSearchParams()
  const memberUid = searchParams.get('member')
  const profileOptions = [
    { profile: DESIGN_PREVIEW_VISITOR_PROFILE, compatibility: DESIGN_PREVIEW_VISITOR_COMPATIBILITY },
    { profile: DESIGN_PREVIEW_AREA_HIGH_PROFILE, compatibility: DESIGN_PREVIEW_AREA_HIGH_COMPATIBILITY },
    { profile: DESIGN_PREVIEW_AREA_HIGHER_PROFILE, compatibility: DESIGN_PREVIEW_AREA_HIGHER_COMPATIBILITY },
    { profile: DESIGN_PREVIEW_AREA_STANDARD_PROFILE, compatibility: DESIGN_PREVIEW_AREA_STANDARD_COMPATIBILITY },
    { profile: DESIGN_PREVIEW_DISTANT_PROFILE, compatibility: DESIGN_PREVIEW_DISTANT_COMPATIBILITY },
  ]
  const selected = profileOptions.find((option) => option.profile.uid === memberUid) ?? profileOptions[0]
  return (
    <AppShell surface="profile">
      <ProfileDetail
        previewData={{
          profile: selected.profile,
          media: DESIGN_PREVIEW_VISITOR_MEDIA,
          compatibility: selected.compatibility,
          friendState: 'friends',
          isFoundingMember: true,
          isMatched: true,
        }}
      />
    </AppShell>
  )
}

function CompatibilityTeaserDesignPreview() {
  return (
    <AppShell surface="compatibility">
      <CompatibilityReport previewData={{ access: 'teaser', experience: DESIGN_PREVIEW_COMPATIBILITY }} />
    </AppShell>
  )
}

function CompatibilityFullDesignPreview() {
  return (
    <AppShell surface="compatibility">
      <CompatibilityReport previewData={{ access: 'full', experience: DESIGN_PREVIEW_COMPATIBILITY }} />
    </AppShell>
  )
}

function SendGiftDesignPreview() {
  return (
    <AppShell activeNavPath="/discovery" surface="profile">
      <GiftToMePreview mode="send" />
    </AppShell>
  )
}

function ReceiveGiftDesignPreview() {
  return (
    <AppShell activeNavPath="/my-profile" surface="profile">
      <GiftToMePreview mode="receive" />
    </AppShell>
  )
}

const previewScreens = [
  { id: 'landingPage', label: 'Landing Page', Component: Welcome },
  { id: 'signup', label: 'Sign Up', Component: SignUp },
  { id: 'verification', label: 'Identity Verification', Component: Verify },
  { id: 'birthDetails', label: 'Birth Details', Component: BirthDetails },
  { id: 'preferences', label: 'Gender Preferences', Component: Preferences },
  { id: 'relationshipGoals', label: 'Relationship Goals', Component: RelationshipGoalsStep },
  { id: 'interests', label: 'Interests', Component: InterestsStep },
  { id: 'aboutYou', label: 'About You', Component: AboutYouDetails },
  { id: 'lifestyle', label: 'Lifestyle', Component: LifestyleStep },
  { id: 'values', label: 'Values', Component: ValuesStep },
  { id: 'profilePhoto', label: 'Profile Photo', Component: ProfilePhoto },
  { id: 'yourStory', label: 'Your Story', Component: YourStoryStep },
  { id: 'cosmicProfile', label: 'Cosmic Profile', Component: CosmicProfileDesignPreview },
  { id: 'myProfile', label: 'My Profile', Component: MyProfileDesignPreview },
  { id: 'safeguarding', label: 'Safeguarding', Component: SafeguardingDesignPreview },
  { id: 'explore', label: 'Explore — Neutral Interest', Component: ExploreDesignPreview },
  { id: 'exploreInterested', label: 'Explore — Interest Sent', Component: ExploreInterestedDesignPreview },
  { id: 'exploreMatched', label: 'Explore — Mutual Match', Component: ExploreMatchedDesignPreview },
  { id: 'exploreAreaFree', label: 'Explore — Search Area (Free)', Component: ExploreAreaFreeDesignPreview },
  { id: 'exploreAreaPremium', label: 'Explore — Search Area (Premium)', Component: ExploreAreaPremiumDesignPreview },
  { id: 'matches', label: 'Your Matches', Component: MatchesDesignPreview },
  { id: 'matchesPremium', label: 'Your Matches — Premium', Component: MatchesPremiumDesignPreview },
  { id: 'matchesLoading', label: 'Your Matches — Loading', Component: MatchesLoadingDesignPreview },
  { id: 'matchesEmpty', label: 'Your Matches — Empty', Component: MatchesEmptyDesignPreview },
  { id: 'matchesRetry', label: 'Your Matches — Retry Error', Component: MatchesRetryDesignPreview },
  { id: 'matchesLiveError', label: 'Your Matches — Live Error', Component: MatchesLiveErrorDesignPreview },
  { id: 'visitorProfile', label: 'Visitor Profile', Component: VisitorProfileDesignPreview },
  { id: 'giftSend', label: 'Gift to Me — Send Gift', Component: SendGiftDesignPreview },
  { id: 'giftReceive', label: 'Gift to Me — Receive Gift', Component: ReceiveGiftDesignPreview },
  { id: 'compatibilityTeaser', label: 'Compatibility — Locked', Component: CompatibilityTeaserDesignPreview },
  { id: 'compatibilityFull', label: 'Compatibility — Full Access', Component: CompatibilityFullDesignPreview },
] as const

type PreviewScreenId = (typeof previewScreens)[number]['id']

function isPreviewScreenId(value: string | null): value is PreviewScreenId {
  return previewScreens.some((screen) => screen.id === value)
}

function sampleOnboarding(screen: PreviewScreenId): Partial<OnboardingData> {
  const astrologySample = screen === 'cosmicProfile' || screen === 'explore' || screen === 'exploreInterested' || screen === 'exploreMatched' || screen === 'exploreAreaFree' || screen === 'exploreAreaPremium' || screen === 'matches' || screen === 'matchesPremium' || screen === 'matchesLoading' || screen === 'matchesEmpty' || screen === 'matchesRetry' || screen === 'matchesLiveError'
  return {
    email: 'sample@local.preview',
    password: 'sample-preview-passphrase',
    birthDate: '1995-06-15',
    birthTimeUnknown: true,
    gender: 'male',
    relationshipGoal: screen === 'explore' ? DESIGN_PREVIEW_VISITOR_PROFILE.relationshipGoal : RELATIONSHIP_GOALS[1].value,
    relationshipGoalSelectedAt: '2026-01-01T00:00:00.000Z',
    partnerValues: [PARTNER_VALUE_OPTIONS[0], PARTNER_VALUE_OPTIONS[1]],
    prioritiseSameRelationshipGoal: true,
    storyPrompts: STORY_PROMPTS.slice(0, 2).map((question, index) => ({
      question,
      answer: index === 0
        ? 'I am curious, thoughtful and always learning something new.'
        : 'I care about creative work, meaningful conversation and kindness.',
    })),
    ...(screen === 'profilePhoto' ? {
      profilePhotoUrl: DESIGN_PREVIEW_PROFILE_PHOTO_URL,
      profilePhotoThumbUrl: DESIGN_PREVIEW_PROFILE_PHOTO_URL,
    } : {}),
    ...(screen === 'myProfile' ? {
      heightCm: 185,
      religion: 'Spiritual, not religious',
    } : {}),
    ...(astrologySample ? {
      birthDetailsConfirmedAt: '2026-01-01T00:00:00.000Z',
      birthPlace: 'Sample City, GB',
      birthCountry: 'GB',
      birthCity: 'Sample City',
      birthPlaceLat: 51.5,
      birthPlaceLon: -0.1,
      country: 'GB',
      city: 'Sample City',
      currentLocationLat: 51.5,
      currentLocationLon: -0.1,
      sunSign: 'Pisces',
      moonSign: 'Virgo',
      risingSign: 'Taurus',
      chineseAnimal: 'Rat',
      chineseElement: 'Wood',
      yinYang: 'Yang' as const,
    } : {}),
  }
}

function sampleProfile(): Partial<SelfProfile> {
  return {
    ...DESIGN_PREVIEW_PROFILE,
    interests: [...DESIGN_PREVIEW_PROFILE.interests],
    values: [...DESIGN_PREVIEW_PROFILE.values],
    music: [...DESIGN_PREVIEW_PROFILE.music],
    languages: [...DESIGN_PREVIEW_PROFILE.languages],
    favoritePlaces: [...DESIGN_PREVIEW_PROFILE.favoritePlaces],
    dreamDestinations: [...DESIGN_PREVIEW_PROFILE.dreamDestinations],
  }
}

export function DesignPreview() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedScreen = searchParams.get('screen')
  const selectedId: PreviewScreenId = isPreviewScreenId(requestedScreen) ? requestedScreen : 'interests'
  const selectedScreen = previewScreens.find((screen) => screen.id === selectedId)!
  const onboarding = useMemo(() => sampleOnboarding(selectedId), [selectedId])
  const profile = useMemo(() => sampleProfile(), [])
  const accessAllowed = isDesignPreviewAccessAllowed({
    isDevelopment: import.meta.env.DEV,
    flagEnabled: DESIGN_PREVIEW_FLAG,
    hostname: window.location.hostname,
    backendConfigured: firebaseConfigured,
  })

  if (!accessAllowed) return <Navigate to="/" replace />

  const SelectedScreen = selectedScreen.Component
  const interactivePreview = selectedId === 'giftSend' || selectedId === 'giftReceive' ||
    selectedId === 'explore' || selectedId === 'exploreInterested' || selectedId === 'exploreMatched' || selectedId === 'exploreAreaFree' || selectedId === 'exploreAreaPremium' || selectedId === 'matches' || selectedId === 'matchesPremium' || selectedId === 'matchesLoading' || selectedId === 'matchesEmpty' || selectedId === 'matchesRetry' || selectedId === 'matchesLiveError'

  return (
    <AuthProvider>
      <AppProvider
        key={selectedId}
        designPreview
        initialOnboarding={onboarding}
        initialProfileExtras={profile}
      >
        <div className="relative min-h-screen bg-midnight">
          {interactivePreview ? (
            <div
              aria-label={`${selectedScreen.label} interactive local design preview`}
              onClickCapture={(event: MouseEvent<HTMLDivElement>) => {
                if ((event.target as Element).closest('a')) event.preventDefault()
              }}
            >
              <SelectedScreen />
            </div>
          ) : (
            <div inert aria-label={`${selectedScreen.label} design preview`}>
              <SelectedScreen />
            </div>
          )}

          <aside className="fixed right-3 top-3 z-[100] w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl border border-cyan-200/25 bg-[#07122f]/95 p-4 text-white shadow-2xl backdrop-blur-xl">
            <p className="text-sm font-semibold text-cyan-100">Local design preview — sample data</p>
            <label className="mt-3 block text-xs text-white/60" htmlFor="design-preview-screen">Preview page</label>
            <select
              id="design-preview-screen"
              value={selectedId}
              onChange={(event) => setSearchParams({ screen: event.target.value })}
              className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-midnight px-3 text-sm text-white outline-none focus:border-cyan-200/60"
            >
              {previewScreens.map((screen) => (
                <option key={screen.id} value={screen.id}>{screen.label}</option>
              ))}
            </select>
            <p className="mt-3 text-xs leading-5 text-white/50">
              The screen below uses in-memory sample data. Gift and member-list previews use local-only controls; all other preview interactions are disabled. Nothing saves or proves backend behaviour.
            </p>
          </aside>
        </div>
      </AppProvider>
    </AuthProvider>
  )
}
