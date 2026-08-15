import { motion } from 'framer-motion'

const symbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']

export function ZodiacWheel({ size = 220 }: { size?: number }) {
  const compact = size < 140
  const symbolSize = compact ? Math.max(12, Math.round(size * 0.15)) : 24
  const symbolFontSize = compact ? Math.max(10, Math.round(size * 0.12)) : 16
  const coreSize = compact ? Math.max(28, Math.round(size * 0.34)) : 64
  const coreFontSize = compact ? Math.max(14, Math.round(size * 0.18)) : 24
  const radius = size / 2 - (compact ? symbolSize / 2 + 4 : 26)
  const center = size / 2

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.svg
        width={size}
        height={size}
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx={center} cy={center} r={size / 2 - 2} fill="none" stroke="rgba(212,175,106,0.25)" strokeWidth="1" />
        <circle cx={center} cy={center} r={size / 2 - 10} fill="none" stroke="rgba(212,175,106,0.12)" strokeWidth="1" />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
          const x1 = center + Math.cos(angle) * (size / 2 - 10)
          const y1 = center + Math.sin(angle) * (size / 2 - 10)
          const x2 = center + Math.cos(angle) * (size / 2 - 2)
          const y2 = center + Math.sin(angle) * (size / 2 - 2)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(212,175,106,0.15)" strokeWidth="1" />
        })}
      </motion.svg>
      {symbols.map((sym, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
        const x = center + Math.cos(angle) * radius
        const y = center + Math.sin(angle) * radius
        return (
          <div
            key={sym}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-champagne/70"
            style={{ left: x, top: y, width: symbolSize, height: symbolSize, fontSize: symbolFontSize }}
          >
            {sym}
          </div>
        )
      })}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="glow-gold flex items-center justify-center rounded-full bg-gradient-to-br from-nebula-purple/40 to-nebula-blue/30"
          style={{ width: coreSize, height: coreSize }}
        >
          <span style={{ fontSize: coreFontSize }}>✦</span>
        </div>
      </div>
    </div>
  )
}
