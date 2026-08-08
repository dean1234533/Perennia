import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Bell, Shield, Sparkles, LogOut, ChevronRight, Moon, Eye, MapPin, Heart, X, Check, Crown,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'
import { subscribeFoundingMembership } from '@/lib/founding500'
import type { FoundingMemberRecord } from '@/types/founding500'

function Row({
  icon: Icon,
  label,
  description,
  right,
  onClick,
}: {
  icon: React.ElementType
  label: string
  description?: string
  right?: React.ReactNode
  onClick?: () => void
}) {
  const content = (
    <>
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
          <Icon className="h-4 w-4 text-champagne" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-white">{label}</p>
          {description && <p className="text-xs text-white/40">{description}</p>}
        </div>
      </div>
      {right ?? (onClick && <ChevronRight className="h-4 w-4 text-white/25" />)}
    </>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className="flex w-full items-center justify-between gap-4 py-4 text-left cursor-pointer">
        {content}
      </button>
    )
  }

  return <div className="flex items-center justify-between gap-4 py-4">{content}</div>
}

export function Settings() {
  const navigate = useNavigate()
  const { setAuthenticated, onboarding, updateOnboarding } = useApp()
  const { user, logOut } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [showDistance, setShowDistance] = useState(true)
  const [incognito, setIncognito] = useState(false)
  const [darkCosmic, setDarkCosmic] = useState(true)
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState(onboarding.name)
  const [phoneDraft, setPhoneDraft] = useState(onboarding.phone)
  const [savingInfo, setSavingInfo] = useState(false)
  const [savedPulse, setSavedPulse] = useState(false)
  const [foundingRecord, setFoundingRecord] = useState<FoundingMemberRecord | null>(null)

  useEffect(() => {
    if (!firebaseConfigured || !user) return
    return subscribeFoundingMembership(user.uid, setFoundingRecord)
  }, [user])

  const email = firebaseConfigured ? user?.email ?? onboarding.email : onboarding.email

  const logout = async () => {
    if (firebaseConfigured) {
      await logOut()
    } else {
      setAuthenticated(false)
    }
    navigate('/')
  }

  const openPersonalInfo = () => {
    setNameDraft(onboarding.name)
    setPhoneDraft(onboarding.phone)
    setPersonalInfoOpen(true)
  }

  const savePersonalInfo = async () => {
    setSavingInfo(true)
    updateOnboarding({ name: nameDraft.trim(), phone: phoneDraft.trim() })
    setSavingInfo(false)
    setPersonalInfoOpen(false)
    setSavedPulse(true)
    setTimeout(() => setSavedPulse(false), 2000)
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pt-8 pb-10 md:pt-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold/70">Preferences</p>
          <h1 className="font-serif-display text-4xl md:text-5xl">Settings</h1>
        </div>
        <AnimatePresence>
          {savedPulse && (
            <motion.span
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300"
            >
              Saved
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {[
        {
          title: 'Account',
          delay: 0.1,
          content: (
            <>
              <Row
                icon={User}
                label="Personal Information"
                description={onboarding.name ? `${onboarding.name} · ${email || 'no email'}` : 'Name, email, phone number'}
                onClick={openPersonalInfo}
              />
              <div className="h-px bg-white/5" />
              <Row
                icon={Sparkles}
                label="Cosmic Profile"
                description="Birth details & astrology"
                onClick={() => navigate('/cosmic-profile')}
              />
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
                icon={Crown}
                label="Founding 500"
                description={
                  foundingRecord
                    ? `Founding Member #${foundingRecord.memberNumber} · ${foundingRecord.tier === 'premium' ? 'Premium' : 'Essential'}`
                    : 'Introductory pricing for our first 500 members'
                }
                onClick={() => navigate('/founding-500')}
                right={
                  foundingRecord ? (
                    <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-gold">
                      Member
                    </span>
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white/25" />
                  )
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

      <AnimatePresence>
        {personalInfoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && setPersonalInfoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-strong w-full max-w-sm rounded-2xl p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-serif-display text-xl text-champagne">Personal Information</h3>
                <button onClick={() => setPersonalInfoOpen(false)} className="cursor-pointer text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-name">Full Name</Label>
                  <Input id="settings-name" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-phone">Phone Number</Label>
                  <Input
                    id="settings-phone"
                    type="tel"
                    placeholder="Add a phone number"
                    value={phoneDraft}
                    onChange={(e) => setPhoneDraft(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Email</Label>
                  <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white/50">
                    {email || 'No email on file'}
                  </p>
                  <p className="text-[11px] text-white/30">
                    Email is tied to your login and can't be changed here.
                  </p>
                </div>
              </div>

              <Button className="mt-6 w-full" onClick={savePersonalInfo} disabled={savingInfo}>
                <Check className="h-4 w-4" /> {savingInfo ? 'Saving…' : 'Save Changes'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
