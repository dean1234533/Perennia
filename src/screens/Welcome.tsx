import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LandingCelestialBackground } from '@/components/shared/AtmosphericBackground'
import { CelestialHeart } from '@/components/shared/CelestialHeart'

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
        <LandingCelestialBackground />
      </div>

      {/* Nav — wordmark + the one login action. No signup button here; the
          only place to join is the hero's primary CTA. */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <CelestialHeart className="h-10 w-10" />
          <span className="font-serif-display text-2xl text-gradient-gold">Perennia</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
          Log In
        </Button>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative min-h-[92vh] overflow-hidden sm:min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 pb-10 text-center"
        >
          <CelestialHeart className="mb-2 h-32 w-32 sm:h-40 sm:w-40" />
          <p className="mb-4 text-xs uppercase tracking-[.42em] text-gold/80">Written in the stars. Chosen by you.</p>
          <h1 className="font-serif-display text-6xl tracking-wide text-ivory [text-shadow:0_4px_32px_rgba(0,0,0,.8)] sm:text-8xl">Perennia</h1>
          <p className="mt-2 font-serif-display text-2xl italic text-champagne/90 sm:text-3xl">For Love That Fits, Naturally.</p>
          <p className="mx-auto mb-9 mt-5 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
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

      {/* ============ RARE ALIGNMENT ============ */}
      {/* Background image only, shown in full (no cropping) — the artwork
          carries this section on its own. */}
      <section className="relative z-10 flex w-full items-center justify-center bg-midnight">
        <img src="/landingPage-Mobile3.JPG" alt="Rare alignment isn't a feature. It's a feeling." className="w-full md:hidden" />
        <img src="/landingPage-Desktop3.JPG" alt="Rare alignment isn't a feature. It's a feeling." className="hidden w-full md:block" />
      </section>

      {/* ============ FINAL CTA ============ */}
      {/* Background image only, shown in full (no cropping) — this artwork
          already carries its own complete message. */}
      <section className="relative z-10 flex w-full items-center justify-center bg-midnight">
        <img src="/landingPage-Mobile4.JPG" alt="Your story deserves a beautiful beginning." className="w-full md:hidden" />
        <img src="/landingPage-Desktop4.JPG" alt="Your story deserves a beautiful beginning." className="hidden w-full md:block" />
      </section>

      {/* ============ BEGIN YOUR STORY ============ */}
      {/* "Stories, Not Statistics" artwork carries its own message in the
          upper portion, with genuinely empty starfield below it — the
          button sits there, in real open space rather than over any
          baked-in text. */}
      <section className="relative z-10 flex min-h-[70vh] w-full items-center justify-center overflow-hidden bg-midnight sm:min-h-[80vh]">
        <img src="/landingPage-Mobile5.png" alt="Stories, not statistics." className="absolute inset-0 h-full w-full object-cover md:hidden" />
        <img src="/landingPage-Desktop5.png" alt="Stories, not statistics." className="absolute inset-0 hidden h-full w-full object-cover md:block" />
        <div className="absolute inset-x-0 top-[77%] z-10 flex justify-center px-6 md:top-[57%]">
          <Button size="lg" onClick={() => navigate('/signup')} className="group">
            Begin Your Story
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center text-xs text-white/30">
        © 2026 Perennia. For love that fits, naturally.
      </footer>
    </div>
  )
}
