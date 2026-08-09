import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MatchingPreferencesPanel } from '@/components/shared/MatchingPreferencesPanel'

export function MatchingPreferences() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-lg px-6 pb-20 pt-8 md:pt-12">
      <div className="mb-8 flex items-center gap-3">
        <Button variant="glass" size="icon" onClick={() => navigate('/settings')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.25em] text-gold/70">Profile</p>
          <h1 className="font-serif-display text-3xl">Matching Preferences</h1>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-[1.75rem] p-6 md:p-8">
        <MatchingPreferencesPanel onSaved={() => navigate('/settings')} />
      </motion.div>
    </div>
  )
}
