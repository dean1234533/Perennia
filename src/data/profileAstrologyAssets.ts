export type ProfileAstrologyKind = 'western' | 'chinese'

const WESTERN_CARD_ASSETS: Record<string, string> = {
  aries: '/approved-symbol-cards-v4/zodiac-white/aries.png',
  taurus: '/approved-symbol-cards-v4/zodiac-white/taurus.png',
  gemini: '/approved-symbol-cards-v4/zodiac-white/gemini.png',
  cancer: '/approved-symbol-cards-v4/zodiac-white/cancer.png',
  leo: '/approved-symbol-cards-v4/zodiac-white/leo.png',
  virgo: '/approved-symbol-cards-v4/zodiac-white/virgo.png',
  libra: '/approved-symbol-cards-v4/zodiac-white/libra.png',
  scorpio: '/approved-symbol-cards-v4/zodiac-white/scorpio.png',
  sagittarius: '/approved-symbol-cards-v4/zodiac-white/sagittarius.png',
  capricorn: '/approved-symbol-cards-v4/zodiac-white/capricorn.png',
  aquarius: '/approved-symbol-cards-v4/zodiac-white/aquarius.png',
  pisces: '/approved-symbol-cards-v4/zodiac-white/pisces.png',
}

const CHINESE_ANIMAL_ASSETS: Record<string, string> = {
  rat: '/chinese-astrology-v1/animals/rat.png',
  ox: '/chinese-astrology-v1/animals/ox.png',
  tiger: '/chinese-astrology-v1/animals/tiger.png',
  rabbit: '/chinese-astrology-v1/animals/rabbit.png',
  dragon: '/chinese-astrology-v1/animals/dragon.png',
  snake: '/chinese-astrology-v1/animals/snake.png',
  horse: '/chinese-astrology-v1/animals/horse.png',
  goat: '/chinese-astrology-v1/animals/goat.png',
  sheep: '/chinese-astrology-v1/animals/goat.png',
  monkey: '/chinese-astrology-v1/animals/monkey.png',
  rooster: '/chinese-astrology-v1/animals/rooster.png',
  dog: '/chinese-astrology-v1/animals/dog.png',
  pig: '/chinese-astrology-v1/animals/pig.png',
}

export function profileAstrologyAsset(kind: ProfileAstrologyKind, value: string) {
  const normalizedValue = value.trim().toLowerCase()
  return kind === 'western'
    ? WESTERN_CARD_ASSETS[normalizedValue]
    : CHINESE_ANIMAL_ASSETS[normalizedValue]
}
