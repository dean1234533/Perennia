import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Starfield } from '@/components/shared/Starfield'

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
      <div
        className="fixed inset-0 z-0"
        style={{ background: 'radial-gradient(120% 90% at 50% -10%, #1a1140 0%, #0c1433 42%, #060b1d 78%)' }}
      >
        <Starfield density={45} />
      </div>

      <div className="relative z-10 flex w-full flex-1 flex-col items-center px-6 py-10">
        <div className="mb-8 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-gold" />
          <span className="font-serif-display text-2xl text-gradient-gold">Perennia</span>
        </div>

        {step !== undefined && totalSteps !== undefined && (
          <div className="mb-10 flex w-full max-w-sm items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                {i < step && (
                  <motion.div
                    className="h-full bg-gradient-to-r from-gold to-champagne"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex w-full flex-1 flex-col items-center justify-center">{children}</div>
      </div>
    </div>
  )
}
