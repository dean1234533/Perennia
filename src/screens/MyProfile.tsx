import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  Check, Upload, Trash2, Star, X, Plus, ShieldCheck,
  GripVertical, Loader2, ImageIcon, VideoIcon, Feather, MoreHorizontal, Play,
  Heart, Sparkles, BriefcaseBusiness, MapPinned, type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfileOrbit } from '@/components/shared/ProfileOrbit'
import { ProfileExperience } from '@/components/shared/ProfileExperience'
import { CelestialHeart } from '@/components/shared/CelestialHeart'
import { FoundingMemberBadge } from '@/components/founding500/FoundingMemberBadge'
import { FullscreenMediaViewer } from '@/components/shared/FullscreenMediaViewer'
import { MyProfileActionsMenu } from '@/components/shared/ProfileActionsMenu'
import { CircularCropper } from '@/components/shared/CircularCropper'
import { DEFAULT_MEDIA_CATEGORIES } from '@/data/mediaCategories'
import { subscribeUserMedia, renameCategoryRemote, type MediaDoc } from '@/lib/firestore'
import {
  uploadImageMedia, uploadVideoMedia, deleteMedia, reorderMedia,
  updateMediaCaption, updateMediaCategory, setProfilePhotoFromMedia, uploadProfilePhoto,
  ACCEPTED_VIDEO_TYPES,
} from '@/lib/media/mediaService'
import { ACCEPTED_IMAGE_TYPES } from '@/lib/media/imageProcessing'
import { toDisplayItem } from '@/lib/media/toDisplayItem'
import type { DisplayMediaItem, DisplayCategory } from '@/types/media'
import type { SelfProfile } from '@/data/selfProfile'
import type { StoryPrompt } from '@/lib/firestore'
import { editorial } from '@/data/editorial-images'
import { calculateAge } from '@/lib/age'
import { subscribeFoundingMembership } from '@/lib/founding500'
import type { FoundingMemberRecord } from '@/types/founding500'

const previewProfile: SelfProfile = {
  about: 'Family-minded, ambitious, and always up for deep talks and meaningful adventures.',
  interests: ['Travel', 'Photography', 'Hiking'],
  lifestyleVibe: 'Active & Adventurous',
  openToNewThings: true,
  values: ['Family', 'Ambition', 'Honesty'],
  music: ['Soul', 'Jazz'],
  languages: ['English'],
  favoritePlaces: ['London', 'Santorini'],
  dreamDestinations: ['Japan', 'New Zealand'],
  fitness: 'Hiking and strength training',
  books: 'Biographies and philosophy',
  movies: 'Character-driven dramas',
  goals: 'A lasting relationship built on trust and shared adventure.',
  profession: 'Creative Director',
  education: 'Postgraduate Degree',
  location: 'London, United Kingdom',
}

const previewStoryPrompts: StoryPrompt[] = [
  { question: 'My ideal Sunday looks like…', answer: 'A slow morning, a good book, and a long walk before dinner with people I love.' },
  { question: 'A cause I care about', answer: 'Making creative education more accessible for young people.' },
]

const previewCategories: DisplayCategory[] = [
  { id: 'moments', label: 'Moments', emoji: '✨' },
  { id: 'adventures', label: 'Adventures', emoji: '🪐' },
  { id: 'people', label: 'People', emoji: '🌍' },
  { id: 'places', label: 'Places', emoji: '🌙' },
]

const previewMedia: MediaDoc[] = [
  editorial.portraitMale,
  editorial.cinematicSunset,
  editorial.portraitMoody,
  editorial.citySkyline,
  editorial.coupleGoldenLight,
  editorial.handsTouching,
].map((url, index) => ({
  id: `preview-${index}`,
  userId: 'preview',
  type: 'image',
  url,
  thumbnailUrl: url,
  category: previewCategories[index % previewCategories.length].id,
  caption: '',
  createdAt: 0,
  order: index,
  processingStatus: 'ready',
}))

export function MyProfile({ preview = false }: { preview?: boolean }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { onboarding, profileExtras, updateProfileExtras } = useApp()

  const [media, setMedia] = useState<MediaDoc[]>(preview ? previewMedia : [])
  const [editMode, setEditMode] = useState(false)
  const [activeCategory, setActiveCategory] = useState(onboarding.categories[0]?.id ?? 'moments')
  const [viewerCategory, setViewerCategory] = useState<string | null>(null)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadCategory, setUploadCategory] = useState(onboarding.categories[0]?.id ?? 'moments')
  // Orbit bubbles (around the profile photo) only ever hold videos; the
  // gallery's "Upload Media" button only ever adds photos. Tracking which
  // one opened the modal lets it show the right picker copy/accept type
  // instead of a generic "photos or videos" that doesn't match either.
  const [uploadMode, setUploadMode] = useState<'photo' | 'video'>('photo')
  const [uploadBusy, setUploadBusy] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [draft, setDraft] = useState<SelfProfile>(preview ? previewProfile : profileExtras)
  const [newInterest, setNewInterest] = useState('')
  const [savedPulse, setSavedPulse] = useState(false)
  const [mediaMode, setMediaMode] = useState<'photos' | 'videos'>('photos')
  const [gridViewerIndex, setGridViewerIndex] = useState<number | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [membership, setMembership] = useState<FoundingMemberRecord | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editMode && !preview) setDraft(profileExtras)
  }, [profileExtras, editMode, preview])

  useEffect(() => {
    if (!user || preview) return
    return subscribeUserMedia(user.uid, setMedia)
  }, [user, preview])

  useEffect(() => {
    if (!user || preview) return
    return subscribeFoundingMembership(user.uid, setMembership)
  }, [user, preview])

  const categories: DisplayCategory[] = preview ? previewCategories : onboarding.categories.map((c) => ({
    id: c.id,
    label: c.label,
    emoji: DEFAULT_MEDIA_CATEGORIES.find((d) => d.id === c.id)?.emoji ?? '✨',
  }))

  const displayItems = media.map(toDisplayItem)
  // The gallery only ever shows photos — videos live exclusively in the
  // orbit bubbles around the profile photo, not mixed into the grid.
  // Orbit bubbles only ever show videos — a category with only photos
  // renders as an empty/emoji bubble, since its content lives in the
  // gallery instead.
  const orbitCategories = preview ? previewCategories.map((category, index) => ({
    ...category,
    coverUrl: previewMedia[index]?.thumbnailUrl ?? null,
    count: 1,
  })) : categories.map((c) => {
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
      setUploadMode('video')
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
        if (uploadMode === 'photo') {
          if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            throw new Error(`"${file.name}" isn't a supported photo type.`)
          }
          await uploadImageMedia(user.uid, file, uploadCategory, order + i)
        } else {
          if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
            throw new Error(`"${file.name}" isn't a supported video type.`)
          }
          await uploadVideoMedia(user.uid, file, uploadCategory, order + i)
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

  const photoUrl = preview ? editorial.portraitMale : onboarding.profilePhotoThumbUrl || onboarding.profilePhotoUrl || null
  const storyPrompts = preview ? previewStoryPrompts : onboarding.storyPrompts
  const visibleMedia = displayItems.filter((item) => (
    mediaMode === 'photos' ? item.type === 'image' : item.type === 'video'
  ) && item.processingStatus !== 'error')

  return (
    <div className="profile-page-shell profile-page">
      {/* Top bar */}
      <div className="profile-topbar">
        <div className="profile-wordmark"><CelestialHeart className="h-8 w-8" /> <span>Perennia</span></div>
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
          <button
            aria-label="Open profile menu"
            aria-haspopup="dialog"
            onClick={() => setProfileMenuOpen(true)}
            className="profile-menu-button"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {editMode && (
            <Button size="sm" onClick={saveExtras}>
              <Check className="h-3.5 w-3.5" /> Save
            </Button>
          )}
        </div>
      </div>

      <div className="profile-hero-desktop">
        <ProfileOrbit
          photoUrl={photoUrl}
          name={(onboarding.name || (preview ? 'Martallus' : 'Your Name')).split(' ')[0]}
          age={calculateAge(onboarding.birthDate) ?? undefined}
          location={draft.location}
          verificationStatus={preview ? 'verified' : onboarding.verification.status}
          categories={orbitCategories}
          onCategorySelect={handleCategorySelect}
          onPhotoClick={() => photoInputRef.current?.click()}
          extraBadge={<FoundingMemberBadge />}
          editableHighlights
          compact
        />
        <div>
          <ProfileExperience
            astrology={{
              sunSign: onboarding.sunSign || (preview ? 'Pisces' : ''),
              moonSign: onboarding.moonSign || (preview ? 'Virgo' : ''),
              risingSign: onboarding.risingSign || (preview ? 'Taurus' : ''),
              chineseAnimal: onboarding.chineseAnimal || (preview ? 'Rat' : ''),
              chineseElement: onboarding.chineseElement || (preview ? 'Wood' : ''),
              yinYang: onboarding.yinYang || (preview ? 'Yang' : ''),
            }}
            isPremium={preview || membership?.tier === 'premium'}
            isOwnProfile
            about={draft.about}
            profession={draft.profession}
            education={draft.education}
            languages={draft.languages}
            interests={draft.interests}
            relationshipGoal={onboarding.relationshipGoal || (preview ? 'Long-term Relationship' : '')}
            onEdit={() => setEditMode(true)}
          />
        </div>
      </div>
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleReplacePhoto(e.target.files)} />
      {photoBusy && (
        <p className="mt-2 text-center text-xs text-white/40">
          <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> Uploading photo…
        </p>
      )}

      {!preview && onboarding.verification.status !== 'verified' && (
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

      <div className="hidden mx-auto mt-4 max-w-3xl text-center">
        <p className="font-serif-display text-lg tracking-wide text-champagne/90 sm:text-2xl">
          <span className="mr-2 text-gold">☾</span>
          {onboarding.sunSign || (preview ? 'Pisces' : 'Sun')} <span className="mx-2 text-white/35">•</span>
          {onboarding.moonSign ? `${onboarding.moonSign} Moon` : preview ? 'Virgo Moon' : 'Moon'} <span className="mx-2 text-white/35">•</span>
          {onboarding.risingSign ? `${onboarding.risingSign} Rising` : preview ? 'Taurus Rising' : 'Rising'}
        </p>

        {/* Looking For — the real relationship intention chosen during
            onboarding (RelationshipGoalsStep), not a separate free-text
            field, so this profile always reflects the real answer. */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/[0.06] px-3.5 py-1 text-xs text-champagne">
            <Heart className="h-3 w-3 text-gold" strokeWidth={1.75} />
            Looking for {onboarding.relationshipGoal || (preview ? 'Long-term Relationship / Marriage' : 'Not set yet')}
          </span>
          {editMode && !preview && (
            <button
              onClick={() => navigate('/relationship-goals')}
              className="text-[10px] uppercase tracking-widest text-white/40 hover:text-gold cursor-pointer"
            >
              Change
            </button>
          )}
        </div>

        {editMode ? (
          <textarea
            value={draft.about}
            onChange={(e) => setDraft((d) => ({ ...d, about: e.target.value }))}
            placeholder="Tell people who you are…"
            rows={3}
            className="mx-auto mt-4 w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center text-lg text-white/90 outline-none focus:border-gold/40"
          />
        ) : (
          <p className="mx-auto mt-3 max-w-2xl font-serif-display text-xl leading-snug text-white/75 sm:text-2xl">
            {draft.about || 'Add a few words that capture your spirit, your story, and the kind of connection you hope to find.'}
          </p>
        )}
      </div>

      {/* Reference-style Photos / Videos switch and compact 3-column grid. */}
      <section id="profile-media" className="profile-luxury-card profile-gallery scroll-mt-20">
        <div className="profile-gallery-header">
        <div className="profile-gallery-tabs" role="tablist" aria-label="Profile media">
          {(['photos', 'videos'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setMediaMode(mode)}
              role="tab"
              aria-selected={mediaMode === mode}
            >
              {mode}
            </button>
          ))}
        </div>
        {visibleMedia.length > 0 && <span className="pb-3 text-xs text-gold">View all ({visibleMedia.length}) →</span>}
        </div>

        {editMode && (
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={() => {
              setUploadCategory(activeCategory)
              setUploadMode(mediaMode === 'photos' ? 'photo' : 'video')
              setUploadOpen(true)
            }}>
              <Upload className="h-3.5 w-3.5" /> Upload {mediaMode === 'photos' ? 'Photos' : 'Videos'}
            </Button>
          </div>
        )}

        <div className="profile-gallery-grid">
          {visibleMedia.slice(0, 10).map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035 }}
              type="button"
              onClick={() => item.processingStatus !== 'processing' && setGridViewerIndex(index)}
              className="group"
            >
              {item.thumbnailUrl || item.url ? (
                <img src={item.thumbnailUrl || item.url} alt={item.caption || ''} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-white/25">
                  {item.type === 'video' ? <VideoIcon className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
                </span>
              )}
              <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full border border-white/25 bg-black/45 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
                {item.type === 'video' ? <Play className="h-3 w-3 fill-current" /> : <ImageIcon className="h-3 w-3" />}
              </span>
              {item.processingStatus === 'processing' && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/55"><Loader2 className="h-5 w-5 animate-spin text-gold" /></span>
              )}
            </motion.button>
          ))}
        </div>

        {visibleMedia.length === 0 && (
          <button
            type="button"
            onClick={() => {
              setUploadCategory(activeCategory)
              setUploadMode(mediaMode === 'photos' ? 'photo' : 'video')
              setUploadOpen(true)
            }}
            className="mt-4 flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-white/15 bg-white/[.025] text-white/35 transition hover:border-gold/35 hover:text-white/60"
          >
            {mediaMode === 'photos' ? <ImageIcon className="h-6 w-6" /> : <VideoIcon className="h-6 w-6" />}
            <span className="text-sm">Add {mediaMode}</span>
          </button>
        )}
      </section>

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
      {/* Four compact sections — everything here traces back to a real
          onboarding screen: Bio to Your Story's prompts, Interests to the
          Interests step, Lifestyle to profession/education/languages from
          About You, Travel to the favourite-places/dream-destinations
          fields also collected there. */}
      <div className={`${editMode ? 'grid' : 'hidden'} mt-10 grid-cols-1 gap-4 sm:grid-cols-2`}>
        <ProfileSection icon={Feather} title="Bio">
          {storyPrompts.length ? (
            <div className="flex flex-col gap-3">
              {storyPrompts.map((p) => (
                <div key={p.question}>
                  <p className="text-xs text-gold/70">{p.question}</p>
                  <p className="mt-0.5 text-sm text-white/80">{p.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint editMode={editMode} preview={preview} label="story" onClick={() => navigate('/your-story')} />
          )}
        </ProfileSection>

        <ProfileSection icon={Sparkles} title="Interests">
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
          ) : draft.interests.length ? (
            <div className="flex flex-wrap gap-2">
              {draft.interests.map((i) => <Badge key={i} variant="glass">{i}</Badge>)}
            </div>
          ) : (
            <EmptyHint editMode={editMode} preview={preview} label="interests" onClick={() => navigate('/interests')} />
          )}
        </ProfileSection>

        <ProfileSection icon={BriefcaseBusiness} title="Lifestyle">
          {editMode ? (
            <div className="flex flex-col gap-3">
              {(['profession', 'education'] as const).map((field) => (
                <div key={field}>
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">{field}</p>
                  <input
                    value={draft[field]}
                    onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40"
                  />
                </div>
              ))}
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">languages (comma-separated)</p>
                <input
                  value={draft.languages.join(', ')}
                  onChange={(e) => setDraft((d) => ({ ...d, languages: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40"
                />
              </div>
            </div>
          ) : draft.profession || draft.education || draft.languages.length ? (
            <div className="flex flex-col gap-2 text-sm text-white/80">
              {draft.profession && <p>{draft.profession}</p>}
              {draft.education && <p>{draft.education}</p>}
              {!!draft.languages.length && <p className="text-white/55">{draft.languages.join(', ')}</p>}
            </div>
          ) : (
            <EmptyHint editMode={editMode} preview={preview} label="lifestyle details" onClick={() => navigate('/about-you')} />
          )}
        </ProfileSection>

        <ProfileSection icon={MapPinned} title="Travel">
          {editMode ? (
            <div className="flex flex-col gap-3">
              {(['favoritePlaces', 'dreamDestinations'] as const).map((field) => (
                <div key={field}>
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">
                    {field === 'favoritePlaces' ? 'favourite places' : 'dream destinations'} (comma-separated)
                  </p>
                  <input
                    value={draft[field].join(', ')}
                    onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40"
                  />
                </div>
              ))}
            </div>
          ) : draft.favoritePlaces.length || draft.dreamDestinations.length ? (
            <div className="flex flex-col gap-2">
              {!!draft.favoritePlaces.length && (
                <div>
                  <p className="text-xs text-gold/70">Favourite Places</p>
                  <p className="mt-0.5 text-sm text-white/80">{draft.favoritePlaces.join(', ')}</p>
                </div>
              )}
              {!!draft.dreamDestinations.length && (
                <div>
                  <p className="text-xs text-gold/70">Dream Destinations</p>
                  <p className="mt-0.5 text-sm text-white/80">{draft.dreamDestinations.join(', ')}</p>
                </div>
              )}
            </div>
          ) : (
            <EmptyHint editMode={editMode} preview={preview} label="travel details" onClick={() => navigate('/about-you')} />
          )}
        </ProfileSection>
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
                accept={uploadMode === 'photo' ? 'image/*' : 'video/*'}
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
                <span className="text-sm">{uploadBusy ? 'Uploading…' : uploadMode === 'photo' ? 'Select photos' : 'Select videos'}</span>
                <span className="text-[10px] text-white/30">
                  {uploadMode === 'photo' ? 'JPG, PNG, WebP, HEIC' : 'MP4, MOV, WebM (max 15s)'}
                </span>
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

      {gridViewerIndex !== null && (
        <FullscreenMediaViewer
          items={visibleMedia}
          initialIndex={gridViewerIndex}
          onClose={() => setGridViewerIndex(null)}
          onDelete={handleDeleteDisplayItem}
        />
      )}

      <MyProfileActionsMenu
        open={profileMenuOpen}
        onClose={() => setProfileMenuOpen(false)}
        onEditProfile={() => setEditMode(true)}
        onManageMedia={() => {
          setEditMode(true)
          setMediaMode('photos')
          window.setTimeout(() => document.getElementById('profile-media')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
        }}
        onManageHighlights={() => {
          setEditMode(true)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    </div>
  )
}

function ProfileSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="mb-3 flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-gold/70">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {title}
      </p>
      {children}
    </div>
  )
}

function EmptyHint({ editMode, preview, label, onClick }: { editMode: boolean; preview: boolean; label: string; onClick: () => void }) {
  if (editMode && !preview) {
    return (
      <button onClick={onClick} className="text-sm italic text-white/35 hover:text-gold cursor-pointer">
        Add your {label} in onboarding →
      </button>
    )
  }
  return <p className="text-sm italic text-white/30">No {label} added yet.</p>
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
