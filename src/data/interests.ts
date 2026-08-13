/** Configurable interest list shown during onboarding and profile editing —
 *  update this array to change what members can choose from app-wide. */
export const AVAILABLE_INTERESTS = [
  'Travel',
  'Fitness',
  'Food & Cooking',
  'Music',
  'Art & Culture',
  'Reading',
  'Photography',
  'Outdoor Adventures',
  'Dancing',
  'Movies & TV',
  'Spirituality',
  'Gaming',
  'Helping Others',
  'Business',
  'Education',
  'Pets & Animals',
  'Sports',
  'Writing',
]

export const MIN_ONBOARDING_INTERESTS = 5
export const MAX_ONBOARDING_INTERESTS = 8

/** Map only clear equivalents from the original list. Unmapped legacy
 * values remain stored when the member saves, avoiding silent data loss. */
export const LEGACY_INTEREST_MAP: Record<string, string> = {
  Food: 'Food & Cooking',
  Cooking: 'Food & Cooking',
  Books: 'Reading',
  Movies: 'Movies & TV',
  'Art / Creativity': 'Art & Culture',
  'Nature / Outdoors': 'Outdoor Adventures',
  Pets: 'Pets & Animals',
}
