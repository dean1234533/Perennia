import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { LandingCelestialBackground } from '@/components/shared/AtmosphericBackground'
import { CelestialHeart } from '@/components/shared/CelestialHeart'
import { getOnboardingStepByRoute, ONBOARDING_STEPS, ONBOARDING_TOTAL_STEPS } from '@/lib/onboardingFlow'

export function OnboardingShell({
  children,
  headerMark,
  progressVariant = 'bars',
  className = '',
}: {
  children: ReactNode
  headerMark?: ReactNode
  progressVariant?: 'bars' | 'nodes'
  className?: string
}) {
  const shouldReduceMotion = useReducedMotion()
  const location = useLocation()
  const previewScreenId = location.pathname === '/dev/design-preview'
    ? new URLSearchParams(location.search).get('screen')
    : null
  const previewStep = previewScreenId
    ? ONBOARDING_STEPS.find((step) => step.id === previewScreenId)
    : undefined
  const currentStep = previewStep ?? getOnboardingStepByRoute(location.pathname)
  const displayedStep = currentStep ? ONBOARDING_STEPS.indexOf(currentStep) + 1 : undefined
  const displayedTotalSteps = currentStep ? ONBOARDING_TOTAL_STEPS : undefined

  return (
    <div className={`relative flex min-h-screen flex-col items-center bg-midnight text-white ${className}`}>
      {/* Absolutely (not fixed-)positioned so it stretches to cover the
          whole scrollable page rather than just one viewport height — a
          `fixed` full-bleed background gets visibly resized/jumped by
          mobile browsers as the address bar hides/shows mid-scroll. */}
      <div className="absolute inset-0 z-0">
        <LandingCelestialBackground />
      </div>

      <div className="relative z-10 flex w-full flex-1 flex-col items-center px-6 py-8 sm:py-10">
        {/* The same celestial heart sits on every onboarding screen, so it
            reads as a consistent marker that you're still inside the
            Perennia setup journey — it's onboarding-only, not part of the
            regular app chrome once a member is through it. */}
        {headerMark ?? <CelestialHeart className="mb-5 h-16 w-16 sm:h-20 sm:w-20" />}

        {displayedStep !== undefined && displayedTotalSteps !== undefined && (
          <div className={`relative mb-8 flex w-full max-w-sm items-center sm:mb-10 ${progressVariant === 'nodes' ? 'gap-0' : 'gap-1.5'}`}>
            {Array.from({ length: displayedTotalSteps }).map((_, i) => {
              const isCurrent = i === displayedStep - 1
              const isCompleted = i < displayedStep - 1
              if (progressVariant === 'nodes') {
                return (
                  <div key={i} className="relative flex flex-1 items-center last:flex-none">
                    {i > 0 && (
                      <span className={`absolute right-1/2 top-1/2 h-px w-full -translate-y-1/2 ${i <= displayedStep - 1 ? 'bg-gold/80' : 'bg-white/20'}`} />
                    )}
                    <span
                      className={`relative z-10 block rounded-full border ${isCurrent
                        ? 'h-4 w-4 border-gold bg-midnight shadow-[0_0_12px_2px_rgba(229,192,123,.48)] before:absolute before:inset-[3px] before:rounded-full before:bg-gold'
                        : isCompleted
                          ? 'h-2.5 w-2.5 border-gold bg-gold shadow-[0_0_7px_rgba(229,192,123,.5)]'
                          : 'h-2.5 w-2.5 border-white/25 bg-midnight'}
                      `}
                    />
                  </div>
                )
              }
              return (
                <div key={i} className="relative flex-1">
                  {isCurrent && (
                    <motion.div
                      layoutId="onboarding-step-marker"
                      className="absolute -top-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_6px_1px_rgba(229,192,123,0.6)]"
                    />
                  )}
                  <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
                    {i < displayedStep && (
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-champagne"
                        initial={shouldReduceMotion ? false : { width: 0 }}
                        animate={{ width: '100%' }}
                        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex w-full flex-1 flex-col items-center justify-center">{children}</div>
      </div>
    </div>
  )
}
