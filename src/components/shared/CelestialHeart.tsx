/** The consistent Perennia visual marker shown at the top of every
 *  onboarding screen — a constellation-style heart (nodes + connecting
 *  lines, like a star chart) rather than the wordmark, so it reads as a
 *  distinct "you're inside onboarding" marker. Pure vector, no image
 *  asset. The gentle glow uses the existing reduced-motion-safe
 *  `animate-pulse-glow` utility already defined in index.css. */
export function CelestialHeart({ className = 'h-20 w-20' }: { className?: string }) {
  return (
    <div className={`${className} animate-pulse-glow`}>
      <svg viewBox="0 0 120 105" fill="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="celestialHeartGrad" x1="10" y1="5" x2="110" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="55%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#e5c07b" />
          </linearGradient>
          <filter id="celestialHeartGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M60 100 C20 75 5 50 5 32 C5 15 20 3 38 3 C48 3 56 9 60 20 C64 9 72 3 82 3 C100 3 115 15 115 32 C115 50 100 75 60 100 Z"
          stroke="url(#celestialHeartGrad)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          fill="url(#celestialHeartGrad)"
          fillOpacity="0.08"
          filter="url(#celestialHeartGlow)"
        />

        {/* Constellation mesh — thin connecting lines between node points. */}
        <g stroke="url(#celestialHeartGrad)" strokeWidth="0.6" strokeOpacity="0.55">
          <line x1="60" y1="100" x2="10" y2="45" />
          <line x1="60" y1="100" x2="110" y2="45" />
          <line x1="60" y1="100" x2="60" y2="55" />
          <line x1="60" y1="55" x2="38" y2="10" />
          <line x1="60" y1="55" x2="82" y2="10" />
          <line x1="10" y1="45" x2="38" y2="10" />
          <line x1="110" y1="45" x2="82" y2="10" />
          <line x1="35" y1="70" x2="60" y2="100" />
          <line x1="85" y1="70" x2="60" y2="100" />
          <line x1="35" y1="70" x2="60" y2="55" />
          <line x1="85" y1="70" x2="60" y2="55" />
        </g>

        {/* Star nodes at each intersection, glowing. */}
        <g fill="#f5f0ff" filter="url(#celestialHeartGlow)">
          {[
            [60, 100, 2.2],
            [10, 45, 1.5],
            [110, 45, 1.5],
            [60, 55, 1.7],
            [38, 10, 1.4],
            [82, 10, 1.4],
            [35, 70, 1.3],
            [85, 70, 1.3],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      </svg>
    </div>
  )
}
