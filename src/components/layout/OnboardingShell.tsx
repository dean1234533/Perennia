import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Heart, Sparkles } from 'lucide-react'
import { AtmosphericBackground } from '@/components/shared/AtmosphericBackground'

export function OnboardingShell({
  children,
  step,
  totalSteps,
}: {
  children: ReactNode
  step?: number
  totalSteps?: number
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center bg-midnight text-white">
      <div className="fixed inset-0 z-0">
        <AtmosphericBackground />
      </div>

      <div className="relative z-10 flex w-full flex-1 flex-col items-center px-6 py-8 sm:py-10">
        {/* Brand mark — small thin-lined heart beside the wordmark, with a
            refined divider beneath. The same header sits on every
            onboarding screen, so it should read as one continuous journey
            rather than a generic multi-step form. */}
        <div className="mb-3 flex items-center gap-2">
          <span className="font-serif-display text-2xl text-gradient-gold sm:text-3xl">Perennia</span>
          <Heart className="h-4 w-4 text-gold" strokeWidth={1.5} />
        </div>
        <div className="mb-6 flex w-32 items-center gap-3 sm:mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/40" />
          <Sparkles className="h-3 w-3 shrink-0 text-gold/60" strokeWidth={1.5} />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/40" />
        </div>

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
