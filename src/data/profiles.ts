export interface CompatibilitySection {
  key: string
  label: string
  score: number
  summary: string
  detail: string
}

export interface Profile {
  id: string
  name: string
  gender: 'male' | 'female'
  age: number
  location: string
  profession: string
  education: string
  verified: boolean
  compatibility: number
  compatibilityLabel: string
  images: string[]
  about: string
  interests: string[]
  lifestyle: { label: string; value: string }[]
  goals: string
  sunSign: string
  moonSign: string
  risingSign: string
  chineseZodiac: string
  values: string[]
  music: string[]
  languages: string[]
  favoritePlaces: string[]
  dreamDestinations: string[]
  fitness: string
  books: string
  movies: string
  sections: CompatibilitySection[]
  prompts: { question: string; answer: string }[]
}

const sectionTemplates = (seed: number): CompatibilitySection[] => [
  {
    key: 'emotional',
    label: 'Emotional Connection',
    score: 82 + (seed % 13),
    summary: 'A deep, intuitive emotional resonance runs between you both.',
    detail:
      'Your emotional rhythms move in sync — moments of vulnerability are met with warmth rather than withdrawal. This is the kind of pairing that tends to build trust quickly and deepen over time.',
  },
  {
    key: 'communication',
    label: 'Communication Style',
    score: 74 + (seed % 20),
    summary: 'You express yourselves in complementary ways.',
    detail:
      'One of you leads with directness, the other with nuance — together you tend to cover blind spots rather than talk past each other. Expect a few early misreads that resolve into fluency.',
  },
  {
    key: 'values',
    label: 'Life Values',
    score: 85 + (seed % 10),
    summary: 'Your core values are strikingly aligned.',
    detail:
      'Family, ambition, and how you define a life well-lived point in the same direction. This kind of alignment is rare and tends to be the strongest predictor of long-term compatibility.',
  },
  {
    key: 'chemistry',
    label: 'Physical Chemistry',
    score: 70 + (seed % 25),
    summary: 'A magnetic, unmistakable pull.',
    detail:
      'The charts suggest a strong initial spark with room to grow into something steadier — the kind of chemistry that rewards patience rather than rushing.',
  },
  {
    key: 'intellect',
    label: 'Intellectual Compatibility',
    score: 78 + (seed % 18),
    summary: 'Conversations that could run for hours.',
    detail:
      'You are drawn to similar ideas but arrive at them differently, which tends to make for lively, generative conversation rather than repetitive agreement.',
  },
  {
    key: 'vision',
    label: 'Long-Term Vision',
    score: 80 + (seed % 15),
    summary: 'Your futures point toward the same horizon.',
    detail:
      'Where you each see yourselves in five years overlaps meaningfully — a strong signal for those seeking something built to last, not just a beautiful beginning.',
  },
]

export const profiles: Profile[] = [
  {
    id: 'amara',
    name: 'Amara Whitfield',
    gender: 'female',
    age: 29,
    location: 'London, UK',
    profession: 'Architect',
    education: 'MArch, University College London',
    verified: true,
    compatibility: 94,
    compatibilityLabel: 'Rare Alignment',
    images: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&q=80&auto=format&fit=crop',
      'https://picsum.photos/seed/amara-travel/900/1100',
      'https://picsum.photos/seed/amara-life/900/1100',
    ],
    about:
      'I design buildings that make people feel something. When I\'m not on site, I\'m usually chasing golden hour with a film camera or losing an afternoon in a gallery. Looking for someone who is curious about the world and unafraid of long conversations.',
    interests: ['Architecture', 'Film Photography', 'Jazz', 'Sailing', 'Wine Tasting', 'Modern Art'],
    lifestyle: [
      { label: 'Drinks', value: 'Socially' },
      { label: 'Smoking', value: 'Never' },
      { label: 'Exercise', value: 'Often' },
      { label: 'Children', value: 'Wants someday' },
      { label: 'Pets', value: 'Has a cat' },
      { label: 'Diet', value: 'Pescatarian' },
    ],
    goals: 'Seeking a grounded, long-term partnership — someone building a rich life who wants to build one alongside another.',
    sunSign: 'Libra',
    moonSign: 'Pisces',
    risingSign: 'Leo',
    chineseZodiac: 'Rabbit',
    values: ['Honesty', 'Ambition', 'Creativity', 'Family'],
    music: ['Jazz', 'Neo-Soul', 'Bossa Nova'],
    languages: ['English', 'French'],
    favoritePlaces: ['Lisbon', 'Kyoto', 'The local Sunday market'],
    dreamDestinations: ['Marrakech', 'Patagonia'],
    fitness: 'Pilates, 3x a week',
    books: 'The Overstory — Richard Powers',
    movies: 'In the Mood for Love',
    sections: sectionTemplates(94),
    prompts: [
      { question: 'A perfect Sunday looks like…', answer: 'Markets, a long lunch, and a gallery I\'ve been meaning to visit for months.' },
      { question: 'I\'m looking for…', answer: 'Someone emotionally fluent who still gets excited about small things.' },
    ],
  },
  {
    id: 'julian',
    name: 'Julian Kane',
    gender: 'male',
    age: 32,
    location: 'Edinburgh, UK',
    profession: 'Novelist',
    education: 'MA English Literature, University of Edinburgh',
    verified: true,
    compatibility: 91,
    compatibilityLabel: 'Exceptional Match',
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&q=80&auto=format&fit=crop',
      'https://picsum.photos/seed/julian-books/900/1100',
      'https://picsum.photos/seed/julian-coast/900/1100',
    ],
    about:
      'Third novel out next spring. I write in the mornings and think best while walking — usually along the coast with too much coffee in me. I believe in slow romance and hand-written letters.',
    interests: ['Literature', 'Hiking', 'Whisky', 'Chess', 'Vinyl Records', 'History'],
    lifestyle: [
      { label: 'Drinks', value: 'Occasionally' },
      { label: 'Smoking', value: 'Never' },
      { label: 'Exercise', value: 'Sometimes' },
      { label: 'Children', value: 'Open to it' },
      { label: 'Pets', value: 'Dog person' },
      { label: 'Diet', value: 'Omnivore' },
    ],
    goals: 'Looking for a witty co-conspirator for a quieter, more intentional kind of life.',
    sunSign: 'Scorpio',
    moonSign: 'Cancer',
    risingSign: 'Aquarius',
    chineseZodiac: 'Dragon',
    values: ['Depth', 'Curiosity', 'Loyalty', 'Solitude'],
    music: ['Vinyl-only', 'Folk', 'Classical'],
    languages: ['English', 'Gaelic (learning)'],
    favoritePlaces: ['A used bookshop in Leith', 'The Highlands', 'Any fireplace'],
    dreamDestinations: ['Reykjavik', 'The Faroe Islands'],
    fitness: 'Long coastal walks',
    books: 'Basically all of them',
    movies: 'The Lighthouse',
    sections: sectionTemplates(91),
    prompts: [
      { question: 'A perfect Sunday looks like…', answer: 'A second-hand bookshop, a fireplace, and no phone signal.' },
      { question: 'I\'m looking for…', answer: 'Depth over small talk, and someone who reads the acknowledgements page.' },
    ],
  },
  {
    id: 'sienna',
    name: 'Sienna Marchetti',
    gender: 'female',
    age: 27,
    location: 'Bath, UK',
    profession: 'Physician',
    education: 'MD, King\'s College London',
    verified: true,
    compatibility: 88,
    compatibilityLabel: 'Strong Alignment',
    images: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=900&q=80&auto=format&fit=crop',
      'https://picsum.photos/seed/sienna-run/900/1100',
      'https://picsum.photos/seed/sienna-garden/900/1100',
    ],
    about:
      'I spend my days in A&E and my weekends trying to be anywhere green. Trained pianist, terrible at sitting still. Looking for someone kind, grounded, and a little bit spontaneous.',
    interests: ['Piano', 'Trail Running', 'Botany', 'Cooking', 'Meditation', 'Travel'],
    lifestyle: [
      { label: 'Drinks', value: 'Rarely' },
      { label: 'Smoking', value: 'Never' },
      { label: 'Exercise', value: 'Daily' },
      { label: 'Children', value: 'Wants someday' },
      { label: 'Pets', value: 'None yet' },
      { label: 'Diet', value: 'Vegetarian' },
    ],
    goals: 'Ready for something real — a partner in life\'s chaos and calm alike.',
    sunSign: 'Virgo',
    moonSign: 'Taurus',
    risingSign: 'Capricorn',
    chineseZodiac: 'Snake',
    values: ['Compassion', 'Discipline', 'Growth', 'Balance'],
    music: ['Piano', 'Indie Folk', 'Lo-fi'],
    languages: ['English', 'Italian'],
    favoritePlaces: ['Any botanical garden', 'The trail behind her flat'],
    dreamDestinations: ['New Zealand', 'The Dolomites'],
    fitness: 'Daily trail running',
    books: 'When Breath Becomes Air',
    movies: 'Little Women',
    sections: sectionTemplates(88),
    prompts: [
      { question: 'A perfect Sunday looks like…', answer: 'A sunrise run, fresh bread, and a slow lazy afternoon.' },
      { question: 'I\'m looking for…', answer: 'Steadiness with a sense of humour — someone who laughs easily.' },
    ],
  },
  {
    id: 'theo',
    name: 'Theo Bergström',
    gender: 'male',
    age: 31,
    location: 'Bristol, UK',
    profession: 'Product Designer',
    education: 'BDes Industrial Design, Central Saint Martins',
    verified: true,
    compatibility: 85,
    compatibilityLabel: 'Strong Alignment',
    images: [
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=900&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=900&q=80&auto=format&fit=crop',
      'https://picsum.photos/seed/theo-studio/900/1100',
      'https://picsum.photos/seed/theo-surf/900/1100',
    ],
    about:
      'I build products by day and furniture by night. Scandinavian minimalist with a soft spot for surf trips and analogue synths. Looking for warmth, wit, and someone unafraid of an early flight.',
    interests: ['Industrial Design', 'Surfing', 'Synths', 'Minimalism', 'Coffee', 'Cycling'],
    lifestyle: [
      { label: 'Drinks', value: 'Socially' },
      { label: 'Smoking', value: 'Never' },
      { label: 'Exercise', value: 'Often' },
      { label: 'Children', value: 'Undecided' },
      { label: 'Pets', value: 'Loves dogs' },
      { label: 'Diet', value: 'Omnivore' },
    ],
    goals: 'Open to where it goes — but hoping for something that feels effortless.',
    sunSign: 'Gemini',
    moonSign: 'Libra',
    risingSign: 'Sagittarius',
    chineseZodiac: 'Horse',
    values: ['Simplicity', 'Adventure', 'Craft', 'Honesty'],
    music: ['Synth', 'Ambient', 'Surf rock'],
    languages: ['English', 'Swedish'],
    favoritePlaces: ['The workshop', 'Any coastline at dawn'],
    dreamDestinations: ['Japan', 'Norway'],
    fitness: 'Surfing, cycling',
    books: 'Shop Class as Soulcraft',
    movies: 'Chef',
    sections: sectionTemplates(85),
    prompts: [
      { question: 'A perfect Sunday looks like…', answer: 'Dawn surf, flat white, workshop time with sawdust everywhere.' },
      { question: 'I\'m looking for…', answer: 'Someone who is as excited by a spontaneous trip as a quiet night in.' },
    ],
  },
  {
    id: 'isabelle',
    name: 'Isabelle Rousseau',
    gender: 'female',
    age: 28,
    location: 'Oxford, UK',
    profession: 'Curator',
    education: 'MA Art History, Sorbonne',
    verified: true,
    compatibility: 82,
    compatibilityLabel: 'Strong Alignment',
    images: [
      'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=900&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&q=80&auto=format&fit=crop',
      'https://picsum.photos/seed/isabelle-museum/900/1100',
      'https://picsum.photos/seed/isabelle-paris/900/1100',
    ],
    about:
      'I curate contemporary art exhibitions and collect vintage postcards from cities I haven\'t visited yet. Bilingual, incurably romantic, and always the one who finds the best hidden restaurant.',
    interests: ['Contemporary Art', 'French Cinema', 'Ballet', 'Antiques', 'Language Learning', 'Wine'],
    lifestyle: [
      { label: 'Drinks', value: 'Socially' },
      { label: 'Smoking', value: 'Never' },
      { label: 'Exercise', value: 'Sometimes' },
      { label: 'Children', value: 'Wants someday' },
      { label: 'Pets', value: 'Has a cat' },
      { label: 'Diet', value: 'Omnivore' },
    ],
    goals: 'Looking for a romantic, curious partner to explore the world\'s beautiful things with.',
    sunSign: 'Aquarius',
    moonSign: 'Leo',
    risingSign: 'Virgo',
    chineseZodiac: 'Rooster',
    values: ['Elegance', 'Curiosity', 'Romance', 'Tradition'],
    music: ['French chanson', 'Chamber music'],
    languages: ['English', 'French', 'Italian'],
    favoritePlaces: ['The Musée Rodin gardens', 'Any flea market'],
    dreamDestinations: ['Kyoto', 'Buenos Aires'],
    fitness: 'Ballet, twice weekly',
    books: 'The Elegance of the Hedgehog',
    movies: 'Amélie',
    sections: sectionTemplates(82),
    prompts: [
      { question: 'A perfect Sunday looks like…', answer: 'A gallery opening, followed by a candlelit dinner nobody rushes.' },
      { question: 'I\'m looking for…', answer: 'A partner in curiosity — someone who wants to see everything.' },
    ],
  },
  {
    id: 'marcus',
    name: 'Marcus Chen',
    gender: 'male',
    age: 33,
    location: 'Manchester, UK',
    profession: 'Investment Director',
    education: 'MBA, London Business School',
    verified: true,
    compatibility: 79,
    compatibilityLabel: 'Promising Match',
    images: [
      'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=900&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=900&q=80&auto=format&fit=crop',
      'https://picsum.photos/seed/marcus-city/900/1100',
      'https://picsum.photos/seed/marcus-golf/900/1100',
    ],
    about:
      'I spend my week reading markets and my weekends trying to unplug from them. Former competitive swimmer, current amateur chef. Family means everything to me.',
    interests: ['Finance', 'Cooking', 'Swimming', 'Golf', 'Travel', 'Classic Cars'],
    lifestyle: [
      { label: 'Drinks', value: 'Socially' },
      { label: 'Smoking', value: 'Never' },
      { label: 'Exercise', value: 'Daily' },
      { label: 'Children', value: 'Wants children' },
      { label: 'Pets', value: 'None' },
      { label: 'Diet', value: 'Omnivore' },
    ],
    goals: 'Focused on building a life and a family with the right person — ready when you are.',
    sunSign: 'Capricorn',
    moonSign: 'Scorpio',
    risingSign: 'Taurus',
    chineseZodiac: 'Ox',
    values: ['Family', 'Ambition', 'Reliability', 'Generosity'],
    music: ['Motown', 'Jazz standards'],
    languages: ['English', 'Mandarin'],
    favoritePlaces: ['The kitchen', 'The pool at 6am'],
    dreamDestinations: ['Taiwan', 'The Amalfi Coast'],
    fitness: 'Competitive swimming',
    books: 'Atomic Habits',
    movies: 'The Pursuit of Happyness',
    sections: sectionTemplates(79),
    prompts: [
      { question: 'A perfect Sunday looks like…', answer: 'A long swim, cooking for people I love, an early night.' },
      { question: 'I\'m looking for…', answer: 'Ambition balanced with warmth — someone who wants a real partnership.' },
    ],
  },
]

export function getProfile(id: string): Profile | undefined {
  return profiles.find((p) => p.id === id)
}
