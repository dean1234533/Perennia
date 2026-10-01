import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, MotionConfig, Reorder } from 'framer-motion'
import {
  Check, Upload, Trash2, Star, X, Plus, Shield, ShieldCheck,
  GripVertical, Loader2, ImageIcon, VideoIcon, Feather, MoreHorizontal, Play,
  Heart, BriefcaseBusiness, MapPinned, Pencil, Eye, Gift,
  LockKeyhole, ArrowRight, ChevronDown,
  Crown, type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfileOrbit } from '@/components/shared/ProfileOrbit'
import { CelestialHeart } from '@/components/shared/CelestialHeart'
import { FullscreenMediaViewer } from '@/components/shared/FullscreenMediaViewer'
import { MyProfileActionsMenu } from '@/components/shared/ProfileActionsMenu'
import { CircularCropper } from '@/components/shared/CircularCropper'
import { ProfileCosmicWheel } from '@/components/shared/ProfileCosmicWheel'
import { ProfileAstrologyIdentity } from '@/components/shared/ProfileAstrologyIdentity'
import { ProfileAboutFacts } from '@/components/shared/ProfileAboutFacts'
import { hasProfileAboutValues } from '@/data/profileAbout'
import { DESIGN_PREVIEW_PROFILE, DESIGN_PREVIEW_PROFILE_PHOTO_URL } from '@/data/designPreviewProfile'
import { AVAILABLE_INTERESTS, MAX_ONBOARDING_INTERESTS } from '@/data/interests'
import { DEFAULT_MEDIA_CATEGORIES } from '@/data/mediaCategories'
import { EDUCATION_OPTIONS, LANGUAGE_OPTIONS, LIFESTYLE_VIBE_DESCRIPTIONS, LIFESTYLE_VIBE_OPTIONS } from '@/data/onboardingOptions'
import { LIFESTYLE_CATEGORIES, MARITAL_BACKGROUND_OPTIONS } from '@/data/lifestyleOptions'
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
import { calculateAge } from '@/lib/age'
import { subscribeFoundingMembership } from '@/lib/founding500'
import type { FoundingMemberRecord } from '@/types/founding500'
import { useModalAccessibility } from '@/hooks/useModalAccessibility'

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

const previewMediaUrls = [
  DESIGN_PREVIEW_PROFILE_PHOTO_URL,
  '/perennia-landing-landscape-v2.webp',
  '/perennia-celestial-background.jpg',
  '/founding-500-background-v2.png',
  '/landingPage-Desktop1.JPG',
  '/landingPage-Mobile1.JPG',
  DESIGN_PREVIEW_PROFILE_PHOTO_URL,
  '/perennia-landing-landscape-v2.webp',
  '/perennia-celestial-background.jpg',
  '/founding-500-background-v2.png',
  '/landingPage-Desktop4.JPG',
]

const previewMedia: MediaDoc[] = previewMediaUrls.map((url, index) => ({
  id: `preview-${index}`,
  userId: 'preview',
  type: index < 6 ? 'image' : 'video',
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
  const { onboarding, profileExtras, updateOnboarding, updateProfileExtras, profileLoaded } = useApp()

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
  const [draft, setDraft] = useState<SelfProfile>(preview ? DESIGN_PREVIEW_PROFILE : profileExtras)
  const [heightDraft, setHeightDraft] = useState<number | null>(onboarding.heightCm)
  const [faithDraft, setFaithDraft] = useState(onboarding.religion)
  const [savedPulse, setSavedPulse] = useState(false)
  const [mediaMode, setMediaMode] = useState<'photos' | 'videos'>('photos')
  const [gridViewerIndex, setGridViewerIndex] = useState<number | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileMenuPanel, setProfileMenuPanel] = useState<'root' | 'safety'>('root')
  const [membership, setMembership] = useState<FoundingMemberRecord | null>(null)
  const [heroExpanded, setHeroExpanded] = useState(false)
  const [brandPanelOpen, setBrandPanelOpen] = useState(false)
  const [premiumPanel, setPremiumPanel] = useState<'viewers' | null>(null)
  const [openInfoSection, setOpenInfoSection] = useState<'bio' | 'interests' | 'lifestyle' | 'travel' | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const viewersDialogRef = useRef<HTMLDivElement>(null)
  const uploadDialogRef = useRef<HTMLDivElement>(null)

  const closeViewers = useCallback(() => setPremiumPanel(null), [])
  const closeUpload = useCallback(() => {
    if (!uploadBusy) setUploadOpen(false)
  }, [uploadBusy])

  useModalAccessibility({
    open: premiumPanel === 'viewers',
    dialogRef: viewersDialogRef,
    onClose: closeViewers,
  })
  useModalAccessibility({
    open: uploadOpen,
    dialogRef: uploadDialogRef,
    onClose: closeUpload,
  })

  useEffect(() => {
    if (!preview && !profileLoaded) return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [preview, profileLoaded])

  useEffect(() => {
    if (!editMode && !preview) setDraft(profileExtras)
  }, [profileExtras, editMode, preview])

  useEffect(() => {
    if (editMode) return
    setHeightDraft(onboarding.heightCm)
    setFaithDraft(onboarding.religion)
  }, [editMode, onboarding.heightCm, onboarding.religion])

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
    await Promise.all([
      updateProfileExtras(draft),
      updateOnboarding({ heightCm: heightDraft, religion: faithDraft.trim() }),
    ])
    setEditMode(false)
    setSavedPulse(true)
    setTimeout(() => setSavedPulse(false), 2000)
  }, [draft, faithDraft, heightDraft, updateOnboarding, updateProfileExtras])

  const photoUrl = preview ? DESIGN_PREVIEW_PROFILE_PHOTO_URL : onboarding.profilePhotoThumbUrl || onboarding.profilePhotoUrl || null
  const storyPrompts = preview ? previewStoryPrompts : onboarding.storyPrompts
  const visibleMedia = displayItems.filter((item) => (
    mediaMode === 'photos' ? item.type === 'image' : item.type === 'video'
  ) && item.processingStatus !== 'error')
  const photos = displayItems.filter((item) => item.type === 'image' && item.processingStatus !== 'error')
  const videos = displayItems.filter((item) => item.type === 'video' && item.processingStatus !== 'error')
  const firstName = (onboarding.name || (preview ? 'Sample Member' : 'Your Name')).split(' ')[0]
  const age = preview ? 42 : calculateAge(onboarding.birthDate)
  const isPremium = membership?.tier === 'premium'
  const location = draft.location || [onboarding.city, onboarding.country].filter(Boolean).join(', ')
  const relationshipGoal = onboarding.relationshipGoal || (preview ? 'Long-term relationship' : '')
  const sunSign = onboarding.sunSign || (preview ? 'Cancer' : '')
  const chineseAnimal = onboarding.chineseAnimal || (preview ? 'Dragon' : '')
  const supportedInterests = new Set<string>(AVAILABLE_INTERESTS)
  const displayedInterests = [...new Set(draft.interests.filter((interest) => supportedInterests.has(interest)))]
    .slice(0, MAX_ONBOARDING_INTERESTS)
  const selectedLifestyle = LIFESTYLE_VIBE_OPTIONS.find((option) => option === draft.lifestyleVibe)
  const lifestyleDescription = selectedLifestyle ? LIFESTYLE_VIBE_DESCRIPTIONS[selectedLifestyle] : ''
  const childrenOptions = LIFESTYLE_CATEGORIES.find((category) => category.label === 'Children')?.options ?? []
  const wantsChildrenOptions = LIFESTYLE_CATEGORIES.find((category) => category.label === 'Wants Children')?.options ?? []
  const hasAboutInformation = hasProfileAboutValues({
    education: draft.education,
    languages: draft.languages,
    profession: draft.profession,
    heightCm: onboarding.heightCm,
    childrenStatus: draft.children,
    wantsChildren: draft.wantsChildren,
    faithOrBeliefs: onboarding.religion,
    maritalBackground: draft.maritalBackground,
  })

  return (
    <MotionConfig reducedMotion="user">
      <div className="profile-page-shell profile-page profile-owner-page">
      <section
        className={`profile-cosmic-hero ${heroExpanded ? 'is-expanded' : ''}`}
        onClick={() => setHeroExpanded((value) => !value)}
      >
        <button
          type="button"
          className="sr-only"
          onClick={(event) => { event.stopPropagation(); setHeroExpanded((value) => !value) }}
          aria-expanded={heroExpanded}
        >
          {heroExpanded ? 'Collapse cosmic profile theme' : 'Expand cosmic profile theme'}
        </button>
        <div className="profile-topbar" onClick={(event) => event.stopPropagation()}>
          <div className="profile-brand-control">
            <button
              type="button"
              className="profile-wordmark"
              onClick={() => setBrandPanelOpen((value) => !value)}
              aria-expanded={brandPanelOpen}
            >
              <CelestialHeart className="h-8 w-8" /> <span>Perennia</span>
            </button>
            <AnimatePresence>
              {brandPanelOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="profile-brand-panel"
                >
                  <strong>Perennia</strong>
                  <span>For Love That Fits, Naturally.</span>
                  <p>Perennia combines Western and Chinese astrology with compatibility insights designed around meaningful, lasting relationships.</p>
                  <button type="button" onClick={() => navigate('/')}>About Perennia <ArrowRight /></button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {savedPulse && (
              <motion.span initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="profile-saved-pulse">
                Profile saved
              </motion.span>
            )}
          </AnimatePresence>
          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Open Safeguarding"
              onClick={() => navigate('/safeguarding')}
              className="profile-safety-button"
            >
              <Shield className="h-5 w-5" />
            </button>
            <button aria-label="Open profile menu" aria-haspopup="dialog" onClick={() => { setProfileMenuPanel('root'); setProfileMenuOpen(true) }} className="profile-menu-button">
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {editMode && (
              <Button size="sm" className="profile-save-button" onClick={saveExtras}><Check className="h-3.5 w-3.5" /> Save</Button>
            )}
          </div>
        </div>

        <div className="profile-hero-layout">
          <div className="profile-hero-orbit" onClick={(event) => event.stopPropagation()}>
            <ProfileOrbit
              photoUrl={photoUrl}
              name={firstName}
              age={age ?? undefined}
              location={location}
              verificationStatus={preview ? 'verified' : onboarding.verification.status}
              categories={orbitCategories}
              onCategorySelect={handleCategorySelect}
              onPhotoClick={() => photoInputRef.current?.click()}
              editableHighlights
              compact
              showIdentity={false}
            />
          </div>

          <div className="profile-hero-identity" onClick={(event) => event.stopPropagation()}>
            <h1>
              {firstName}{age !== null ? ` · ${age}` : ''}
            </h1>
            <div className="profile-status-badges" aria-label="Profile status">
              {(preview || membership) && <FoundingMemberBadge />}
              <VerificationBadge status={preview ? 'verified' : onboarding.verification.status} />
            </div>
            <div className="profile-identity-facts">
              {location && <p><MapPinned /> {location}</p>}
              {relationshipGoal && <p><Heart /> {relationshipGoal}</p>}
            </div>
            <div className="profile-identity-footer">
              <div className="profile-public-astrology" aria-label="Public astrology">
                {sunSign && <ProfileAstrologyIdentity kind="western" value={sunSign} label="Western Sign" />}
                {chineseAnimal && <ProfileAstrologyIdentity kind="chinese" value={chineseAnimal} label="Chinese Animal" />}
              </div>
              <button type="button" className="profile-edit-link" onClick={() => setEditMode(true)}>
                <Pencil /> Edit Profile
              </button>
            </div>
          </div>
        </div>
      </section>

      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleReplacePhoto(e.target.files)} />
      <div className="profile-neutral-surface">
        <div className="profile-neutral-content">
          {photoBusy && <p className="profile-upload-status"><Loader2 /> Uploading photo…</p>}

          {!preview && onboarding.verification.status !== 'verified' && (
            <button type="button" onClick={() => navigate('/verify')} className="profile-verification-action">
              <ShieldCheck /> {onboarding.verification.status === 'pending' ? 'Verification in review' : 'Complete identity verification'}
            </button>
          )}

          <section className={`profile-premium-strip ${isPremium ? 'is-member' : ''}`} aria-label="Premium features">
            <div className="profile-premium-title"><Crown /><span>Premium<br />Features</span></div>
            <button type="button" onClick={() => navigate('/settings#privacy')}><LockKeyhole /><span><strong>Private Mode</strong><small>Your profile visibility</small></span></button>
            <button type="button" aria-haspopup="dialog" onClick={() => isPremium ? setPremiumPanel('viewers') : navigate('/founding-500')}><Eye /><span><strong>Viewers</strong><small>See who viewed you</small></span></button>
            <button type="button" onClick={() => navigate(isPremium ? '/discovery' : '/founding-500')}><Gift /><span><strong>Gift to Me</strong><small>Surprise me</small></span></button>
            {!isPremium && <button type="button" className="profile-premium-cta" onClick={() => navigate('/founding-500')}><span>Discover<br />Premium</span><ArrowRight /></button>}
          </section>

          <div className="profile-content-grid">
            <button type="button" className="profile-cosmic-card" onClick={() => navigate('/cosmic-profile')}>
              <span><strong>My Cosmic Profile</strong><small>Explore your full astrological blueprint</small><em>View Cosmic Profile <ArrowRight /></em></span>
              <ProfileCosmicWheel />
            </button>

            <section id="profile-media" className="profile-media-card scroll-mt-20">
              <ProfileMediaRow
                title="Photos"
                items={photos}
                type="photos"
                onAdd={() => { setUploadMode('photo'); setUploadCategory(activeCategory); setUploadOpen(true) }}
                onOpen={(index) => { setMediaMode('photos'); setGridViewerIndex(index) }}
              />
              <ProfileMediaRow
                title="Videos"
                items={videos}
                type="videos"
                onAdd={() => { setUploadMode('video'); setUploadCategory(activeCategory); setUploadOpen(true) }}
                onOpen={(index) => { setMediaMode('videos'); setGridViewerIndex(index) }}
              />
            </section>
          </div>

          <div className="profile-detail-grid">
            <section className="profile-neutral-card profile-neutral-card--wide">
              <h2 className="profile-neutral-heading">About Me</h2>
              <div className="profile-about-content profile-about-content--facts-only">
                {editMode ? (
                  <div className="profile-about-edit-fields">
                    <label>
                      <span>Education</span>
                      <select value={draft.education} onChange={(event) => setDraft((current) => ({ ...current, education: event.target.value }))}>
                        <option value="">Not specified</option>
                        {EDUCATION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Languages</span>
                      <input
                        value={draft.languages.join(', ')}
                        onChange={(event) => setDraft((current) => ({ ...current, languages: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) }))}
                        placeholder="English, French"
                        list="profile-language-options"
                      />
                    </label>
                    <label>
                      <span>Job title</span>
                      <input value={draft.profession} onChange={(event) => setDraft((current) => ({ ...current, profession: event.target.value }))} />
                    </label>
                    <label>
                      <span>Height (cm)</span>
                      <input type="number" min="100" max="250" inputMode="numeric" value={heightDraft ?? ''} onChange={(event) => setHeightDraft(event.target.value ? Number(event.target.value) : null)} />
                    </label>
                    <label>
                      <span>Children</span>
                      <select value={draft.children} onChange={(event) => setDraft((current) => ({ ...current, children: event.target.value }))}>
                        <option value="">Not specified</option>
                        {childrenOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Wants children</span>
                      <select value={draft.wantsChildren} onChange={(event) => setDraft((current) => ({ ...current, wantsChildren: event.target.value }))}>
                        <option value="">Not specified</option>
                        {wantsChildrenOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Faith or beliefs</span>
                      <input value={faithDraft} onChange={(event) => setFaithDraft(event.target.value)} placeholder="Optional" />
                    </label>
                    <label>
                      <span>Marital background</span>
                      <select value={draft.maritalBackground} onChange={(event) => setDraft((current) => ({ ...current, maritalBackground: event.target.value }))}>
                        <option value="">Not specified</option>
                        {MARITAL_BACKGROUND_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <datalist id="profile-language-options">
                      {LANGUAGE_OPTIONS.map((option) => <option key={option} value={option} />)}
                    </datalist>
                  </div>
                ) : hasAboutInformation ? (
                  <ProfileAboutFacts
                    education={draft.education}
                    languages={draft.languages}
                    profession={draft.profession}
                    heightCm={onboarding.heightCm}
                    childrenStatus={draft.children}
                    wantsChildren={draft.wantsChildren}
                    faithOrBeliefs={onboarding.religion}
                    maritalBackground={draft.maritalBackground}
                  />
                ) : (
                  <p className="profile-about-empty">Add optional profile details through Edit Profile.</p>
                )}
              </div>
            </section>
          </div>

      {/* Manage media (edit mode) */}
      <AnimatePresence>
        {editMode && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="profile-edit-content mt-10 overflow-hidden">
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

      {/* Four compact sections — everything here traces back to a real
          onboarding screen: Bio to Your Story's prompts, Interests to the
          Interests step, Lifestyle to its saved profile fields, and Travel
          to the favourite-places/dream-destinations fields. */}
      <div className="profile-edit-content mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ProfileSection icon={Feather} title="Bio" open={preview || editMode || openInfoSection === 'bio'} collapsible={!editMode} onToggle={() => setOpenInfoSection((current) => current === 'bio' ? null : 'bio')}>
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

        <ProfileSection icon={Heart} title="Interests" open={preview || editMode || openInfoSection === 'interests'} collapsible={!editMode} onToggle={() => setOpenInfoSection((current) => current === 'interests' ? null : 'interests')}>
          {displayedInterests.length ? (
            <div className="flex flex-wrap gap-2">
              {displayedInterests.map((interest) => <Badge key={interest} variant="glass">{interest}</Badge>)}
            </div>
          ) : (
            <EmptyHint editMode={editMode} preview={preview} label="interests" onClick={() => navigate('/interests')} />
          )}
        </ProfileSection>

        <ProfileSection icon={BriefcaseBusiness} title="Lifestyle" open={preview || editMode || openInfoSection === 'lifestyle'} collapsible={!editMode} onToggle={() => setOpenInfoSection((current) => current === 'lifestyle' ? null : 'lifestyle')}>
          {selectedLifestyle ? (
            <div>
              <Badge variant="glass">{selectedLifestyle}</Badge>
              {lifestyleDescription && <p className="mt-2 text-sm text-white/65">{lifestyleDescription}</p>}
              {draft.openToNewThings && (
                <div className="mt-3">
                  <Badge variant="glass">Open to New Things</Badge>
                </div>
              )}
            </div>
          ) : (
            <EmptyHint editMode={editMode} preview={preview} label="lifestyle" onClick={() => navigate('/interests')} />
          )}
        </ProfileSection>

        <ProfileSection icon={MapPinned} title="Travel" open={preview || editMode || openInfoSection === 'travel'} collapsible={!editMode} onToggle={() => setOpenInfoSection((current) => current === 'travel' ? null : 'travel')}>
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
        </div>
      </div>

      <AnimatePresence>
        {premiumPanel === 'viewers' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
            onClick={(event) => event.target === event.currentTarget && closeViewers()}
          >
            <motion.div
              ref={viewersDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-viewers-title"
              data-modal-surface
              tabIndex={-1}
              initial={{ scale: .95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-strong w-full max-w-sm rounded-2xl p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 id="profile-viewers-title" className="font-serif-display text-xl text-champagne">Profile Viewers</h3>
                <button type="button" data-modal-initial-focus onClick={closeViewers} aria-label="Close profile viewers" className="cursor-pointer text-white/45 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[.025] px-6 py-9 text-center">
                <Eye className="h-7 w-7 text-blue-200/70" strokeWidth={1.6} />
                <p className="mt-3 text-sm text-white/80">No viewer activity to show yet</p>
                <p className="mt-1 text-xs leading-relaxed text-white/45">Profile viewer activity will appear here when it becomes available.</p>
              </div>
              <Button variant="glass" className="mt-4 w-full" onClick={closeViewers}>Done</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload modal */}
      <AnimatePresence>
        {uploadOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && closeUpload()}
          >
            <motion.div
              ref={uploadDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-upload-title"
              aria-busy={uploadBusy}
              data-modal-surface
              tabIndex={-1}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-strong w-full max-w-md rounded-2xl p-6"
            >
              <h3 id="profile-upload-title" className="font-serif-display mb-4 text-xl text-champagne">Upload Media</h3>
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
                type="button"
                data-modal-initial-focus
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
              <Button variant="glass" className="mt-4 w-full" onClick={closeUpload} disabled={uploadBusy}>
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
        initialPanel={profileMenuPanel}
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
    </MotionConfig>
  )
}

function FoundingMemberBadge() {
  return <span className="profile-founding-member-badge"><Crown /> Founding Member</span>
}

function VerificationBadge({ status }: { status: 'unverified' | 'pending' | 'verified' | 'failed' }) {
  const verified = status === 'verified'
  return (
    <span className={`profile-verification-badge ${verified ? 'is-verified' : 'is-pending'}`}>
      {verified ? <ShieldCheck /> : <Shield />} {verified ? 'Verified' : 'Pending verification'}
    </span>
  )
}

function ProfileMediaRow({
  title,
  items,
  type,
  onAdd,
  onOpen,
}: {
  title: string
  items: DisplayMediaItem[]
  type: 'photos' | 'videos'
  onAdd: () => void
  onOpen: (index: number) => void
}) {
  return (
    <div className="profile-media-row">
      <div className="profile-media-heading">
        <h2>{title}</h2>
        <button type="button" onClick={onAdd} aria-label={`Add ${type === 'photos' ? 'a photo' : 'a video'}`}><Plus /> Add</button>
      </div>
      <div className="profile-media-scroller">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="profile-media-thumbnail"
            onClick={() => item.processingStatus !== 'processing' && onOpen(index)}
            aria-label={item.caption || `Open ${type === 'photos' ? 'photo' : 'video'}`}
          >
            {item.thumbnailUrl || item.url ? <img src={item.thumbnailUrl || item.url} alt={item.caption || ''} /> : <ImageIcon />}
            {type === 'videos' && <span className="profile-video-play"><Play /></span>}
            {item.processingStatus === 'processing' && <span className="profile-media-processing"><Loader2 /></span>}
          </button>
        ))}
        {!items.length && (
          <button type="button" className="profile-media-empty" onClick={onAdd}>
            {type === 'photos' ? <ImageIcon /> : <VideoIcon />} Add your first {type === 'photos' ? 'photo' : 'video'}
          </button>
        )}
      </div>
    </div>
  )
}

function ProfileSection({ icon: Icon, title, open, collapsible, onToggle, children }: { icon: LucideIcon; title: string; open: boolean; collapsible: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      {collapsible ? (
        <button type="button" onClick={onToggle} aria-expanded={open} className={`flex w-full items-center justify-between gap-3 text-left ${open ? 'mb-3' : ''}`}>
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-gold/70">
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {title}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <p className="mb-3 flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-gold/70">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {title}
        </p>
      )}
      {open && children}
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
