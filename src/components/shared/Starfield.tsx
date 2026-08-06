import { useMemo } from 'react'

interface StarfieldProps {
  density?: number
  className?: string
}

interface Star {
  x: number
  y: number
  size: number
  delay: number
  duration: number
}

function makeStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.6,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2.5,
  }))
}

export function Starfield({ density = 140, className = '' }: StarfieldProps) {
  const stars = useMemo(() => makeStars(density), [density])

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* nebula glows */}
      <div className="absolute -top-1/4 -left-1/4 h-[70vh] w-[70vh] rounded-full bg-nebula-purple/20 blur-[140px] animate-drift" />
      <div
        className="absolute -bottom-1/4 -right-1/4 h-[65vh] w-[65vh] rounded-full bg-nebula-blue/20 blur-[140px] animate-drift"
        style={{ animationDirection: 'reverse', animationDuration: '80s' }}
      />
      <div className="absolute top-1/3 left-1/2 h-[40vh] w-[40vh] -translate-x-1/2 rounded-full bg-rose/10 blur-[120px]" />

      {/* stars */}
      <svg className="absolute inset-0 h-full w-full">
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x}%`}
            cy={`${s.y}%`}
            r={s.size}
            fill={s.size > 1.8 ? '#f0dfc0' : '#ffffff'}
            className="animate-twinkle"
            style={{
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              transformOrigin: `${s.x}% ${s.y}%`,
            }}
          />
        ))}
      </svg>
    </div>
  )
}
