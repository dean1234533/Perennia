import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex max-w-full items-center gap-1 whitespace-normal break-words rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider',
  {
    variants: {
      variant: {
        gold: 'bg-gold/15 text-champagne border border-gold/30',
        glass: 'glass text-white/80',
        purple: 'bg-nebula-purple/20 text-white/90 border border-nebula-purple/30',
        success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      },
    },
    defaultVariants: { variant: 'glass' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
