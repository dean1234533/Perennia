import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-wide transition-all duration-300 disabled:pointer-events-none disabled:opacity-40 overflow-hidden select-none cursor-pointer',
  {
    variants: {
      variant: {
        gold: 'bg-gradient-to-r from-champagne via-gold to-champagne bg-[length:200%_auto] text-midnight shadow-[0_8px_30px_-8px_rgba(212,175,106,0.6)] hover:bg-[position:100%_0] hover:shadow-[0_8px_40px_-6px_rgba(212,175,106,0.8)] active:scale-[0.97]',
        glass: 'glass text-champagne hover:bg-white/10 active:scale-[0.97] hover:border-gold/40',
        ghost: 'text-white/70 hover:text-white hover:bg-white/5 active:scale-[0.97]',
        outline: 'border border-gold/40 text-champagne hover:bg-gold/10 hover:border-gold active:scale-[0.97]',
        link: 'text-gold underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        default: 'h-12 px-7',
        lg: 'h-14 px-9 text-base',
        icon: 'h-11 w-11 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'gold',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
