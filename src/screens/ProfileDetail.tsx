import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { ArrowRight, Gift, Heart, MessageCircle, Loader2, MoreHorizontal, MapPin, Briefcase, Play, UserPlus, UserCheck, X, Crown, ShieldCheck, Shield } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { ProfileOrbit } from '@/components/shared/ProfileOrbit'
import { CelestialHeart } from '@/components/shared/CelestialHeart'
import { FullscreenMediaViewer } from '@/components/shared/FullscreenMediaViewer'
import { OtherProfileActionsMenu } from '@/components/shared/ProfileActionsMenu'
import { ProfileCosmicWheel } from '@/components/shared/ProfileCosmicWheel'
import { ProfileAstrologyIdentity } from '@/components/shared/ProfileAstrologyIdentity'
import { ProfileAboutFacts } from '@/components/shared/ProfileAboutFacts'
import { hasProfileAboutValues } from '@/data/profileAbout'
import { toDisplayItem } from '@/lib/media/toDisplayItem'
import { getConversation, getUserDoc, subscribeUserMedia, type DiscoveryCandidate, type MediaDoc } from '@/lib/firestore'
import { emptySelfProfile } from '@/data/selfProfile'
import { getCompatibility, type CompatibilityResult, type PersonBirthProfile } from '@/lib/compatibilityApi'
import { calculateAge } from '@/lib/age'
import { DEFAULT_MEDIA_CATEGORIES } from '@/data/mediaCategories'
import type { DisplayCategory, DisplayMediaItem } from '@/types/media'
import { subscribeFriendState, sendFriendRequest, respondToFriendRequest, unfriend, type FriendState } from '@/lib/friendsApi'
import { reportProfileRemote } from '@/lib/privacyApi'
import { getPublicFoundingStatus } from '@/lib/founding500'

export interface ProfileDetailPreviewData {
  profile: DiscoveryCandidate
  media: MediaDoc[]
  compatibility: CompatibilityResult
  friendState: FriendState
  isFoundingMember: boolean
  isMatched: boolean
}

export function ProfileDetail({ previewData }: { previewData?: ProfileDetailPreviewData } = {}) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { likeProfile, blockProfile, muteProfile, matchedIds, onboarding } = useApp()
  const { user } = useAuth()
  const [profile, setProfile] = useState<DiscoveryCandidate | null | undefined>(previewData?.profile)
  const [media, setMedia] = useState<MediaDoc[]>(previewData?.media ?? [])
  const [result, setResult] = useState<CompatibilityResult | null>(previewData?.compatibility ?? null)
  const [liked, setLiked] = useState(false)
  const [videoViewerCategory, setVideoViewerCategory] = useState<string | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [mediaMode, setMediaMode] = useState<'photos' | 'videos'>('photos')
  const [gridViewerIndex, setGridViewerIndex] = useState<number | null>(null)
  const [friendState, setFriendState] = useState<FriendState>(previewData?.friendState ?? 'none')
  const [heroExpanded, setHeroExpanded] = useState(false)
  const [messageOpening, setMessageOpening] = useState(false)
  const [previewConversationOpen, setPreviewConversationOpen] = useState(false)
  const [isFoundingMember, setIsFoundingMember] = useState(previewData?.isFoundingMember ?? false)
  useEffect(() => {
    if (previewData) return
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
    return subscribeUserMedia(id, setMedia)
  }, [id, previewData])

  // The profile replaces a centered loading state after its member data
  // arrives. Reset at that point as well as on the route change so browser
  // scroll anchoring cannot leave the portrait above the visible viewport.
  useEffect(() => {
    if (!profile?.uid) return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [profile?.uid])

  useEffect(() => {
    if (previewData) return
    if (!user || !id) return
    return subscribeFriendState(user.uid, id, setFriendState)
  }, [previewData, user, id])

  useEffect(() => {
    if (previewData) return
    if (!id || !user) return
    getPublicFoundingStatus(id).then(setIsFoundingMember).catch(() => setIsFoundingMember(false))
  }, [id, previewData, user])

  const selfChartComplete = Boolean(
    onboarding.sunSign && onboarding.moonSign && onboarding.risingSign &&
    onboarding.chineseAnimal && onboarding.chineseElement && onboarding.yinYang
  )
  const otherChartComplete = Boolean(
    profile?.sunSign && profile.moonSign && profile.risingSign &&
    profile.chineseAnimal && profile.chineseElement && profile.yinYang
  )

  useEffect(() => {
    if (previewData) return
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
  }, [profile?.uid, previewData, selfChartComplete, otherChartComplete])

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

  const isMatched = previewData?.isMatched ?? matchedIds.includes(profile.uid)
  const extras = profile.profileExtras
  const preferredName = profile.name.split(' ')[0]
  const visitorStoryPrompts = profile.storyPrompts.filter((prompt) => prompt.answer.trim())
  const hasVisitorStory = visitorStoryPrompts.length > 0 || Boolean(extras?.about)
  const hasAboutInformation = hasProfileAboutValues({
    education: extras?.education,
    languages: extras?.languages,
    profession: extras?.profession,
    heightCm: profile.heightCm,
    childrenStatus: extras?.children,
    wantsChildren: extras?.wantsChildren,
    faithOrBeliefs: profile.religion,
    maritalBackground: extras?.maritalBackground,
  })
  const hasInterestsInformation = Boolean(extras?.interests?.length || extras?.lifestyleVibe || extras?.values?.length)
  const hasTravelInformation = Boolean(extras?.favoritePlaces?.length || extras?.dreamDestinations?.length)

  const handleMessage = async () => {
    if (previewData) {
      setPreviewConversationOpen(true)
      return
    }
    if (!user || messageOpening) return
    setMessageOpening(true)
    try {
      const pairConversationId = [user.uid, profile.uid].sort().join('_')
      const existingConversation = await getConversation(pairConversationId)
      if (existingConversation) {
        navigate(`/messages/${pairConversationId}`, { state: { otherUid: profile.uid } })
        return
      }
      const introduction = await likeProfile(profile.uid)
      navigate(`/messages/${introduction.conversationId ?? pairConversationId}`, { state: { otherUid: profile.uid } })
    } catch (error) {
      console.warn('[Perennia] Could not open this conversation:', error)
    } finally {
      setMessageOpening(false)
    }
  }

  const handleLike = () => {
    setLiked(true)
    if (previewData) return
    likeProfile(profile.uid).then(({ matchId, conversationId }) => {
      setTimeout(() => {
        if (matchId) navigate(`/match/${matchId}`, { state: { otherUid: profile.uid, compatibility: result?.compatibility ?? null } })
        else if (conversationId) navigate(`/messages/${conversationId}`, { state: { otherUid: profile.uid } })
        else navigate('/discovery')
      }, matchId ? 600 : 900)
    })
  }

  const handleFriendAction = async () => {
    if (previewData) {
      setFriendState((current) => current === 'friends' ? 'none' : 'friends')
      return
    }
    if (friendState === 'none') await sendFriendRequest(profile.uid)
    else if (friendState === 'incoming') await respondToFriendRequest(profile.uid, true)
    else if (friendState === 'friends') await unfriend(profile.uid)
  }

  const friendLabel = friendState === 'incoming' ? 'Accept Friend' : friendState === 'outgoing' ? 'Request Sent' : friendState === 'friends' ? 'Friends' : 'Add Friend'

  return (
    <MotionConfig reducedMotion="user">
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
                {profile.sunSign && <ProfileAstrologyIdentity kind="western" value={profile.sunSign} label="Western Sign" />}
                {profile.chineseAnimal && <ProfileAstrologyIdentity kind="chinese" value={profile.chineseAnimal} label="Chinese Animal" />}
              </div>
              <div className="profile-visitor-actions">
                {isMatched && (user || previewData) && <button onClick={() => void handleMessage()} disabled={messageOpening}>{messageOpening ? <Loader2 className="animate-spin" /> : <MessageCircle />} Message</button>}
                <button onClick={() => void handleFriendAction()} disabled={friendState === 'outgoing'}>{friendState === 'friends' ? <UserCheck /> : <UserPlus />} {friendLabel}</button>
                {friendState === 'incoming' && <button onClick={() => void respondToFriendRequest(profile.uid, false)}><X /> Decline</button>}
                <button onClick={handleLike}><Heart className={liked ? 'fill-current' : ''} /> Like</button>
              </div>
            </div>
            {previewData && (
              <button
                type="button"
                className="profile-send-gift-action"
                onClick={() => navigate('/dev/design-preview?screen=giftSend')}
              >
                <span className="profile-send-gift-action__icon"><Gift aria-hidden="true" /></span>
                <span><strong>Send a Gift</strong><small>Choose a thoughtful gift, arranged privately by Perennia</small></span>
                <ArrowRight aria-hidden="true" />
              </button>
            )}
            {previewConversationOpen && <p className="profile-preview-message-status" role="status">In-memory conversation ready for {preferredName}. No data was saved.</p>}
          </div>
        </div>
      </section>

      <div className="profile-neutral-surface">
        <div className="profile-neutral-content">
          <div className="profile-content-grid">
            <button type="button" className="profile-cosmic-card" onClick={() => navigate(`/compatibility/${profile.uid}`)}>
              <span><strong>Cosmic Profile</strong><small>Explore your compatibility and their astrological blueprint</small><em>Check Our Compatibility <ArrowRight /></em></span>
              <ProfileCosmicWheel />
            </button>
            <section className="profile-media-card">
              <VisitorMediaRow title="Photos" items={profilePhotos} onOpen={(index) => { setMediaMode('photos'); setGridViewerIndex(index) }} />
              <VisitorMediaRow title="Videos" items={profileVideos} video onOpen={(index) => { setMediaMode('videos'); setGridViewerIndex(index) }} />
            </section>
          </div>
          <div className="profile-detail-grid">
            <section className="profile-neutral-card">
              <h2 className="profile-neutral-heading">About Me</h2>
              {hasAboutInformation ? (
                <div className="profile-about-content profile-about-content--facts-only">
                  <ProfileAboutFacts
                    education={extras?.education}
                    languages={extras?.languages}
                    profession={extras?.profession}
                    heightCm={profile.heightCm}
                    childrenStatus={extras?.children}
                    wantsChildren={extras?.wantsChildren}
                    faithOrBeliefs={profile.religion}
                    maritalBackground={extras?.maritalBackground}
                  />
                </div>
              ) : (
                <p className="px-4 pb-4 text-sm text-slate-500">No About Me information shared yet.</p>
              )}
            </section>
            <section className="profile-neutral-card">
              <h2 className="profile-neutral-heading">Interests &amp; Lifestyle</h2>
              {hasInterestsInformation ? (
                <div className="profile-interests-content">
                  <strong>Interests</strong>
                  <div className="profile-neutral-chips">{extras?.interests?.map((interest) => <span key={interest}>{interest}</span>)}</div>
                  <strong>Lifestyle</strong>
                  <div className="profile-neutral-chips is-lifestyle">{extras?.lifestyleVibe && <span>{extras.lifestyleVibe}</span>}{extras?.values?.slice(0, 5).map((value) => <span key={value}>{value}</span>)}</div>
                </div>
              ) : (
                <p className="px-4 pb-4 text-sm text-slate-500">No interests or lifestyle information shared yet.</p>
              )}
            </section>
            {hasVisitorStory && (
              <section className="profile-neutral-card profile-neutral-card--wide">
                <h2 className="profile-neutral-heading profile-visitor-story-heading">{preferredName}’s Story</h2>
                <div className="profile-visitor-story">
                  {visitorStoryPrompts.length > 0 ? visitorStoryPrompts.map((prompt) => (
                    <article key={prompt.question}>
                      <strong>{prompt.question}</strong>
                      <p>{prompt.answer}</p>
                    </article>
                  )) : <p>{extras?.about}</p>}
                </div>
              </section>
            )}
            {hasTravelInformation && (
              <section className="profile-neutral-card profile-neutral-card--wide">
                <h2 className="profile-neutral-heading">Travel</h2>
                <div className="profile-travel-content">
                  {extras?.favoritePlaces?.length ? (
                    <div>
                      <strong>Favourite Places</strong>
                      <p>{extras.favoritePlaces.join(', ')}</p>
                    </div>
                  ) : null}
                  {extras?.dreamDestinations?.length ? (
                    <div>
                      <strong>Dream Destinations</strong>
                      <p>{extras.dreamDestinations.join(', ')}</p>
                    </div>
                  ) : null}
                </div>
              </section>
            )}
          </div>
        </div>
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
        onReport={() => previewData ? Promise.resolve() : reportProfileRemote(profile.uid)}
        onBlock={() => {
          if (previewData) return
          blockProfile(profile.uid)
          navigate('/discovery')
        }}
        onMute={() => {
          if (previewData) return
          void muteProfile(profile.uid)
        }}
      />
      </div>
    </MotionConfig>
  )
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
