import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play } from 'lucide-react'
import { GALLERY_TABS, type GalleryItem, type GalleryCategory } from '@/data/gallery-media'
import { FullscreenMediaViewer } from './FullscreenMediaViewer'
import { cn } from '@/lib/utils'

export function MasonryGallery({ items }: { items: GalleryItem[] }) {
  const [activeTab, setActiveTab] = useState<GalleryCategory>('moments')
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const filtered = items.filter((i) => i.category === activeTab)

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {GALLERY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors cursor-pointer',
              activeTab === tab.key
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
            <p className="text-sm text-white/45">Check back soon.</p>
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
                onClick={() => setViewerIndex(i)}
                className="group relative mb-3 block w-full overflow-hidden rounded-2xl md:mb-4 cursor-pointer"
              >
                <img
                  src={item.url}
                  alt={item.caption ?? ''}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ aspectRatio: i % 5 === 0 ? '3/4' : i % 3 === 0 ? '1/1' : '4/5' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {item.isVideo && (
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
        <FullscreenMediaViewer items={filtered} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </div>
  )
}
