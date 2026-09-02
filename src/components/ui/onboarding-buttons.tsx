import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OnboardingPrimaryButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
  loading?: boolean
  loadingLabel?: string
  showArrow?: boolean
}

export function OnboardingPrimaryButton({
  children,
  loading = false,
  loadingLabel = 'Loading…',
  showArrow = false,
  disabled,
  className,
  type = 'button',
  ...props
}: OnboardingPrimaryButtonProps) {
  return (
    <Button
      {...props}
      type={type}
      variant="ghost"
      size="lg"
      aria-busy={loading}
      disabled={disabled || loading}
      className={cn('onboarding-primary-button', className)}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          {showArrow && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </>
      )}
    </Button>
  )
}

interface OnboardingBackButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'> {
  to: string
}

export function OnboardingBackButton({ to, className, ...props }: OnboardingBackButtonProps) {
  const navigate = useNavigate()

  return (
    <Button
      {...props}
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => navigate(to)}
      className={cn('onboarding-back-button', className)}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span>Back</span>
    </Button>
  )
}
