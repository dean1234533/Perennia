import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Loader2, MoreHorizontal, MapPin, Briefcase, GraduationCap, Sparkles, X } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProfileOrbit } from '@/components/shared/ProfileOrbit'
import { ProfileExperience } from '@/components/shared/ProfileExperience'
import { CelestialHeart } from '@/components/shared/CelestialHeart'
import { MasonryGallery } from '@/components/shared/MasonryGallery'
import { FullscreenMediaViewer } from '@/components/shared/FullscreenMediaViewer'
import { CompatibilitySnapshot } from '@/components/shared/CompatibilitySnapshot'
import { ProfileDetailSections } from '@/components/shared/ProfileDetailSections'
import { OtherProfileActionsMenu } from '@/components/shared/ProfileActionsMenu'
import { toDisplayItem } from '@/lib/media/toDisplayItem'
import { getUserDoc, subscribeUserMedia, getPrivateLifestyle, type DiscoveryCandidate, type MediaDoc, type PrivateLifestyle } from '@/lib/firestore'
import { emptySelfProfile } from '@/data/selfProfile'
import { getCompatibility, type CompatibilityResult, type PersonBirthProfile } from '@/lib/compatibilityApi'
import { calculateAge } from '@/lib/age'
import { DEFAULT_MEDIA_CATEGORIES } from '@/data/mediaCategories'
import type { DisplayCategory } from '@/types/media'

export function ProfileDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { likeProfile, passProfile, blockProfile, matchedIds, profileExtras, onboarding } = useApp()
  const { user } = useAuth()
  const [profile, setProfile] = useState<DiscoveryCandidate | null | undefined>(undefined)
  const [media, setMedia] = useState<MediaDoc[]>([])
  const [result, setResult] = useState<CompatibilityResult | null>(null)
  const [liked, setLiked] = useState(false)
  const [videoViewerCategory, setVideoViewerCategory] = useState<string | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [mediaMode, setMediaMode] = useState<'photos' | 'videos'>('photos')
  const [gridViewerIndex, setGridViewerIndex] = useState<number | null>(null)
  // A successful read here already means access was allowed (public, or a
  // real match — see firestore.rules) — a denied/missing read is treated
  // identically to "nothing set," never surfaced as an error.
  const [lifestyle, setLifestyle] = useState<PrivateLifestyle | null>(null)
  const [selfLifestyle, setSelfLifestyle] = useState<PrivateLifestyle | null>(null)

  useEffect(() => {
    if (!id) return
    // Normalized against real defaults before it ever reaches render — a
    // profile viewed here belongs to someone else's account, which can
    // easily predate a SelfProfile/UserDoc array field added later (real
    // accounts don't retroactively grow new Firestore fields). Every
    // `.length` read below assumes these arrays exist; this is what
    // makes that assumption actually true instead of a real accounts
    // white-screening the viewer.
    getUserDoc(id).then((doc) => setProfile(doc ? {
      uid: id,
      ...doc,
      storyPrompts: doc.storyPrompts ?? [],
      profileExtras: doc.profileExtras ? { ...emptySelfProfile, ...doc.profileExtras } : null,
    } : null))
    getPrivateLifestyle(id).then(setLifestyle)
    return subscribeUserMedia(id, setMedia)
  }, [id])

  // The profile replaces a centered loading state after its member data
  // arrives. Reset at that point as well as on the route change so browser
  // scroll anchoring cannot leave the portrait above the visible viewport.
  useEffect(() => {
    if (!profile?.uid) return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [profile?.uid])

  useEffect(() => {
    if (!user) return
    getPrivateLifestyle(user.uid).then(setSelfLifestyle)
  }, [user])

  const selfChartComplete = Boolean(
    onboarding.sunSign && onboarding.moonSign && onboarding.risingSign &&
    onboarding.chineseAnimal && onboarding.chineseElement && onboarding.yinYang
  )
  const otherChartComplete = Boolean(
    profile?.sunSign && profile.moonSign && profile.risingSign &&
    profile.chineseAnimal && profile.chineseElement && profile.yinYang
  )

  useEffect(() => {
    // getCompatibility rejects (400) an incomplete birth chart — only call
    // it once both sides genuinely have one, real for any member who
    // hasn't finished their own birth details yet.
    if (!profile || !selfChartComplete || !otherChartComplete) return
    const personA: PersonBirthProfile = {
      sunSign: onboarding.sunSign,
      moonSign: onboarding.moonSign,
      risingSign: onboarding.risingSign,
      chineseAnimal: onboarding.chineseAnimal,
      chineseElement: onboarding.chineseElement,
      yinYang: onboarding.yinYang,
    }
    getCompatibility({
      personA,
      personB: {
        sunSign: profile.sunSign,
        moonSign: profile.moonSign,
        risingSign: profile.risingSign,
        chineseAnimal: profile.chineseAnimal,
        chineseElement: profile.chineseElement,
        yinYang: profile.yinYang,
      },
    })
      .then(setResult)
      .catch((err) => console.warn('[Perennia] Failed to load compatibility:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid, selfChartComplete, otherChartComplete])

  if (profile === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-serif-display text-2xl text-champagne">Profile not found</p>
        <Button onClick={() => navigate('/discovery')}>Back to Discovery</Button>
      </div>
    )
  }

  const displayItems = media.map(toDisplayItem)
  const galleryImages = displayItems.filter((i) => i.type === 'image')
  const visibleGalleryMedia = displayItems.filter((item) => item.type === (mediaMode === 'photos' ? 'image' : 'video') && item.processingStatus === 'ready')

  const categories: DisplayCategory[] = (profile.categories?.length ? profile.categories : DEFAULT_MEDIA_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))).map((c) => ({
    id: c.id,
    label: c.label,
    emoji: DEFAULT_MEDIA_CATEGORIES.find((d) => d.id === c.id)?.emoji ?? '✨',
  }))

  const orbitCategories = categories.map((c) => {
    const videos = media.filter((m) => m.category === c.id && m.type === 'video' && m.processingStatus === 'ready')
    return {
      id: c.id,
      label: c.label,
      emoji: c.emoji,
      coverUrl: videos[0]?.video?.poster || videos[0]?.thumbnailUrl || null,
      count: videos.length,
    }
  })

  const handleOrbitSelect = (categoryId: string) => {
    if (media.some((m) => m.category === categoryId && m.type === 'video' && m.processingStatus === 'ready')) {
      setVideoViewerCategory(categoryId)
    }
  }

  const isMatched = matchedIds.includes(profile.uid)
  const extras = profile.profileExtras

  const handleLike = () => {
    setLiked(true)
    likeProfile(profile.uid).then((matchId) => {
      setTimeout(() => {
        if (matchId) navigate(`/match/${matchId}`, { state: { otherUid: profile.uid, compatibility: result?.compatibility ?? null } })
        else navigate('/discovery')
      }, matchId ? 600 : 900)
    })
  }

  const handlePass = () => {
    passProfile(profile.uid)
    navigate('/discovery')
  }

  return (
    <div className="profile-page-shell profile-page">
      <div className="profile-topbar">
        <div className="profile-wordmark"><CelestialHeart className="h-8 w-8" /> <span>Perennia</span></div>
        <button
          aria-label="Open profile options"
          aria-haspopup="dialog"
          onClick={() => setProfileMenuOpen(true)}
          className="profile-menu-button"
        ><MoreHorizontal className="h-5 w-5" /></button>
      </div>

      <div className="profile-layout">
        <ProfileOrbit
          photoUrl={profile.profilePhotoUrl || null}
          name={profile.name.split(' ')[0]}
          age={calculateAge(profile.birthDate) ?? undefined}
          location={extras?.location && profile.showDistance ? extras.location : undefined}
          verificationStatus={profile.verification?.status ?? 'unverified'}
          categories={orbitCategories}
          onCategorySelect={handleOrbitSelect}
          compatibility={result?.compatibility}
          profileLayout
          compact
        />
        <ProfileExperience
          astrology={{
            sunSign: profile.sunSign,
            chineseAnimal: profile.chineseAnimal,
          }}
          isPremium={false}
          isOwnProfile={false}
          about={extras?.about}
          profession={extras?.profession}
          education={extras?.education}
          languages={extras?.languages}
          interests={extras?.interests}
          relationshipGoal={profile.relationshipGoal}
          cosmicProfilePath={null}
          messageAction={isMatched && user ? (
            <button className="profile-action-pill" onClick={() => navigate(`/messages/${[user.uid, profile.uid].sort().join('_')}`)}>
              <MessageCircle className="h-4 w-4" /> Message
            </button>
          ) : null}
          likeAction={(
            <button className="profile-action-pill" onClick={handleLike}>
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> Like
            </button>
          )}
        />
      </div>

      {(galleryImages.length > 0 || displayItems.some((item) => item.type === 'video')) && (
        <section className="profile-luxury-card profile-gallery">
          <div className="profile-gallery-header">
            <div className="profile-gallery-tabs" role="tablist" aria-label="Profile media">
              <button role="tab" aria-selected={mediaMode === 'photos'} onClick={() => setMediaMode('photos')}>Photos</button>
              <button role="tab" aria-selected={mediaMode === 'videos'} onClick={() => setMediaMode('videos')}>Videos</button>
            </div>
            <span className="pb-3 text-xs text-gold">View all ({visibleGalleryMedia.length}) →</span>
          </div>
          <div className="profile-gallery-grid">
            {visibleGalleryMedia.slice(0, 10).map((item, index) => (
              <button key={item.id} onClick={() => setGridViewerIndex(index)} aria-label={item.caption || `View ${profile.name.split(' ')[0]}'s ${mediaMode === 'photos' ? 'photo' : 'video'}`}>
                <img src={item.thumbnailUrl || item.url} alt={item.caption || ''} loading="lazy" />
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="hidden mx-auto max-w-4xl px-6 md:px-0">
        <ProfileOrbit
          photoUrl={profile.profilePhotoUrl || null}
          name={profile.name}
          age={calculateAge(profile.birthDate) ?? undefined}
          verificationStatus={profile.verification?.status ?? 'unverified'}
          categories={orbitCategories}
          onCategorySelect={handleOrbitSelect}
          compatibility={result?.compatibility}
        />

        {((extras?.location && profile.showDistance) || extras?.profession || extras?.education) && (
          <div className="mb-8 mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-white/60">
            {extras?.location && profile.showDistance && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {extras.location}</span>}
            {extras?.profession && <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {extras.profession}</span>}
            {extras?.education && <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> {extras.education}</span>}
          </div>
        )}

        {/* Compatibility snapshot */}
        <div className="mb-8">
          {!selfChartComplete ? (
            <div className="glass flex flex-col items-center gap-3 rounded-[1.75rem] px-8 py-10 text-center">
              <Sparkles className="h-6 w-6 text-gold/60" />
              <p className="text-sm text-white/60">Complete your cosmic profile to see real compatibility here.</p>
              <Button size="sm" onClick={() => navigate('/birth-details')}>Add Birth Details</Button>
            </div>
          ) : !otherChartComplete ? (
            <div className="glass flex flex-col items-center gap-3 rounded-[1.75rem] px-8 py-10 text-center">
              <Sparkles className="h-6 w-6 text-gold/60" />
              <p className="text-sm text-white/60">{profile.name.split(' ')[0]} hasn't finished their cosmic profile yet.</p>
            </div>
          ) : !result ? (
            <div className="glass flex items-center justify-center rounded-[1.75rem] px-8 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
            </div>
          ) : (
            <CompatibilitySnapshot
              profile={profile}
              self={profileExtras}
              otherLifestyle={lifestyle?.items ?? []}
              selfLifestyle={selfLifestyle?.items ?? []}
              compatibility={result.compatibility}
              compatibilityLabel={result.band}
            />
          )}
        </div>

        {/* Bio */}
        {extras?.about && (
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/70">About {profile.name.split(' ')[0]}</p>
            <p className="font-serif-display text-2xl leading-snug text-white/90 md:text-3xl">{extras.about}</p>
          </motion.div>
        )}

        {/* Interests */}
        {!!extras?.interests.length && (
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold/70">Interests</p>
            <div className="flex flex-wrap gap-2">
              {extras.interests.map((interest) => (
                <Badge key={interest} variant="glass">{interest}</Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Relationship goal + intentions */}
        {(profile.relationshipGoal || extras?.goals) && (
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/70">Looking For</p>
            {profile.relationshipGoal && (
              <Badge variant="gold" className="mb-3">{profile.relationshipGoal}</Badge>
            )}
            {extras?.goals && <p className="max-w-2xl text-xl leading-relaxed text-white/70">{extras.goals}</p>}
          </motion.div>
        )}

        {/* Story prompts */}
        {profile.storyPrompts.length > 0 && profile.storyPrompts.map((prompt, i) => (
          <motion.div key={prompt.question} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="mb-8">
            <p className="mb-3 text-xs uppercase tracking-widest text-gold/70">{prompt.question}</p>
            <p className="font-serif-display text-3xl italic leading-snug text-white/95 md:text-4xl">"{prompt.answer}"</p>
          </motion.div>
        ))}

        {/* Lifestyle — a successful read already means visibility allowed it
            (public, or a real match); private/unmatched reads come back
            null from getPrivateLifestyle and simply render nothing. */}
        {!!lifestyle?.items.length && (
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold/70">Lifestyle</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {lifestyle.items.map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] uppercase tracking-widest text-white/40">{item.label}</p>
                  <p className="text-sm text-white/80">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <p className="mb-1 text-xs uppercase tracking-[0.25em] text-gold/70">Moments</p>
            <h2 className="font-serif-display mb-5 text-2xl text-champagne">Exploring {profile.name.split(' ')[0]}'s World</h2>
            <MasonryGallery items={galleryImages} categories={categories} />
          </motion.div>
        )}

        {/* Premium detail sections */}
        {(!!extras?.values.length || !!extras?.music.length || !!extras?.languages.length) && (
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <p className="mb-1 text-xs uppercase tracking-[0.25em] text-gold/70">More About {profile.name.split(' ')[0]}</p>
            {!!extras?.values.length && (
              <div className="mb-5 flex flex-wrap gap-2">
                {extras.values.map((value) => (
                  <Badge key={value} variant="gold">{value}</Badge>
                ))}
              </div>
            )}
            <ProfileDetailSections
              music={extras?.music ?? []}
              languages={extras?.languages ?? []}
              favoritePlaces={extras?.favoritePlaces ?? []}
              dreamDestinations={extras?.dreamDestinations ?? []}
              fitness={extras?.fitness ?? ''}
              books={extras?.books ?? ''}
              movies={extras?.movies ?? ''}
            />
          </motion.div>
        )}

        <Button variant="link" onClick={() => navigate(`/compatibility/${profile.uid}`)} className="mx-auto flex text-sm">
          <Sparkles className="h-3.5 w-3.5" /> View Full Compatibility Report →
        </Button>
      </div>

      {/* Floating action buttons */}
      <div className="hidden fixed bottom-24 left-1/2 z-30 -translate-x-1/2 items-center gap-4 lg:bottom-8">
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.08 }}
          onClick={handlePass}
          className="glass-strong flex h-14 w-14 items-center justify-center rounded-full text-white/60 shadow-xl cursor-pointer hover:text-white"
        >
          <X className="h-6 w-6" />
        </motion.button>
        {isMatched && user && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => navigate(`/messages/${[user.uid, profile.uid].sort().join('_')}`)}
            className="glass-strong flex h-14 w-14 items-center justify-center rounded-full text-champagne shadow-xl cursor-pointer hover:text-white"
          >
            <MessageCircle className="h-5 w-5" />
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.08 }}
          animate={liked ? { scale: [1, 1.3, 1] } : {}}
          onClick={handleLike}
          className="glow-gold flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-champagne to-gold text-midnight shadow-xl cursor-pointer"
        >
          <Heart className={`h-7 w-7 ${liked ? 'fill-midnight' : ''}`} />
        </motion.button>
      </div>

      {videoViewerCategory && (
        <FullscreenMediaViewer
          items={displayItems.filter((i) => i.category === videoViewerCategory && i.type === 'video' && i.processingStatus === 'ready')}
          initialIndex={0}
          onClose={() => setVideoViewerCategory(null)}
        />
      )}

      {gridViewerIndex !== null && (
        <FullscreenMediaViewer items={visibleGalleryMedia} initialIndex={gridViewerIndex} onClose={() => setGridViewerIndex(null)} />
      )}

      <OtherProfileActionsMenu
        open={profileMenuOpen}
        onClose={() => setProfileMenuOpen(false)}
        profileName={profile.name}
        profileId={profile.uid}
        onBlock={() => {
          blockProfile(profile.uid)
          navigate('/discovery')
        }}
        onMute={() => {
          passProfile(profile.uid)
          navigate('/discovery')
        }}
      />
    </div>
  )
}
