// A plain, memorable-word list for the "suggest a strong password" helper —
// deliberately simple/neutral words, not a security-critical vault.
const WORDS = [
  'amber', 'anchor', 'ash', 'atlas', 'aurora', 'birch', 'blossom', 'breeze',
  'brook', 'canyon', 'cedar', 'cliff', 'clover', 'comet', 'copper', 'coral',
  'crescent', 'crimson', 'crystal', 'dawn', 'dune', 'dusk', 'echo', 'ember',
  'falcon', 'feather', 'fern', 'fjord', 'flint', 'forest', 'garnet', 'glacier',
  'grove', 'harbor', 'hazel', 'heather', 'horizon', 'indigo', 'ivory', 'ivy',
  'jade', 'juniper', 'lagoon', 'lantern', 'laurel', 'linen', 'lotus', 'lunar',
  'maple', 'marble', 'meadow', 'mist', 'moss', 'nebula', 'nectar', 'nova',
  'oak', 'obsidian', 'olive', 'onyx', 'opal', 'orbit', 'orchid', 'pearl',
  'pebble', 'petal', 'pine', 'plume', 'quartz', 'quiet', 'rain', 'raven',
  'reef', 'ridge', 'river', 'rose', 'sable', 'saffron', 'sage', 'sail',
  'sand', 'sequoia', 'shore', 'silver', 'slate', 'sparrow', 'spruce', 'star',
  'stone', 'storm', 'summit', 'sunset', 'tide', 'timber', 'topaz', 'trellis',
  'tundra', 'valley', 'velvet', 'violet', 'willow', 'wren', 'zephyr',
]

/** Real crypto-random passphrase (browser Web Crypto, not Math.random) —
 *  4 words + a 3-digit number comfortably clears a 15-character minimum
 *  while staying easy to actually remember and type. */
export function generatePassphrase(): string {
  const randomValues = new Uint32Array(5)
  crypto.getRandomValues(randomValues)

  const words = Array.from(randomValues.slice(0, 4), (v) => {
    const word = WORDS[v % WORDS.length]
    return word[0].toUpperCase() + word.slice(1)
  })
  const number = 100 + (randomValues[4] % 900)

  return `${words.join('-')}-${number}`
}
