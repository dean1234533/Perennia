import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'

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
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
        await signUp(name, email, password)
        navigate(destination)
      } catch (err) {
        setError(friendlyAuthError(err))
        setLoading(false)
      }
      return
    }
    updateOnboarding({ name, email, password })
    setTimeout(() => navigate(destination), 900)
  }

  const isValid = name.length > 1 && email.includes('@') && password.length >= 6

  return (
    <OnboardingShell step={1} totalSteps={12}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong w-full max-w-md rounded-[2rem] p-8 md:p-10"
      >
        <h1 className="font-serif-display mb-2 text-3xl">Begin Your Story</h1>
        <p className="mb-8 text-sm text-white/55">
          Create your account. Your journey toward a compatibility-first connection starts here.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <Input id="name" placeholder="Eleanor Ashworth" className="pl-11" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <Input id="email" type="email" placeholder="you@example.com" className="pl-11" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <Input id="password" type="password" placeholder="At least 6 characters" className="pl-11" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" size="lg" className="mt-3 w-full" disabled={!isValid || loading}>
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
