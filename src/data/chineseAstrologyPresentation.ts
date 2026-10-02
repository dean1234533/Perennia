export interface ChineseAstrologyValues {
  animal: string | null
  heavenlyStem: string | null
  earthlyBranch: string | null
  stemElement: string | null
  polarity: string | null
}

export interface ChineseAstrologyRow {
  key: 'animal' | 'heavenlyStem' | 'earthlyBranch' | 'stemElement' | 'polarity'
  label: string
  value: string | null
  leftCharacter: string | null
  rightCharacter: string | null
  explanation: string | null
  rightArtwork: string | null
  accent: 'gold' | 'amber' | 'blue' | 'green'
}

interface AnimalPresentation {
  name: string
  character: string
  branch: string
  asset: string
}

interface StemPresentation {
  name: string
  character: string
  polarity: string
  element: string
}

interface BranchPresentation {
  name: string
  character: string
  animal: string
}

interface IllustratedValuePresentation {
  name: string
  character: string
  asset: string
}

const ASSET_ROOT = '/chinese-astrology-v1'

export const CHINESE_ANIMALS: Record<string, AnimalPresentation> = {
  rat: { name: 'Rat', character: '鼠', branch: 'Zi', asset: `${ASSET_ROOT}/animals/rat.png` },
  ox: { name: 'Ox', character: '牛', branch: 'Chou', asset: `${ASSET_ROOT}/animals/ox.png` },
  tiger: { name: 'Tiger', character: '虎', branch: 'Yin', asset: `${ASSET_ROOT}/animals/tiger.png` },
  rabbit: { name: 'Rabbit', character: '兔', branch: 'Mao', asset: `${ASSET_ROOT}/animals/rabbit.png` },
  dragon: { name: 'Dragon', character: '龍', branch: 'Chen', asset: `${ASSET_ROOT}/animals/dragon.png` },
  snake: { name: 'Snake', character: '蛇', branch: 'Si', asset: `${ASSET_ROOT}/animals/snake.png` },
  horse: { name: 'Horse', character: '馬', branch: 'Wu', asset: `${ASSET_ROOT}/animals/horse.png` },
  goat: { name: 'Goat', character: '羊', branch: 'Wei', asset: `${ASSET_ROOT}/animals/goat.png` },
  monkey: { name: 'Monkey', character: '猴', branch: 'Shen', asset: `${ASSET_ROOT}/animals/monkey.png` },
  rooster: { name: 'Rooster', character: '雞', branch: 'You', asset: `${ASSET_ROOT}/animals/rooster.png` },
  dog: { name: 'Dog', character: '狗', branch: 'Xu', asset: `${ASSET_ROOT}/animals/dog.png` },
  pig: { name: 'Pig', character: '豬', branch: 'Hai', asset: `${ASSET_ROOT}/animals/pig.png` },
}

export const HEAVENLY_STEMS: Record<string, StemPresentation> = {
  jia: { name: 'Jia', character: '甲', polarity: 'Yang', element: 'Wood' },
  yi: { name: 'Yi', character: '乙', polarity: 'Yin', element: 'Wood' },
  bing: { name: 'Bing', character: '丙', polarity: 'Yang', element: 'Fire' },
  ding: { name: 'Ding', character: '丁', polarity: 'Yin', element: 'Fire' },
  wu: { name: 'Wu', character: '戊', polarity: 'Yang', element: 'Earth' },
  ji: { name: 'Ji', character: '己', polarity: 'Yin', element: 'Earth' },
  geng: { name: 'Geng', character: '庚', polarity: 'Yang', element: 'Metal' },
  xin: { name: 'Xin', character: '辛', polarity: 'Yin', element: 'Metal' },
  ren: { name: 'Ren', character: '壬', polarity: 'Yang', element: 'Water' },
  gui: { name: 'Gui', character: '癸', polarity: 'Yin', element: 'Water' },
}

export const EARTHLY_BRANCHES: Record<string, BranchPresentation> = {
  zi: { name: 'Zi', character: '子', animal: 'Rat' },
  chou: { name: 'Chou', character: '丑', animal: 'Ox' },
  yin: { name: 'Yin', character: '寅', animal: 'Tiger' },
  mao: { name: 'Mao', character: '卯', animal: 'Rabbit' },
  chen: { name: 'Chen', character: '辰', animal: 'Dragon' },
  si: { name: 'Si', character: '巳', animal: 'Snake' },
  wu: { name: 'Wu', character: '午', animal: 'Horse' },
  wei: { name: 'Wei', character: '未', animal: 'Goat' },
  shen: { name: 'Shen', character: '申', animal: 'Monkey' },
  you: { name: 'You', character: '酉', animal: 'Rooster' },
  xu: { name: 'Xu', character: '戌', animal: 'Dog' },
  hai: { name: 'Hai', character: '亥', animal: 'Pig' },
}

export const CHINESE_ELEMENTS: Record<string, IllustratedValuePresentation> = {
  wood: { name: 'Wood', character: '木', asset: `${ASSET_ROOT}/elements/wood.png` },
  fire: { name: 'Fire', character: '火', asset: `${ASSET_ROOT}/elements/fire.png` },
  earth: { name: 'Earth', character: '土', asset: `${ASSET_ROOT}/elements/earth.png` },
  metal: { name: 'Metal', character: '金', asset: `${ASSET_ROOT}/elements/metal.png` },
  water: { name: 'Water', character: '水', asset: `${ASSET_ROOT}/elements/water.png` },
}

export const CHINESE_POLARITIES: Record<string, IllustratedValuePresentation> = {
  yin: { name: 'Yin', character: '陰', asset: `${ASSET_ROOT}/polarity/yin.png` },
  yang: { name: 'Yang', character: '陽', asset: `${ASSET_ROOT}/polarity/yang.png` },
}

function lookup<T>(values: Record<string, T>, value: string | null) {
  if (!value) return null
  return values[value.trim().toLowerCase()] ?? null
}

export function getChineseAstrologyRows(values: ChineseAstrologyValues): ChineseAstrologyRow[] {
  const animalKey = values.animal?.trim().toLowerCase() === 'sheep' ? 'goat' : values.animal
  const animal = lookup(CHINESE_ANIMALS, animalKey)
  const stem = lookup(HEAVENLY_STEMS, values.heavenlyStem)
  const branch = lookup(EARTHLY_BRANCHES, values.earthlyBranch)
  const element = lookup(CHINESE_ELEMENTS, values.stemElement)
  const polarity = lookup(CHINESE_POLARITIES, values.polarity)

  return [
    {
      key: 'animal',
      label: 'Chinese Zodiac Animal',
      value: animal?.name ?? null,
      leftCharacter: animal?.character ?? null,
      rightCharacter: null,
      explanation: animal ? `Linked to ${animal.branch}` : null,
      rightArtwork: animal?.asset ?? null,
      accent: 'gold',
    },
    {
      key: 'heavenlyStem',
      label: 'Heavenly Stem',
      value: stem?.name ?? null,
      leftCharacter: '天',
      rightCharacter: stem?.character ?? null,
      explanation: stem ? `${stem.polarity} ${stem.element} stem` : null,
      rightArtwork: null,
      accent: 'amber',
    },
    {
      key: 'earthlyBranch',
      label: 'Earthly Branch',
      value: branch?.name ?? null,
      leftCharacter: '地',
      rightCharacter: branch?.character ?? null,
      explanation: branch ? `${branch.animal} branch` : null,
      rightArtwork: null,
      accent: 'blue',
    },
    {
      key: 'stemElement',
      label: 'Stem Element',
      value: element?.name ?? null,
      leftCharacter: element?.character ?? null,
      rightCharacter: null,
      explanation: element && stem ? `Derived from ${stem.name}` : null,
      rightArtwork: element?.asset ?? null,
      accent: 'green',
    },
    {
      key: 'polarity',
      label: 'Yin / Yang',
      value: polarity?.name ?? null,
      leftCharacter: polarity?.character ?? null,
      rightCharacter: null,
      explanation: polarity && stem ? `Derived from ${stem.name}` : null,
      rightArtwork: polarity?.asset ?? null,
      accent: 'gold',
    },
  ]
}
