import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  Pencil, Check, Upload, Trash2, Star, X, Plus, ShieldCheck,
  GripVertical, Loader2, ImageIcon, VideoIcon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfileOrbit } from '@/components/shared/ProfileOrbit'
import { MasonryGallery } from '@/components/shared/MasonryGallery'
import { FullscreenMediaViewer } from '@/components/shared/FullscreenMediaViewer'
import { CircularCropper } from '@/components/shared/CircularCropper'
import { ProfileDetailSections } from '@/components/shared/ProfileDetailSections'
import { DEFAULT_MEDIA_CATEGORIES } from '@/data/mediaCategories'
import { subscribeUserMedia, renameCategoryRemote, type MediaDoc } from '@/lib/firestore'
import {
  uploadImageMedia, uploadVideoMedia, deleteMedia, reorderMedia,
  updateMediaCaption, updateMediaCategory, setProfilePhotoFromMedia, uploadProfilePhoto,
  ACCEPTED_VIDEO_TYPES,
} from '@/lib/media/mediaService'
import { ACCEPTED_IMAGE_TYPES } from '@/lib/media/imageProcessing'
import type { DisplayMediaItem, DisplayCategory } from '@/types/media'
import type { SelfProfile } from '@/data/selfProfile'

function toDisplayItem(m: MediaDoc): DisplayMediaItem {
  return {
    id: m.id,
    url: m.url,
    thumbnailUrl: m.thumbnailUrl || m.video?.poster || '',
    category: m.category,
    type: m.type,
    caption: m.caption,
    processingStatus: m.processingStatus,
  }
}

export function MyProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { onboarding, profileExtras, updateProfileExtras } = useApp()

  const [media, setMedia] = useState<MediaDoc[]>([])
  const [editMode, setEditMode] = useState(false)
  const [activeCategory, setActiveCategory] = useState(onboarding.categories[0]?.id ?? 'moments')
  const [viewerCategory, setViewerCategory] = useState<string | null>(null)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadCategory, setUploadCategory] = useState(onboarding.categories[0]?.id ?? 'moments')
  const [uploadBusy, setUploadBusy] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [draft, setDraft] = useState<SelfProfile>(profileExtras)
  const [newInterest, setNewInterest] = useState('')
  const [savedPulse, setSavedPulse] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editMode) setDraft(profileExtras)
  }, [profileExtras, editMode])

  useEffect(() => {
    if (!user) return
    return subscribeUserMedia(user.uid, setMedia)
  }, [user])

  const categories: DisplayCategory[] = onboarding.categories.map((c) => ({
    id: c.id,
    label: c.label,
    emoji: DEFAULT_MEDIA_CATEGORIES.find((d) => d.id === c.id)?.emoji ?? '✨',
  }))

  const displayItems = media.map(toDisplayItem)
  // The gallery only ever shows photos — videos live exclusively in the
  // orbit bubbles around the profile photo, not mixed into the grid.
  const galleryItems = displayItems.filter((i) => i.type === 'image')

  // Orbit bubbles only ever show videos — a category with only photos
  // renders as an empty/emoji bubble, since its content lives in the
  // gallery instead.
  const orbitCategories = categories.map((c) => {
    const videos = media.filter((m) => m.category === c.id && m.type === 'video' && m.processingStatus === 'ready')
    return {
      id: c.id,
      label: c.label,
      emoji: c.emoji,
      coverUrl: videos[0]?.video?.poster || videos[0]?.thumbnailUrl || null,
      count: media.filter((m) => m.category === c.id && m.type === 'video' && m.processingStatus !== 'error').length,
    }
  })

  const handleCategorySelect = (id: string) => {
    setActiveCategory(id)
    const hasVideo = displayItems.some((i) => i.category === id && i.type === 'video' && i.processingStatus === 'ready')
    if (hasVideo && !editMode) {
      setViewerCategory(id)
      setViewerIndex(0)
    } else {
      setUploadCategory(id)
      setUploadOpen(true)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return
    setUploadBusy(true)
    setUploadError(null)
    const order = media.filter((m) => m.category === uploadCategory).length
    try {
      let i = 0
      for (const file of Array.from(files)) {
        if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          await uploadImageMedia(user.uid, file, uploadCategory, order + i)
        } else if (ACCEPTED_VIDEO_TYPES.includes(file.type)) {
          await uploadVideoMedia(user.uid, file, uploadCategory, order + i)
        } else {
          throw new Error(`"${file.name}" isn't a supported image or video type.`)
        }
        i++
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploadBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleReplacePhoto = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setCropFile(file)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const confirmCrop = async (blob: Blob) => {
    if (!user) return
    setPhotoBusy(true)
    try {
      await uploadProfilePhoto(user.uid, blob)
    } finally {
      setPhotoBusy(false)
      setCropFile(null)
    }
  }

  const categoryItems = media.filter((m) => m.category === activeCategory)

  const handleDeleteDisplayItem = (item: DisplayMediaItem) => {
    const match = media.find((m) => m.id === item.id)
    if (match) deleteMedia(match)
  }

  const handleReorder = async (newOrder: MediaDoc[]) => {
    setMedia((prev) => {
      const others = prev.filter((m) => m.category !== activeCategory)
      return [...others, ...newOrder]
    })
    await reorderMedia(newOrder.map((m, i) => ({ id: m.id, order: i })))
  }

  const handleRenameCategory = async (id: string, label: string) => {
    if (!user || !label.trim()) return
    await renameCategoryRemote(user.uid, id, label.trim())
  }

  const saveExtras = useCallback(async () => {
    await updateProfileExtras(draft)
    setEditMode(false)
    setSavedPulse(true)
    setTimeout(() => setSavedPulse(false), 2000)
  }, [draft, updateProfileExtras])

  const addInterest = () => {
    const val = newInterest.trim()
    if (!val || draft.interests.includes(val)) return
    setDraft((d) => ({ ...d, interests: [...d.interests, val] }))
    setNewInterest('')
  }

  const photoUrl = onboarding.profilePhotoThumbUrl || onboarding.profilePhotoUrl || null

  return (
    <div className="mx-auto max-w-4xl px-6 pb-32 pt-8 md:px-0">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <AnimatePresence>
          {savedPulse && (
            <motion.span
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300"
            >
              Profile saved
            </motion.span>
          )}
        </AnimatePresence>
        <div className="ml-auto flex items-center gap-2">
          {editMode ? (
            <Button onClick={saveExtras}>
              <Check className="h-4 w-4" /> Save
            </Button>
          ) : (
            <Button variant="glass" onClick={() => setEditMode(true)}>
              <Pencil className="h-4 w-4" /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Orbit hero */}
      <ProfileOrbit
        photoUrl={photoUrl}
        name={onboarding.name || 'Your Name'}
        location={draft.location}
        verificationStatus={onboarding.verification.status}
        categories={orbitCategories}
        onCategorySelect={handleCategorySelect}
        onPhotoClick={() => photoInputRef.current?.click()}
      />
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleReplacePhoto(e.target.files)} />
      {photoBusy && (
        <p className="mt-2 text-center text-xs text-white/40">
          <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> Uploading photo…
        </p>
      )}

      {onboarding.verification.status !== 'verified' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate('/verify')}
          className="glass mx-auto mt-4 flex items-center gap-2 rounded-full border border-gold/25 px-4 py-2 text-xs text-champagne cursor-pointer hover:border-gold/50"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {onboarding.verification.status === 'pending' ? 'Verification in review' : 'Verify your identity'}
        </motion.button>
      )}

      {/* About */}
      <div className="mt-10">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/70">About Me</p>
        {editMode ? (
          <textarea
            value={draft.about}
            onChange={(e) => setDraft((d) => ({ ...d, about: e.target.value }))}
            placeholder="Tell people who you are…"
            rows={4}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-lg text-white/90 outline-none focus:border-gold/40"
          />
        ) : (
          <p className="font-serif-display text-2xl leading-snug text-white/90 md:text-3xl">
            {draft.about || <span className="text-lg font-sans italic text-white/30">Add a bio so people know who you are.</span>}
          </p>
        )}
      </div>

      {/* Moments — the gallery */}
      <div className="mt-10">
        <p className="mb-1 text-xs uppercase tracking-[0.25em] text-gold/70">Moments</p>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif-display text-2xl text-champagne">Your Gallery</h2>
          <Button
            size="sm"
            onClick={() => {
              setUploadCategory(activeCategory)
              setUploadOpen(true)
            }}
          >
            <Upload className="h-3.5 w-3.5" /> Upload Media
          </Button>
        </div>
        <MasonryGallery
          items={galleryItems}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onDelete={handleDeleteDisplayItem}
        />
      </div>

      {/* Manage media (edit mode) */}
      <AnimatePresence>
        {editMode && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-10 overflow-hidden">
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold/70">Manage Media</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {categories.map((c) => (
                <CategoryTab
                  key={c.id}
                  cat={c}
                  active={activeCategory === c.id}
                  onSelect={() => setActiveCategory(c.id)}
                  onRename={(label) => handleRenameCategory(c.id, label)}
                />
              ))}
            </div>

            <Reorder.Group
              axis="y"
              values={categoryItems}
              onReorder={handleReorder}
              className="flex flex-col gap-3"
            >
              {categoryItems.map((item) => (
                <Reorder.Item key={item.id} value={item} className="glass flex items-center gap-3 rounded-2xl p-3">
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-white/30 active:cursor-grabbing" />
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white/20">
                        {item.type === 'video' ? <VideoIcon className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                      </div>
                    )}
                    {item.processingStatus === 'processing' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="h-4 w-4 animate-spin text-gold" />
                      </div>
                    )}
                  </div>
                  <input
                    defaultValue={item.caption}
                    placeholder="Add a caption…"
                    onBlur={(e) => updateMediaCaption(item.id, e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-xs text-white/80 outline-none focus:border-gold/30"
                  />
                  <select
                    value={item.category}
                    onChange={(e) => updateMediaCategory(item.id, e.target.value)}
                    className="rounded-lg border border-white/10 bg-midnight px-2 py-1.5 text-xs text-white/60"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                  {item.type === 'image' && item.processingStatus === 'ready' && (
                    <button
                      onClick={() => user && setProfilePhotoFromMedia(user.uid, item)}
                      title="Set as profile photo"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 hover:text-gold cursor-pointer"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMedia(item)}
                    title="Delete"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 hover:text-rose cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            {categoryItems.length === 0 && (
              <p className="glass rounded-2xl px-6 py-10 text-center text-sm text-white/40">
                Nothing in {categories.find((c) => c.id === activeCategory)?.label} yet.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interests */}
      <div className="mt-10">
        <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold/70">Interests</p>
        {editMode ? (
          <>
            <Reorder.Group axis="x" values={draft.interests} onReorder={(v) => setDraft((d) => ({ ...d, interests: v }))} className="mb-3 flex flex-wrap gap-2">
              {draft.interests.map((interest) => (
                <Reorder.Item key={interest} value={interest} className="cursor-grab active:cursor-grabbing">
                  <Badge variant="glass" className="flex items-center gap-1.5">
                    {interest}
                    <button onClick={() => setDraft((d) => ({ ...d, interests: d.interests.filter((i) => i !== interest) }))} className="cursor-pointer">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <div className="flex gap-2">
              <input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                placeholder="Add an interest…"
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-white/80 outline-none focus:border-gold/40"
              />
              <Button size="sm" variant="glass" onClick={addInterest}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            {draft.interests.length ? (
              draft.interests.map((i) => <Badge key={i} variant="glass">{i}</Badge>)
            ) : (
              <p className="text-sm italic text-white/30">No interests added yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Relationship goals */}
      <div className="mt-10">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/70">Relationship Intentions</p>
        {editMode ? (
          <input
            value={draft.goals}
            onChange={(e) => setDraft((d) => ({ ...d, goals: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-lg text-white/80 outline-none focus:border-gold/40"
          />
        ) : (
          <p className="max-w-2xl text-xl leading-relaxed text-white/70">
            {draft.goals || <span className="italic text-white/30">Not added yet.</span>}
          </p>
        )}
      </div>

      {/* Profession / education / location */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(['profession', 'education', 'location'] as const).map((field) => (
          <div key={field}>
            <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">{field}</p>
            {editMode ? (
              <input
                value={draft[field]}
                onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40"
              />
            ) : (
              <p className="text-sm text-white/80">{draft[field] || <span className="italic text-white/30">—</span>}</p>
            )}
          </div>
        ))}
      </div>

      {/* Premium detail sections */}
      <div className="mt-12">
        <p className="mb-5 text-xs uppercase tracking-[0.25em] text-gold/70">More About You</p>
        {editMode ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(['music', 'languages', 'favoritePlaces', 'dreamDestinations'] as const).map((field) => (
              <div key={field}>
                <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">{field} (comma-separated)</p>
                <input
                  value={draft[field].join(', ')}
                  onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40"
                />
              </div>
            ))}
            {(['fitness', 'books', 'movies'] as const).map((field) => (
              <div key={field}>
                <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">{field}</p>
                <input
                  value={draft[field]}
                  onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40"
                />
              </div>
            ))}
          </div>
        ) : (
          <ProfileDetailSections
            music={draft.music}
            languages={draft.languages}
            favoritePlaces={draft.favoritePlaces}
            dreamDestinations={draft.dreamDestinations}
            fitness={draft.fitness}
            books={draft.books}
            movies={draft.movies}
          />
        )}
      </div>

      {/* Upload modal */}
      <AnimatePresence>
        {uploadOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && !uploadBusy && setUploadOpen(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong w-full max-w-md rounded-2xl p-6">
              <h3 className="font-serif-display mb-4 text-xl text-champagne">Upload Media</h3>
              <div className="mb-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setUploadCategory(c.id)}
                    className={`rounded-full px-3 py-1.5 text-xs cursor-pointer ${uploadCategory === c.id ? 'bg-gold/15 border border-gold/30 text-champagne' : 'glass text-white/50'}`}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadBusy}
                className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/15 py-10 text-white/50 hover:border-gold/30 hover:text-white/80 cursor-pointer disabled:cursor-wait"
              >
                {uploadBusy ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <Upload className="h-6 w-6" />}
                <span className="text-sm">{uploadBusy ? 'Uploading…' : 'Select photos or videos'}</span>
                <span className="text-[10px] text-white/30">JPG, PNG, WebP, HEIC · MP4, MOV, WebM (max 15s)</span>
              </button>
              {uploadError && <p className="mt-3 text-xs text-rose">{uploadError}</p>}
              <Button variant="glass" className="mt-4 w-full" onClick={() => setUploadOpen(false)} disabled={uploadBusy}>
                Done
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {cropFile && <CircularCropper file={cropFile} onConfirm={confirmCrop} onCancel={() => setCropFile(null)} />}

      {viewerCategory && (
        <FullscreenMediaViewer
          items={displayItems.filter((i) => i.category === viewerCategory && i.type === 'video' && i.processingStatus === 'ready')}
          initialIndex={viewerIndex}
          onClose={() => setViewerCategory(null)}
          onDelete={handleDeleteDisplayItem}
        />
      )}
    </div>
  )
}

function CategoryTab({ cat, active, onSelect, onRename }: { cat: DisplayCategory; active: boolean; onSelect: () => void; onRename: (label: string) => void }) {
  const [renaming, setRenaming] = useState(false)
  const [value, setValue] = useState(cat.label)

  if (renaming) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => { setRenaming(false); onRename(value) }}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="w-28 rounded-full border border-gold/30 bg-white/[0.03] px-3 py-1.5 text-xs text-white outline-none"
      />
    )
  }

  return (
    <button
      onClick={onSelect}
      onDoubleClick={() => setRenaming(true)}
      className={`rounded-full px-3.5 py-1.5 text-xs cursor-pointer ${active ? 'bg-gold/15 border border-gold/30 text-champagne' : 'glass text-white/50 hover:text-white/80'}`}
      title="Double-click to rename"
    >
      {cat.emoji} {cat.label}
    </button>
  )
}
