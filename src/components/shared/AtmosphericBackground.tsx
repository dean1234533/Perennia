import { useMemo, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

interface Star {
  x: number
  y: number
  size: number
  delay: number
  duration: number
  opacity: number
}

function makeSparseStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 1.1 + 0.4,
    delay: Math.random() * 10,
    duration: Math.random() * 8 + 12,
    opacity: Math.random() * 0.35 + 0.15,
  }))
}

interface Particle {
  x: number
  size: number
  delay: number
  duration: number
  hue: 'gold' | 'lavender'
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    x: Math.random() * 100,
    size: Math.random() * 3 + 2,
    delay: Math.random() * 10,
    duration: Math.random() * 14 + 18,
    hue: i % 3 === 0 ? 'gold' : 'lavender',
  }))
}

/**
 * Restrained, cinematic backdrop for the marketing hero — nebula haze, a
 * distant glowing horizon, and a handful of near-invisible stars, rather
 * than a planetarium. Content should always read as brighter than this.
 */
export function AtmosphericBackground() {
  const stars = useMemo(() => makeSparseStars(22), [])
  const particles = useMemo(() => makeParticles(7), [])
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.35)
  const smoothX = useSpring(mouseX, { stiffness: 20, damping: 20, mass: 1 })
  const smoothY = useSpring(mouseY, { stiffness: 20, damping: 20, mass: 1 })
  const reflectionX = useTransform(smoothX, (v) => `${v * 100}%`)
  const reflectionY = useTransform(smoothY, (v) => `${v * 100}%`)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="pointer-events-auto absolute inset-0 overflow-hidden"
    >
      {/* Base gradient: midnight -> navy -> royal purple undertone */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% -10%, #1a1140 0%, #0c1433 42%, #060b1d 78%)',
        }}
      />

      {/* Distant glowing horizon */}
      <div
        className="absolute left-1/2 top-[62%] h-[40vh] w-[140vw] -translate-x-1/2 rounded-[100%] opacity-60 blur-[90px]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(142,108,246,0.22), rgba(229,192,123,0.08) 55%, transparent 75%)',
        }}
      />

      {/* Slow-drifting nebula clouds */}
      <motion.div
        className="absolute -top-1/3 left-[8%] h-[60vh] w-[60vh] rounded-full opacity-50 blur-[110px] animate-haze"
        style={{ background: 'radial-gradient(circle, rgba(54,35,95,0.85), transparent 70%)' }}
      />
      <motion.div
        className="absolute bottom-[-20%] right-[5%] h-[55vh] w-[55vh] rounded-full opacity-40 blur-[120px] animate-haze"
        style={{
          background: 'radial-gradient(circle, rgba(142,108,246,0.5), transparent 70%)',
          animationDelay: '6s',
        }}
      />
      <motion.div
        className="absolute left-[35%] top-[20%] h-[40vh] w-[40vh] rounded-full opacity-30 blur-[100px] animate-haze"
        style={{
          background: 'radial-gradient(circle, rgba(229,192,123,0.25), transparent 70%)',
          animationDelay: '12s',
        }}
      />

      {/* Volumetric light rays */}
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-screen"
        style={{
          background:
            'linear-gradient(115deg, transparent 30%, rgba(248,245,240,0.5) 48%, transparent 62%)',
        }}
      />

      {/* Cursor-reactive glass reflection */}
      <motion.div
        className="absolute inset-0 opacity-[0.16] mix-blend-screen"
        style={{
          background: useTransform(
            [reflectionX, reflectionY],
            ([x, y]) =>
              `radial-gradient(600px circle at ${x} ${y}, rgba(142,108,246,0.5), transparent 60%)`
          ),
        }}
      />

      {/* Extremely faint, sparse star clusters */}
      <svg className="absolute inset-0 h-full w-full">
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x}%`}
            cy={`${s.y}%`}
            r={s.size}
            fill="#f8f5f0"
            opacity={s.opacity}
            className={reducedMotion ? undefined : 'animate-twinkle'}
            style={reducedMotion ? undefined : { animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` }}
          />
        ))}
      </svg>

      {/* Sparse floating particles */}
      {!reducedMotion && particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full blur-[1px]"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            background: p.hue === 'gold' ? 'rgba(229,192,123,0.55)' : 'rgba(142,108,246,0.5)',
            bottom: '-5%',
          }}
          animate={{ y: ['0vh', '-105vh'], opacity: [0, 0.6, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 30%, transparent 45%, rgba(6,11,29,0.55) 85%, rgba(6,11,29,0.85) 100%)',
        }}
      />
    </div>
  )
}
