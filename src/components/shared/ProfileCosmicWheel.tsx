const glyphs = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']

export function ProfileCosmicWheel() {
  return (
    <span className="profile-cosmic-wheel" aria-hidden="true">
      <svg viewBox="0 0 160 160" role="presentation">
        <circle cx="80" cy="80" r="72" />
        <circle cx="80" cy="80" r="54" />
        <circle cx="80" cy="80" r="27" />
        {Array.from({ length: 12 }, (_, index) => {
          const angle = index * Math.PI / 6
          const x1 = 80 + Math.cos(angle) * 27
          const y1 = 80 + Math.sin(angle) * 27
          const x2 = 80 + Math.cos(angle) * 72
          const y2 = 80 + Math.sin(angle) * 72
          return <line key={`line-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        })}
        {glyphs.map((glyph, index) => {
          const angle = index * Math.PI / 6 - Math.PI / 2
          return <text key={glyph} x={80 + Math.cos(angle) * 63} y={83 + Math.sin(angle) * 63}>{glyph}</text>
        })}
        <path d="M80 61 86 74 100 80 86 86 80 100 74 86 60 80 74 74Z" />
      </svg>
    </span>
  )
}
