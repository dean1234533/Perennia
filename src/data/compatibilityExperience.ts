import type { CompatibilityResult } from '@/lib/compatibilityApi'
import { DESIGN_PREVIEW_PROFILE_PHOTO_URL } from '@/data/designPreviewProfile'
import { DESIGN_PREVIEW_VISITOR_PROFILE } from '@/data/designPreviewVisitorProfile'

export type CompatibilityAccess = 'full' | 'teaser'

export type CompatibilityDimensionKey =
  | 'animal'
  | 'element'
  | 'yinYang'
  | 'sun'
  | 'moon'
  | 'rising'

export interface CompatibilityPerson {
  preferredName: string
  profilePhotoUrl?: string
  profilePath?: string
  sunSign: string
  moonSign: string
  risingSign: string
  chineseAnimal: string
  chineseElement: string
  yinYang: string
  naturalAnimalElement?: string
}

export interface CompatibilityDimension {
  key: CompatibilityDimensionKey
  title: string
  score: number
  label: string
  explanation: string
}

export interface CompatibilityExperienceData {
  personA: CompatibilityPerson
  personB: CompatibilityPerson
  overallScore: number
  overallLabel: string
  dimensions: CompatibilityDimension[]
  freeInsight: string
  summary: string
  isPreviewSample?: boolean
}

export const COMPATIBILITY_REPORT_PRICE = {
  amount: 2.99,
  currency: 'GBP',
  display: '£2.99',
} as const

export const COMPATIBILITY_DIMENSION_ORDER: CompatibilityDimensionKey[] = [
  'animal',
  'element',
  'yinYang',
  'sun',
  'moon',
  'rising',
]

const DIMENSION_TITLES: Record<CompatibilityDimensionKey, string> = {
  animal: 'Chinese Animal',
  element: 'Heavenly Stem Element',
  yinYang: 'Yin / Yang',
  sun: 'Sun Sign',
  moon: 'Moon Sign',
  rising: 'Rising Sign',
}

function scoreLabel(score: number) {
  if (score >= 90) return 'Excellent Compatibility'
  if (score >= 80) return 'Highly Compatible'
  if (score >= 70) return 'Good Compatibility'
  if (score >= 50) return 'Growing Potential'
  return 'Needs Understanding'
}

export function compatibilityExperienceFromResult({
  personA,
  personB,
  result,
}: {
  personA: CompatibilityPerson
  personB: CompatibilityPerson
  result: CompatibilityResult
}): CompatibilityExperienceData {
  return {
    personA,
    personB,
    overallScore: result.compatibility,
    overallLabel: result.band,
    dimensions: COMPATIBILITY_DIMENSION_ORDER.map((key) => ({
      key,
      title: DIMENSION_TITLES[key],
      score: result.factors[key].score,
      label: scoreLabel(result.factors[key].score),
      explanation: result.factors[key].insight,
    })),
    freeInsight: `${personA.preferredName} and ${personB.preferredName} can explore how their six established astrological dimensions interact.`,
    summary: result.insights.understanding,
  }
}

export const DESIGN_PREVIEW_COMPATIBILITY: CompatibilityExperienceData = {
  personA: {
    preferredName: 'Alex',
    profilePhotoUrl: DESIGN_PREVIEW_PROFILE_PHOTO_URL,
    profilePath: '/my-profile',
    sunSign: 'Pisces',
    moonSign: 'Virgo',
    risingSign: 'Taurus',
    chineseAnimal: 'Rat',
    chineseElement: 'Wood',
    yinYang: 'Yang',
    naturalAnimalElement: 'Water',
  },
  personB: {
    preferredName: DESIGN_PREVIEW_VISITOR_PROFILE.name.split(' ')[0],
    profilePhotoUrl: DESIGN_PREVIEW_VISITOR_PROFILE.profilePhotoThumbUrl || DESIGN_PREVIEW_VISITOR_PROFILE.profilePhotoUrl,
    profilePath: `/profile/${DESIGN_PREVIEW_VISITOR_PROFILE.uid}`,
    sunSign: 'Cancer',
    moonSign: 'Libra',
    risingSign: 'Aquarius',
    chineseAnimal: 'Dragon',
    chineseElement: 'Wood',
    yinYang: 'Yang',
    naturalAnimalElement: 'Earth',
  },
  overallScore: 86,
  overallLabel: 'Highly Compatible',
  dimensions: [
    {
      key: 'animal',
      title: 'Chinese Animal',
      score: 84,
      label: 'Very Compatible',
      explanation: 'Rat and Dragon energy can create an encouraging, resourceful bond with shared momentum and mutual respect.',
    },
    {
      key: 'element',
      title: 'Heavenly Stem Element',
      score: 92,
      label: 'Excellent Compatibility',
      explanation: 'Both members carry Wood energy, supporting growth, curiosity and a shared instinct to build toward the future.',
    },
    {
      key: 'yinYang',
      title: 'Yin / Yang',
      score: 76,
      label: 'Good Compatibility',
      explanation: 'Two Yang profiles bring energy and initiative. Making room for rest and reflection helps that strength stay balanced.',
    },
    {
      key: 'sun',
      title: 'Sun Sign',
      score: 90,
      label: 'Excellent Compatibility',
      explanation: 'Pisces and Cancer are both Water signs, supporting empathy, emotional understanding and a naturally intuitive connection.',
    },
    {
      key: 'moon',
      title: 'Moon Sign',
      score: 82,
      label: 'Very Compatible',
      explanation: 'Virgo and Libra approach emotional security differently, yet both value care, consideration and a harmonious daily life.',
    },
    {
      key: 'rising',
      title: 'Rising Sign',
      score: 78,
      label: 'Good Compatibility',
      explanation: 'Taurus and Aquarius can broaden one another’s perspective when steadiness and independence are treated as complementary strengths.',
    },
  ],
  freeInsight: 'You both share Wood as your Heavenly Stem element, suggesting a mutual preference for growth, curiosity and building toward the future.',
  summary: 'This sample connection combines emotional warmth with shared growth energy. The strongest potential comes from empathy, encouragement and making space for both stability and independence.',
  isPreviewSample: true,
}
