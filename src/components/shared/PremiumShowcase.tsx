import { motion } from 'framer-motion'
import { ShieldCheck, Radar, Gem, Infinity as InfinityIcon } from 'lucide-react'

const items = [
  {
    icon: ShieldCheck,
    title: 'Verified Members',
    text: 'Every profile is identity-checked before it ever reaches you.',
  },
  {
    icon: Radar,
    title: 'Compatibility Analysis',
    text: 'Six dimensions of alignment, calculated — not guessed.',
  },
  {
    icon: Gem,
    title: 'Curated Matches',
    text: 'A handful of exceptional introductions, never an endless feed.',
  },
  {
    icon: InfinityIcon,
    title: 'Long-Term Relationships',
    text: 'Built for people seeking something that lasts, not a swipe.',
  },
]

export function PremiumShowcase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong glow-purple relative w-full max-w-3xl rounded-[2rem] p-6 md:p-10"
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-70"
        style={{
          background:
            'radial-gradient(80% 60% at 50% 0%, rgba(142,108,246,0.14), transparent 70%)',
        }}
      />

      <div className="relative mb-8 text-center">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">The Perennia Standard</p>
        <h3 className="font-serif-display text-2xl text-ivory md:text-3xl">
          What Makes a Match <span className="text-gradient-gold italic">Worth Trusting</span>
        </h3>
      </div>

      <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 5 + i * 0.6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition-colors duration-500 hover:border-gold/30 hover:bg-white/[0.05]"
            >
              <div
                className="pointer-events-none absolute -inset-8 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: 'radial-gradient(circle, rgba(229,192,123,0.25), transparent 70%)' }}
              />
              <div className="relative mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-royal-purple/60 to-lavender/20 ring-1 ring-white/10">
                <item.icon className="h-5 w-5 text-champagne" strokeWidth={1.75} />
              </div>
              <h4 className="relative font-serif-display mb-1.5 text-lg text-ivory">{item.title}</h4>
              <p className="relative text-xs leading-relaxed text-white/50">{item.text}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
