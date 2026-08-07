import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, BadgeCheck, MapPin, Briefcase, GraduationCap, Heart, X, MessageCircle, Sparkles,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MasonryGallery } from '@/components/shared/MasonryGallery'
import { CompatibilitySnapshot } from '@/components/shared/CompatibilitySnapshot'
import { ProfileDetailSections } from '@/components/shared/ProfileDetailSections'
import { getProfileGallery, getCoverImage } from '@/data/gallery-media'
import { defaultSelfProfile } from '@/data/selfProfile'

export function ProfileDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { likeProfile, passProfile, profiles } = useApp()
  const profile = id ? profiles.find((p) => p.id === id) : undefined
  const [liked, setLiked] = useState(false)

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-serif-display text-2xl text-champagne">Profile not found</p>
        <Button onClick={() => navigate('/discovery')}>Back to Discovery</Button>
      </div>
    )
  }

  const gallery = getProfileGallery(profile.id)
  const cover = getCoverImage(profile.id)

  const handleLike = () => {
    setLiked(true)
    likeProfile(profile.id).then((matched) => {
      setTimeout(() => {
        if (matched) navigate(`/match/${profile.id}`)
        else navigate('/discovery')
      }, matched ? 600 : 900)
    })
  }

  const handlePass = () => {
    passProfile(profile.id)
    navigate('/discovery')
  }

  return (
    <div className="pb-32">
      <Button
        variant="glass"
        size="icon"
        onClick={() => navigate('/discovery')}
        className="fixed left-4 top-4 z-30 md:left-8 md:top-8"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* Cover image with parallax-ish scale-in */}
      <div className="relative h-[38vh] min-h-[220px] w-full overflow-hidden md:h-[42vh]">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          src={cover}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/20 to-black/10" />
      </div>

      <div className="mx-auto max-w-4xl px-6 md:px-0">
        {/* Avatar overlapping cover */}
        <div className="-mt-16 mb-4 flex items-end justify-between md:-mt-20">
          <motion.img
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            src={profile.images[0]}
            alt={profile.name}
            className="h-32 w-32 rounded-full border-4 border-midnight object-cover shadow-2xl md:h-40 md:w-40"
          />
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="mb-2 flex items-center gap-2">
            <h1 className="font-serif-display text-3xl text-white md:text-4xl">{profile.name}, {profile.age}</h1>
            {profile.verified && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] uppercase tracking-wide text-emerald-300 border border-emerald-500/30">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
          <div className="mb-5 flex flex-wrap items-center gap-4 text-sm text-white/60">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {profile.location}</span>
            <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {profile.profession}</span>
            <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> {profile.education}</span>
          </div>
        </motion.div>

        {/* Compatibility snapshot */}
        <div className="mb-8">
          <CompatibilitySnapshot profile={profile} self={defaultSelfProfile} />
        </div>

        {/* Bio */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/70">About {profile.name.split(' ')[0]}</p>
          <p className="font-serif-display text-2xl leading-snug text-white/90 md:text-3xl">{profile.about}</p>
        </motion.div>

        {/* Interests */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold/70">Interests</p>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <Badge key={interest} variant="glass">{interest}</Badge>
            ))}
          </div>
        </motion.div>

        {/* Goals */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/70">Relationship Intentions</p>
          <p className="max-w-2xl text-xl leading-relaxed text-white/70">{profile.goals}</p>
        </motion.div>

        {/* Lifestyle */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold/70">Lifestyle</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {profile.lifestyle.map((item) => (
              <div key={item.label}>
                <p className="text-[10px] uppercase tracking-widest text-white/40">{item.label}</p>
                <p className="text-sm text-white/80">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Gallery — the centrepiece */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
          <p className="mb-1 text-xs uppercase tracking-[0.25em] text-gold/70">Gallery</p>
          <h2 className="font-serif-display mb-5 text-2xl text-champagne">Exploring {profile.name.split(' ')[0]}'s World</h2>
          <MasonryGallery items={gallery} />
        </motion.div>

        {/* Premium detail sections */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
          <p className="mb-1 text-xs uppercase tracking-[0.25em] text-gold/70">More About {profile.name.split(' ')[0]}</p>
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge variant="gold">Values: {profile.values.join(', ')}</Badge>
          </div>
          <ProfileDetailSections
            music={profile.music}
            languages={profile.languages}
            favoritePlaces={profile.favoritePlaces}
            dreamDestinations={profile.dreamDestinations}
            fitness={profile.fitness}
            books={profile.books}
            movies={profile.movies}
          />
        </motion.div>

        {profile.prompts.map((prompt, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="mb-8">
            <p className="mb-3 text-xs uppercase tracking-widest text-gold/70">{prompt.question}</p>
            <p className="font-serif-display text-3xl italic leading-snug text-white/95 md:text-4xl">"{prompt.answer}"</p>
          </motion.div>
        ))}

        <Button variant="link" onClick={() => navigate(`/compatibility/${profile.id}`)} className="mx-auto flex text-sm">
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
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.08 }}
          onClick={() => navigate(`/messages/${profile.id}`)}
          className="glass-strong flex h-14 w-14 items-center justify-center rounded-full text-champagne shadow-xl cursor-pointer hover:text-white"
        >
          <MessageCircle className="h-5 w-5" />
        </motion.button>
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
    </div>
  )
}
