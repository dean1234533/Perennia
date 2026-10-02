import { motion } from 'framer-motion'

const MARTALLUS_NATAL_WHEEL_ASSET = '/astrology/perennia-martallus-natal-wheel.svg'

export function CosmicZodiacWheel() {
  return (
    <div className="cosmic-wheel" aria-hidden="true">
      <motion.img
        src={MARTALLUS_NATAL_WHEEL_ASSET}
        alt=""
        className="cosmic-wheel-svg"
        initial={{ opacity: 0, scale: .96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: .9 }}
      />
    </div>
  )
}
