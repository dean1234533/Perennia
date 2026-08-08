import { motion } from 'framer-motion'
import type { Founding500Config } from '@/types/founding500'

export function MemberCounter({ config }: { config: Founding500Config }) {
  const pct = Math.min(100, (config.currentMemberCount / config.memberLimit) * 100)
  const remaining = Math.max(config.memberLimit - config.currentMemberCount, 0)

  return (
    <div className="mx-auto w-full max-w-md text-center">
      <p className="mb-2 text-xs uppercase tracking-[0.35em] text-gold/70">Founding 500</p>
      <p className="font-serif-display mb-4 text-2xl text-champagne">
        {config.currentMemberCount} / {config.memberLimit} <span className="text-white/40">Members</span>
      </p>
      <div className="relative mb-3 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-gold to-champagne"
        />
      </div>
      <p className="text-xs uppercase tracking-widest text-white/40">
        {remaining > 0 ? `${remaining} places remaining` : 'The Founding 500 is now full'}
      </p>
    </div>
  )
}
