import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import type { TierPricing } from '@/types/founding500'

function formatPrice(amount: number, currency: string) {
  const symbol = currency.toUpperCase() === 'GBP' ? '£' : currency.toUpperCase() === 'USD' ? '$' : currency.toUpperCase() === 'EUR' ? '€' : ''
  return `${symbol}${amount.toFixed(2)}`
}

interface PricingTimelineProps {
  pricing: TierPricing
  currency: string
  promoPeriodMonths: number
}

export function PricingTimeline({ pricing, currency, promoPeriodMonths }: PricingTimelineProps) {
  const remainingMonths = Math.max(12 - promoPeriodMonths, 0)
  const steps = [
    {
      label: `Months 1–${promoPeriodMonths}`,
      sublabel: 'Founding 500 member',
      price: pricing.introPrice,
      emphasis: true,
    },
    {
      label: `Rest of Year 1${remainingMonths ? ` (${remainingMonths} months)` : ''}`,
      sublabel: 'Still your founding rate',
      price: pricing.year1Price,
      emphasis: false,
    },
    {
      label: 'Future Standard Price',
      sublabel: 'From year 2 onward',
      price: pricing.futurePrice,
      emphasis: false,
    },
  ]

  return (
    <div className="flex flex-col items-center" role="list" aria-label="Membership pricing timeline">
      {steps.map((step, i) => (
        <div key={step.label} className="flex w-full flex-col items-center" role="listitem">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className={`w-full max-w-sm rounded-2xl border px-5 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.035),0_16px_45px_rgba(2,7,20,.14)] backdrop-blur-md ${
              step.emphasis
                ? 'border-gold/35 bg-[#17142b]/55 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_0_24px_rgba(229,192,123,.1)]'
                : 'border-white/10 bg-[#071126]/45'
            }`}
          >
            <p className={`mb-1 text-[10px] uppercase tracking-[0.25em] ${step.emphasis ? 'text-gold' : 'text-white/40'}`}>
              {step.label}
            </p>
            <p className={`font-serif-display text-2xl ${step.emphasis ? 'text-gradient-gold' : 'text-champagne'}`}>
              {formatPrice(step.price, currency)}
              <span className="text-sm text-white/40"> / month</span>
            </p>
            <p className="mt-1 text-[11px] text-white/35">{step.sublabel}</p>
          </motion.div>
          {i < steps.length - 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.15 }}
              className="py-2 text-gold/40"
            >
              <ArrowDown className="h-4 w-4" />
            </motion.div>
          )}
        </div>
      ))}
    </div>
  )
}
