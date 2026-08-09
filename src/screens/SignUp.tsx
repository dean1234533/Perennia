import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Wand2 } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'
import { scorePasswordStrength } from '@/lib/passwordStrength'
import { generatePassphrase } from '@/lib/generatePassphrase'

const MIN_PASSWORD_LENGTH = 15

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  if (code.includes('email-already-in-use')) return 'An account with this email already exists.'
  if (code.includes('invalid-email')) return 'That email address looks invalid.'
  if (code.includes('weak-password')) return 'Please choose a stronger password.'
  return 'Something went wrong creating your account. Please try again.'
}

export function SignUp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next')
  const { updateOnboarding } = useApp()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // A Founding 500 signup (or any other deep-linked flow) carries its
  // destination through as `?next=`, so we skip straight to identity
  // verification (per the Founding 500 flow spec) instead of forcing new
  // members through the full dating-profile onboarding chain. `next` is
  // re-attached to /verify so it still lands on the real destination after.
  const destination = next ? `/verify?next=${encodeURIComponent(next)}` : '/profile-photo'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (firebaseConfigured) {
      try {
        await signUp(email, password)
        navigate(destination)
      } catch (err) {
        setError(friendlyAuthError(err))
        setLoading(false)
      }
      return
    }
    updateOnboarding({ email, password })
    setTimeout(() => navigate(destination), 900)
  }

  const handleSuggestPassword = () => {
    const suggestion = generatePassphrase()
    setPassword(suggestion)
    setShowPassword(true)
  }

  const strength = scorePasswordStrength(password)
  const isValid = email.includes('@') && password.length >= MIN_PASSWORD_LENGTH

  return (
    <OnboardingShell step={1} totalSteps={12}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm text-center"
      >
        <h1 className="font-serif-display text-4xl md:text-5xl">Begin Your Story</h1>
        <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-white/55">
          Create your account. Your journey toward a compatibility-first connection starts here.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5 text-left">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.2em] text-white/45">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/50" strokeWidth={1.75} />
              <Input
                id="email"
                type="email"
                placeholder="Email"
                className="border-white/15 bg-navy/40 pl-11 backdrop-blur-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.2em] text-white/45">Password</Label>
              <button
                type="button"
                onClick={handleSuggestPassword}
                className="flex items-center gap-1 text-[11px] text-gold/70 transition-colors hover:text-gold cursor-pointer"
              >
                <Wand2 className="h-3 w-3" strokeWidth={1.75} />
                Suggest a strong password
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/50" strokeWidth={1.75} />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="border-white/15 bg-navy/40 pl-11 pr-11 backdrop-blur-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white/70 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
              </button>
            </div>

            <div className="mt-1 flex flex-col gap-2">
              <p className="text-[11px] text-white/35">Minimum {MIN_PASSWORD_LENGTH} characters</p>
              {password.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5" role="meter" aria-valuemin={0} aria-valuemax={4} aria-valuenow={strength.score} aria-label="Password strength">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
                        {i < strength.score && (
                          <div className="h-full rounded-full bg-gradient-to-r from-gold to-champagne" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-white/40">Password strength — {strength.label}</p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" size="lg" className="mt-2 w-full" disabled={!isValid || loading}>
            {loading ? 'Creating Your Account…' : (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-white/40">
          Already have an account?{' '}
          <button
            onClick={() => navigate(next ? `/login?next=${encodeURIComponent(next)}` : '/login')}
            className="text-gold hover:underline cursor-pointer"
          >
            Log in
          </button>
        </p>
      </motion.div>
    </OnboardingShell>
  )
}
