import { motion } from 'framer-motion'
import { BadgeCheck, ShieldQuestion, Clock, ImagePlus } from 'lucide-react'
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
const ORBIT_POSITIONS: OrbitPosition[] = [
  { x: 26, y: 6, size: 1.0 },
  { x: 76, y: 11, size: 0.82 },
  { x: 4, y: 38, size: 0.92 },
  { x: 97, y: 42, size: 1.05 },
  { x: 13, y: 70, size: 0.8 },
  { x: 85, y: 73, size: 0.95 },
  { x: 47, y: 88, size: 0.74 },
  { x: 58, y: 1, size: 0.68 },
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
}

function VerificationBadge({ status }: { status: ProfileOrbitProps['verificationStatus'] }) {
  if (status === 'verified') {
    return (
      <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] uppercase tracking-wide text-emerald-300">
        <BadgeCheck className="h-3 w-3" /> Verified
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-gold">
        <Clock className="h-3 w-3" /> Verification pending
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-wide text-white/50">
      <ShieldQuestion className="h-3 w-3" /> Verification required
    </span>
  )
}

export function ProfileOrbit({
  photoUrl,
  name,
  age,
  location,
  verificationStatus,
  categories,
  onCategorySelect,
  compatibility,
  onPhotoClick,
}: ProfileOrbitProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative mx-auto mb-4 h-[340px] w-full max-w-[420px] sm:h-[420px] sm:max-w-[480px] md:h-[500px] md:max-w-[560px]">
        {/* Satellite media circles */}
        {categories.slice(0, ORBIT_POSITIONS.length).map((cat, i) => {
          const pos = ORBIT_POSITIONS[i]
          const sizePx = 46 + pos.size * 30
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
              className="group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 cursor-pointer"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div
                className={cn(
                  'relative flex items-center justify-center overflow-hidden rounded-full border-2 shadow-lg transition-colors',
                  cat.count > 0 ? 'border-gold/50 bg-white/[0.03] group-hover:border-gold' : 'border-white/15 bg-white/[0.02] group-hover:border-white/30'
                )}
                style={{ width: sizePx, height: sizePx }}
              >
                {cat.coverUrl ? (
                  <img src={cat.coverUrl} alt={cat.label} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg opacity-60">{cat.emoji}</span>
                )}
                {cat.count > 0 && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-midnight px-1 text-[9px] font-semibold text-champagne ring-1 ring-gold/40">
                    {cat.count}
                  </span>
                )}
              </div>
              <span className="glass rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/55 group-hover:text-champagne whitespace-nowrap">
                {cat.emoji} {cat.label}
              </span>
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
              className="absolute -inset-3 rounded-full bg-gradient-to-br from-gold/30 via-champagne/10 to-transparent blur-xl"
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative flex h-[124px] w-[124px] items-center justify-center overflow-hidden rounded-full border-[3px] border-gold/60 bg-white/[0.03] shadow-2xl sm:h-[152px] sm:w-[152px] md:h-[176px] md:w-[176px]">
              {photoUrl ? (
                <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-white/35">
                  <ImagePlus className="h-7 w-7" />
                  <span className="text-[10px] uppercase tracking-wide">Add photo</span>
                </div>
              )}
            </div>
            {typeof compatibility === 'number' && (
              <div className="glass-strong absolute -right-2 -top-2 flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 text-xs font-semibold text-champagne shadow-lg">
                {compatibility}%
              </div>
            )}
          </div>
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-2 flex flex-col items-center gap-2 text-center"
      >
        <h1 className="font-serif-display text-2xl text-white sm:text-3xl">
          {name}
          {age ? `, ${age}` : ''}
        </h1>
        {location && <p className="text-sm text-white/55">{location}</p>}
        <VerificationBadge status={verificationStatus} />
      </motion.div>
    </div>
  )
}
