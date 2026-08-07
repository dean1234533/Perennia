/** Mock "your own" profile content — the editable side of the profile experience. */
export interface SelfProfile {
  about: string
  interests: string[]
  values: string[]
  lifestyle: { label: string; value: string }[]
  music: string[]
  languages: string[]
  favoritePlaces: string[]
  dreamDestinations: string[]
  fitness: string
  books: string
  movies: string
  goals: string
  profession: string
  education: string
  location: string
}

export const defaultSelfProfile: SelfProfile = {
  about:
    'I design buildings by day and chase golden hour with a film camera by night. Looking for someone curious about the world, unafraid of long conversations, and up for a spontaneous weekend trip.',
  interests: ['Architecture', 'Film Photography', 'Jazz', 'Wine Tasting', 'Modern Art', 'Sailing'],
  values: ['Honesty', 'Curiosity', 'Family', 'Ambition'],
  lifestyle: [
    { label: 'Drinks', value: 'Socially' },
    { label: 'Smoking', value: 'Never' },
    { label: 'Exercise', value: 'Often' },
    { label: 'Children', value: 'Wants someday' },
    { label: 'Pets', value: 'Has a cat' },
    { label: 'Diet', value: 'Pescatarian' },
  ],
  music: ['Jazz', 'Neo-Soul', 'Bossa Nova'],
  languages: ['English', 'French'],
  favoritePlaces: ['Lisbon', 'The local Sunday market'],
  dreamDestinations: ['Kyoto', 'Patagonia'],
  fitness: 'Pilates, 3x a week',
  books: 'The Overstory — Richard Powers',
  movies: 'In the Mood for Love',
  goals: 'Seeking a grounded, long-term partnership — someone building a rich life who wants to build one alongside another.',
  profession: 'Architect',
  education: 'MArch, University College London',
  location: 'London, UK',
}
