import { useMemo, type CSSProperties } from 'react'

interface CelestialStar {
  x: number
  y: number
  size: number
  opacity: number
  duration: number
  delay: number
}

interface MovingStar extends CelestialStar {
  driftX: number
  driftY: number
}

// Small deterministic PRNG: the stars keep their positions across renders,
// avoiding layout shimmer while still looking naturally irregular.
function seededRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

function makeMovingStars(count: number): MovingStar[] {
  const random = seededRandom(20260810)
  return Array.from({ length: count }, () => {
    // Keep the centre quieter so the movement never competes with the hero copy.
    const onLeft = random() > 0.5
    return {
      x: onLeft ? random() * 24 : 76 + random() * 24,
      y: random() * 100,
      size: random() * 1.25 + 0.75,
      opacity: random() * 0.38 + 0.38,
      duration: random() * 12 + 15,
      delay: random() * -28,
      driftX: (onLeft ? 1 : -1) * (random() * 15 + 8),
      driftY: -(random() * 18 + 8),
    }
  })
}

function makeStars(count: number): CelestialStar[] {
  const random = seededRandom(20260809)
  return Array.from({ length: count }, () => {
    const x = random() * 100
    const y = random() * 100
    const inReadingZone = x > 24 && x < 76 && y > 18 && y < 78
    return {
      x,
      y,
      size: random() * 1.15 + 0.45,
      opacity: (random() * 0.38 + 0.2) * (inReadingZone ? 0.38 : 1),
      duration: random() * 7 + 8,
      delay: random() * -16,
    }
  })
}

const glowStars = [
  { x: 8, y: 19, delay: -2 },
  { x: 91, y: 12, delay: -7 },
  { x: 84, y: 69, delay: -11 },
  { x: 13, y: 83, delay: -5 },
]

/** Shared, image-led celestial background. All animation is limited to
 * opacity and tiny transforms so it stays compositor-friendly. */
export function LandingCelestialBackground() {
  const stars = useMemo(() => makeStars(76), [])
  const movingStars = useMemo(() => makeMovingStars(16), [])

  return (
    <div className="celestial-atmosphere pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="celestial-artwork absolute -inset-[1.5%] bg-cover bg-center" />

      {/* A near-static duplicate haze creates depth without altering artwork. */}
      <div className="celestial-drift absolute -inset-[3%] opacity-[.07] mix-blend-screen bg-[url('/perennia-celestial-background.jpg')] bg-cover bg-center" />

      <div className="absolute inset-0">
        {stars.map((star, index) => (
          <i
            key={index}
            className="celestial-twinkle absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size,
              opacity: star.opacity,
              animationDuration: `${star.duration}s`, animationDelay: `${star.delay}s`,
            }}
          />
        ))}
        {movingStars.map((star, index) => (
          <i
            key={`moving-${index}`}
            className="celestial-moving-star absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size,
              opacity: star.opacity,
              animationDuration: `${star.duration}s`, animationDelay: `${star.delay}s`,
              '--star-drift-x': `${star.driftX}px`,
              '--star-drift-y': `${star.driftY}px`,
            } as CSSProperties}
          />
        ))}
        {glowStars.map((star, index) => (
          <i
            key={index}
            className="celestial-glow-star absolute h-1 w-1 rounded-full bg-ivory"
            style={{ left: `${star.x}%`, top: `${star.y}%`, animationDelay: `${star.delay}s` }}
          />
        ))}
      </div>

      <i className="celestial-shooting-star absolute left-[12%] top-[18%] h-px w-28 -rotate-[18deg]" />

      {/* Dark calm centre and edge vignette keep text legible on every page. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_54%_62%_at_50%_43%,rgba(3,10,28,.28)_0%,rgba(3,10,28,.12)_48%,transparent_76%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_46%,rgba(2,7,20,.18)_76%,rgba(2,6,18,.5)_100%)]" />
    </div>
  )
}

/** Original restrained app/onboarding atmosphere. The supplied photographic
 * artwork is deliberately reserved for the public landing page. */
export function AtmosphericBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#1a1140_0%,#0c1433_42%,#060b1d_78%)]" />
      <div className="absolute -left-[18%] -top-[22%] h-[68vh] w-[68vh] rounded-full bg-nebula-purple/15 blur-[120px] animate-haze" />
      <div className="absolute -bottom-[20%] -right-[15%] h-[62vh] w-[62vh] rounded-full bg-nebula-blue/15 blur-[130px] animate-haze [animation-delay:7s]" />
      <div className="absolute inset-0 opacity-[.16] bg-[radial-gradient(circle_at_18%_22%,white_0_1px,transparent_1.4px),radial-gradient(circle_at_78%_34%,white_0_1px,transparent_1.4px),radial-gradient(circle_at_60%_76%,white_0_1px,transparent_1.4px)] bg-[length:91px_87px,127px_119px,151px_143px]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_30%,transparent_45%,rgba(6,11,29,.55)_85%,rgba(6,11,29,.85)_100%)]" />
    </div>
  )
}
