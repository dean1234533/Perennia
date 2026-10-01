import type { AvailableInterest } from '@/data/interests'
import { LIFESTYLE_VIBE_OPTIONS } from '@/data/onboardingOptions'
import type { SelfProfile } from '@/data/selfProfile'

export const DESIGN_PREVIEW_PROFILE_PHOTO_URL = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0" y1="0" x2="1" y2="1"%3E%3Cstop stop-color="%232258c7"/%3E%3Cstop offset="1" stop-color="%238a3ec1"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23g)"/%3E%3Ccircle cx="200" cy="150" r="70" fill="%23f3d8c7"/%3E%3Cpath d="M75 400c10-105 60-155 125-155s115 50 125 155" fill="%23152b67"/%3E%3C/svg%3E'

export const DESIGN_PREVIEW_INTERESTS = [
  'Food & Cooking',
  'Fitness',
  'Music',
  'Travel',
  'Art & Culture',
  'Outdoor Adventures',
  'Movies & TV',
  'Spirituality',
] satisfies AvailableInterest[]

export const DESIGN_PREVIEW_PROFILE: SelfProfile = {
  about: "I value honesty, loyalty and deep connection. I’m ambitious, grounded and always growing. Looking for a partner to build something meaningful and timeless with.",
  interests: DESIGN_PREVIEW_INTERESTS,
  lifestyleVibe: LIFESTYLE_VIBE_OPTIONS[0],
  openToNewThings: true,
  values: [],
  music: ['Soul', 'Jazz'],
  languages: ['English'],
  favoritePlaces: ['London', 'Santorini'],
  dreamDestinations: ['Japan', 'New Zealand'],
  fitness: 'Hiking and strength training',
  books: 'Biographies and philosophy',
  movies: 'Character-driven dramas',
  goals: 'A lasting relationship built on trust and shared adventure.',
  profession: 'Creative Director',
  education: 'Doctorate / PhD',
  children: 'No children',
  wantsChildren: 'Open to it',
  maritalBackground: 'Never married',
  location: 'London, United Kingdom',
}
