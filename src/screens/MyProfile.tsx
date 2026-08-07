import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  BadgeCheck, MapPin, Briefcase, GraduationCap, Sun, Sparkles, Pencil, Eye,
  Plus, X, Crop, ImagePlus, Check, Settings as SettingsIcon,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { selfAvatarUrl } from '@/lib/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MasonryGallery } from '@/components/shared/MasonryGallery'
import { FullscreenMediaViewer } from '@/components/shared/FullscreenMediaViewer'
import { ProfileDetailSections } from '@/components/shared/ProfileDetailSections'
import { GALLERY_TABS, getProfileGallery, type GalleryItem, type GalleryCategory } from '@/data/gallery-media'
import { defaultSelfProfile } from '@/data/selfProfile'

export function MyProfile() {
  const navigate = useNavigate()
  const { onboarding } = useApp()
  const [editMode, setEditMode] = useState(false)
  const [gallery, setGallery] = useState<GalleryItem[]>(() => getProfileGallery('self'))
  const [coverId, setCoverId] = useState<string>(() => gallery.find((g) => g.category === 'highlights')?.id ?? gallery[0].id)
  const [activeTab, setActiveTab] = useState<GalleryCategory>('moments')
  const [interests, setInterests] = useState(defaultSelfProfile.interests)
  const [newInterest, setNewInterest] = useState('')
  const [cropTarget, setCropTarget] = useState<GalleryItem | null>(null)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [savedPulse, setSavedPulse] = useState(false)

  const coverImage = gallery.find((g) => g.id === coverId)?.url ?? gallery[0].url
  const filtered = gallery.filter((g) => g.category === activeTab)

  const removeMedia = (id: string) => {
    setGallery((prev) => prev.filter((g) => g.id !== id))
    if (coverId === id) setCoverId(gallery[0]?.id ?? '')
  }

  const addMedia = () => {
    const pool = getProfileGallery('self')
    const candidate = pool.find((p) => !gallery.some((g) => g.id === p.id) && p.category === activeTab)
      ?? { id: `new-${Date.now()}`, url: pool[Math.floor(Math.random() * pool.length)].url, category: activeTab }
    setGallery((prev) => [{ ...candidate, id: `${candidate.id}-${Date.now()}` }, ...prev])
  }

  const updateCaption = (id: string, caption: string) => {
    setGallery((prev) => prev.map((g) => (g.id === id ? { ...g, caption } : g)))
  }

  const handleSave = () => {
    setEditMode(false)
    setSavedPulse(true)
    setTimeout(() => setSavedPulse(false), 2000)
  }

  const removeInterest = (interest: string) => setInterests((prev) => prev.filter((i) => i !== interest))
  const addInterest = () => {
    const trimmed = newInterest.trim()
    if (trimmed && !interests.includes(trimmed)) setInterests((prev) => [...prev, trimmed])
    setNewInterest('')
  }

  return (
    <div className="pb-32">
      {/* Top action bar */}
      <div className="fixed left-4 right-4 top-4 z-30 flex items-center justify-between md:left-8 md:right-8">
        <AnimatePresence>
          {savedPulse && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-strong flex items-center gap-2 rounded-full px-4 py-2 text-sm text-emerald-300"
            >
              <Check className="h-4 w-4" /> Profile saved
            </motion.div>
          )}
        </AnimatePresence>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="glass" size="icon" onClick={() => navigate('/settings')}>
            <SettingsIcon className="h-4 w-4" />
          </Button>
          {editMode ? (
            <Button variant="gold" size="sm" onClick={handleSave}>
              <Check className="h-4 w-4" /> Save
            </Button>
          ) : (
            <Button variant="glass" size="sm" onClick={() => setEditMode(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Cover */}
      <div className="relative h-[38vh] min-h-[220px] w-full overflow-hidden md:h-[42vh]">
        <motion.img
          key={coverImage}
          initial={{ opacity: 0.4, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          src={coverImage}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/20 to-black/10" />
        {editMode && (
          <div className="absolute bottom-4 right-4 rounded-full glass-strong px-3 py-1.5 text-[11px] text-white/70">
            Tap any photo below and choose "Set as Cover"
          </div>
        )}
      </div>

      <div className="mx-auto max-w-4xl px-6 md:px-0">
        <div className="-mt-16 mb-4 flex items-end justify-between md:-mt-20">
          <div className="relative">
            <img
              src={selfAvatarUrl(onboarding.gender)}
              alt="You"
              className="h-32 w-32 rounded-full border-4 border-midnight object-cover shadow-2xl md:h-40 md:w-40"
            />
            {editMode && (
              <button className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-gold text-midnight shadow-lg cursor-pointer">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2">
          <h1 className="font-serif-display text-3xl text-white md:text-4xl">{onboarding.name || 'Eleanor Ashworth'}</h1>
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] uppercase tracking-wide text-emerald-300 border border-emerald-500/30">
            <BadgeCheck className="h-3 w-3" /> Verified
          </span>
        </div>
        <div className="mb-5 flex flex-wrap items-center gap-4 text-sm text-white/60">
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {defaultSelfProfile.location}</span>
          <span className="flex items-center gap-1.5"><Sun className="h-4 w-4" /> {onboarding.sunSign || 'Libra'}</span>
          <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {defaultSelfProfile.profession}</span>
          <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> {defaultSelfProfile.education}</span>
        </div>

        {/* Bio */}
        <div className="mb-8">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/70">About Me</p>
          <p className="font-serif-display text-2xl leading-snug text-white/90 md:text-3xl">{defaultSelfProfile.about}</p>
        </div>

        {/* Interests — reorderable in edit mode */}
        <div className="mb-8">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold/70">Interests</p>
          {editMode ? (
            <>
              <Reorder.Group axis="x" values={interests} onReorder={setInterests} className="mb-3 flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <Reorder.Item key={interest} value={interest} className="cursor-grab active:cursor-grabbing">
                    <span className="glass flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs text-white/80">
                      {interest}
                      <button onClick={() => removeInterest(interest)} className="text-white/40 hover:text-rose-300 cursor-pointer">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
              <div className="flex max-w-xs items-center gap-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                  placeholder="Add an interest…"
                  className="h-9 text-sm"
                />
                <Button size="icon" variant="glass" onClick={addInterest} className="h-9 w-9 shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => <Badge key={interest} variant="glass">{interest}</Badge>)}
            </div>
          )}
        </div>

        {/* Goals */}
        <div className="mb-8">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/70">Relationship Intentions</p>
          <p className="max-w-2xl text-xl leading-relaxed text-white/70">{defaultSelfProfile.goals}</p>
        </div>

        {/* Lifestyle */}
        <div className="mb-10">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold/70">Lifestyle</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {defaultSelfProfile.lifestyle.map((item) => (
              <div key={item.label}>
                <p className="text-[10px] uppercase tracking-widest text-white/40">{item.label}</p>
                <p className="text-sm text-white/80">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gallery */}
        <div className="mb-12">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.25em] text-gold/70">Gallery</p>
              <h2 className="font-serif-display text-2xl text-champagne">Your World</h2>
            </div>
            {editMode && (
              <Button size="sm" variant="glass" onClick={addMedia}>
                <ImagePlus className="h-3.5 w-3.5" /> Add Media
              </Button>
            )}
          </div>

          {editMode ? (
            <div>
              <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
                {GALLERY_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors cursor-pointer ${
                      activeTab === tab.key ? 'bg-gold/15 text-champagne border border-gold/30' : 'glass text-white/50 hover:text-white/80'
                    }`}
                  >
                    <span>{tab.emoji}</span> {tab.label}
                  </button>
                ))}
              </div>

              <Reorder.Group
                axis="y"
                values={filtered}
                onReorder={(newOrder) => {
                  setGallery((prev) => [...prev.filter((g) => g.category !== activeTab), ...newOrder])
                }}
                className="grid grid-cols-2 gap-4 sm:grid-cols-3"
              >
                {filtered.map((item) => (
                  <Reorder.Item key={item.id} value={item} className="cursor-grab active:cursor-grabbing">
                    <div className="group relative overflow-hidden rounded-2xl">
                      <img src={item.url} alt="" className="h-40 w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <button
                        onClick={() => removeMedia(item.id)}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-rose-300 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setCropTarget(item)}
                        className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-gold cursor-pointer"
                      >
                        <Crop className="h-3.5 w-3.5" />
                      </button>
                      {coverId === item.id ? (
                        <span className="absolute bottom-2 left-2 rounded-full bg-gold/90 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-midnight">
                          Cover
                        </span>
                      ) : (
                        <button
                          onClick={() => setCoverId(item.id)}
                          className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/70 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                        >
                          Set as Cover
                        </button>
                      )}
                      <input
                        value={item.caption ?? ''}
                        onChange={(e) => updateCaption(item.id, e.target.value)}
                        placeholder="Add a caption…"
                        className="absolute bottom-2 right-2 w-[60%] rounded-md bg-black/50 px-2 py-1 text-[10px] text-white placeholder:text-white/40 outline-none"
                      />
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          ) : (
            <MasonryGallery items={gallery} />
          )}
        </div>

        {/* Premium sections */}
        <div className="mb-12">
          <p className="mb-1 text-xs uppercase tracking-[0.25em] text-gold/70">More About Me</p>
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge variant="gold">Values: {defaultSelfProfile.values.join(', ')}</Badge>
          </div>
          <ProfileDetailSections
            music={defaultSelfProfile.music}
            languages={defaultSelfProfile.languages}
            favoritePlaces={defaultSelfProfile.favoritePlaces}
            dreamDestinations={defaultSelfProfile.dreamDestinations}
            fitness={defaultSelfProfile.fitness}
            books={defaultSelfProfile.books}
            movies={defaultSelfProfile.movies}
          />
        </div>

        {!editMode && (
          <Button variant="link" onClick={() => setViewerIndex(0)} className="mx-auto flex text-sm">
            <Eye className="h-3.5 w-3.5" /> Preview as Others See It
          </Button>
        )}
      </div>

      {viewerIndex !== null && (
        <FullscreenMediaViewer items={gallery} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}

      {/* Mock crop dialog */}
      <AnimatePresence>
        {cropTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
            onClick={() => setCropTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-sm rounded-3xl p-6 text-center"
            >
              <p className="font-serif-display mb-4 text-xl text-champagne">Crop Photo</p>
              <div className="relative mx-auto mb-5 aspect-square w-full max-w-[240px] overflow-hidden rounded-2xl border-2 border-gold/40">
                <img src={cropTarget.url} alt="" className="h-full w-full object-cover" />
              </div>
              <p className="mb-5 text-xs text-white/45">Drag to reposition · pinch to zoom (prototype preview)</p>
              <Button className="w-full" onClick={() => setCropTarget(null)}>Apply Crop</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
