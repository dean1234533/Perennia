import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Bell, Shield, Sparkles, LogOut, ChevronRight, Eye, MapPin, Heart, X, Check, Crown,
  SlidersHorizontal, Images, KeyRound, Trash2, AlertTriangle, Loader2, UserRoundX, Ban, Flag, BadgeHelp,
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
import { getUserDoc } from '@/lib/firestore'
import type { FoundingMemberRecord } from '@/types/founding500'

function Row({
  icon: Icon,
  label,
  description,
  right,
  onClick,
  id,
}: {
  icon: React.ElementType
  label: string
  description?: string
  right?: React.ReactNode
  onClick?: () => void
  id?: string
}) {
  const content = (
    <>
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/10 bg-gold/5">
          <Icon className="h-4 w-4 text-gold" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-white">{label}</p>
          {description && <p className="text-xs text-white/40">{description}</p>}
        </div>
      </div>
      {right ?? (onClick && <ChevronRight className="h-4 w-4 text-white/25 transition-transform group-hover:translate-x-0.5" />)}
    </>
  )

  if (onClick) {
    return (
      <button id={id} onClick={onClick} className="group -mx-2 flex w-full scroll-mt-20 items-center justify-between gap-4 rounded-2xl px-2 py-4 text-left transition-colors hover:bg-white/[0.03] cursor-pointer">
        {content}
      </button>
    )
  }

  return <div id={id} className="flex scroll-mt-20 items-center justify-between gap-4 py-4">{content}</div>
}

export function Settings() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuthenticated, onboarding, updateOnboarding, blockedIds, unblockProfile } = useApp()
  const { user, logOut, changePassword, deleteAccount } = useAuth()
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState(onboarding.name)
  const [phoneDraft, setPhoneDraft] = useState(onboarding.phone)
  const [savingInfo, setSavingInfo] = useState(false)
  const [savedPulse, setSavedPulse] = useState(false)
  const [foundingRecord, setFoundingRecord] = useState<FoundingMemberRecord | null>(null)

  const [securityOpen, setSecurityOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [securityError, setSecurityError] = useState('')
  const [securityStatus, setSecurityStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [blockedOpen, setBlockedOpen] = useState(false)
  const [blockedProfiles, setBlockedProfiles] = useState<{ uid: string; name: string; photoUrl: string }[]>([])
  const [blockedLoading, setBlockedLoading] = useState(false)
  const [safetyOpen, setSafetyOpen] = useState(false)

  useEffect(() => {
    const anchor = location.hash.slice(1)
    if (!anchor) return
    if (anchor === 'delete-account') {
      setDeleteOpen(true)
      return
    }
    if (anchor === 'blocked-users') {
      setBlockedOpen(true)
      return
    }
    if (anchor === 'safety') {
      setSafetyOpen(true)
      return
    }
    window.setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
  }, [location.hash])

  const openBlockedUsers = async () => {
    setBlockedOpen(true)
    if (!firebaseConfigured || blockedIds.length === 0) return
    setBlockedLoading(true)
    const docs = await Promise.all(blockedIds.map((uid) => getUserDoc(uid)))
    setBlockedProfiles(
      docs
        .map((doc, i) => (doc ? { uid: blockedIds[i], name: doc.name || 'Unknown', photoUrl: doc.profilePhotoThumbUrl || doc.profilePhotoUrl } : null))
        .filter((p): p is { uid: string; name: string; photoUrl: string } => p !== null)
    )
    setBlockedLoading(false)
  }

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

  const handleChangePassword = async () => {
    setSecurityError('')
    if (newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters.')
      return
    }
    setSecurityStatus('saving')
    try {
      await changePassword(currentPassword, newPassword)
      setSecurityStatus('saved')
      setCurrentPassword('')
      setNewPassword('')
      setTimeout(() => {
        setSecurityOpen(false)
        setSecurityStatus('idle')
      }, 1200)
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : 'Could not change your password.')
      setSecurityStatus('idle')
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError('')
    setDeleting(true)
    try {
      await deleteAccount(deletePassword)
      navigate('/')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete your account.')
      setDeleting(false)
    }
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
                icon={Images}
                label="Manage Photos & Videos"
                description="Edit your profile media"
                onClick={() => navigate('/my-profile')}
              />
              <div className="h-px bg-white/5" />
              <Row
                icon={SlidersHorizontal}
                label="Matching Preferences"
                description="Age range, distance & location"
                onClick={() => navigate('/matching-preferences')}
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
                id="membership"
                icon={Crown}
                label="Founding 500 Membership"
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
          id: 'privacy',
          delay: 0.16,
          content: (
            <>
              <Row
                icon={Eye}
                label="Incognito Mode"
                description="Hide your profile from Discovery"
                right={<Switch checked={onboarding.incognito} onCheckedChange={(v) => updateOnboarding({ incognito: v })} />}
              />
              <div className="h-px bg-white/5" />
              <Row
                icon={MapPin}
                label="Show Location"
                description="Display your location on your profile"
                right={<Switch checked={onboarding.showDistance} onCheckedChange={(v) => updateOnboarding({ showDistance: v })} />}
              />
              <div className="h-px bg-white/5" />
              <Row
                id="blocked-users"
                icon={UserRoundX}
                label="Blocked Users"
                description={blockedIds.length ? `${blockedIds.length} blocked` : 'Review profiles you have blocked'}
                onClick={openBlockedUsers}
              />
              <div className="h-px bg-white/5" />
              <Row id="safety" icon={Shield} label="Safety Settings" description="Blocking, reporting & support" onClick={() => setSafetyOpen(true)} />
            </>
          ),
        },
        {
          title: 'Notifications',
          id: 'notifications',
          delay: 0.22,
          content: (
            <Row
              icon={Bell}
              label="Push Notifications"
              description="New matches & messages"
              right={<Switch checked={onboarding.pushNotificationsEnabled} onCheckedChange={(v) => updateOnboarding({ pushNotificationsEnabled: v })} />}
            />
          ),
        },
        {
          title: 'Security',
          id: 'security',
          delay: 0.28,
          content: (
            <>
              <Row icon={KeyRound} label="Change Password" onClick={() => setSecurityOpen(true)} />
              <div className="h-px bg-white/5" />
              <Row
                icon={Trash2}
                label="Delete Account"
                description="Permanently remove your account and data"
                onClick={() => setDeleteOpen(true)}
              />
            </>
          ),
        },
      ].map((section) => (
        <motion.div id={section.id} className="scroll-mt-20" key={section.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: section.delay }}>
          <p className="mb-3 mt-8 text-xs uppercase tracking-[0.25em] text-gold/60">{section.title}</p>
          <Card className="border-white/5">
            <CardContent className="divide-y divide-transparent px-5 py-1">{section.content}</CardContent>
          </Card>
        </motion.div>
      ))}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }} className="mt-8">
        <Button variant="outline" className="w-full text-rose-300 border-rose-400/30 hover:bg-rose-500/10" onClick={logout}>
          <LogOut className="h-4 w-4" /> Log Out
        </Button>
      </motion.div>

      {/* Personal Info modal */}
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

      {/* Change password modal */}
      <AnimatePresence>
        {securityOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && !deleting && setSecurityOpen(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong w-full max-w-sm rounded-2xl p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-serif-display text-xl text-champagne">Change Password</h3>
                <button onClick={() => setSecurityOpen(false)} className="cursor-pointer text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                {securityError && <p className="text-xs text-rose-300">{securityError}</p>}
              </div>
              <Button className="mt-6 w-full" onClick={handleChangePassword} disabled={securityStatus === 'saving' || !currentPassword || !newPassword}>
                {securityStatus === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : securityStatus === 'saved' ? <Check className="h-4 w-4" /> : 'Update Password'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete account modal */}
      <AnimatePresence>
        {deleteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && !deleting && setDeleteOpen(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong w-full max-w-sm rounded-2xl p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/15">
                  <AlertTriangle className="h-5 w-5 text-rose-300" />
                </div>
                <h3 className="font-serif-display text-xl text-champagne">Delete Account</h3>
              </div>
              <p className="mb-5 text-sm leading-relaxed text-white/55">
                This permanently deletes your profile, photos, videos, and account. This cannot be undone.
                Confirm your password to continue.
              </p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="delete-password">Password</Label>
                <Input id="delete-password" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
              </div>
              {deleteError && <p className="mt-3 text-xs text-rose-300">{deleteError}</p>}
              <div className="mt-6 flex gap-3">
                <Button variant="glass" className="flex-1" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
                  onClick={handleDeleteAccount}
                  disabled={deleting || !deletePassword}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Forever'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blocked users modal */}
      <AnimatePresence>
        {blockedOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && setBlockedOpen(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong w-full max-w-sm rounded-2xl p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-serif-display text-xl text-champagne">Blocked Users</h3>
                <button onClick={() => setBlockedOpen(false)} className="cursor-pointer text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {blockedLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gold" /></div>
              ) : blockedProfiles.length === 0 ? (
                <p className="py-4 text-center text-sm text-white/40">You haven't blocked anyone.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {blockedProfiles.map((p) => (
                    <div key={p.uid} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10">
                        {p.photoUrl && <img src={p.photoUrl} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <p className="flex-1 truncate text-sm text-white/85">{p.name}</p>
                      <button
                        onClick={async () => {
                          await unblockProfile(p.uid)
                          setBlockedProfiles((prev) => prev.filter((b) => b.uid !== p.uid))
                        }}
                        className="cursor-pointer rounded-full border border-white/15 px-3 py-1 text-xs text-white/60 hover:border-gold/40 hover:text-gold"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safety settings modal */}
      <AnimatePresence>
        {safetyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && setSafetyOpen(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong w-full max-w-sm rounded-2xl p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-serif-display text-xl text-champagne">Safety Settings</h3>
                <button onClick={() => setSafetyOpen(false)} className="cursor-pointer text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <Row
                  icon={Ban}
                  label="Blocked Users"
                  description={blockedIds.length ? `${blockedIds.length} blocked` : 'Manage who you have blocked'}
                  onClick={() => { setSafetyOpen(false); openBlockedUsers() }}
                />
                <div className="h-px bg-white/5" />
                <Row
                  icon={Flag}
                  label="Report a Problem"
                  description="Email our safety team"
                  onClick={() => { window.location.href = 'mailto:safety@perennia.com?subject=Report%20a%20Problem'; setSafetyOpen(false) }}
                />
                <div className="h-px bg-white/5" />
                <Row
                  icon={BadgeHelp}
                  label="Help & Support"
                  description="Email support"
                  onClick={() => { window.location.href = 'mailto:support@perennia.com'; setSafetyOpen(false) }}
                />
              </div>

              <p className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 text-xs leading-relaxed text-white/45">
                Never share financial details or move conversations off Perennia early. Meet new connections in
                public places and tell a friend your plans. If a member makes you uncomfortable, block and
                report them — our team reviews every report.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
