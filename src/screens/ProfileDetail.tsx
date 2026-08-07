import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BadgeCheck, MapPin, Briefcase, Heart, X, MessageCircle,
  Sparkles, Sun, Moon, ArrowUpCircle,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function ProfileDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { likeProfile, passProfile, profiles } = useApp()
  const profile = id ? profiles.find((p) => p.id === id) : undefined
  const [activeImage, setActiveImage] = useState(0)
  const [liked, setLiked] = useState(false)

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-serif-display text-2xl text-champagne">Profile not found</p>
        <Button onClick={() => navigate('/discovery')}>Back to Discovery</Button>
      </div>
    )
  }

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

      {/* Gallery */}
      <motion.div layoutId={`card-${profile.id}`} className="relative h-[70vh] w-full overflow-hidden md:h-[80vh]">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeImage}
            layoutId={activeImage === 0 ? `card-img-${profile.id}` : undefined}
            src={profile.images[activeImage]}
            alt={profile.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full w-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/10 to-transparent" />

        {/* Image indicators */}
        <div className="absolute left-1/2 top-6 flex -translate-x-1/2 gap-1.5">
          {profile.images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={`h-1 rounded-full transition-all cursor-pointer ${i === activeImage ? 'w-8 bg-gold' : 'w-4 bg-white/30'}`}
            />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="gold">{profile.compatibilityLabel}</Badge>
            <div className="glass-strong rounded-full px-3 py-1">
              <span className="font-serif-display text-sm text-gradient-gold">{profile.compatibility}% Match</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif-display text-4xl text-white md:text-6xl">{profile.name}, {profile.age}</h1>
            {profile.verified && <BadgeCheck className="h-6 w-6 text-gold" />}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {profile.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" /> {profile.profession}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="mx-auto max-w-4xl px-6 py-16 md:px-0">
        {/* About + Cosmic Snapshot — editorial split, no card chrome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-5"
        >
          <div className="md:col-span-3">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/70">About {profile.name.split(' ')[0]}</p>
            <p className="font-serif-display text-2xl leading-snug text-white/90 md:text-3xl">
              {profile.about}
            </p>
          </div>
          <div className="flex flex-col justify-center gap-4 md:col-span-2 md:border-l md:border-white/8 md:pl-10">
            {[
              { icon: Sun, label: 'Sun', value: profile.sunSign },
              { icon: Moon, label: 'Moon', value: profile.moonSign },
              { icon: ArrowUpCircle, label: 'Rising', value: profile.risingSign },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <r.icon className="h-4 w-4 shrink-0 text-gold" />
                <p className="text-[11px] uppercase tracking-widest text-white/40">{r.label}</p>
                <p className="font-serif-display text-lg text-champagne">{r.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Interests + Lifestyle — flowing, no boxes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mb-20"
        >
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold/70">Interests</p>
          <div className="mb-10 flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <Badge key={interest} variant="glass">
                {interest}
              </Badge>
            ))}
          </div>
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

        {/* Prompts — large pull-quotes, no card chrome */}
        <div className="mb-20 flex flex-col gap-14">
          {profile.prompts.map((prompt, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <p className="mb-3 text-xs uppercase tracking-widest text-gold/70">{prompt.question}</p>
              <p className="font-serif-display text-3xl italic leading-snug text-white/95 md:text-4xl">
                "{prompt.answer}"
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-16">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold/70">Looking For</p>
          <p className="max-w-2xl text-xl leading-relaxed text-white/70">{profile.goals}</p>
        </motion.div>

        <Button variant="link" onClick={() => navigate(`/compatibility/${profile.id}`)} className="mx-auto flex text-sm">
          View Full Compatibility Report →
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
