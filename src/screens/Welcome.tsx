import { motion, MotionConfig } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Heart, Shield, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LandingCelestialBackground } from '@/components/shared/AtmosphericBackground'

const HERO_CTA = 'perennia-glass-button perennia-glass-button--primary group h-14 w-full rounded-full text-ivory sm:text-base'
const SECONDARY_CTA = 'perennia-glass-button perennia-glass-button--secondary h-14 w-full rounded-full text-white/95 sm:text-base'

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

function IntentionFeature({
  icon,
  heading,
  children,
  delay,
}: {
  icon: React.ReactNode
  heading: string
  children: React.ReactNode
  delay: number
}) {
  return (
    <FadeUp delay={delay} className="relative flex gap-4 sm:gap-5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-champagne/45 bg-white/[.025] text-champagne shadow-[0_0_24px_rgba(229,192,123,.12)] sm:h-16 sm:w-16">
        {icon}
      </div>
      <div className="pt-1">
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-ivory sm:text-base">{heading}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-white/72 sm:text-[0.95rem] sm:leading-7">{children}</p>
      </div>
    </FadeUp>
  )
}

function AlignmentCard({ icon, heading, children, divided = false }: { icon: React.ReactNode; heading: React.ReactNode; children: React.ReactNode; divided?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col items-center px-6 py-8 text-center sm:px-6 sm:py-10 lg:px-10 ${divided ? 'border-t border-white/15 sm:border-l sm:border-t-0' : ''}`}>
      <div className="relative mb-5 flex h-12 w-12 items-center justify-center text-champagne drop-shadow-[0_0_11px_rgba(229,192,123,.42)] sm:h-14 sm:w-14">
        {icon}
      </div>
      <h3 className="font-serif-display text-xl leading-[1.05] text-ivory lg:text-2xl">{heading}</h3>
      <p className="mt-3 max-w-xs text-sm leading-6 text-white/65">{children}</p>
    </div>
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
    <MotionConfig reducedMotion="user">
    <div className="perennia-landing-page relative isolate overflow-x-clip bg-midnight text-white">
      {/* Genuinely pinned (position: fixed) and sized with `dvh`'s
          opposite: `svh` (STATIC small-viewport height — the one value
          that never recalculates while the address bar animates). `dvh`
          continuously re-measures in real time as the browser chrome
          slides away, so everything inside visibly resized/rescaled
          throughout that animation — that's the "zoom" that was
          happening, not a one-off jump. `svh` never changes at all, so
          there's nothing to animate or snap. When the browser chrome
          hides, the real viewport does become slightly taller than this
          fixed layer for a moment — but the plain page background
          (bg-midnight) is essentially the same near-black as this
          background's own base color, so that sliver is invisible. */}
      <div className="pointer-events-none fixed inset-0 z-0 h-[100svh]">
        <LandingCelestialBackground />
      </div>

      {/* ============ HERO ============ */}
      <section className="relative z-10 min-h-[100svh] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-4xl flex-col items-center justify-center px-5 py-8 text-center sm:px-10 sm:py-10"
        >
          <div className="perennia-approved-wordmark w-[min(92vw,60rem)]" aria-label="Perennia">
            <img
              src="/perennia-logo-transparent-v2.png"
              alt=""
              width="1254"
              height="1254"
              fetchPriority="high"
              className="perennia-approved-wordmark__heart"
            />
            <span className="perennia-approved-wordmark__crescent" aria-hidden="true">☾</span>
            <h1 className="perennia-approved-wordmark__name">Perennia</h1>
            <span className="perennia-approved-wordmark__ornament" aria-hidden="true">
              <i />
              <b>✦</b>
              <i />
            </span>
          </div>

          <p className="-mt-2 font-serif-display text-xl font-medium italic tracking-[0.025em] text-[#10277a] [text-shadow:0_1px_12px_rgba(255,255,255,.55)] sm:text-2xl">
            For Love That Fits, Naturally.
          </p>
          <p className="mx-auto mb-5 mt-3 max-w-xl text-sm leading-6 text-[#091431]/85 [text-shadow:0_1px_10px_rgba(255,255,255,.65)] sm:text-base sm:leading-7">
            Perennia combines a structured compatibility system with astrological insight to
            introduce you to people with genuine long-term potential.
          </p>

          <div className="flex w-full max-w-md flex-col items-center gap-3 lg:max-w-xl">
            <Button
              size="lg"
              onClick={() => navigate('/signup')}
              className={HERO_CTA}
            >
              Begin Your Journey
              <motion.span
                className="inline-block"
                aria-hidden="true"
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
              className={SECONDARY_CTA}
            >
              Log In
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ============ A DIFFERENT KIND OF BEGINNING ============ */}
      <section className="relative z-10 flex w-full items-center overflow-hidden px-6 py-24 sm:min-h-[68rem] sm:px-12 sm:py-28 lg:min-h-[56rem] lg:px-20">
        <div className="mx-auto w-full max-w-7xl">
          <FadeUp className="max-w-4xl text-left">
            <p className="mb-5 text-[0.68rem] font-medium uppercase tracking-[0.32em] text-gold/80 sm:mb-7 sm:text-xs sm:tracking-[0.4em]">
              A Different Kind of Beginning
            </p>
            <h2 className="font-serif-display text-[clamp(2.05rem,9vw,5.75rem)] font-medium leading-[0.96] tracking-[-0.025em]">
              <span className="block text-ivory [text-shadow:0_3px_28px_rgba(158,176,220,.22)]">Some connections aren’t</span>
              <span className="block pt-1 text-gradient-gold italic sm:pt-2">found.</span>
              <span className="block pt-1 text-ivory [text-shadow:0_3px_28px_rgba(158,176,220,.22)] sm:pt-2">They’re recognised.</span>
            </h2>
          </FadeUp>

          {/* What We Believe — deliberately subordinate in scale to the
              statement above; generous top margin preserves the breathing
              space the brief calls for between the two. */}
          <FadeUp delay={0.15} className="mt-20 max-w-2xl text-left sm:mt-28 lg:mt-32">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.32em] text-gold/80 sm:text-xs sm:tracking-[0.4em]">
              What We Believe
            </p>
            <h3 className="mt-5 font-serif-display text-xl font-medium leading-[1.2] text-ivory sm:mt-6 sm:text-2xl lg:text-[1.85rem]">
              Not more matches.
              <br />
              Something worth building.
            </h3>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/72 sm:mt-6 sm:text-base sm:leading-8">
              Perennia is built for people looking for more than a moment — for connection with
              the potential to become something lasting.
            </p>

            <p className="mt-10 font-serif-display text-lg italic text-gradient-gold sm:mt-12 sm:text-xl">
              And lasting love can become something bigger.
            </p>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/72 sm:mt-6 sm:text-base sm:leading-8">
              Strong relationships can create stronger foundations for families. By helping people
              begin with greater compatibility and intention, Perennia is built to encourage more
              enduring partnerships from the start.
            </p>

            <div aria-hidden="true" className="mt-10 flex items-center gap-3 text-gold/60 sm:mt-12">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/50" />
              <span className="h-1 w-1 rotate-45 bg-gold/60" />
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold/50" />
            </div>
            <p className="mt-6 text-[0.65rem] font-medium uppercase tracking-[0.32em] text-white/58 sm:text-xs sm:tracking-[0.4em]">
              Compatibility · Intention · Longevity
            </p>

            <p className="mt-8 font-serif-display text-sm italic text-white/48 sm:mt-10 sm:text-base">
              For Love That Fits, Naturally.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ============ RARE ALIGNMENT ============ */}
      <section className="relative z-10 flex w-full items-center justify-center overflow-hidden px-4 py-24 sm:px-8 sm:py-28 lg:min-h-[52rem]">
        <div className="mx-auto w-full max-w-7xl">
          <FadeUp className="text-center">
            <h2 className="font-serif-display text-[clamp(2.15rem,12vw,3.35rem)] font-medium leading-[0.98] tracking-[-0.02em] sm:text-[5.1rem] lg:text-[6.25rem]">
              <span className="block text-gradient-gold not-italic uppercase tracking-[0.025em]">Rare Alignment</span>
              <span className="block text-ivory [text-shadow:0_3px_26px_rgba(160,178,222,.2)]">isn’t a feature.</span>
              <span className="block pt-1 text-gradient-gold italic sm:pt-2">It’s a feeling.</span>
            </h2>

            <div aria-hidden="true" className="mx-auto mt-9 flex w-full max-w-xl items-center gap-3 text-gold sm:mt-12 sm:gap-5">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/55 to-gold/80" />
              <span className="h-1 w-1 rotate-45 bg-gold/70" />
              <span className="relative flex h-8 w-8 rotate-45 items-center justify-center border border-gold/75 shadow-[0_0_16px_rgba(229,192,123,.28)]">
                <span className="h-2.5 w-2.5 border border-gold/90 bg-gold/10" />
              </span>
              <span className="h-1 w-1 rotate-45 bg-gold/70" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold/55 to-gold/80" />
            </div>
          </FadeUp>

          <FadeUp delay={0.12} className="mx-auto mt-12 grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[1.75rem] border border-champagne/25 bg-white/[.025] shadow-[0_18px_70px_rgba(2,7,25,.2),inset_0_1px_rgba(255,255,255,.05)] backdrop-blur-[3px] sm:mt-16 sm:grid-cols-3 sm:rounded-[2rem]">
            <AlignmentCard
              icon={
                <span className="relative inline-flex">
                  <Heart className="h-10 w-10" strokeWidth={1.25} />
                  <Sparkles className="absolute -right-2 -top-2 h-4 w-4 text-gold" strokeWidth={1.4} />
                </span>
              }
              heading={<>Meaningful<br />Connections</>}
            >
              We focus on genuine compatibility to help you find lasting bonds.
            </AlignmentCard>

            <AlignmentCard
              divided
              icon={
                <span className="relative block h-11 w-14" aria-hidden="true">
                  <span className="absolute left-1 top-2 h-8 w-8 rounded-full border-[1.5px] border-champagne" />
                  <span className="absolute right-1 top-2 h-8 w-8 rounded-full border-[1.5px] border-champagne" />
                  <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-gold shadow-[0_0_8px_rgba(229,192,123,.75)]" />
                </span>
              }
              heading={<>Built for<br />Lasting Love</>}
            >
              Not just matches, but relationships that grow and endure.
            </AlignmentCard>

            <AlignmentCard
              divided
              icon={
                <span className="relative inline-flex">
                  <Shield className="h-11 w-11" strokeWidth={1.2} />
                  <Sparkles className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-gold" strokeWidth={1.5} />
                </span>
              }
              heading={<>Safe by<br />Design</>}
            >
              A trusted space for everyone serious about building a future.
            </AlignmentCard>
          </FadeUp>
        </div>
      </section>

      {/* ============ BUILT ON INTENTION ============ */}
      <section className="relative z-10 w-full overflow-hidden px-5 py-24 sm:px-10 sm:py-28 lg:py-32">
        <div className="mx-auto w-full max-w-7xl">
          <FadeUp className="text-center lg:text-left">
            <p className="text-xs font-medium uppercase tracking-[0.38em] text-champagne sm:text-sm">Built on Intention</p>
            <div aria-hidden="true" className="mx-auto mt-5 flex w-28 items-center gap-3 text-gold lg:mx-0">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/70" />
              <span className="h-2 w-2 rotate-45 border border-gold/80 shadow-[0_0_12px_rgba(229,192,123,.5)]" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/70" />
            </div>
          </FadeUp>

          <div className="mx-auto mt-14 grid max-w-2xl gap-10 sm:gap-12 lg:mx-0 lg:mt-16 lg:max-w-[38rem]">
            <IntentionFeature icon={<ShieldCheck className="h-7 w-7" strokeWidth={1.35} />} heading="Verified Members Only" delay={0.05}>
              Every profile is identity verified to help keep the Perennia community genuine and safer.
            </IntentionFeature>
            <IntentionFeature icon={<Heart className="h-7 w-7" strokeWidth={1.35} />} heading="80%+ Compatibility" delay={0.12}>
              Perennia only introduces you to profiles that meet your compatibility threshold.
            </IntentionFeature>
            <IntentionFeature icon={<Sparkles className="h-7 w-7" strokeWidth={1.35} />} heading="A Deeper Match" delay={0.19}>
              Compatibility goes beyond first impressions. Perennia is designed to help you discover connections with the potential to grow into something meaningful and lasting.
            </IntentionFeature>
          </div>
        </div>
      </section>

      {/* ============ STORIES, NOT STATISTICS ============
          No background of its own — rendered directly over the page's
          existing pinned celestial layer, same as "Built on Intention"
          above it, so there's no visible seam between sections. */}
      <section className="relative z-10 flex w-full items-center justify-center overflow-hidden px-6 py-24 sm:py-32 lg:min-h-[58rem]">
        <FadeUp className="flex w-full max-w-3xl flex-col items-center text-center">
          <span aria-hidden="true" className="font-serif-display text-3xl leading-none text-gold [text-shadow:0_0_20px_rgba(229,192,123,.72)] sm:text-4xl">✦</span>

          <h2 className="mt-6 font-serif-display text-[4.1rem] font-medium leading-[0.86] tracking-[-0.025em] text-ivory [text-shadow:0_4px_28px_rgba(159,178,224,.22)] sm:text-[6.6rem] lg:text-[7.25rem]">
            Stories,
            <br />
            Not
            <br />
            <span className="inline-block pt-2 text-gradient-gold italic sm:pt-4">Statistics</span>
          </h2>

          <div aria-hidden="true" className="mt-9 flex w-44 items-center gap-3 text-gold sm:mt-12 sm:w-56">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/70" />
            <span className="font-serif-display text-sm leading-none">✦</span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/70" />
          </div>

          <p className="mx-auto mt-10 max-w-xl text-lg font-light leading-8 tracking-[0.015em] text-white/70 sm:mt-12 sm:text-xl sm:leading-9">
            We’re not here to
            <br />
            impress you with numbers.
          </p>
          <p className="mx-auto mt-6 max-w-xl text-lg font-light leading-8 tracking-[0.015em] text-white/70 sm:mt-8 sm:text-xl sm:leading-9">
            We’re here to help you
            <br />
            find the one the numbers
            <br />
            can’t explain.
          </p>

          <Heart className="mt-10 h-9 w-9 text-gold drop-shadow-[0_0_12px_rgba(229,192,123,.35)] sm:mt-12" strokeWidth={1.2} />

          <Button size="lg" onClick={() => navigate('/signup')} className={`${HERO_CTA} mt-8 h-16 max-w-md text-sm sm:mt-10 sm:w-auto sm:min-w-96 sm:text-base`}>
            Begin Your Journey
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </FadeUp>
      </section>

      <footer className="relative z-10 border-t border-white/5 bg-midnight/75 px-6 py-8 text-center text-xs text-white/30 backdrop-blur-sm">
        © 2026 Perennia. For love that fits, naturally.
      </footer>
    </div>
    </MotionConfig>
  )
}
