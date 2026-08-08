import { UserRound } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'

interface SelfAvatarProps {
  className?: string
}

/** Renders the signed-in member's real uploaded profile photo. Before they
 *  add one, shows a neutral placeholder — never a stock photo standing in
 *  for their face. `className` should carry sizing/border/ring utilities;
 *  it's applied to both the real <img> and the placeholder so they're
 *  visually interchangeable. */
export function SelfAvatar({ className }: SelfAvatarProps) {
  const { onboarding } = useApp()
  const src = onboarding.profilePhotoThumbUrl || onboarding.profilePhotoUrl

  if (src) {
    return <img src={src} alt="" className={cn('object-cover', className)} />
  }

  return (
    <div className={cn('flex items-center justify-center bg-white/8 text-white/30', className)}>
      <UserRound className="h-1/2 w-1/2" />
    </div>
  )
}
