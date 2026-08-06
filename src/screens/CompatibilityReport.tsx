import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, MessageCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Starfield } from '@/components/shared/Starfield'

export function CompatibilityReport() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profiles } = useApp()
  const profile = id ? profiles.find((p) => p.id === id) : undefined

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-serif-display text-2xl text-champagne">Report not found</p>
        <Button onClick={() => navigate('/discovery')}>Back to Discovery</Button>
      </div>
    )
  }

  return (
    <div className="relative pb-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] overflow-hidden">
        <Starfield density={70} />
      </div>

      <Button variant="glass" size="icon" onClick={() => navigate(-1)} className="fixed left-4 top-4 z-30 md:left-8 md:top-8">
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-16 text-center md:pt-24">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-xs uppercase tracking-[0.3em] text-gold/80"
        >
          Compatibility Report
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-serif-display mb-2 text-3xl md:text-5xl"
        >
          You &amp; {profile.name.split(' ')[0]}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12 text-white/50"
        >
          A closer look at the alignment across six dimensions of compatibility.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex justify-center"
        >
          <ProgressRing value={profile.compatibility} size={260} strokeWidth={12} label={`${profile.compatibility}%`} sublabel={profile.compatibilityLabel} />
        </motion.div>

        <div className="mb-16 flex items-center justify-center gap-4">
          <img src="https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&q=80&auto=format&fit=crop" alt="you" className="h-12 w-12 rounded-full border-2 border-gold/40 object-cover" />
          <Sparkles className="h-5 w-5 text-gold" />
          <img src={profile.images[0]} alt={profile.name} className="h-12 w-12 rounded-full border-2 border-gold/40 object-cover" />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {profile.sections.map((section, i) => (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: (i % 2) * 0.1 }}
            >
              <Card className="h-full overflow-hidden">
                <CardContent className="p-7">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-serif-display text-xl text-champagne">{section.label}</h3>
                    <span className="font-serif-display text-2xl text-gradient-gold">{section.score}%</span>
                  </div>
                  <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${section.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                      className="h-full rounded-full bg-gradient-to-r from-gold to-champagne"
                    />
                  </div>
                  <p className="mb-2 text-sm font-medium text-white/80">{section.summary}</p>
                  <p className="text-sm leading-relaxed text-white/50">{section.detail}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="glass-strong glow-gold mt-10 flex flex-col items-center rounded-[2rem] px-8 py-14 text-center"
        >
          <h2 className="font-serif-display mb-3 text-2xl md:text-3xl">Ready to Explore This Further?</h2>
          <p className="mb-8 max-w-md text-white/55">
            Compatibility this rare doesn't happen often. Perhaps it's time to say hello.
          </p>
          <Button size="lg" onClick={() => navigate(`/messages/${profile.id}`)}>
            <MessageCircle className="h-4 w-4" /> Message {profile.name.split(' ')[0]}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
