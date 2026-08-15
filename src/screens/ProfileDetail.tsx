import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronUp, Heart, MessageCircle, Loader2, MoreHorizontal, MapPin, Briefcase, GraduationCap, Play, Sparkles, UserPlus, UserCheck, X, Crown, ShieldCheck, Shield } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProfileOrbit } from '@/components/shared/ProfileOrbit'
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
import type { DisplayCategory, DisplayMediaItem } from '@/types/media'
import { subscribeFriendState, sendFriendRequest, respondToFriendRequest, unfriend, type FriendState } from '@/lib/friendsApi'
import { reportProfileRemote } from '@/lib/privacyApi'
import { getPublicFoundingStatus } from '@/lib/founding500'

export function ProfileDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { likeProfile, passProfile, blockProfile, muteProfile, matchedIds, profileExtras, onboarding } = useApp()
  const { user } = useAuth()
  const [profile, setProfile] = useState<DiscoveryCandidate | null | undefined>(undefined)
  const [media, setMedia] = useState<MediaDoc[]>([])
  const [result, setResult] = useState<CompatibilityResult | null>(null)
  const [liked, setLiked] = useState(false)
  const [videoViewerCategory, setVideoViewerCategory] = useState<string | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [mediaMode, setMediaMode] = useState<'photos' | 'videos'>('photos')
  const [gridViewerIndex, setGridViewerIndex] = useState<number | null>(null)
  const [friendState, setFriendState] = useState<FriendState>('none')
  const [heroExpanded, setHeroExpanded] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(true)
  const [interestsOpen, setInterestsOpen] = useState(true)
  const [isFoundingMember, setIsFoundingMember] = useState(false)
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

  useEffect(() => {
    if (!user || !id) return
    return subscribeFriendState(user.uid, id, setFriendState)
  }, [user, id])

  useEffect(() => {
    if (!id || !user) return
    getPublicFoundingStatus(id).then(setIsFoundingMember).catch(() => setIsFoundingMember(false))
  }, [id, user])

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
  const profilePhotos = displayItems.filter((item) => item.type === 'image' && item.processingStatus === 'ready')
  const profileVideos = displayItems.filter((item) => item.type === 'video' && item.processingStatus === 'ready')

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
    likeProfile(profile.uid).then(({ matchId, conversationId }) => {
      setTimeout(() => {
        if (matchId) navigate(`/match/${matchId}`, { state: { otherUid: profile.uid, compatibility: result?.compatibility ?? null } })
        else if (conversationId) navigate(`/messages/${conversationId}`, { state: { otherUid: profile.uid } })
        else navigate('/discovery')
      }, matchId ? 600 : 900)
    })
  }

  const handlePass = () => {
    passProfile(profile.uid)
    navigate('/discovery')
  }

  const handleFriendAction = async () => {
    if (friendState === 'none') await sendFriendRequest(profile.uid)
    else if (friendState === 'incoming') await respondToFriendRequest(profile.uid, true)
    else if (friendState === 'friends') await unfriend(profile.uid)
  }

  const friendLabel = friendState === 'incoming' ? 'Accept Friend' : friendState === 'outgoing' ? 'Request Sent' : friendState === 'friends' ? 'Friends' : 'Add Friend'

  return (
    <div className="profile-page-shell profile-page profile-owner-page profile-visitor-page">
      <section className={`profile-cosmic-hero ${heroExpanded ? 'is-expanded' : ''}`} onClick={() => setHeroExpanded((value) => !value)}>
        <div className="profile-topbar" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="profile-wordmark" onClick={() => navigate('/')}><CelestialHeart className="h-8 w-8" /> <span>Perennia</span></button>
          <button aria-label="Open profile options" aria-haspopup="dialog" onClick={() => setProfileMenuOpen(true)} className="profile-menu-button"><MoreHorizontal className="h-5 w-5" /></button>
        </div>
        <div className="profile-hero-layout">
          <div className="profile-hero-orbit" onClick={(event) => event.stopPropagation()}>
            <ProfileOrbit
              photoUrl={profile.profilePhotoUrl || null}
              name={profile.name.split(' ')[0]}
              age={calculateAge(profile.birthDate) ?? undefined}
              verificationStatus={profile.verification?.status ?? 'unverified'}
              categories={orbitCategories}
              onCategorySelect={handleOrbitSelect}
              compatibility={result?.compatibility}
              compact
              showIdentity={false}
            />
          </div>
          <div className="profile-hero-identity" onClick={(event) => event.stopPropagation()}>
            <h1>{profile.name.split(' ')[0]}{calculateAge(profile.birthDate) !== null ? ` · ${calculateAge(profile.birthDate)}` : ''}</h1>
            <div className="profile-status-badges" aria-label="Profile status">
              {isFoundingMember && <span className="profile-founding-member-badge"><Crown /> Founding Member</span>}
              <span className={`profile-verification-badge ${profile.verification?.status === 'verified' ? 'is-verified' : 'is-pending'}`}>
                {profile.verification?.status === 'verified' ? <ShieldCheck /> : <Shield />}
                {profile.verification?.status === 'verified' ? 'Verified' : 'Pending verification'}
              </span>
            </div>
            <div className="profile-identity-facts">
              {extras?.profession && <p><Briefcase /> {extras.profession}</p>}
              {extras?.location && profile.showDistance && <p><MapPin /> {extras.location}</p>}
              {profile.relationshipGoal && <p><Heart /> {profile.relationshipGoal}</p>}
            </div>
            <div className="profile-identity-footer">
              <div className="profile-public-astrology">
                {profile.sunSign && <VisitorAstrology symbol={westernGlyph(profile.sunSign)} value={profile.sunSign} label="Western Sign" />}
                {profile.chineseAnimal && <VisitorAstrology symbol={animalGlyph(profile.chineseAnimal)} value={profile.chineseAnimal} label="Chinese Animal" />}
              </div>
              <div className="profile-visitor-actions">
                {isMatched && user && <button onClick={() => navigate(`/messages/${[user.uid, profile.uid].sort().join('_')}`)}><MessageCircle /> Message</button>}
                <button onClick={() => void handleFriendAction()} disabled={friendState === 'outgoing'}>{friendState === 'friends' ? <UserCheck /> : <UserPlus />} {friendLabel}</button>
                {friendState === 'incoming' && <button onClick={() => void respondToFriendRequest(profile.uid, false)}><X /> Decline</button>}
                <button onClick={handleLike}><Heart className={liked ? 'fill-current' : ''} /> Like</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="profile-neutral-surface">
        <div className="profile-neutral-content">
          <div className="profile-content-grid">
            <button type="button" className="profile-cosmic-card" onClick={() => navigate(`/compatibility/${profile.uid}`)}>
              <span><strong>Cosmic Profile</strong><small>Explore your compatibility and their astrological blueprint</small><em>View Cosmic Profile <ArrowRight /></em></span>
              <span className="profile-cosmic-wheel" aria-hidden="true">✦</span>
            </button>
            <section className="profile-media-card">
              <VisitorMediaRow title="Photos" items={profilePhotos} onOpen={(index) => { setMediaMode('photos'); setGridViewerIndex(index) }} />
              <VisitorMediaRow title="Videos" items={profileVideos} video onOpen={(index) => { setMediaMode('videos'); setGridViewerIndex(index) }} />
            </section>
          </div>
          <div className="profile-detail-grid">
            <section className="profile-neutral-card">
              <button className="profile-neutral-heading" onClick={() => setAboutOpen((value) => !value)} aria-expanded={aboutOpen}><span>About Me</span><ChevronUp className={aboutOpen ? '' : 'is-collapsed'} /></button>
              {aboutOpen && <div className="profile-about-content"><div className="profile-about-facts">{extras?.education && <p><GraduationCap /><span>Education</span><strong>{extras.education}</strong></p>}{extras?.languages?.length ? <p><MessageCircle /><span>Languages</span><strong>{extras.languages.join(', ')}</strong></p> : null}{extras?.profession && <p><Briefcase /><span>Job title</span><strong>{extras.profession}</strong></p>}</div>{extras?.about && <p className="profile-about-story">{extras.about}</p>}</div>}
            </section>
            <section className="profile-neutral-card">
              <button className="profile-neutral-heading" onClick={() => setInterestsOpen((value) => !value)} aria-expanded={interestsOpen}><span>Interests &amp; Lifestyle</span><ChevronUp className={interestsOpen ? '' : 'is-collapsed'} /></button>
              {interestsOpen && <div className="profile-interests-content"><strong>Interests</strong><div className="profile-neutral-chips">{extras?.interests?.map((interest) => <span key={interest}>{interest}</span>)}</div><strong>Lifestyle</strong><div className="profile-neutral-chips is-lifestyle">{extras?.lifestyleVibe && <span>{extras.lifestyleVibe}</span>}{extras?.values?.slice(0, 5).map((value) => <span key={value}>{value}</span>)}</div></div>}
            </section>
          </div>
        </div>
      </div>

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
        onReport={() => reportProfileRemote(profile.uid)}
        onBlock={() => {
          blockProfile(profile.uid)
          navigate('/discovery')
        }}
        onMute={() => {
          void muteProfile(profile.uid)
        }}
      />
    </div>
  )
}

const VISITOR_WESTERN_GLYPHS: Record<string, string> = {
  aries:'♈', taurus:'♉', gemini:'♊', cancer:'♋', leo:'♌', virgo:'♍', libra:'♎', scorpio:'♏', sagittarius:'♐', capricorn:'♑', aquarius:'♒', pisces:'♓',
}
const VISITOR_ANIMAL_GLYPHS: Record<string, string> = {
  rat:'鼠', ox:'牛', tiger:'虎', rabbit:'兔', dragon:'龍', snake:'蛇', horse:'馬', goat:'羊', sheep:'羊', monkey:'猴', rooster:'雞', dog:'狗', pig:'豬',
}
function westernGlyph(value: string) { return VISITOR_WESTERN_GLYPHS[value.toLowerCase()] ?? '✦' }
function animalGlyph(value: string) { return VISITOR_ANIMAL_GLYPHS[value.toLowerCase()] ?? '✦' }

function VisitorAstrology({ symbol, value, label }: { symbol: string; value: string; label: string }) {
  return <span className="profile-astrology-identity"><b aria-hidden="true">{symbol}</b><span><strong>{value}</strong><small>{label}</small></span></span>
}

function VisitorMediaRow({ title, items, video = false, onOpen }: { title: string; items: DisplayMediaItem[]; video?: boolean; onOpen: (index: number) => void }) {
  return (
    <div className="profile-media-row">
      <div className="profile-media-heading"><h2>{title}</h2></div>
      <div className="profile-media-scroller">
        {items.map((item, index) => (
          <button key={item.id} className="profile-media-thumbnail" onClick={() => onOpen(index)} aria-label={item.caption || `Open ${video ? 'video' : 'photo'}`}>
            <img src={item.thumbnailUrl || item.url} alt={item.caption || ''} />
            {video && <span className="profile-video-play"><Play /></span>}
          </button>
        ))}
        {!items.length && <p className="profile-media-empty">No {title.toLowerCase()} shared yet.</p>}
      </div>
    </div>
  )
}
