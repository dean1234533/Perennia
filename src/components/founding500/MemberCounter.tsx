import { motion } from 'framer-motion'
import type { Founding500Config } from '@/types/founding500'

export function MemberCounter({ config }: { config: Founding500Config }) {
  const pct = Math.min(100, (config.currentMemberCount / config.memberLimit) * 100)
  const remaining = Math.max(config.memberLimit - config.currentMemberCount, 0)

  return (
    <div className="mx-auto w-full max-w-sm rounded-[1.35rem] border border-white/10 bg-[#071126]/45 px-5 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_20px_60px_rgba(2,7,20,.16)] backdrop-blur-md sm:px-8">
      <p className="mb-1 text-[10px] uppercase tracking-[0.35em] text-gold/70 sm:text-xs">Founding 500</p>
      <p className="font-serif-display mb-2 text-xl text-champagne sm:text-2xl">
        {config.currentMemberCount} / {config.memberLimit} <span className="text-white/40">Members</span>
      </p>
      <div className="relative mb-3 h-[3px] w-full overflow-hidden rounded-full bg-white/15 shadow-[0_0_14px_rgba(229,192,123,.12)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-gold to-champagne shadow-[0_0_12px_rgba(229,192,123,.8)]"
        />
      </div>
      <p className="text-xs uppercase tracking-widest text-white/40">
        {remaining > 0 ? `${remaining} places remaining` : 'The Founding 500 is now full'}
      </p>
    </div>
  )
}
