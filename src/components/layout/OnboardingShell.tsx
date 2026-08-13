import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LandingCelestialBackground } from '@/components/shared/AtmosphericBackground'
import { CelestialHeart } from '@/components/shared/CelestialHeart'
import { useApp } from '@/context/AppContext'

const RESUMABLE_ONBOARDING_PATHS = new Set([
  '/verify',
  '/birth-details',
  '/preferences',
  '/relationship-goals',
  '/interests',
  '/about-you',
  '/profile-photo',
  '/your-story',
  '/cosmic-profile',
])

export function OnboardingShell({
  children,
  step,
  totalSteps,
}: {
  children: ReactNode
  step?: number
  totalSteps?: number
}) {
  const location = useLocation()
  const { onboarding, onboardingComplete, profileLoaded, updateOnboarding } = useApp()

  // Store the actual screen being viewed. This makes a later sign-in resume
  // optional steps exactly, rather than guessing solely from required fields.
  useEffect(() => {
    if (
      profileLoaded &&
      !onboardingComplete &&
      RESUMABLE_ONBOARDING_PATHS.has(location.pathname) &&
      onboarding.onboardingResumePath !== location.pathname
    ) {
      void updateOnboarding({ onboardingResumePath: location.pathname }).catch((error) => {
        console.warn('[Perennia] Failed to save onboarding position:', error)
      })
    }
  }, [location.pathname, onboarding.onboardingResumePath, onboardingComplete, profileLoaded, updateOnboarding])

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-midnight text-white">
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
        <CelestialHeart className="mb-5 h-16 w-16 sm:h-20 sm:w-20" />

        {step !== undefined && totalSteps !== undefined && (
          <div className="relative mb-8 flex w-full max-w-sm items-center gap-1.5 sm:mb-10">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const isCurrent = i === step - 1
              return (
                <div key={i} className="relative flex-1">
                  {isCurrent && (
                    <motion.div
                      layoutId="onboarding-step-marker"
                      className="absolute -top-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_6px_1px_rgba(229,192,123,0.6)]"
                    />
                  )}
                  <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
                    {i < step && (
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-champagne"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
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
