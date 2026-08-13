import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CelestialHeart } from '@/components/shared/CelestialHeart'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next')
  // Always enter through the guarded app route. That guard first restores an
  // incomplete onboarding journey and only checks payment after onboarding
  // is complete, so a stale Founding-500 deep link cannot skip profile setup.
  const destination = '/discovery'
  const { setAuthenticated } = useApp()
  const { logIn, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetMessage, setResetMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResetMessage('')
    setLoading(true)

    if (firebaseConfigured) {
      try {
        await logIn(email, password)
        navigate(destination)
      } catch {
        setError('Incorrect email or password. Please try again.')
        setLoading(false)
      }
      return
    }

    setTimeout(() => {
      if (password.length < 6) {
        setError('Incorrect email or password. Please try again.')
        setLoading(false)
        return
      }
      setAuthenticated(true)
      navigate(destination)
    }, 900)
  }

  const handleForgotPassword = async () => {
    setError('')
    setResetMessage('')

    const registeredEmail = email.trim()
    if (!registeredEmail) {
      setError('Enter your registered email address to reset your password.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registeredEmail)) {
      setError('Enter a valid email address to reset your password.')
      return
    }

    if (!firebaseConfigured) {
      setError('Password reset is unavailable in this local preview.')
      return
    }

    setResetLoading(true)
    try {
      await resetPassword(registeredEmail)
      setResetMessage('If an account exists for this email, we’ve sent a password-reset link.')
    } catch (resetError) {
      const code = typeof resetError === 'object' && resetError && 'code' in resetError
        ? String(resetError.code)
        : ''

      if (code === 'auth/invalid-email') {
        setError('Enter a valid email address to reset your password.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many reset requests. Please wait a moment and try again.')
      } else if (code === 'auth/network-request-failed') {
        setError('We couldn’t connect. Check your connection and try again.')
      } else {
        setError('We couldn’t send the reset email. Please try again.')
      }
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center overflow-y-auto bg-midnight text-white">
      {/* Real celestial photography, swapped by viewport — portrait crop on
          mobile, wide landscape on desktop, rather than one image stretched
          to fit both. */}
      <img
        src="/login-mobile.JPG"
        alt=""
        className="absolute inset-0 h-full w-full object-cover md:hidden"
      />
      <img
        src="/login-desktop.JPG"
        alt=""
        className="absolute inset-0 hidden h-full w-full object-cover md:block"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-midnight/40 via-midnight/20 to-midnight" />

      <div className="relative z-10 flex w-full flex-1 flex-col items-center px-6 py-8 sm:py-10">
        <CelestialHeart className="mb-8 h-20 w-20 sm:mb-10 sm:h-24 sm:w-24" />

        <div className="login-form-stage flex w-full flex-1 flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm text-center"
          >
            <h1 className="font-serif-display text-4xl text-[#f2dfbd] md:text-5xl">Welcome Back</h1>
            <p className="mt-4 text-sm text-white/55">Sign in to continue your story.</p>

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
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="cursor-pointer text-[11px] text-white/55 transition-colors hover:text-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/45 disabled:cursor-wait disabled:opacity-50"
                  >
                    {resetLoading ? 'Sending…' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/50" strokeWidth={1.75} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    className="border-white/15 bg-navy/40 pl-11 backdrop-blur-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
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

              {resetMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="status"
                  className="rounded-xl border border-blue-300/25 bg-blue-950/35 px-4 py-2.5 text-xs leading-5 text-blue-100"
                >
                  {resetMessage}
                </motion.p>
              )}

              <Button
                type="submit"
                size="lg"
                variant="ghost"
                className="mt-2 w-full border border-blue-200/40 bg-gradient-to-r from-[#173a78]/95 via-[#303a92]/95 to-[#442c7f]/95 text-ivory shadow-[0_10px_32px_-12px_rgba(98,130,255,.75)] hover:border-blue-100/55 hover:from-[#1d478d] hover:via-[#3b47a8] hover:to-[#523695] hover:text-white hover:shadow-[0_12px_38px_-10px_rgba(111,137,255,.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100/60 focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
                disabled={loading}
              >
                {loading ? 'Signing In…' : (
                  <>
                    Sign In <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-white/60 [text-shadow:0_1px_10px_rgba(2,7,24,.75)]">
              New to Perennia?{' '}
              <button
                onClick={() => navigate(next ? `/signup?next=${encodeURIComponent(next)}` : '/signup')}
                className="cursor-pointer text-champagne hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/45"
              >
                Create an account
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
