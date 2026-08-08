import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Loader2, ImageOff } from 'lucide-react'
import type { DisplayMediaItem, DisplayCategory } from '@/types/media'
import { FullscreenMediaViewer } from './FullscreenMediaViewer'
import { cn } from '@/lib/utils'

interface MasonryGalleryProps {
  items: DisplayMediaItem[]
  categories: DisplayCategory[]
  initialCategory?: string
  /** Controlled active tab — pass this + onCategoryChange when the parent
   *  needs to know/drive which category is being viewed (e.g. so an
   *  "Upload Media" button targets whatever category is on screen). */
  activeCategory?: string
  onCategoryChange?: (id: string) => void
  /** When provided, items can be deleted from the fullscreen viewer. */
  onDelete?: (item: DisplayMediaItem) => void
}

export function MasonryGallery({ items, categories, initialCategory, activeCategory, onCategoryChange, onDelete }: MasonryGalleryProps) {
  const [internalTab, setInternalTab] = useState(initialCategory ?? categories[0]?.id ?? '')
  const activeTab = activeCategory ?? internalTab
  const setActiveTab = (id: string) => {
    if (onCategoryChange) onCategoryChange(id)
    else setInternalTab(id)
  }
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const filtered = items.filter((i) => i.category === activeTab)
  const viewable = filtered.filter((i) => i.processingStatus !== 'error')

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {categories.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors cursor-pointer',
              activeTab === tab.id
                ? 'bg-gold/15 text-champagne border border-gold/30'
                : 'glass text-white/50 hover:text-white/80'
            )}
          >
            <span>{tab.emoji}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Masonry grid */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass flex flex-col items-center gap-2 rounded-3xl px-8 py-16 text-center"
          >
            <p className="font-serif-display text-xl text-champagne">Nothing here yet</p>
            <p className="text-sm text-white/45">Upload something to fill this category.</p>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="columns-2 gap-3 sm:columns-3 md:gap-4"
          >
            {filtered.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => item.processingStatus !== 'processing' && setViewerIndex(viewable.indexOf(item))}
                disabled={item.processingStatus === 'processing'}
                className="group relative mb-3 block w-full overflow-hidden rounded-2xl bg-white/[0.08] md:mb-4 cursor-pointer disabled:cursor-wait"
              >
                <GalleryImage
                  src={item.thumbnailUrl || item.url}
                  alt={item.caption ?? ''}
                  aspectRatio={i % 5 === 0 ? '3/4' : i % 3 === 0 ? '1/1' : '4/5'}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {item.processingStatus === 'processing' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-gold" />
                    <span className="text-[10px] uppercase tracking-wide text-white/70">Processing video…</span>
                  </div>
                )}
                {item.processingStatus === 'error' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] uppercase tracking-wide text-rose">
                    Processing failed
                  </div>
                )}
                {item.type === 'video' && item.processingStatus === 'ready' && (
                  <div className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                    <Play className="h-3 w-3 fill-white text-white" />
                  </div>
                )}
                {item.caption && (
                  <p className="absolute bottom-2.5 left-2.5 right-2.5 truncate text-left text-xs text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {item.caption}
                  </p>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {viewerIndex !== null && (
        <FullscreenMediaViewer items={viewable} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} onDelete={onDelete} />
      )}
    </div>
  )
}

/** A plain <img> gives no visible feedback while loading (just a faint
 *  placeholder background, easy to mistake for a broken/transparent tile)
 *  and none at all if the URL 404s. This shows a real loading shimmer and
 *  a visible broken-image state instead of a blank hole. */
function GalleryImage({ src, alt, aspectRatio }: { src: string; alt: string; aspectRatio: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  if (status === 'error') {
    return (
      <div
        className="flex w-full items-center justify-center bg-white/[0.06] text-white/25"
        style={{ aspectRatio }}
      >
        <ImageOff className="h-6 w-6" />
      </div>
    )
  }

  return (
    <div className="relative w-full" style={{ aspectRatio }}>
      {status === 'loading' && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.08] to-white/[0.03]" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={cn(
          'absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-105',
          status === 'loading' ? 'opacity-0' : 'opacity-100'
        )}
      />
    </div>
  )
}
