import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ImagePlus, Plus, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface OrbitCategory {
  id: string
  label: string
  emoji: string
  coverUrl: string | null
  count: number
}

interface OrbitPosition {
  x: number // percentage from left, relative to the orbit container
  y: number // percentage from top
  size: number // relative scale factor
}

// A hand-placed, asymmetric arrangement — deliberately not an even circle of
// evenly-spaced dots (that would read as generic "story ring" chrome). This
// is Perennia's own celestial-orbit signature.
// x values are kept inside an 8-92% band (with extra clearance for the
// larger bubbles) so a translated circle never clips past the container
// edge on narrow phone viewports — verified at 375px/390px widths.
const ORBIT_POSITIONS: OrbitPosition[] = [
  { x: 20, y: 10, size: 1.0 },
  { x: 80, y: 15, size: 0.82 },
  { x: 9, y: 40, size: 0.92 },
  { x: 90, y: 44, size: 1.0 },
  { x: 16, y: 72, size: 0.8 },
  { x: 82, y: 75, size: 0.9 },
  { x: 47, y: 90, size: 0.74 },
  { x: 50, y: 3, size: 0.68 },
]

const ORBIT_PLANETS = [
  { src: '/planets-realistic/jupiter.png', name: 'Jupiter' },
  { src: '/planets-realistic/mars.png', name: 'Mars' },
  { src: '/planets-realistic/earth.png', name: 'Earth' },
  { src: '/planets-realistic/saturn.png', name: 'Saturn' },
]

interface ProfileOrbitProps {
  photoUrl: string | null
  name: string
  age?: number
  location?: string
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'failed'
  categories: OrbitCategory[]
  onCategorySelect: (categoryId: string) => void
  compatibility?: number
  onPhotoClick?: () => void
  /** Extra badges shown alongside verification status — e.g. a Founding
   *  Member pill. Only ever passed for the signed-in member's own view. */
  extraBadge?: ReactNode
  compact?: boolean
  editableHighlights?: boolean
  profileLayout?: boolean
  showIdentity?: boolean
}

export function ProfileOrbit({
  photoUrl,
  name,
  age,
  location,
  categories,
  onCategorySelect,
  compatibility,
  onPhotoClick,
  extraBadge,
  compact = false,
  editableHighlights = false,
  profileLayout = false,
  showIdentity = true,
}: ProfileOrbitProps) {
  const positions = compact
    ? [
        { x: 20, y: 24, size: 0.72 },
        { x: 81, y: 34, size: 0.56 },
        { x: 18, y: 68, size: 0.62 },
        { x: 82, y: 74, size: 0.76 },
      ]
    : ORBIT_POSITIONS

  return (
    <div className={cn('flex flex-col items-center', profileLayout && 'profile-orbit-root')}>
      <div className={cn(
        'profile-orbit relative mx-auto w-full',
        compact
          ? 'h-[270px] max-w-[390px] sm:h-[330px] sm:max-w-[470px]'
          : 'h-[320px] max-w-[410px] sm:h-[410px] sm:max-w-[500px] md:h-[470px] md:max-w-[560px]'
      )}>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/16" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[91%] w-[91%] -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-[50%] border border-gold/20" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[58%] w-[102%] -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-[50%] border border-gold/14" />
        {/* Planet satellites double as shortcuts into the profile sections. */}
        {categories.slice(0, positions.length).map((cat, i) => {
          const pos = positions[i]
          const planet = ORBIT_PLANETS[i % ORBIT_PLANETS.length]
          const compactSizes = [68, 44, 56, 84]
          const regularSizes = [84, 58, 70, 102]
          const sizePx = (compact ? compactSizes : regularSizes)[i % 4]
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: [0, i % 2 === 0 ? -6 : 6, 0],
              }}
              transition={{
                opacity: { delay: 0.15 + i * 0.05, duration: 0.5 },
                scale: { delay: 0.15 + i * 0.05, duration: 0.5, type: 'spring', stiffness: 200 },
                y: { duration: 5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 },
              }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onCategorySelect(cat.id)}
              className="group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center cursor-pointer"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className="relative flex items-center justify-center transition-[filter] duration-300 group-hover:drop-shadow-[0_0_12px_rgba(235,197,132,.48)]" style={{ width: sizePx, height: sizePx }}>
                <img src={planet.src} alt={planet.name} className="h-full w-full object-contain" />
                {(cat.count > 0 || editableHighlights) && (
                  <span className="absolute bottom-[3%] right-[2%] flex h-5 w-5 items-center justify-center rounded-full border border-gold/70 bg-midnight/95 text-champagne shadow-[0_0_10px_rgba(229,192,123,.35)]">
                    {cat.count > 0 ? <Play className="h-2.5 w-2.5 fill-current" /> : <Plus className="h-3 w-3" />}
                  </span>
                )}
              </div>
              <span className="sr-only">{cat.label}</span>
            </motion.button>
          )
        })}

        {/* Central profile photo */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          onClick={onPhotoClick}
          disabled={!onPhotoClick}
          className={cn(
            'absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2',
            onPhotoClick ? 'cursor-pointer' : 'cursor-default'
          )}
        >
          <div className="relative">
            <motion.div
              className="absolute -inset-5 rounded-full bg-[radial-gradient(circle,rgba(88,131,235,.2)_0%,rgba(229,192,123,.08)_48%,transparent_72%)] blur-lg"
              animate={{ opacity: [0.45, 0.72, 0.45] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="pointer-events-none absolute -inset-[11px] rounded-full border border-[#8eafff]/55 shadow-[0_0_16px_rgba(83,126,236,.22)]" />
            <div className="pointer-events-none absolute -inset-[5px] rounded-full border border-white/65 shadow-[inset_0_0_10px_rgba(111,152,255,.18)]" />
            <div className={cn(
              'relative flex items-center justify-center overflow-hidden rounded-full border border-[#f1d6a7]/90 bg-[#06132c] p-[3px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.22),0_0_25px_rgba(54,96,198,.28)]',
              compact
                ? 'h-[184px] w-[184px] sm:h-[224px] sm:w-[224px]'
                : 'h-[158px] w-[158px] sm:h-[210px] sm:w-[210px] md:h-[244px] md:w-[244px]'
            )}>
              {photoUrl ? (
                <img src={photoUrl} alt={name} className="h-full w-full rounded-full border border-white/55 object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-white/35">
                  <ImagePlus className="h-7 w-7" />
                  <span className="text-[10px] uppercase tracking-wide">Add photo</span>
                </div>
              )}
            </div>
            <span className="pointer-events-none absolute -left-[8px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#ffe1a8] shadow-[0_0_5px_2px_rgba(255,218,153,.75),0_0_14px_5px_rgba(75,116,235,.32)]" />
            <span className="pointer-events-none absolute -right-[7px] top-[43%] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_5px_2px_rgba(255,255,255,.72),0_0_13px_5px_rgba(80,125,246,.4)]" />
            {typeof compatibility === 'number' && (
              <div className="glass-strong absolute -right-2 -top-2 flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-xs font-semibold text-champagne shadow-lg">
                {compatibility}%
              </div>
            )}
          </div>
        </motion.button>
      </div>

      {showIdentity && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn('profile-orbit-identity flex flex-col items-center gap-2 text-center', compact ? '-mt-2 sm:-mt-4' : '-mt-1 sm:-mt-3')}
        >
          <h1 className={cn('font-serif-display font-medium tracking-wide text-ivory', compact ? 'text-4xl sm:text-5xl' : 'text-4xl sm:text-6xl')}>
            {name}
            {age ? `, ${age}` : ''}
          </h1>
          {location && <p className="text-sm text-white/55">{location}</p>}
          {extraBadge && <div className="flex flex-wrap items-center justify-center gap-2">{extraBadge}</div>}
        </motion.div>
      )}
    </div>
  )
}
