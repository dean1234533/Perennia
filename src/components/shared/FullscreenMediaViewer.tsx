import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import type { DisplayMediaItem } from '@/types/media'
import { cn } from '@/lib/utils'

interface FullscreenMediaViewerProps {
  items: DisplayMediaItem[]
  initialIndex: number
  onClose: () => void
  /** When provided, shows a delete button. The caller owns the actual
   *  deletion (Storage + Firestore); this component just reacts to the
   *  resulting shrink of `items` via the effect below. */
  onDelete?: (item: DisplayMediaItem) => void
}

export function FullscreenMediaViewer({ items, initialIndex, onClose, onDelete }: FullscreenMediaViewerProps) {
  const [index, setIndex] = useState(initialIndex)
  const [zoomed, setZoomed] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
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

  // Lock background scroll while the viewer is open — otherwise scrolling
  // the page behind it toggles the mobile browser's collapsible toolbar,
  // which keeps changing the real visible viewport height and made the
  // bottom action bar (delete button) flicker in and out of view.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  // React to items shrinking after a delete (real-time from Firestore) —
  // close if that was the last item, otherwise keep the index in bounds.
  useEffect(() => {
    if (items.length === 0) {
      onClose()
      return
    }
    if (index >= items.length) setIndex(items.length - 1)
  }, [items.length, index, onClose])

  if (!item) return null

  const handleDelete = () => {
    onDelete?.(item)
    setConfirmingDelete(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-xl"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Top bar — normal flow, always gets its own space */}
      <div className="z-10 flex shrink-0 items-center justify-between p-5">
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

      {/* Media area — takes whatever space is left between the top bar and
          the bottom action bar, so those two never get pushed off-screen
          regardless of the browser's actual visible viewport height. */}
      <div className="relative min-h-0 flex-1">
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
            {item.type === 'video' ? (
              <video
                src={item.url}
                poster={item.thumbnailUrl}
                controls
                autoPlay
                muted
                playsInline
                className="h-full max-w-full rounded-2xl object-contain shadow-2xl"
              />
            ) : (
              <motion.img
                src={item.url}
                alt={item.caption ?? ''}
                onDoubleClick={() => setZoomed((z) => !z)}
                animate={{ scale: zoomed ? 1.8 : 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                drag={zoomed}
                dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
                className={cn(
                  'h-full max-w-full rounded-2xl object-contain shadow-2xl',
                  zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                )}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Caption + actions — normal flow, always gets its own space at the
          bottom regardless of media size. */}
      <div
        className="z-10 flex shrink-0 flex-col items-center gap-4 p-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {item.caption && (
          <p className="font-serif-display max-w-md text-center text-lg italic text-white/85">"{item.caption}"</p>
        )}
        {onDelete && (
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              {confirmingDelete ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete() }}
                    className="glass-strong rounded-full bg-rose-500/20 px-4 py-2 text-sm text-rose-300 cursor-pointer"
                  >
                    Delete
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmingDelete(false) }}
                    className="glass-strong rounded-full px-4 py-2 text-sm text-white/60 cursor-pointer"
                  >
                    Cancel
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="trigger"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); setConfirmingDelete(true) }}
                  className="glass-strong flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/60 hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}
