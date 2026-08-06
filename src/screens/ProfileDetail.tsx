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
import { Card, CardContent } from '@/components/ui/card'

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

      <div className="mx-auto max-w-3xl px-6 py-10 md:px-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="mb-6">
            <CardContent className="p-8">
              <h2 className="font-serif-display mb-3 text-2xl text-champagne">About</h2>
              <p className="leading-relaxed text-white/65">{profile.about}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                <h2 className="font-serif-display text-2xl text-champagne">Cosmic Snapshot</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                  <Sun className="mx-auto mb-2 h-4 w-4 text-gold" />
                  <p className="text-[10px] uppercase tracking-widest text-white/40">Sun</p>
                  <p className="font-serif-display text-champagne">{profile.sunSign}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                  <Moon className="mx-auto mb-2 h-4 w-4 text-white/70" />
                  <p className="text-[10px] uppercase tracking-widest text-white/40">Moon</p>
                  <p className="font-serif-display text-champagne">{profile.moonSign}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                  <ArrowUpCircle className="mx-auto mb-2 h-4 w-4 text-white/70" />
                  <p className="text-[10px] uppercase tracking-widest text-white/40">Rising</p>
                  <p className="font-serif-display text-champagne">{profile.risingSign}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <Card className="mb-6">
            <CardContent className="p-8">
              <h2 className="font-serif-display mb-4 text-2xl text-champagne">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <Badge key={interest} variant="glass">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
          <Card className="mb-6">
            <CardContent className="p-8">
              <h2 className="font-serif-display mb-4 text-2xl text-champagne">Lifestyle</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {profile.lifestyle.map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">{item.label}</p>
                    <p className="text-sm text-white/80">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {profile.prompts.map((prompt, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.06 }}>
            <Card className="mb-6">
              <CardContent className="p-8">
                <p className="mb-2 text-xs uppercase tracking-widest text-gold/80">{prompt.question}</p>
                <p className="font-serif-display text-xl leading-snug text-white/90">"{prompt.answer}"</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="mb-6">
            <CardContent className="p-8">
              <h2 className="font-serif-display mb-3 text-2xl text-champagne">Looking For</h2>
              <p className="leading-relaxed text-white/65">{profile.goals}</p>
            </CardContent>
          </Card>
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
