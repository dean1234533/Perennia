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
    <div className="flex flex-col items-center">
      {steps.map((step, i) => (
        <div key={step.label} className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className={`w-full max-w-xs rounded-2xl px-6 py-4 text-center ${
              step.emphasis ? 'glass-strong border border-gold/30 glow-gold' : 'glass border border-white/5'
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
