export interface ChineseYearProfile {
  animal: string
  animalCharacter: string
  heavenlyStem: string
  heavenlyStemCharacter: string
  earthlyBranch: string
  earthlyBranchCharacter: string
  element: string
  polarity: 'Yin' | 'Yang'
}

// 1900 was a Yang Metal Rat year (Geng Zi). Keeping the stem and branch
// cycles anchored to that same reference makes this agree with the existing
// backend zodiac calculation while filling the two values the UI omitted.
const STEMS = [
  { name: 'Geng', character: '庚', element: 'Metal', polarity: 'Yang' as const },
  { name: 'Xin', character: '辛', element: 'Metal', polarity: 'Yin' as const },
  { name: 'Ren', character: '壬', element: 'Water', polarity: 'Yang' as const },
  { name: 'Gui', character: '癸', element: 'Water', polarity: 'Yin' as const },
  { name: 'Jia', character: '甲', element: 'Wood', polarity: 'Yang' as const },
  { name: 'Yi', character: '乙', element: 'Wood', polarity: 'Yin' as const },
  { name: 'Bing', character: '丙', element: 'Fire', polarity: 'Yang' as const },
  { name: 'Ding', character: '丁', element: 'Fire', polarity: 'Yin' as const },
  { name: 'Wu', character: '戊', element: 'Earth', polarity: 'Yang' as const },
  { name: 'Ji', character: '己', element: 'Earth', polarity: 'Yin' as const },
]

const BRANCHES = [
  { name: 'Zi', character: '子', animal: 'Rat', animalCharacter: '鼠' },
  { name: 'Chou', character: '丑', animal: 'Ox', animalCharacter: '牛' },
  { name: 'Yin', character: '寅', animal: 'Tiger', animalCharacter: '虎' },
  { name: 'Mao', character: '卯', animal: 'Rabbit', animalCharacter: '兔' },
  { name: 'Chen', character: '辰', animal: 'Dragon', animalCharacter: '龍' },
  { name: 'Si', character: '巳', animal: 'Snake', animalCharacter: '蛇' },
  { name: 'Wu', character: '午', animal: 'Horse', animalCharacter: '馬' },
  { name: 'Wei', character: '未', animal: 'Sheep', animalCharacter: '羊' },
  { name: 'Shen', character: '申', animal: 'Monkey', animalCharacter: '猴' },
  { name: 'You', character: '酉', animal: 'Rooster', animalCharacter: '雞' },
  { name: 'Xu', character: '戌', animal: 'Dog', animalCharacter: '狗' },
  { name: 'Hai', character: '亥', animal: 'Pig', animalCharacter: '豬' },
]

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor
}

export function computeChineseYearProfile(birthDate: string): ChineseYearProfile | null {
  const year = Number(birthDate.slice(0, 4))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !Number.isInteger(year)) return null

  const stem = STEMS[positiveModulo(year - 1900, STEMS.length)]
  const branch = BRANCHES[positiveModulo(year - 1900, BRANCHES.length)]

  return {
    animal: branch.animal,
    animalCharacter: branch.animalCharacter,
    heavenlyStem: stem.name,
    heavenlyStemCharacter: stem.character,
    earthlyBranch: branch.name,
    earthlyBranchCharacter: branch.character,
    element: stem.element,
    polarity: stem.polarity,
  }
}
