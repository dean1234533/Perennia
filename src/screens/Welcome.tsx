import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Heart, Shield, Star, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Starfield } from '@/components/shared/Starfield'
import { Card } from '@/components/ui/card'

const features = [
  {
    icon: Star,
    title: 'Astrological Depth',
    text: 'Your birth chart informs a compatibility model far richer than swipes and filters — grounded in who you actually are.',
  },
  {
    icon: Shield,
    title: 'Verified, Always',
    text: 'Every member is identity-verified. No bots, no catfish — just real people ready for something real.',
  },
  {
    icon: Heart,
    title: 'Curated, Not Endless',
    text: 'We surface a handful of exceptional matches, not an infinite feed. Quality over quantity, always.',
  },
]

const steps = [
  { n: '01', title: 'Share Your Story', text: 'Build a cosmic profile shaped by your birth details, values, and vision for love.' },
  { n: '02', title: 'We Calculate Compatibility', text: 'Our engine studies emotional, intellectual, and astrological alignment across six dimensions.' },
  { n: '03', title: 'Meet With Intention', text: 'Explore curated matches with full compatibility reports — no guesswork, no wasted time.' },
]

export function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen overflow-hidden bg-midnight text-white">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#0a0c1e] via-midnight to-black">
        <Starfield density={160} />
      </div>

      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-gold" />
          <span className="font-serif-display text-2xl text-gradient-gold">Perennia</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Log In
          </Button>
          <Button variant="gold" size="sm" onClick={() => navigate('/signup')}>
            Join Perennia
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center px-6 pb-24 pt-16 text-center md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-champagne/80"
        >
          <Moon className="h-3.5 w-3.5" />
          Compatibility-First Dating
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif-display max-w-4xl text-5xl font-medium leading-[1.05] md:text-7xl"
        >
          For Love That Fits, <span className="text-gradient-gold italic">Naturally.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25 }}
          className="mt-6 max-w-xl text-lg text-white/60"
        >
          Perennia pairs the science of compatibility with the wonder of astrology to introduce
          you to people you were truly meant to meet.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Button size="lg" onClick={() => navigate('/signup')} className="group">
            Begin Your Story
            <motion.span
              className="inline-block"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              →
            </motion.span>
          </Button>
          <Button size="lg" variant="glass" onClick={() => navigate('/login')}>
            I Already Have an Account
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-16 flex items-center gap-6 text-xs uppercase tracking-widest text-white/40"
        >
          <span>12,000+ Verified Members</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>Featured in Condé Nast</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>94% Report Compatibility</span>
        </motion.div>
      </section>

      {/* Floating preview card */}
      <section className="relative z-10 mx-auto -mt-4 mb-24 flex max-w-5xl justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 8 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong glow-purple w-full max-w-3xl rounded-[2rem] p-3"
        >
          <div className="relative overflow-hidden rounded-[1.6rem]">
            <img
              src="https://picsum.photos/seed/perennia-hero/1400/700"
              alt=""
              className="h-[280px] w-full object-cover md:h-[420px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-6">
              <div className="text-left">
                <p className="font-serif-display text-2xl">Amara &amp; Julian</p>
                <p className="text-sm text-white/60">94% Rare Alignment</p>
              </div>
              <div className="glass rounded-2xl px-4 py-2 text-right">
                <p className="text-2xl font-serif-display text-gradient-gold">94%</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center"
        >
          <h2 className="font-serif-display text-3xl md:text-5xl">
            A Different Kind of <span className="text-gradient-gold italic">Introduction</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/55">
            We built Perennia for people who want intention, not infinite scroll.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
            >
              <Card className="h-full p-2 transition-transform duration-500 hover:-translate-y-2 hover:border-gold/30">
                <div className="p-6">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-nebula-purple/30 to-nebula-blue/20">
                    <f.icon className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="font-serif-display mb-2 text-xl text-champagne">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-white/55">{f.text}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-16 md:py-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center font-serif-display text-3xl md:text-5xl"
        >
          How <span className="text-gradient-gold italic">Perennia</span> Works
        </motion.h2>

        <div className="grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative"
            >
              <span className="font-serif-display text-6xl text-white/10">{s.n}</span>
              <h3 className="font-serif-display -mt-4 mb-2 text-2xl text-champagne">{s.title}</h3>
              <p className="text-sm leading-relaxed text-white/55">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-28 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="glass-strong glow-gold mx-auto flex max-w-3xl flex-col items-center rounded-[2rem] px-8 py-16 text-center"
        >
          <h2 className="font-serif-display mb-4 text-3xl md:text-4xl">
            Your Story Deserves a <span className="text-gradient-gold italic">Beautiful Beginning</span>
          </h2>
          <p className="mb-8 max-w-md text-white/60">
            Join thousands who have found a love that truly fits — written in the stars, grounded in reality.
          </p>
          <Button size="lg" onClick={() => navigate('/signup')}>
            Begin Your Story
          </Button>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center text-xs text-white/30">
        © 2026 Perennia. For love that fits, naturally.
      </footer>
    </div>
  )
}
