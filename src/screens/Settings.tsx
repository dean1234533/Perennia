import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User, Bell, Shield, Sparkles, LogOut, ChevronRight, Moon, Eye, MapPin, Heart,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'
import { selfAvatarUrl } from '@/lib/avatar'

function Row({
  icon: Icon,
  label,
  description,
  right,
}: {
  icon: React.ElementType
  label: string
  description?: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
          <Icon className="h-4 w-4 text-champagne" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          {description && <p className="text-xs text-white/40">{description}</p>}
        </div>
      </div>
      {right ?? <ChevronRight className="h-4 w-4 text-white/25" />}
    </div>
  )
}

export function Settings() {
  const navigate = useNavigate()
  const { setAuthenticated, onboarding, updateOnboarding } = useApp()
  const { logOut } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [showDistance, setShowDistance] = useState(true)
  const [incognito, setIncognito] = useState(false)
  const [darkCosmic, setDarkCosmic] = useState(true)

  const logout = async () => {
    if (firebaseConfigured) {
      await logOut()
    } else {
      setAuthenticated(false)
    }
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pt-8 pb-10 md:pt-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">Preferences</p>
        <h1 className="font-serif-display text-4xl md:text-5xl">Settings</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative mb-6 flex items-center gap-4 overflow-hidden rounded-3xl glass p-5"
      >
        <img
          src={selfAvatarUrl(onboarding.gender)}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-15 blur-2xl"
        />
        <img
          src={selfAvatarUrl(onboarding.gender)}
          alt="You"
          className="relative h-16 w-16 rounded-full object-cover ring-2 ring-gold/40"
        />
        <div className="relative flex-1">
          <p className="font-serif-display text-xl text-champagne">{onboarding.name || 'Eleanor Ashworth'}</p>
          <p className="text-sm text-white/45">{onboarding.sunSign || 'Libra'} • London, UK</p>
        </div>
        <Button variant="glass" size="sm" className="relative" onClick={() => navigate('/cosmic-profile')}>
          Edit
        </Button>
      </motion.div>

      {[
        {
          title: 'Account',
          delay: 0.1,
          content: (
            <>
              <Row icon={User} label="Personal Information" description="Name, email, phone number" />
              <div className="h-px bg-white/5" />
              <Row icon={Sparkles} label="Cosmic Profile" description="Birth details & astrology" />
              <div className="h-px bg-white/5" />
              <Row
                icon={Shield}
                label="Verification"
                description={
                  onboarding.verification.status === 'verified'
                    ? 'Identity verified via Stripe'
                    : onboarding.verification.status === 'pending'
                      ? 'Verification in review'
                      : 'Not verified yet'
                }
                right={
                  <button onClick={() => navigate('/verify')} className="cursor-pointer">
                    <span
                      className={`text-xs ${
                        onboarding.verification.status === 'verified'
                          ? 'text-emerald-400'
                          : onboarding.verification.status === 'pending'
                            ? 'text-gold'
                            : 'text-white/40'
                      }`}
                    >
                      {onboarding.verification.status === 'verified'
                        ? 'Verified'
                        : onboarding.verification.status === 'pending'
                          ? 'Pending'
                          : 'Verify Now'}
                    </span>
                  </button>
                }
              />
              <div className="h-px bg-white/5" />
              <Row
                icon={Heart}
                label="I Am"
                description="We'll show you the opposite in Discovery"
                right={
                  <div className="flex items-center gap-1 rounded-full glass p-1">
                    {(['male', 'female'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => updateOnboarding({ gender: g })}
                        className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors cursor-pointer ${
                          onboarding.gender === g ? 'bg-gold/20 text-champagne border border-gold/30' : 'text-white/45'
                        }`}
                      >
                        {g === 'male' ? 'Male' : 'Female'}
                      </button>
                    ))}
                  </div>
                }
              />
            </>
          ),
        },
        {
          title: 'Privacy',
          delay: 0.16,
          content: (
            <>
              <Row icon={Eye} label="Incognito Mode" description="Browse without being seen" right={<Switch checked={incognito} onCheckedChange={setIncognito} />} />
              <div className="h-px bg-white/5" />
              <Row icon={MapPin} label="Show Distance" description="Display your location to matches" right={<Switch checked={showDistance} onCheckedChange={setShowDistance} />} />
            </>
          ),
        },
        {
          title: 'Notifications',
          delay: 0.22,
          content: (
            <Row icon={Bell} label="Push Notifications" description="New matches & messages" right={<Switch checked={notifications} onCheckedChange={setNotifications} />} />
          ),
        },
        {
          title: 'Appearance',
          delay: 0.28,
          content: (
            <Row icon={Moon} label="Cosmic Dark Mode" description="Deep midnight theme" right={<Switch checked={darkCosmic} onCheckedChange={setDarkCosmic} />} />
          ),
        },
      ].map((section) => (
        <motion.div key={section.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: section.delay }}>
          <p className="mb-2 mt-6 text-xs font-medium uppercase tracking-widest text-white/35">{section.title}</p>
          <Card>
            <CardContent className="divide-y divide-transparent px-5 py-1">{section.content}</CardContent>
          </Card>
        </motion.div>
      ))}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }} className="mt-8">
        <Button variant="outline" className="w-full text-rose-300 border-rose-400/30 hover:bg-rose-500/10" onClick={logout}>
          <LogOut className="h-4 w-4" /> Log Out
        </Button>
      </motion.div>
    </div>
  )
}
