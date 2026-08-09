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
