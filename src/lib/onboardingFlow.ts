import type { OnboardingData } from '@/context/AppContext'
import { COUNTRIES } from '@/data/countries'
import {
  AVAILABLE_INTERESTS,
  LEGACY_INTEREST_MAP,
  MIN_ONBOARDING_INTERESTS,
} from '@/data/interests'
import {
  EDUCATION_OPTIONS,
  LANGUAGE_OPTIONS,
  LIFESTYLE_VIBE_OPTIONS,
  SUPPORTED_GENDERS,
} from '@/data/onboardingOptions'
import {
  DEAL_BREAKER_OPTIONS,
  isNotSureGoalExpired,
  NOT_SURE_GOAL,
  PARTNER_VALUE_OPTIONS,
  RELATIONSHIP_GOALS,
} from '@/data/relationshipGoals'
import type { SelfProfile } from '@/data/selfProfile'
import { STORY_PROMPTS } from '@/data/storyPrompts'
import { AVAILABLE_VALUES } from '@/data/values'
import { TIME_OPTIONS } from '@/lib/timeOptions'

export const STORY_COMPLETION_LIMITS = {
  biographyMin: 50,
  biographyMax: 500,
  promptMin: 20,
  promptMax: 300,
  requiredPrompts: 2,
} as const

export type OnboardingStepId =
  | 'signup'
  | 'verification'
  | 'birthDetails'
  | 'preferences'
  | 'relationshipGoals'
  | 'interests'
  | 'aboutYou'
  | 'lifestyle'
  | 'values'
  | 'profilePhoto'
  | 'yourStory'
  | 'cosmicProfile'

export interface OnboardingCompletionInput {
  onboarding: OnboardingData
  profileExtras: SelfProfile
  user: { uid: string; email: string | null } | null
  profileLoaded: boolean
  onboardingComplete: boolean
  backendConfigured: boolean
  localPreviewBypassEnabled: boolean
}

export interface OnboardingStepDefinition {
  id: OnboardingStepId
  route: string
  previousRoute: string | null
  nextRoute: string | null
  requiresAuthentication: boolean
  requiresProfile: boolean
  completedUserRevisit: 'allow' | 'redirect-to-app'
  isComplete: (input: OnboardingCompletionInput) => boolean
}

const countryCodes = new Set<string>(COUNTRIES.map((country) => country.code))
const timeValues = new Set<string>(TIME_OPTIONS.map((option) => option.value))
const genderValues = new Set<string>(SUPPORTED_GENDERS)
const relationshipGoalValues = new Set<string>(RELATIONSHIP_GOALS.map((goal) => goal.value))
const dealBreakerValues = new Set<string>(DEAL_BREAKER_OPTIONS)
const partnerValueValues = new Set<string>(PARTNER_VALUE_OPTIONS)
const interestValues = new Set<string>(AVAILABLE_INTERESTS)
const educationValues = new Set<string>(EDUCATION_OPTIONS)
const languageValues = new Set<string>(LANGUAGE_OPTIONS)
const lifestyleVibeValues = new Set<string>(LIFESTYLE_VIBE_OPTIONS)
const storyPromptValues = new Set<string>(STORY_PROMPTS)
const personalValueValues = new Set<string>(AVAILABLE_VALUES)

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isFiniteCoordinate(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
}

function hasUniqueRecognisedValues(values: unknown, allowed: Set<string>, minimum: number, maximum?: number) {
  if (!Array.isArray(values)) return false
  const recognised = values.filter((value): value is string => typeof value === 'string' && allowed.has(value))
  const unique = new Set(recognised)
  return unique.size === values.length &&
    unique.size >= minimum &&
    (maximum === undefined || unique.size <= maximum)
}

function isValidDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getTime() <= Date.now()
}

function isValidTimestamp(value: unknown) {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value))
}

function isGenuineSignupComplete(input: OnboardingCompletionInput) {
  if (input.localPreviewBypassEnabled && !input.backendConfigured) return true
  if (!input.backendConfigured || !input.user || !input.profileLoaded) return false
  if (!isNonEmptyString(input.onboarding.email)) return false
  const storedEmail = input.onboarding.email.trim().toLowerCase()
  const authenticatedEmail = input.user.email?.trim().toLowerCase() ?? ''
  return storedEmail.length > 0 && storedEmail === authenticatedEmail
}

function isIdentityComplete(input: OnboardingCompletionInput) {
  if (input.localPreviewBypassEnabled && !input.backendConfigured) return true
  const verification = input.onboarding.verification
  return verification.status === 'verified' &&
    verification.provider === 'stripe_identity' &&
    isNonEmptyString(verification.verificationReference) &&
    isValidTimestamp(verification.verifiedAt) &&
    isValidTimestamp(verification.detailsConfirmedAt)
}

function isBirthDetailsComplete(input: OnboardingCompletionInput) {
  const data = input.onboarding
  return isValidTimestamp(data.birthDetailsConfirmedAt) &&
    isValidDate(data.birthDate) &&
    (data.birthTimeUnknown === true || timeValues.has(data.birthTime)) &&
    countryCodes.has(data.birthCountry) &&
    isNonEmptyString(data.birthCity) &&
    isNonEmptyString(data.birthPlace) &&
    isFiniteCoordinate(data.birthPlaceLat) &&
    isFiniteCoordinate(data.birthPlaceLon) &&
    countryCodes.has(data.country) &&
    isNonEmptyString(data.city) &&
    isFiniteCoordinate(data.currentLocationLat) &&
    isFiniteCoordinate(data.currentLocationLon)
}

function isPreferencesComplete(input: OnboardingCompletionInput) {
  return genderValues.has(input.onboarding.gender)
}

function isRelationshipGoalsComplete(input: OnboardingCompletionInput) {
  const data = input.onboarding
  if (!relationshipGoalValues.has(data.relationshipGoal)) return false
  if (data.relationshipGoal === NOT_SURE_GOAL && isNotSureGoalExpired(data.relationshipGoalSelectedAt)) return false
  return hasUniqueRecognisedValues(data.partnerValues, partnerValueValues, 1, 4) &&
    hasUniqueRecognisedValues(data.relationshipDealBreakers, dealBreakerValues, 0, 3)
}

function isInterestsComplete(input: OnboardingCompletionInput) {
  if (!Array.isArray(input.profileExtras.interests)) return false
  const recognised = input.profileExtras.interests
    .filter((value): value is string => typeof value === 'string')
    .map((value) => LEGACY_INTEREST_MAP[value] ?? value)
    .filter((value) => interestValues.has(value))
  return new Set(recognised).size >= MIN_ONBOARDING_INTERESTS
}

function isAboutYouComplete(input: OnboardingCompletionInput) {
  const { profession, education, languages } = input.profileExtras
  const professionComplete = profession === 'Prefer not to say' || isNonEmptyString(profession)
  return professionComplete &&
    educationValues.has(education) &&
    hasUniqueRecognisedValues(languages, languageValues, 1)
}

function isLifestyleComplete(input: OnboardingCompletionInput) {
  return lifestyleVibeValues.has(input.profileExtras.lifestyleVibe)
}

function isValuesComplete(input: OnboardingCompletionInput) {
  if (!Array.isArray(input.profileExtras.values)) return false
  const recognised = input.profileExtras.values.filter(
    (value): value is string => typeof value === 'string' && personalValueValues.has(value),
  )
  return new Set(recognised).size >= 1
}

function urlBelongsToUser(value: string, uid: string) {
  try {
    const decoded = decodeURIComponent(value)
    return decoded.includes(`users/${uid}/profile/`) || decoded.includes(`users/${uid}/media/`)
  } catch {
    return false
  }
}

function isProfilePhotoComplete(input: OnboardingCompletionInput) {
  const { profilePhotoUrl, profilePhotoThumbUrl } = input.onboarding
  if (!isNonEmptyString(profilePhotoUrl) || !isNonEmptyString(profilePhotoThumbUrl)) return false
  if (input.localPreviewBypassEnabled && !input.backendConfigured) {
    return profilePhotoUrl.startsWith('data:image/') && profilePhotoThumbUrl.startsWith('data:image/')
  }
  if (!input.user) return false
  return urlBelongsToUser(profilePhotoUrl, input.user.uid) && urlBelongsToUser(profilePhotoThumbUrl, input.user.uid)
}

function isYourStoryComplete(input: OnboardingCompletionInput) {
  const limits = STORY_COMPLETION_LIMITS
  if (typeof input.profileExtras.about !== 'string') return false
  const biographyLength = input.profileExtras.about.trim().length
  if (biographyLength < limits.biographyMin || biographyLength > limits.biographyMax) return false
  if (!Array.isArray(input.onboarding.storyPrompts)) return false

  const answers = new Map<string, string>()
  for (const prompt of input.onboarding.storyPrompts) {
    if (!prompt || typeof prompt !== 'object') return false
    if (!storyPromptValues.has(prompt.question)) continue
    if (answers.has(prompt.question) || typeof prompt.answer !== 'string') return false
    answers.set(prompt.question, prompt.answer)
  }

  let validAnswers = 0
  for (const question of STORY_PROMPTS) {
    const answer = answers.get(question)?.trim() ?? ''
    if (!answer) continue
    if (answer.length < limits.promptMin || answer.length > limits.promptMax) return false
    validAnswers += 1
  }
  return validAnswers >= limits.requiredPrompts
}

const completionValidators: Record<OnboardingStepId, (input: OnboardingCompletionInput) => boolean> = {
  signup: isGenuineSignupComplete,
  verification: isIdentityComplete,
  birthDetails: isBirthDetailsComplete,
  preferences: isPreferencesComplete,
  relationshipGoals: isRelationshipGoalsComplete,
  interests: isInterestsComplete,
  aboutYou: isAboutYouComplete,
  lifestyle: isLifestyleComplete,
  values: isValuesComplete,
  profilePhoto: isProfilePhotoComplete,
  yourStory: isYourStoryComplete,
  cosmicProfile: (input) => input.onboardingComplete,
}

const stepMetadata: Omit<OnboardingStepDefinition, 'isComplete'>[] = [
  { id: 'signup', route: '/signup', previousRoute: null, nextRoute: '/verify', requiresAuthentication: false, requiresProfile: false, completedUserRevisit: 'redirect-to-app' },
  { id: 'verification', route: '/verify', previousRoute: '/signup', nextRoute: '/birth-details', requiresAuthentication: true, requiresProfile: true, completedUserRevisit: 'allow' },
  { id: 'birthDetails', route: '/birth-details', previousRoute: '/verify', nextRoute: '/preferences', requiresAuthentication: true, requiresProfile: true, completedUserRevisit: 'allow' },
  { id: 'preferences', route: '/preferences', previousRoute: '/birth-details', nextRoute: '/relationship-goals', requiresAuthentication: true, requiresProfile: true, completedUserRevisit: 'allow' },
  { id: 'relationshipGoals', route: '/relationship-goals', previousRoute: '/preferences', nextRoute: '/interests', requiresAuthentication: true, requiresProfile: true, completedUserRevisit: 'allow' },
  { id: 'interests', route: '/interests', previousRoute: '/relationship-goals', nextRoute: '/about-you', requiresAuthentication: true, requiresProfile: true, completedUserRevisit: 'allow' },
  { id: 'aboutYou', route: '/about-you', previousRoute: '/interests', nextRoute: '/lifestyle', requiresAuthentication: true, requiresProfile: true, completedUserRevisit: 'allow' },
  { id: 'lifestyle', route: '/lifestyle', previousRoute: '/about-you', nextRoute: '/values', requiresAuthentication: true, requiresProfile: true, completedUserRevisit: 'allow' },
  { id: 'values', route: '/values', previousRoute: '/lifestyle', nextRoute: '/profile-photo', requiresAuthentication: true, requiresProfile: true, completedUserRevisit: 'allow' },
  { id: 'profilePhoto', route: '/profile-photo', previousRoute: '/values', nextRoute: '/your-story', requiresAuthentication: true, requiresProfile: true, completedUserRevisit: 'allow' },
  { id: 'yourStory', route: '/your-story', previousRoute: '/profile-photo', nextRoute: '/cosmic-profile', requiresAuthentication: true, requiresProfile: true, completedUserRevisit: 'allow' },
  { id: 'cosmicProfile', route: '/cosmic-profile', previousRoute: '/your-story', nextRoute: null, requiresAuthentication: true, requiresProfile: true, completedUserRevisit: 'allow' },
]

export const ONBOARDING_STEPS: OnboardingStepDefinition[] = stepMetadata.map((step) => ({
  ...step,
  isComplete: completionValidators[step.id],
}))

export const ONBOARDING_TOTAL_STEPS = ONBOARDING_STEPS.length

export function getOnboardingStep(id: OnboardingStepId) {
  return ONBOARDING_STEPS.find((step) => step.id === id)!
}

export function getOnboardingStepByRoute(route: string) {
  return ONBOARDING_STEPS.find((step) => step.route === route)
}

export function resolveOnboardingDestination(candidate: string | null, fallback: string) {
  return candidate && getOnboardingStepByRoute(candidate) ? candidate : fallback
}

export function calculateOnboardingProgress(input: OnboardingCompletionInput) {
  const completion = new Map<OnboardingStepId, boolean>(
    ONBOARDING_STEPS.map((step) => [step.id, step.isComplete(input)]),
  )
  const completedSteps = ONBOARDING_STEPS.filter((step) => completion.get(step.id))
  const earliestIncompleteStep = ONBOARDING_STEPS.find((step) => !completion.get(step.id)) ?? null
  const allPrerequisiteStepsComplete = ONBOARDING_STEPS
    .slice(0, -1)
    .every((step) => completion.get(step.id))

  return {
    completion,
    completedSteps,
    earliestIncompleteStep,
    allPrerequisiteStepsComplete,
    isRouteAccessible(route: string) {
      const requestedIndex = ONBOARDING_STEPS.findIndex((step) => step.route === route)
      if (requestedIndex < 0) return false
      if (!earliestIncompleteStep) return true
      const earliestIncompleteIndex = ONBOARDING_STEPS.indexOf(earliestIncompleteStep)
      return requestedIndex <= earliestIncompleteIndex
    },
  }
}
