import { type SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** A real native <select> styled to match the glass/celestial theme —
 *  genuine dropdown/select behavior (keyboard nav, native picker on
 *  mobile), not a custom-built listbox reimplementation. */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { icon?: React.ReactNode }>(
  ({ className, icon, children, ...props }, ref) => (
    <div className="relative">
      {icon && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gold/50">{icon}</span>}
      <select
        ref={ref}
        className={cn(
          'h-14 w-full appearance-none rounded-xl border border-blue-200/35 bg-navy/40 pr-10 text-base text-white backdrop-blur-sm transition focus:border-blue-200/70 focus:outline-none focus:shadow-[0_0_18px_rgba(111,135,255,.16)] disabled:cursor-not-allowed disabled:opacity-50',
          icon ? 'pl-11' : 'pl-4',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
    </div>
  )
)
Select.displayName = 'Select'
