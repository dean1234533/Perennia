import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { LIFESTYLE_CATEGORIES } from '@/data/lifestyleOptions'
import { getPrivateLifestyle, updatePrivateLifestyle, type LifestyleVisibility } from '@/lib/firestore'

const VISIBILITY_OPTIONS: { value: LifestyleVisibility; label: string; description: string }[] = [
  { value: 'public', label: 'Public', description: 'Visible on your profile to everyone' },
  { value: 'matching-only', label: 'Matches Only', description: 'Only visible once you match' },
  { value: 'private', label: 'Private', description: "Used for matching, never shown" },
]

export function LifestyleStep() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [values, setValues] = useState<Record<string, string>>({})
  const [visibility, setVisibility] = useState<LifestyleVisibility>('public')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    getPrivateLifestyle(user.uid).then((existing) => {
      if (!existing) return
      setValues(Object.fromEntries(existing.items.map((l) => [l.label, l.value])))
      setVisibility(existing.visibility)
    })
  }, [user])

  const handleContinue = async () => {
    if (!user) return
    setSaving(true)
    const items = Object.entries(values)
      .filter(([, v]) => v)
      .map(([label, value]) => ({ label, value }))
    await updatePrivateLifestyle(user.uid, { items, visibility })
    setSaving(false)
    navigate('/values')
  }

  return (
    <OnboardingShell step={8} totalSteps={12}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong w-full max-w-lg rounded-[2rem] p-8 md:p-10"
      >
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">03 — Your Lifestyle</p>
        <h1 className="font-serif-display mb-2 text-3xl">Your Lifestyle</h1>
        <p className="mb-6 text-sm text-white/55">Answer as many as you'd like — nothing here is required.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {LIFESTYLE_CATEGORIES.map((cat) => (
            <div key={cat.label} className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-white/45">{cat.label}</label>
              <select
                value={values[cat.label] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [cat.label]: e.target.value }))}
                className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-gold/40"
              >
                <option value="" className="bg-midnight">Prefer not to say</option>
                {cat.options.map((o) => (
                  <option key={o} value={o} className="bg-midnight">{o}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <p className="mb-3 mt-8 text-xs uppercase tracking-[0.25em] text-gold/70">Who can see this?</p>
        <div className="flex flex-col gap-2">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setVisibility(opt.value)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
                visibility === opt.value ? 'border-gold/50 bg-gold/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              }`}
            >
              <div>
                <p className={`text-sm ${visibility === opt.value ? 'text-champagne' : 'text-white/80'}`}>{opt.label}</p>
                <p className="text-xs text-white/40">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>

        <Button size="lg" className="mt-8 w-full" onClick={handleContinue} disabled={saving}>
          {saving ? 'Saving…' : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </motion.div>
    </OnboardingShell>
  )
}
