/** Configurable values list shown during onboarding and profile editing. */
export const AVAILABLE_VALUES = [
  'Honesty', 'Family', 'Growth', 'Adventure', 'Loyalty', 'Ambition',
  'Curiosity', 'Kindness', 'Independence', 'Spirituality', 'Stability',
  'Creativity', 'Humor', 'Community', 'Authenticity',
] as const

export type AvailableValue = (typeof AVAILABLE_VALUES)[number]
