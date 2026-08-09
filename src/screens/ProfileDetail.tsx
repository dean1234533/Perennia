import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Heart, X, MessageCircle, Sparkles, Loader2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProfileOrbit } from '@/components/shared/ProfileOrbit'
import { MasonryGallery } from '@/components/shared/MasonryGallery'
import { FullscreenMediaViewer } from '@/components/shared/FullscreenMediaViewer'
import { CompatibilitySnapshot } from '@/components/shared/CompatibilitySnapshot'
import { ProfileDetailSections } from '@/components/shared/ProfileDetailSections'
import { toDisplayItem } from '@/lib/media/toDisplayItem'
import { getUserDoc, subscribeUserMedia, type DiscoveryCandidate, type MediaDoc } from '@/lib/firestore'
import { getCompatibility, type CompatibilityResult, type PersonBirthProfile } from '@/lib/compatibilityApi'
import { calculateAge } from '@/lib/age'
import { DEFAULT_MEDIA_CATEGORIES } from '@/data/mediaCategories'
import type { DisplayCategory } from '@/types/media'

export function ProfileDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { likeProfile, passProfile, matchedIds, profileExtras, onboarding } = useApp()
  const { user } = useAuth()
  const [profile, setProfile] = useState<DiscoveryCandidate | null | undefined>(undefined)
  const [media, setMedia] = useState<MediaDoc[]>([])
  const [result, setResult] = useState<CompatibilityResult | null>(null)
  const [liked, setLiked] = useState(false)
  const [videoViewerCategory, setVideoViewerCategory] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getUserDoc(id).then((doc) => setProfile(doc ? { uid: id, ...doc } : null))
    return subscribeUserMedia(id, setMedia)
  }, [id])

  const selfChartComplete = Boolean(
    onboarding.sunSign && onboarding.moonSign && onboarding.risingSign &&
    onboarding.chineseAnimal && onboarding.chineseElement && onboarding.yinYang
  )

  useEffect(() => {
    if (!profile || !selfChartComplete) return
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
  }, [profile?.uid, selfChartComplete])

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
    <div className="pb-32 pt-16 md:pt-8">
      <Button
        variant="glass"
        size="icon"
        onClick={() => navigate('/discovery')}
        className="fixed left-4 top-4 z-30 md:left-8 md:top-8 lg:left-28 xl:left-72"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="mx-auto max-w-4xl px-6 md:px-0">
        <ProfileOrbit
          photoUrl={profile.profilePhotoUrl || null}
          name={profile.name}
          age={calculateAge(profile.birthDate) ?? undefined}
          verificationStatus={profile.verification?.status ?? 'unverified'}
          categories={orbitCategories}
          onCategorySelect={handleOrbitSelect}
          compatibility={result?.compatibility}
        />

        {(extras?.location || extras?.profession || extras?.education) && (
          <div className="mb-8 mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-white/60">
            {extras?.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {extras.location}</span>}
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
          ) : !result ? (
            <div className="glass flex items-center justify-center rounded-[1.75rem] px-8 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
            </div>
          ) : (
            <CompatibilitySnapshot profile={profile} self={profileExtras} compatibility={result.compatibility} compatibilityLabel={result.band} />
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

        {/* Goals */}
        {extras?.goals && (
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/70">Relationship Intentions</p>
            <p className="max-w-2xl text-xl leading-relaxed text-white/70">{extras.goals}</p>
          </motion.div>
        )}

        {/* Lifestyle */}
        {!!extras?.lifestyle.length && (
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold/70">Lifestyle</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {extras.lifestyle.map((item) => (
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
      <div className="fixed bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 lg:bottom-8">
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
    </div>
  )
}
