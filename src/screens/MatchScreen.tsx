import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, MessageCircle, Compass } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { Starfield } from '@/components/shared/Starfield'
import { SelfAvatar } from '@/components/shared/SelfAvatar'

export function MatchScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profiles } = useApp()
  const profile = id ? profiles.find((p) => p.id === id) : undefined

  if (!profile) {
    navigate('/discovery')
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-midnight px-6 text-center text-white">
      <Starfield density={180} />
      <div className="absolute inset-0 bg-gradient-to-b from-nebula-purple/20 via-transparent to-transparent" />

      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute text-gold"
          initial={{ opacity: 0, y: 0, x: `${Math.random() * 100}vw`, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], y: -400, scale: [0.5, 1, 0.5] }}
          transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          style={{ bottom: '-5%' }}
        >
          <Sparkles className="h-4 w-4" />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mb-8 flex items-center"
      >
        <motion.div
          initial={{ x: 40, rotate: -6 }}
          animate={{ x: 0, rotate: -6 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="h-32 w-32 -mr-4 md:h-40 md:w-40"
        >
          <SelfAvatar className="h-full w-full rounded-full border-4 border-midnight shadow-2xl" />
        </motion.div>
        <motion.img
          initial={{ x: -40, rotate: 6 }}
          animate={{ x: 0, rotate: 6 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          src={profile.images[0]}
          alt={profile.name}
          className="h-32 w-32 rounded-full border-4 border-midnight object-cover shadow-2xl md:h-40 md:w-40"
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 mb-2 text-xs uppercase tracking-[0.3em] text-gold"
      >
        A Rare Alignment
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7 }}
        className="font-serif-display relative z-10 mb-4 text-4xl md:text-6xl"
      >
        It's a <span className="text-gradient-gold italic">Match</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="relative z-10 mb-10 max-w-md text-white/60"
      >
        You and {profile.name.split(' ')[0]} share a {profile.compatibility}% compatibility score.
        The stars — and the science — agree.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 flex flex-col gap-3 sm:flex-row"
      >
        <Button size="lg" onClick={() => navigate(`/messages/${profile.id}`)}>
          <MessageCircle className="h-4 w-4" /> Send a Message
        </Button>
        <Button size="lg" variant="glass" onClick={() => navigate(`/compatibility/${profile.id}`)}>
          View Compatibility Report
        </Button>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => navigate('/discovery')}
        className="relative z-10 mt-8 flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 cursor-pointer"
      >
        <Compass className="h-3.5 w-3.5" /> Continue Discovering
      </motion.button>
    </div>
  )
}
