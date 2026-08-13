/** Intentional, single-choice relationship goals used during onboarding. */
export const RELATIONSHIP_GOALS = [
  {
    value: 'Long-term Relationship / Marriage',
    description: 'Looking for a life partner and a future together.',
  },
  {
    value: 'Something Serious',
    description: 'Looking for a committed relationship that could develop into something long-term.',
  },
  {
    value: 'Open to Exploring',
    description: 'Open to getting to know someone seriously and seeing how the relationship develops.',
  },
  {
    value: 'Not Sure Yet',
    description: 'A temporary choice while you decide what feels right.',
    temporary: true,
  },
] as const

export const NOT_SURE_GOAL = 'Not Sure Yet'
export const NOT_SURE_GOAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000

/** A missing timestamp on a persisted temporary choice is treated as expired
 * so an older/incomplete record cannot bypass the seven-day limit. */
export function isNotSureGoalExpired(selectedAt: string, now = Date.now()) {
  if (!selectedAt) return true
  const selectedAtMs = Date.parse(selectedAt)
  return !Number.isFinite(selectedAtMs) || now - selectedAtMs >= NOT_SURE_GOAL_DURATION_MS
}

export const DEAL_BREAKER_OPTIONS = [
  'Dishonesty',
  'Poor communication',
  "Doesn't want children",
  'Different family goals',
  'Smoking',
  'Emotional unavailability',
]

export const PARTNER_VALUE_OPTIONS = [
  'Kindness',
  'Loyalty',
  'Ambition',
  'Family Values',
  'Emotional Maturity',
  'Sense of Humour',
  'Spiritual Connection',
]
