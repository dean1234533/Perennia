import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'

export function Login() {
  const navigate = useNavigate()
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
        navigate('/discovery')
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
      navigate('/discovery')
    }, 900)
  }

  return (
    <OnboardingShell>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong w-full max-w-md rounded-[2rem] p-8 md:p-10"
      >
        <h1 className="font-serif-display mb-2 text-3xl">Welcome Back</h1>
        <p className="mb-8 text-sm text-white/55">Sign in to continue your story.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <Input id="email" type="email" placeholder="you@example.com" className="pl-11" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button type="button" className="text-xs text-white/40 hover:text-gold cursor-pointer">
                Forgot?
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <Input id="password" type="password" placeholder="Your password" className="pl-11" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
          <button onClick={() => navigate('/signup')} className="text-gold hover:underline cursor-pointer">
            Create an account
          </button>
        </p>
      </motion.div>
    </OnboardingShell>
  )
}
