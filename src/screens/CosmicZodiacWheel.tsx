import { motion } from 'framer-motion'

const zodiacSymbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']
const points = [[180, 78], [224, 101], [260, 144], [249, 197], [218, 241], [174, 270], [132, 244], [96, 207], [82, 158], [108, 113], [145, 91], [203, 145], [157, 172], [205, 207], [137, 215], [227, 169]] as const
const lines = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,0],[0,12],[0,11],[1,11],[1,15],[2,15],[3,15],[3,13],[4,13],[5,13],[5,14],[6,14],[7,14],[7,12],[8,12],[9,12],[10,12],[11,12],[11,13],[11,15],[12,13],[12,14],[13,14],[13,15],[14,15]] as const

export function CosmicZodiacWheel() {
  return (
    <div className="cosmic-wheel" aria-hidden="true">
      <div className="cosmic-wheel-aura" />
      <motion.svg viewBox="0 0 360 360" className="cosmic-wheel-svg" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .9 }}>
        <defs>
          <radialGradient id="cosmic-core"><stop offset="0" stopColor="#fffdf0" /><stop offset=".1" stopColor="#efc979" /><stop offset=".38" stopColor="#d5a957" stopOpacity=".25" /><stop offset="1" stopColor="#d5a957" stopOpacity="0" /></radialGradient>
          <filter id="cosmic-glow"><feGaussianBlur stdDeviation="2.4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx="180" cy="180" r="170" fill="rgba(2,9,27,.22)" stroke="rgba(239,203,126,.82)" strokeWidth="1.2" />
        {[154,123,92,57].map((radius, index) => <circle key={radius} cx="180" cy="180" r={radius} fill="none" stroke={`rgba(239,203,126,${.34 - index * .065})`} />)}
        {zodiacSymbols.map((symbol, index) => {
          const angle = (index * 30 - 90) * Math.PI / 180
          const nextAngle = angle + Math.PI / 12
          return <g key={symbol}>
            <line x1={180 + Math.cos(angle) * 154} y1={180 + Math.sin(angle) * 154} x2={180 + Math.cos(angle) * 170} y2={180 + Math.sin(angle) * 170} stroke="rgba(239,203,126,.55)" />
            <text x={180 + Math.cos(nextAngle) * 162} y={180 + Math.sin(nextAngle) * 162} textAnchor="middle" dominantBaseline="middle" fill="rgba(247,218,155,.98)" fontSize="18" fontFamily="Georgia, serif">{symbol}</text>
            <line x1="180" y1="180" x2={180 + Math.cos(angle) * 123} y2={180 + Math.sin(angle) * 123} stroke="rgba(239,203,126,.09)" />
          </g>
        })}
        {lines.map(([from,to], index) => <line key={index} x1={points[from][0]} y1={points[from][1]} x2={points[to][0]} y2={points[to][1]} stroke="rgba(239,203,126,.52)" strokeWidth=".75" />)}
        {points.map(([x,y], index) => <circle key={index} cx={x} cy={y} r={index < 11 ? 2 : 1.6} fill="#f5d58d" filter="url(#cosmic-glow)" />)}
        <circle cx="180" cy="180" r="49" fill="url(#cosmic-core)" />
        <g filter="url(#cosmic-glow)" fill="#fff5ce"><path d="M180 153 L184 176 L207 180 L184 184 L180 207 L176 184 L153 180 L176 176 Z" /><circle cx="180" cy="180" r="4.5" fill="#fffdf3" /></g>
      </motion.svg>
    </div>
  )
}
