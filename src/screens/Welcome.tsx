import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Moon, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AtmosphericBackground } from '@/components/shared/AtmosphericBackground'
import { editorial } from '@/data/editorial-images'
import {
  CosmicProfileMockup, CompatibilityMockup, MessagingMockup,
  VerificationMockup, ProfileMockup, MatchesMockup,
} from '@/components/shared/ProductMockups'

const testimonials = [
  {
    quote: 'I had given up on dating apps entirely. Perennia felt like the first one that actually understood what I was looking for — not just who.',
    name: 'Charlotte, 31',
    role: 'Married her match in 2025',
  },
  {
    quote: 'The compatibility report before our first date told me more than three months of messaging on other apps ever did.',
    name: 'Daniel, 34',
    role: 'In a relationship since 2024',
  },
  {
    quote: 'It felt less like swiping and more like being introduced by someone who actually knew us both.',
    name: 'Priya, 29',
    role: 'Engaged, 2026',
  },
]

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="relative overflow-hidden bg-midnight text-white">
      <div className="fixed inset-0 z-0">
        <AtmosphericBackground />
      </div>

      {/* Founding 500 announcement banner */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => navigate('/founding-500')}
        className="group relative z-20 flex w-full cursor-pointer items-center justify-center gap-2 bg-gradient-to-r from-gold/20 via-champagne/25 to-gold/20 px-4 py-2.5 text-center text-xs font-medium text-champagne transition-colors hover:from-gold/30 hover:via-champagne/35 hover:to-gold/30 sm:text-sm"
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold" />
        <span>
          <span className="hidden sm:inline">Introducing the </span>Founding 500 — join us at the beginning
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </motion.button>

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

      {/* ============ HERO ============ */}
      <section className="relative z-10 flex flex-col items-center px-6 pb-20 pt-16 text-center md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full glass border-lavender/20 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-champagne/80"
        >
          <Moon className="h-3.5 w-3.5 text-lavender" />
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
      </section>

      {/* ============ EDGE-TO-EDGE CINEMATIC COUPLE IMAGE ============ */}
      <section className="relative z-10 h-[80vh] min-h-[560px] w-full overflow-hidden">
        <motion.img
          initial={{ scale: 1.08 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
          src={editorial.coupleGoldenLight}
          alt="Two people at golden hour"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/45 to-midnight/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-midnight/85 via-midnight/30 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-xl px-6 md:px-16">
            <FadeUp>
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gold/80 [text-shadow:0_2px_16px_rgba(0,0,0,0.9)]">A Different Kind of Beginning</p>
              <h2 className="font-serif-display text-4xl leading-[1.1] [text-shadow:0_4px_24px_rgba(0,0,0,0.85)] md:text-6xl">
                Some connections aren't <span className="text-gradient-gold italic">found</span>.
                <br />
                They're recognized.
              </h2>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ============ HOW COMPATIBILITY WORKS — split, text left ============ */}
      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-24 md:py-32 lg:grid-cols-2 lg:gap-20">
        <FadeUp>
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold/70">Your Cosmic Profile</p>
          <h2 className="font-serif-display mb-6 text-4xl leading-tight md:text-5xl">
            Compatibility begins with <span className="text-gradient-gold italic">who you are</span>
          </h2>
          <p className="mb-8 max-w-md text-white/55 leading-relaxed">
            Your birth details, values, and story shape a profile far richer than a list of
            hobbies — the foundation every introduction we make is built on.
          </p>
          <Button variant="link" onClick={() => navigate('/signup')} className="text-base">
            Build Your Profile <ArrowRight className="h-4 w-4" />
          </Button>
        </FadeUp>
        <FadeUp delay={0.15}>
          <CosmicProfileMockup />
        </FadeUp>
      </section>

      {/* ============ COMPATIBILITY REPORT — full-width showcase ============ */}
      <section className="relative z-10 px-6 py-24 md:py-32">
        <FadeUp className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold/70">The Compatibility Report</p>
          <h2 className="font-serif-display text-4xl leading-tight md:text-5xl">
            Not a guess. <span className="text-gradient-gold italic">A calculation.</span>
          </h2>
          <p className="mt-5 text-white/55 leading-relaxed">
            Six dimensions of alignment — emotional, intellectual, and astrological — distilled
            into a single, honest number before you ever say hello.
          </p>
        </FadeUp>
        <FadeUp delay={0.1} className="mx-auto max-w-2xl">
          <CompatibilityMockup />
        </FadeUp>
      </section>

      {/* ============ PROFILE SHOWCASE — split, image left ============ */}
      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-24 md:py-32 lg:grid-cols-2 lg:gap-20">
        <FadeUp className="order-2 lg:order-1">
          <ProfileMockup />
        </FadeUp>
        <FadeUp delay={0.15} className="order-1 lg:order-2">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold/70">Discovery, Reimagined</p>
          <h2 className="font-serif-display mb-6 text-4xl leading-tight md:text-5xl">
            Explore someone's world, <span className="text-gradient-gold italic">not their résumé</span>
          </h2>
          <p className="mb-8 max-w-md text-white/55 leading-relaxed">
            Full-screen galleries, rich profiles, and a curated collection instead of an endless
            feed — a handful of people worth actually getting to know.
          </p>
          <Button variant="link" onClick={() => navigate('/signup')} className="text-base">
            See How It Works <ArrowRight className="h-4 w-4" />
          </Button>
        </FadeUp>
      </section>

      {/* ============ HANDS TOUCHING — full bleed emotional beat ============ */}
      <section className="relative z-10 h-[60vh] min-h-[420px] w-full overflow-hidden">
        <img src={editorial.handsTouching} alt="Two hands touching" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-midnight/30" />
        <div className="absolute inset-0 flex items-end justify-center pb-16">
          <FadeUp className="text-center">
            <p className="font-serif-display text-2xl italic text-champagne [text-shadow:0_2px_16px_rgba(0,0,0,0.8)] md:text-3xl">
              "Rare alignment isn't a feature. It's a feeling."
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ============ MESSAGING — split, text left ============ */}
      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-24 md:py-32 lg:grid-cols-2 lg:gap-20">
        <FadeUp>
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold/70">Conversation, Elevated</p>
          <h2 className="font-serif-display mb-6 text-4xl leading-tight md:text-5xl">
            Say something <span className="text-gradient-gold italic">worth reading</span>
          </h2>
          <p className="mb-8 max-w-md text-white/55 leading-relaxed">
            A messaging experience built for intention — read receipts, voice notes, and reactions
            that feel like a conversation, not a transaction.
          </p>
          <Button variant="link" onClick={() => navigate('/signup')} className="text-base">
            Start Talking <ArrowRight className="h-4 w-4" />
          </Button>
        </FadeUp>
        <FadeUp delay={0.15}>
          <MessagingMockup />
        </FadeUp>
      </section>

      {/* ============ VERIFICATION + MATCHES — asymmetric two-up ============ */}
      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-24 md:py-32 md:grid-cols-5">
        <FadeUp className="md:col-span-3">
          <VerificationMockup />
        </FadeUp>
        <FadeUp delay={0.12} className="md:col-span-2">
          <MatchesMockup />
        </FadeUp>
      </section>

      {/* ============ LUXURY CITY — relationship insights, oversized stats ============ */}
      <section className="relative z-10 w-full overflow-hidden">
        <div className="relative min-h-[70vh]">
          <img src={editorial.citySkyline} alt="City at golden hour" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-midnight/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/70 to-midnight/40" />
          <div className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center">
            <FadeUp>
              <p className="mb-6 text-xs uppercase tracking-[0.3em] text-gold/80">Built On Intention</p>
            </FadeUp>
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-16">
              {[
                { n: '12,000+', l: 'Verified Members' },
                { n: '94%', l: 'Report Genuine Compatibility' },
                { n: '6', l: 'Dimensions Analyzed Per Match' },
              ].map((stat, i) => (
                <FadeUp key={stat.l} delay={i * 0.12}>
                  <p className="font-serif-display text-gradient-gold text-5xl md:text-6xl">{stat.n}</p>
                  <p className="mt-3 text-xs uppercase tracking-widest text-white/50">{stat.l}</p>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS — magazine pull-quotes ============ */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32">
        <FadeUp className="mb-16 text-center">
          <h2 className="font-serif-display text-4xl md:text-5xl">
            Stories, Not <span className="text-gradient-gold italic">Statistics</span>
          </h2>
        </FadeUp>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.12}>
              <Sparkles className="mb-5 h-5 w-5 text-gold/60" />
              <p className="font-serif-display mb-6 text-xl italic leading-snug text-white/90">
                "{t.quote}"
              </p>
              <p className="text-sm text-champagne">{t.name}</p>
              <p className="text-xs text-white/40">{t.role}</p>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ============ FINAL CTA — cinematic sunset, full bleed ============ */}
      <section className="relative z-10 h-[70vh] min-h-[480px] w-full overflow-hidden">
        <img src={editorial.cinematicSunset} alt="Cinematic sunset" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-midnight/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <FadeUp>
            <h2 className="font-serif-display mb-5 max-w-2xl text-4xl leading-tight [text-shadow:0_4px_24px_rgba(0,0,0,0.85)] md:text-6xl">
              Your Story Deserves a <span className="text-gradient-gold italic">Beautiful Beginning</span>
            </h2>
            <p className="mx-auto mb-10 max-w-md text-white/65 [text-shadow:0_2px_12px_rgba(0,0,0,0.7)]">
              Join thousands who have found a love that truly fits — written in the stars,
              grounded in reality.
            </p>
            <Button size="lg" onClick={() => navigate('/signup')}>
              Begin Your Story
            </Button>
          </FadeUp>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center text-xs text-white/30">
        © 2026 Perennia. For love that fits, naturally.
      </footer>
    </div>
  )
}
