import { emptySelfProfile } from '@/data/selfProfile'
import { DEFAULT_MEDIA_CATEGORIES } from '@/data/mediaCategories'
import { defaultPreferences, type DiscoveryCandidate, type MediaDoc, type PrivateLifestyle } from '@/lib/firestore'
import type { CompatibilityResult } from '@/lib/compatibilityApi'

const VISITOR_PHOTO_DATA_URL = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0" y1="0" x2="1" y2="1"%3E%3Cstop stop-color="%235783d5"/%3E%3Cstop offset="1" stop-color="%239d70c5"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23g)"/%3E%3Ccircle cx="200" cy="148" r="70" fill="%23f0cdbb"/%3E%3Cpath d="M75 400c10-105 60-155 125-155s115 50 125 155" fill="%23152b67"/%3E%3Cpath d="M125 145c0-72 35-105 78-105 55 0 83 40 77 116-22-22-49-35-83-35-26 0-50 8-72 24Z" fill="%23202143"/%3E%3C/svg%3E'

export const DESIGN_PREVIEW_VISITOR_PROFILE: DiscoveryCandidate = {
  uid: 'local-visitor-profile',
  name: 'Amara Bennett',
  email: 'visitor@local.preview',
  phone: '',
  onboardingResumePath: '',
  verification: {
    status: 'verified',
    provider: 'stripe_identity',
    verificationReference: null,
    verifiedAt: '2026-01-01T00:00:00.000Z',
    detailsConfirmedAt: '2026-01-01T00:00:00.000Z',
  },
  onboardingComplete: true,
  legalName: '',
  aboutYouCompletedAt: '2026-01-01T00:00:00.000Z',
  birthDetailsConfirmedAt: '2026-01-01T00:00:00.000Z',
  birthDate: '1992-07-08',
  birthTime: '10:30',
  birthTimeUnknown: false,
  birthPlace: 'Sample City, GB',
  birthCountry: 'GB',
  birthCity: 'Sample City',
  birthPlaceLat: 51.5,
  birthPlaceLon: -0.1,
  sunSign: 'Cancer',
  moonSign: 'Libra',
  risingSign: 'Aquarius',
  chineseAnimal: 'Dragon',
  chineseElement: 'Wood',
  yinYang: 'Yang',
  gender: 'female',
  heightCm: 168,
  country: 'GB',
  city: 'Sample City',
  religion: 'Spiritual, not religious',
  relationshipGoal: 'Long-term Relationship / Marriage',
  relationshipGoalSelectedAt: '2026-01-01T00:00:00.000Z',
  relationshipDealBreakers: ['Dishonesty'],
  partnerValues: ['Kindness', 'Communication'],
  prioritiseSameRelationshipGoal: true,
  currentLocationLat: 51.5,
  currentLocationLon: -0.1,
  storyPrompts: [
    { question: 'My ideal Sunday looks like…', answer: 'A coastal walk, a relaxed lunch and time with people I care about.' },
    { question: 'Something I’m always curious about', answer: 'The stories behind places, art and the people who make them memorable.' },
  ],
  preferences: defaultPreferences,
  incognito: false,
  showDistance: true,
  pushNotificationsEnabled: true,
  pushTokens: [],
  likedIds: [],
  passedIds: [],
  matchedIds: [],
  blockedIds: [],
  profilePhotoUrl: VISITOR_PHOTO_DATA_URL,
  profilePhotoThumbUrl: VISITOR_PHOTO_DATA_URL,
  categories: DEFAULT_MEDIA_CATEGORIES.slice(0, 4).map(({ id, label }) => ({ id, label })),
  profileExtras: {
    ...emptySelfProfile,
    about: 'Warm, curious and grounded. I value thoughtful conversation, creativity and building a life with room for both adventure and calm.',
    interests: ['Travel', 'Photography', 'Music', 'Food & Cooking', 'Outdoor Adventures'],
    lifestyleVibe: 'Social & Connected',
    openToNewThings: true,
    values: ['Kindness', 'Trust', 'Growth'],
    music: ['Soul', 'Jazz'],
    languages: ['English', 'French'],
    favoritePlaces: ['Sample Coast', 'Sample Highlands'],
    dreamDestinations: ['Japan', 'New Zealand'],
    fitness: 'Walking and yoga',
    books: 'Contemporary fiction and biographies',
    movies: 'Independent cinema',
    goals: 'A meaningful partnership built on trust, laughter and shared experiences.',
    profession: 'Creative Producer',
    education: 'Master’s degree',
    children: 'No children',
    wantsChildren: 'Wants children',
    maritalBackground: 'Never married',
    location: 'Sample City, United Kingdom',
  },
}

export const DESIGN_PREVIEW_DISTANT_PROFILE: DiscoveryCandidate = {
  ...DESIGN_PREVIEW_VISITOR_PROFILE,
  uid: 'local-distant-profile',
  name: 'Leila Morgan',
  email: 'distant-visitor@local.preview',
  birthDate: '1990-03-20',
  birthPlace: 'North Sample Region, GB',
  birthCity: 'North Sample Region',
  birthPlaceLat: 55.86,
  birthPlaceLon: -4.25,
  sunSign: 'Pisces',
  moonSign: 'Taurus',
  risingSign: 'Libra',
  chineseAnimal: 'Horse',
  chineseElement: 'Metal',
  yinYang: 'Yin',
  city: 'North Sample Region',
  currentLocationLat: 55.86,
  currentLocationLon: -4.25,
  religion: '',
  profileExtras: {
    ...(DESIGN_PREVIEW_VISITOR_PROFILE.profileExtras ?? emptySelfProfile),
    education: '',
    profession: 'Community Arts Coordinator',
    languages: ['English'],
    children: 'Has children',
    wantsChildren: '',
    maritalBackground: 'Divorced',
    favoritePlaces: [],
    dreamDestinations: ['Sample Fjords'],
    location: 'North Sample Region, United Kingdom',
  },
}

export const DESIGN_PREVIEW_AREA_HIGH_PROFILE: DiscoveryCandidate = {
  ...DESIGN_PREVIEW_VISITOR_PROFILE,
  uid: 'local-area-high-profile',
  name: 'Maya Collins',
  email: 'area-high@local.preview',
  birthDate: '1993-11-18',
  sunSign: 'Scorpio',
  moonSign: 'Cancer',
  risingSign: 'Virgo',
  chineseAnimal: 'Rooster',
  currentLocationLat: 51.62,
  currentLocationLon: -0.1,
  city: 'Greater London',
  profileExtras: {
    ...(DESIGN_PREVIEW_VISITOR_PROFILE.profileExtras ?? emptySelfProfile),
    location: 'Greater London, United Kingdom',
  },
}

export const DESIGN_PREVIEW_AREA_HIGHER_PROFILE: DiscoveryCandidate = {
  ...DESIGN_PREVIEW_VISITOR_PROFILE,
  uid: 'local-area-higher-profile',
  name: 'Sophie Reed',
  email: 'area-higher@local.preview',
  birthDate: '1991-05-24',
  sunSign: 'Gemini',
  moonSign: 'Pisces',
  risingSign: 'Libra',
  chineseAnimal: 'Goat',
  currentLocationLat: 51.75,
  currentLocationLon: -0.2,
  city: 'North London',
  profileExtras: {
    ...(DESIGN_PREVIEW_VISITOR_PROFILE.profileExtras ?? emptySelfProfile),
    location: 'North London, United Kingdom',
  },
}

export const DESIGN_PREVIEW_AREA_STANDARD_PROFILE: DiscoveryCandidate = {
  ...DESIGN_PREVIEW_VISITOR_PROFILE,
  uid: 'local-area-standard-profile',
  name: 'Nora Ellis',
  email: 'area-standard@local.preview',
  birthDate: '1989-09-09',
  sunSign: 'Virgo',
  moonSign: 'Capricorn',
  risingSign: 'Taurus',
  chineseAnimal: 'Snake',
  currentLocationLat: 51.9,
  currentLocationLon: -0.3,
  city: 'Hertfordshire',
  heightCm: null,
  religion: '',
  profileExtras: {
    ...(DESIGN_PREVIEW_VISITOR_PROFILE.profileExtras ?? emptySelfProfile),
    education: '',
    profession: '',
    languages: [],
    children: '',
    wantsChildren: '',
    maritalBackground: '',
    favoritePlaces: [],
    dreamDestinations: [],
    location: 'Hertfordshire, United Kingdom',
  },
}

const visitorMediaSources = [
  '/landingPage-Desktop1.JPG',
  '/perennia-landing-landscape-v2.webp',
  '/landingPage-Desktop4.JPG',
  '/landingPage-Mobile1.JPG',
  '/landingPage-Mobile4.JPG',
]

export const DESIGN_PREVIEW_VISITOR_MEDIA: MediaDoc[] = visitorMediaSources.map((url, index) => ({
  id: `visitor-preview-media-${index}`,
  userId: DESIGN_PREVIEW_VISITOR_PROFILE.uid,
  type: index < 3 ? 'image' : 'video',
  url,
  thumbnailUrl: url,
  category: DESIGN_PREVIEW_VISITOR_PROFILE.categories[index % DESIGN_PREVIEW_VISITOR_PROFILE.categories.length].id,
  caption: index < 3 ? `Sample profile photo ${index + 1}` : `Sample profile video ${index - 2}`,
  createdAt: 0,
  order: index,
  processingStatus: 'ready',
  ...(index >= 3 ? { video: { poster: url } } : {}),
}))

export const DESIGN_PREVIEW_VISITOR_LIFESTYLE: PrivateLifestyle = {
  visibility: 'public',
  items: [
    { label: 'Lifestyle', value: 'Social & Connected' },
    { label: 'Open to New Things', value: 'Yes' },
  ],
}

const previewFactor = {
  score: 86,
  tier: 'HIGH' as const,
  insight: 'A strong sample compatibility signal for layout preview only.',
}

export const DESIGN_PREVIEW_VISITOR_COMPATIBILITY: CompatibilityResult = {
  compatibility: 86,
  band: 'Strong connection',
  factors: {
    sun: previewFactor,
    moon: previewFactor,
    rising: previewFactor,
    animal: previewFactor,
    element: previewFactor,
    yinYang: { ...previewFactor, tier: 'COMPLEMENTARY' },
  },
  insights: {
    understanding: 'You may find it easier than usual to recognise what the other person needs and to approach differences with warmth and curiosity.',
    emotionalConnection: 'There is encouraging potential for emotional trust when both people make space for honesty and reassurance.',
    communication: 'Conversation may feel thoughtful and supportive, especially when expectations are expressed clearly rather than assumed.',
    relationshipGrowth: 'This connection can grow through shared experiences, mutual encouragement and a willingness to learn from one another.',
    challenges: 'Different rhythms may occasionally need patience, but direct and considerate communication can help prevent misunderstandings.',
    longTermPotential: 'The existing compatibility result supports meaningful long-term potential when both people continue investing in trust, consistency and shared direction.',
  },
}

export const DESIGN_PREVIEW_DISTANT_COMPATIBILITY: CompatibilityResult = {
  ...DESIGN_PREVIEW_VISITOR_COMPATIBILITY,
  compatibility: 72,
  band: 'Promising connection',
  insights: {
    understanding: 'You may need a little more time to understand one another, but curiosity and patience can build a rewarding connection.',
    emotionalConnection: 'Emotional trust may grow steadily when both people communicate their needs openly and consistently.',
    communication: 'Different communication styles can complement one another when both people listen carefully and clarify expectations.',
    relationshipGrowth: 'This connection can develop through shared experiences and a willingness to appreciate different perspectives.',
    challenges: 'Moments of uncertainty may benefit from a slower pace and direct, considerate conversation.',
    longTermPotential: 'The existing compatibility result suggests promising potential when both people invest in trust, flexibility and shared direction.',
  },
}

export const DESIGN_PREVIEW_AREA_HIGH_COMPATIBILITY: CompatibilityResult = {
  ...DESIGN_PREVIEW_VISITOR_COMPATIBILITY,
  compatibility: 91,
  band: 'Excellent connection',
}

export const DESIGN_PREVIEW_AREA_HIGHER_COMPATIBILITY: CompatibilityResult = {
  ...DESIGN_PREVIEW_VISITOR_COMPATIBILITY,
  compatibility: 82,
  band: 'Strong connection',
}

export const DESIGN_PREVIEW_AREA_STANDARD_COMPATIBILITY: CompatibilityResult = {
  ...DESIGN_PREVIEW_DISTANT_COMPATIBILITY,
  compatibility: 64,
  band: 'Developing connection',
}
