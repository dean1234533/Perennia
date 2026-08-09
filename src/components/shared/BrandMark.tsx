import { Heart, Sparkles } from 'lucide-react'

/** The shared Perennia brand header — wordmark, a small thin-lined heart,
 *  and a refined divider beneath. Used on every onboarding screen and the
 *  login screen so the mark reads identically everywhere. */
export function BrandMark() {
  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <span className="font-serif-display text-2xl text-gradient-gold sm:text-3xl">Perennia</span>
        <Heart className="h-4 w-4 text-gold" strokeWidth={1.5} />
      </div>
      <div className="mb-6 flex w-32 items-center gap-3 sm:mb-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/40" />
        <Sparkles className="h-3 w-3 shrink-0 text-gold/60" strokeWidth={1.5} />
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/40" />
      </div>
    </>
  )
}
