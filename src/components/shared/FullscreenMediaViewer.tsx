import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Play } from 'lucide-react'
import type { GalleryItem } from '@/data/gallery-media'
import { cn } from '@/lib/utils'

interface FullscreenMediaViewerProps {
  items: GalleryItem[]
  initialIndex: number
  onClose: () => void
}

export function FullscreenMediaViewer({ items, initialIndex, onClose }: FullscreenMediaViewerProps) {
  const [index, setIndex] = useState(initialIndex)
  const [zoomed, setZoomed] = useState(false)
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const dragX = useMotionValue(0)

  const item = items[index]

  const goNext = useCallback(() => {
    setZoomed(false)
    setIndex((i) => (i + 1) % items.length)
  }, [items.length])

  const goPrev = useCallback(() => {
    setZoomed(false)
    setIndex((i) => (i - 1 + items.length) % items.length)
  }, [items.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, goNext, goPrev])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-5">
        <span className="glass-strong rounded-full px-3.5 py-1.5 text-xs text-white/80">
          {index + 1} / {items.length}
        </span>
        <button
          onClick={onClose}
          className="glass-strong flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:text-white cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Prev / next arrows (desktop) */}
      <button
        onClick={(e) => { e.stopPropagation(); goPrev() }}
        className="glass-strong absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white/70 hover:text-white md:flex cursor-pointer"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goNext() }}
        className="glass-strong absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white/70 hover:text-white md:flex cursor-pointer"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Media */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-full w-full items-center justify-center px-4 md:px-20"
          drag={!zoomed ? 'x' : false}
          style={{ x: dragX }}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={(_, info) => {
            if (info.offset.x < -80) goNext()
            else if (info.offset.x > 80) goPrev()
          }}
        >
          <motion.img
            src={item.url}
            alt={item.caption ?? ''}
            onDoubleClick={() => setZoomed((z) => !z)}
            animate={{ scale: zoomed ? 1.8 : 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            drag={zoomed}
            dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
            className={cn(
              'max-h-[78vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl',
              zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
            )}
          />
          {item.isVideo && !zoomed && (
            <div className="pointer-events-none absolute flex h-16 w-16 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
              <Play className="h-6 w-6 fill-white text-white" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Caption + actions */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-4 p-6">
        {item.caption && (
          <p className="font-serif-display max-w-md text-center text-lg italic text-white/85">"{item.caption}"</p>
        )}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation()
              setLiked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
            }}
            className="glass-strong flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80 cursor-pointer"
          >
            <Heart className={cn('h-4 w-4', liked[item.id] && 'fill-rose text-rose')} />
          </motion.button>
          <button className="glass-strong flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/40 cursor-not-allowed" disabled>
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">Comments soon</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
