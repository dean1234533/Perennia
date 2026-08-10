import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, BadgeHelp, Ban, Bell, ChevronRight, CircleUserRound, CreditCard, Eye, Flag,
  HeartHandshake, Images, LogOut, Loader2, Pencil, Shield, SlidersHorizontal, Sparkles,
  Trash2, UserRoundX, VolumeX, WalletCards, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cancelFoundingMembership, createBillingPortalSession } from '@/lib/founding500'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { firebaseConfigured } from '@/lib/firebase'

function MenuAction({ icon: Icon, label, danger = false, onClick }: {
  icon: React.ElementType
  label: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/[.055] ${danger ? 'text-rose-300' : 'text-white/75 hover:text-white'}`}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.6} />
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-3.5 w-3.5 text-white/20 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

function MenuGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <p className="mb-1 px-3 text-[10px] uppercase tracking-[.22em] text-blue-200/50">{title}</p>
      <div>{children}</div>
    </section>
  )
}

function MenuFrame({ open, onClose, onBack, title, children }: { open: boolean; onClose: () => void; onBack?: () => void; title: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-start justify-end bg-black/55 p-3 pt-16 backdrop-blur-sm sm:p-6 sm:pt-20"
          onClick={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            initial={{ opacity: 0, y: -12, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .98 }}
            className="max-h-[calc(100vh-5rem)] w-full max-w-sm overflow-y-auto rounded-[1.6rem] border border-blue-200/20 bg-[#07142b]/95 p-4 shadow-[0_0_45px_rgba(73,90,220,.22)] backdrop-blur-2xl"
          >
            <div className="mb-4 flex items-center justify-between px-2">
              <div className="flex min-w-0 items-center gap-2">
                {onBack && (
                  <button type="button" onClick={onBack} aria-label="Back to profile menu" className="-ml-2 rounded-full p-2 text-white/55 hover:bg-white/5 hover:text-white">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <h2 className="truncate font-serif-display text-2xl text-ivory">{title}</h2>
              </div>
              <button type="button" onClick={onClose} aria-label="Close menu" className="rounded-full p-2 text-white/45 hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MenuToggle({ icon: Icon, title, description, checked, onCheckedChange }: {
  icon: React.ElementType
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[.025] p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-200/65" strokeWidth={1.6} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/85">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/42">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  )
}

type ProfileMenuPanel = 'root' | 'privacy' | 'blocked-users' | 'safety' | 'notifications' | 'membership' | 'delete-account'

export function MyProfileActionsMenu({
  open,
  onClose,
  onEditProfile,
  onManageMedia,
  onManageHighlights,
}: {
  open: boolean
  onClose: () => void
  onEditProfile: () => void
  onManageMedia: () => void
  onManageHighlights: () => void
}) {
  const navigate = useNavigate()
  const { logOut, deleteAccount } = useAuth()
  const { setAuthenticated, onboarding, updateOnboarding, blockedIds, unblockProfile } = useApp()
  const [panel, setPanel] = useState<ProfileMenuPanel>('root')
  const [confirming, setConfirming] = useState<'cancel-subscription' | null>(null)
  const [cancelStatus, setCancelStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [cancelError, setCancelError] = useState('')
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    if (!open) {
      setPanel('root')
      setConfirming(null)
      setDeletePassword('')
      setDeleteError('')
    }
  }, [open])

  const go = (to: string) => { onClose(); navigate(to) }
  const logout = async () => {
    if (firebaseConfigured) await logOut()
    else setAuthenticated(false)
    onClose()
    navigate('/')
  }

  const closeConfirm = () => {
    setConfirming(null)
    setCancelStatus('idle')
    setCancelError('')
  }

  const confirmCancelSubscription = async () => {
    setCancelStatus('loading')
    setCancelError('')
    try {
      await cancelFoundingMembership()
      setCancelStatus('done')
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Could not cancel your membership. Please try again.')
      setCancelStatus('error')
    }
  }

  const openBilling = async () => {
    if (billingLoading) return
    setBillingLoading(true)
    setBillingError('')
    try {
      const { url } = await createBillingPortalSession(window.location.origin + '/my-profile')
      window.location.href = url
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Could not open billing. Please try again.')
      setBillingLoading(false)
    }
  }

  const confirmDeleteAccount = async () => {
    if (firebaseConfigured && !deletePassword) {
      setDeleteError('Enter your password to confirm account deletion.')
      return
    }
    setDeletingAccount(true)
    setDeleteError('')
    try {
      if (firebaseConfigured) await deleteAccount(deletePassword)
      else setAuthenticated(false)
      onClose()
      navigate('/')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Your account could not be deleted. Please try again.')
      setDeletingAccount(false)
    }
  }

  if (confirming) {
    if (cancelStatus === 'done') {
      return (
        <MenuFrame open={open} onClose={closeConfirm} title="Membership Canceled">
          <div className="px-2 pb-2">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
              <CreditCard className="h-5 w-5" />
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              Your Founding 500 membership has been canceled and billing has stopped. You'll keep your founding
              member number on record, but full app access ends now.
            </p>
            <Button className="mt-6 w-full" onClick={() => go('/founding-500')}>Done</Button>
          </div>
        </MenuFrame>
      )
    }

    return (
      <MenuFrame open={open} onClose={closeConfirm} title="Cancel Subscription?">
        <div className="px-2 pb-2">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/15 text-blue-200">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="text-sm leading-relaxed text-white/60">
            This cancels your real Stripe subscription and ends billing immediately. You will lose access to the app until you rejoin.
          </p>
          {cancelStatus === 'error' && (
            <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{cancelError}</p>
          )}
          <div className="mt-6 flex gap-3">
            <Button variant="glass" className="flex-1" onClick={closeConfirm} disabled={cancelStatus === 'loading'}>Go Back</Button>
            <Button
              className="flex-1"
              onClick={confirmCancelSubscription}
              disabled={cancelStatus === 'loading'}
            >
              {cancelStatus === 'loading' ? 'Canceling…' : 'Continue'}
            </Button>
          </div>
        </div>
      </MenuFrame>
    )
  }

  if (panel === 'privacy') {
    return (
      <MenuFrame open={open} onClose={onClose} onBack={() => setPanel('root')} title="Privacy Settings">
        <div className="space-y-3 px-1 pb-2">
          <MenuToggle icon={Eye} title="Incognito mode" description="Only people you have liked can see your profile." checked={onboarding.incognito} onCheckedChange={(incognito) => updateOnboarding({ incognito })} />
          <MenuToggle icon={Shield} title="Show distance" description="Allow approximate distance to appear on your profile." checked={onboarding.showDistance} onCheckedChange={(showDistance) => updateOnboarding({ showDistance })} />
        </div>
      </MenuFrame>
    )
  }

  if (panel === 'blocked-users') {
    return (
      <MenuFrame open={open} onClose={onClose} onBack={() => setPanel('root')} title="Blocked Users">
        <div className="px-1 pb-2">
          {blockedIds.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[.025] px-5 py-8 text-center">
              <UserRoundX className="mx-auto h-7 w-7 text-blue-200/45" strokeWidth={1.4} />
              <p className="mt-3 text-sm text-white/75">No blocked profiles</p>
              <p className="mt-1 text-xs text-white/40">Profiles you block will appear here.</p>
            </div>
          ) : blockedIds.map((id, index) => (
            <div key={id} className="mb-2 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[.025] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/45"><CircleUserRound className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm text-white/75">Blocked profile {index + 1}</p></div>
              <Button variant="glass" className="h-9 px-3 text-xs" onClick={() => void unblockProfile(id)}>Unblock</Button>
            </div>
          ))}
        </div>
      </MenuFrame>
    )
  }

  if (panel === 'safety') {
    return (
      <MenuFrame open={open} onClose={onClose} onBack={() => setPanel('root')} title="Safety Settings">
        <div className="space-y-3 px-1 pb-2">
          <div className="rounded-2xl border border-blue-200/12 bg-blue-400/[.045] p-4">
            <Shield className="h-5 w-5 text-blue-200/70" />
            <p className="mt-3 text-sm text-white/80">Your safety controls are always available.</p>
            <p className="mt-1 text-xs leading-relaxed text-white/45">Block or report another member from the three-dot menu on their profile.</p>
          </div>
          <MenuAction icon={UserRoundX} label="Manage Blocked Users" onClick={() => setPanel('blocked-users')} />
          <MenuAction icon={BadgeHelp} label="Contact Safety Support" onClick={() => { window.location.href = 'mailto:safety@perennia.com'; onClose() }} />
        </div>
      </MenuFrame>
    )
  }

  if (panel === 'notifications') {
    return (
      <MenuFrame open={open} onClose={onClose} onBack={() => setPanel('root')} title="Notifications">
        <div className="px-1 pb-2">
          <MenuToggle icon={Bell} title="Push notifications" description="Receive updates about matches, messages and important account activity." checked={onboarding.pushNotificationsEnabled} onCheckedChange={(pushNotificationsEnabled) => updateOnboarding({ pushNotificationsEnabled })} />
        </div>
      </MenuFrame>
    )
  }

  if (panel === 'membership') {
    return (
      <MenuFrame open={open} onClose={onClose} onBack={() => setPanel('root')} title="Membership">
        <div className="space-y-2 px-1 pb-2">
          <MenuAction icon={Sparkles} label="View / Upgrade Membership" onClick={() => go('/founding-500')} />
          <MenuAction icon={billingLoading ? Loader2 : WalletCards} label={billingLoading ? 'Opening billing…' : 'Billing Information'} onClick={openBilling} />
          {billingError && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{billingError}</p>}
          <MenuAction icon={X} label="Cancel Subscription" danger onClick={() => setConfirming('cancel-subscription')} />
        </div>
      </MenuFrame>
    )
  }

  if (panel === 'delete-account') {
    return (
      <MenuFrame open={open} onClose={onClose} onBack={() => setPanel('root')} title="Close Account">
        <div className="px-2 pb-2">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/15 text-rose-300"><Trash2 className="h-5 w-5" /></div>
          <p className="text-sm leading-relaxed text-white/60">Closing your account permanently removes your profile and data. This cannot be undone.</p>
          {firebaseConfigured && (
            <div className="mt-5">
              <label htmlFor="delete-account-password" className="mb-2 block text-xs text-white/55">Confirm your password</label>
              <Input id="delete-account-password" type="password" autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} placeholder="Enter your password" />
            </div>
          )}
          {deleteError && <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{deleteError}</p>}
          <Button className="mt-5 w-full bg-rose-500/20 text-rose-200 hover:bg-rose-500/30" onClick={confirmDeleteAccount} disabled={deletingAccount}>
            {deletingAccount ? 'Deleting account…' : 'Permanently Delete Account'}
          </Button>
        </div>
      </MenuFrame>
    )
  }

  return (
    <MenuFrame open={open} onClose={onClose} title="Profile Menu">
      <MenuGroup title="Profile">
        <MenuAction icon={Pencil} label="Edit Profile" onClick={() => { onClose(); onEditProfile() }} />
        <MenuAction icon={Sparkles} label="Edit Interests" onClick={() => go('/interests')} />
        <MenuAction icon={HeartHandshake} label="Edit Relationship Intention" onClick={() => go('/relationship-goals')} />
        <MenuAction icon={Images} label="Manage Photos & Videos" onClick={() => { onClose(); onManageMedia() }} />
        <MenuAction icon={SlidersHorizontal} label="Manage Highlights" onClick={() => { onClose(); onManageHighlights() }} />
      </MenuGroup>
      <MenuGroup title="Account & Privacy">
        <MenuAction icon={Shield} label="Privacy Settings" onClick={() => setPanel('privacy')} />
        <MenuAction icon={UserRoundX} label="Blocked Users" onClick={() => setPanel('blocked-users')} />
        <MenuAction icon={Shield} label="Safety Settings" onClick={() => setPanel('safety')} />
        <MenuAction icon={Bell} label="Notifications" onClick={() => setPanel('notifications')} />
      </MenuGroup>
      <MenuGroup title="Membership">
        <MenuAction icon={CreditCard} label="Manage Subscription" onClick={() => setPanel('membership')} />
        <MenuAction icon={Sparkles} label="View / Upgrade Membership" onClick={() => go('/founding-500')} />
        <MenuAction
          icon={billingLoading ? Loader2 : WalletCards}
          label={billingLoading ? 'Opening billing…' : 'Billing Information'}
          onClick={openBilling}
        />
        {billingError && <p className="px-3 pb-1 text-xs text-rose-300">{billingError}</p>}
        <MenuAction icon={X} label="Cancel Subscription" danger onClick={() => setConfirming('cancel-subscription')} />
      </MenuGroup>
      <MenuGroup title="Safety & Support">
        <MenuAction icon={BadgeHelp} label="Help & Support" onClick={() => { window.location.href = 'mailto:support@perennia.com'; onClose() }} />
        <MenuAction icon={Flag} label="Report a Problem" onClick={() => { window.location.href = 'mailto:support@perennia.com?subject=Report%20a%20Problem'; onClose() }} />
      </MenuGroup>
      <MenuGroup title="Account">
        <MenuAction icon={LogOut} label="Log Out" onClick={logout} />
        <MenuAction icon={Trash2} label="Close / Delete Account" danger onClick={() => setPanel('delete-account')} />
      </MenuGroup>
    </MenuFrame>
  )
}

export function OtherProfileActionsMenu({
  open,
  onClose,
  profileName,
  profileId,
  onBlock,
  onMute,
}: {
  open: boolean
  onClose: () => void
  profileName: string
  profileId: string
  onBlock: () => void
  onMute: () => void
}) {
  const [confirmBlock, setConfirmBlock] = useState(false)

  if (confirmBlock) {
    return (
      <MenuFrame open={open} onClose={() => setConfirmBlock(false)} title={`Block ${profileName.split(' ')[0]}?`}>
        <div className="px-2 pb-2">
          <p className="text-sm leading-relaxed text-white/60">Their profile will be removed from your discovery experience. This action requires confirmation.</p>
          <div className="mt-6 flex gap-3">
            <Button variant="glass" className="flex-1" onClick={() => setConfirmBlock(false)}>Cancel</Button>
            <Button className="flex-1 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30" onClick={() => { onBlock(); onClose() }}>Block Profile</Button>
          </div>
        </div>
      </MenuFrame>
    )
  }

  return (
    <MenuFrame open={open} onClose={onClose} title="Profile Options">
      <MenuGroup title="Safety">
        <MenuAction icon={Ban} label="Block User" danger onClick={() => setConfirmBlock(true)} />
        <MenuAction icon={Flag} label="Report User" danger onClick={() => { window.location.href = `mailto:safety@perennia.com?subject=Report%20profile%20${encodeURIComponent(profileId)}`; onClose() }} />
        <MenuAction icon={VolumeX} label="Mute / Hide Profile" onClick={() => { onMute(); onClose() }} />
      </MenuGroup>
      <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[.025] px-3 py-3 text-xs text-white/35">
        <CircleUserRound className="h-4 w-4" /> These controls apply only to this profile.
      </div>
    </MenuFrame>
  )
}
