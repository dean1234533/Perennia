export const SUPPORTED_GENDERS = ['male', 'female'] as const

export const EDUCATION_OPTIONS = [
  'Secondary School',
  'College / Sixth Form',
  'Apprenticeship / Vocational',
  'Undergraduate Degree',
  'Postgraduate Degree',
  'Doctorate / PhD',
  'Other',
  'Prefer not to say',
] as const

export const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch',
  'Polish', 'Romanian', 'Greek', 'Russian', 'Ukrainian', 'Arabic', 'Hebrew',
  'Turkish', 'Persian', 'Hindi', 'Urdu', 'Bengali', 'Punjabi', 'Mandarin Chinese',
  'Cantonese', 'Japanese', 'Korean', 'Vietnamese', 'Thai', 'Indonesian',
  'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Irish', 'Welsh', 'Swahili',
  'British Sign Language', 'American Sign Language',
] as const

export const LIFESTYLE_VIBE_OPTIONS = [
  'Calm & Peaceful',
  'Active & Adventurous',
  'Driven & Ambitious',
  'Family-Oriented',
  'Creative & Inspired',
  'Social & Connected',
  'Health & Wellness',
  'Home & Comfort',
  'Nature & Outdoors',
  'Culture & Experiences',
] as const

export const LIFESTYLE_VIBE_DESCRIPTIONS = {
  'Calm & Peaceful': 'I value peace, simplicity and mindfulness.',
  'Active & Adventurous': 'I love exploring, staying active and new experiences.',
  'Driven & Ambitious': "I'm focused on growth, goals and building my future.",
  'Family-Oriented': 'Family and strong relationships are very important.',
  'Creative & Inspired': "I'm drawn to creativity, ideas and imagination.",
  'Social & Connected': 'I enjoy meaningful connections, shared experiences and spending time with others.',
  'Health & Wellness': 'I prioritise healthy habits, balance and feeling my best.',
  'Home & Comfort': 'I enjoy a cosy home, familiar routines and quiet comforts.',
  'Nature & Outdoors': 'I feel most at home in nature and the open air.',
  'Culture & Experiences': 'I enjoy arts, culture and discovering memorable experiences.',
} as const satisfies Record<(typeof LIFESTYLE_VIBE_OPTIONS)[number], string>
