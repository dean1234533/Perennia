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
      {/* Absolutely (not fixed-)positioned so it stretches to cover the
          whole scrollable page rather than just one viewport height — a
          `fixed` full-bleed background gets visibly resized/jumped by
          mobile browsers as the address bar hides/shows mid-scroll. */}
      <div className="absolute inset-0 z-0">
        <LandingCelestialBackground />
      </div>

      {/* ============ HERO ============ */}
      <section className="relative min-h-screen overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-start px-6 pb-6 pt-16 text-center sm:justify-center sm:px-10 sm:py-6"
        >
          <CelestialHeart className="h-40 w-40 sm:h-32 sm:w-32" />
          <span aria-hidden="true" className="-mt-2 font-serif-display text-3xl leading-none text-ivory [text-shadow:0_0_16px_rgba(173,194,255,.75)]">☾</span>

          <h1 className="mt-1 font-serif-display text-[4.1rem] font-medium uppercase leading-none tracking-[0.025em] text-ivory [text-shadow:0_3px_28px_rgba(157,175,255,.35)] sm:text-[6rem] lg:text-[6.5rem]">
            Perennia
          </h1>

          <div aria-hidden="true" className="my-3 flex w-full max-w-md items-center justify-center gap-3 text-lavender">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/75 to-white/25" />
            <span className="h-1 w-1 rounded-full bg-white/80" />
            <span className="h-2.5 w-2.5 rotate-45 border border-lavender/80" />
            <span className="h-4 w-4 rotate-45 border border-lavender bg-nebula-purple/35 shadow-[0_0_14px_rgba(142,108,246,.8)]" />
            <span className="h-2.5 w-2.5 rotate-45 border border-lavender/80" />
            <span className="h-1 w-1 rounded-full bg-white/80" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-white/75 to-white/25" />
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.34em] text-champagne sm:text-sm">
            For Love That Fits, Naturally.
          </p>
          <p className="mx-auto mb-5 mt-3 max-w-xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
            Perennia combines a structured compatibility system with astrological insight to
            introduce you to people with genuine long-term potential.
          </p>

          <div className="flex w-full max-w-md flex-col items-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate('/signup')}
              className="group h-14 w-full border border-ivory/80 uppercase tracking-[0.15em] shadow-[0_0_24px_rgba(229,192,123,.22)] sm:text-base"
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
              className="h-14 w-full border border-lavender/35 bg-navy/45 uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm hover:border-lavender/55 hover:bg-navy/65 hover:text-white sm:text-base"
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
      <section className="relative z-10 flex w-full items-center justify-center bg-midnight">
        <img src="/landingPage-Mobile3.JPG" alt="Rare alignment isn't a feature. It's a feeling." className="w-full md:hidden" />
        <img src="/landingPage-Desktop3.JPG" alt="Rare alignment isn't a feature. It's a feeling." className="hidden w-full md:block" />
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative z-10 flex w-full items-center justify-center bg-midnight">
        <img src="/landingPage-Mobile4.JPG" alt="Your story deserves a beautiful beginning." className="w-full md:hidden" />
        <img src="/landingPage-Desktop4.JPG" alt="Your story deserves a beautiful beginning." className="hidden w-full md:block" />
      </section>

      {/* ============ BEGIN YOUR STORY ============ */}
      <section className="relative z-10 flex min-h-[70vh] w-full items-center justify-center overflow-hidden bg-midnight sm:min-h-[80vh]">
        <img src="/landingPage-Mobile5.png" alt="Stories, not statistics." className="absolute inset-0 h-full w-full object-cover md:hidden" />
        <img src="/landingPage-Desktop5.png" alt="Stories, not statistics." className="absolute inset-0 hidden h-full w-full object-cover md:block" />
        <div className="landing-final-cta absolute inset-x-0 z-10 flex justify-center px-6">
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
