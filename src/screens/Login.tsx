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
  // Logging in always lands on Discovery — EXCEPT when `next` is a Founding
  // 500 destination (e.g. mid-checkout), where it means something real:
  // continue that flow rather than dropping the member back at Discovery.
  const destination = next?.startsWith('/founding-500') ? next : '/discovery'
  const { setAuthenticated } = useApp()
  const { logIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-midnight text-white">
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
            <h1 className="font-serif-display text-4xl md:text-5xl">Welcome Back</h1>
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
                  <button type="button" className="text-[11px] text-white/40 hover:text-gold cursor-pointer">
                    Forgot?
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

              <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>
                {loading ? 'Signing In…' : (
                  <>
                    Sign In <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-white/40">
              New to Perennia?{' '}
              <button
                onClick={() => navigate(next ? `/signup?next=${encodeURIComponent(next)}` : '/signup')}
                className="text-gold hover:underline cursor-pointer"
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
