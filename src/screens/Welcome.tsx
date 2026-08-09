import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Heart, Infinity as InfinityIcon, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AtmosphericBackground } from '@/components/shared/AtmosphericBackground'

const principles = [
  {
    icon: Heart,
    title: 'Meaningful Connections',
    body: 'Focused on genuine compatibility and lasting bonds.',
  },
  {
    icon: InfinityIcon,
    title: 'Built for Lasting Love',
    body: 'Not simply matches, but relationships with the potential to grow and endure.',
  },
  {
    icon: ShieldCheck,
    title: 'Intentional and Safe',
    body: 'A trusted environment for people serious about building a future.',
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

// The public landing page's job is to make someone want to see what Perennia
// is — not to demonstrate the product. Deliberately just 5 sections; the
// astrology/compatibility mechanics, verification flow, discovery, profile
// orbit, and messaging are all real, but they're discoveries you make after
// joining, not marketing copy before it.
export function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="relative overflow-hidden bg-midnight text-white">
      <div className="fixed inset-0 z-0">
        <AtmosphericBackground />
      </div>

      {/* Nav — wordmark + the one login action. No signup button here; the
          only place to join is the hero's primary CTA. */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-gold" />
          <span className="font-serif-display text-2xl text-gradient-gold">Perennia</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
          Log In
        </Button>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative flex flex-col items-center px-6 pb-16 pt-10 text-center sm:pt-14">
        {/* The supplied artwork already bakes in the heart, "Perennia"
            wordmark, divider, tagline, and description — shown at its
            natural aspect ratio (never cropped) so nothing in it is ever
            hidden or guessed at. The real buttons live in genuinely
            separate space below, not overlaid on top of it, so they can
            never collide with the artwork's own text on any device. */}
        <img src="/landingPage-Mobile1.JPG" alt="" className="w-full max-w-[420px] md:hidden" />
        <img src="/landingPage-Desktop1.JPG" alt="" className="hidden w-full max-w-2xl md:block" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 -mt-2 flex flex-col items-center sm:-mt-4"
        >
          <h1 className="sr-only">Perennia</h1>
          <p className="sr-only">For Love That Fits, Naturally.</p>
          <p className="sr-only">
            Perennia combines a structured compatibility system with astrological insight to
            introduce you to people with genuine long-term potential.
          </p>

          <div className="flex w-full max-w-xs flex-col items-center gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/signup')}
              className="group w-full uppercase tracking-wide sm:w-auto"
            >
              Begin Your Story
              <motion.span
                className="inline-block"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate('/login')}
              className="w-full border border-lavender/30 bg-navy/50 uppercase tracking-wide text-white/85 backdrop-blur-sm shadow-[0_0_24px_-10px_rgba(142,108,246,0.5)] hover:bg-navy/65 hover:border-lavender/50 hover:text-white sm:w-auto"
            >
              Log In
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ============ A DIFFERENT KIND OF BEGINNING ============ */}
      <section className="relative z-10 h-[75vh] min-h-[520px] w-full overflow-hidden">
        <img src="/landingPage-Mobile2.JPG" alt="" className="h-full w-full object-cover md:hidden" />
        <img src="/landingPage-Desktop2.JPG" alt="" className="hidden h-full w-full object-cover md:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/50 to-transparent" />
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

      {/* ============ COMPATIBILITY FIRST ============ */}
      <section className="relative z-10 mx-auto max-w-2xl px-6 py-24 text-center md:py-32">
        <FadeUp>
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gold/70">Compatibility First</p>
          <h2 className="font-serif-display mb-6 text-4xl leading-tight md:text-5xl">
            Meet fewer people.
            <br />
            Meet <span className="text-gradient-gold italic">people who fit</span>.
          </h2>
          <p className="text-white/55 leading-relaxed">
            Perennia is designed to introduce you to people with stronger natural compatibility
            and genuine potential for something lasting.
          </p>
        </FadeUp>
      </section>

      {/* ============ RARE ALIGNMENT ============ */}
      <section className="relative z-10">
        <div className="relative h-[55vh] min-h-[380px] w-full overflow-hidden">
          <img src="/landingPage-Mobile3.JPG" alt="" className="h-full w-full object-cover object-top md:hidden" />
          <img src="/landingPage-Desktop3.JPG" alt="" className="hidden h-full w-full object-cover object-top md:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/10 to-transparent" />
        </div>

        <div className="mx-auto max-w-4xl px-6 pb-24 pt-4 text-center md:pb-32">
          <FadeUp>
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gold/70">Rare Alignment</p>
            <h2 className="font-serif-display mb-16 text-3xl leading-snug italic md:text-5xl">
              Rare alignment isn't a feature.
              <br />
              <span className="text-gradient-gold">It's a feeling.</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
            {principles.map((p, i) => (
              <FadeUp key={p.title} delay={i * 0.1} className="flex flex-col items-center sm:border-l sm:border-white/10 sm:first:border-l-0 sm:px-4">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/5">
                  <p.icon className="h-5 w-5 text-gold" />
                </div>
                <h3 className="font-serif-display mb-2 text-lg text-champagne">{p.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{p.body}</p>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.3} className="mt-16">
            <p className="text-xs uppercase tracking-[0.25em] text-white/35">
              Every member is identity verified before appearing in Discovery.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ============ FINAL CTA — cinematic city skyline, full bleed ============ */}
      <section className="relative z-10 h-[70vh] min-h-[480px] w-full overflow-hidden">
        <img src="/landingPage-Mobile4.JPG" alt="" className="h-full w-full object-cover md:hidden" />
        <img src="/landingPage-Desktop4.JPG" alt="" className="hidden h-full w-full object-cover md:block" />
        <div className="absolute inset-0 bg-midnight/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <FadeUp>
            <h2 className="font-serif-display mb-5 max-w-2xl text-4xl leading-tight [text-shadow:0_4px_24px_rgba(0,0,0,0.85)] md:text-6xl">
              Your Story Deserves a <span className="text-gradient-gold italic">Beautiful Beginning</span>
            </h2>
            <p className="mx-auto mb-10 max-w-md text-white/65 [text-shadow:0_2px_12px_rgba(0,0,0,0.7)]">
              Ready to discover a different way to meet someone?
            </p>
            <Button size="lg" onClick={() => navigate('/signup')} className="group">
              Begin Your Story
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
