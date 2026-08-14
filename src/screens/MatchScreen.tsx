import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, MessageCircle, Compass, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Starfield } from '@/components/shared/Starfield'
import { SelfAvatar } from '@/components/shared/SelfAvatar'
import { getMatch, getUserDoc, type DiscoveryCandidate } from '@/lib/firestore'

interface MatchLocationState {
  otherUid?: string
  compatibility?: number | null
}

export function MatchScreen() {
  const { id: matchId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const state = (location.state as MatchLocationState | null) ?? null
  const [profile, setProfile] = useState<DiscoveryCandidate | null | undefined>(undefined)
  const compatibility = state?.compatibility ?? null

  useEffect(() => {
    if (!matchId || !user) return
    let cancelled = false

    async function resolve() {
      const otherUid = state?.otherUid ?? (await getMatch(matchId!))?.users.find((u) => u !== user!.uid)
      if (!otherUid) {
        if (!cancelled) setProfile(null)
        return
      }
      const doc = await getUserDoc(otherUid)
      if (!cancelled) setProfile(doc ? { uid: otherUid, ...doc } : null)
    }

    resolve()
    return () => {
      cancelled = true
    }
  }, [matchId, user, state?.otherUid])

  if (!matchId || profile === null) {
    navigate('/discovery')
    return null
  }

  if (profile === undefined) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    )
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
          src={profile.profilePhotoUrl}
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
        Connection Open
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7 }}
        className="font-serif-display relative z-10 mb-4 text-4xl md:text-6xl"
      >
        You <span className="text-gradient-gold italic">Connected</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="relative z-10 mb-10 max-w-md text-white/60"
      >
        {compatibility !== null
          ? `You and ${profile.name.split(' ')[0]} share a ${compatibility}% compatibility score. You can message now, and they'll see your profile in their connections.`
          : `You can message ${profile.name.split(' ')[0]} now, and they'll see your profile in their connections.`}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 flex flex-col gap-3 sm:flex-row"
      >
        <Button size="lg" onClick={() => navigate(`/messages/${matchId}`)}>
          <MessageCircle className="h-4 w-4" /> Send a Message
        </Button>
        <Button size="lg" variant="glass" onClick={() => navigate(`/compatibility/${profile.uid}`)}>
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
