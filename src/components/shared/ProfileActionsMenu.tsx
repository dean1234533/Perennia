import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  BadgeHelp, Ban, Bell, ChevronRight, CircleUserRound, CreditCard, Flag,
  HeartHandshake, Images, LogOut, Loader2, Pencil, Shield, SlidersHorizontal, Sparkles,
  Trash2, UserRoundX, VolumeX, WalletCards, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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

function MenuFrame({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
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
              <h2 className="font-serif-display text-2xl text-ivory">{title}</h2>
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
  const { logOut } = useAuth()
  const { setAuthenticated } = useApp()
  const [confirming, setConfirming] = useState<'cancel-subscription' | 'delete-account' | null>(null)
  const [cancelStatus, setCancelStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [cancelError, setCancelError] = useState('')
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState('')

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

  if (confirming) {
    const deleting = confirming === 'delete-account'

    if (!deleting && cancelStatus === 'done') {
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
      <MenuFrame open={open} onClose={closeConfirm} title={deleting ? 'Close Account?' : 'Cancel Subscription?'}>
        <div className="px-2 pb-2">
          <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-full ${deleting ? 'bg-rose-500/15 text-rose-300' : 'bg-blue-500/15 text-blue-200'}`}>
            {deleting ? <Trash2 className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
          </div>
          <p className="text-sm leading-relaxed text-white/60">
            {deleting
              ? 'Closing your account permanently removes your profile and data. You will be asked to confirm your password before anything is deleted.'
              : 'This cancels your real Stripe subscription and ends billing immediately. You will lose access to the app until you rejoin.'}
          </p>
          {!deleting && cancelStatus === 'error' && (
            <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{cancelError}</p>
          )}
          <div className="mt-6 flex gap-3">
            <Button variant="glass" className="flex-1" onClick={closeConfirm} disabled={cancelStatus === 'loading'}>Go Back</Button>
            <Button
              className={`flex-1 ${deleting ? 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30' : ''}`}
              onClick={() => (deleting ? go('/settings#delete-account') : confirmCancelSubscription())}
              disabled={!deleting && cancelStatus === 'loading'}
            >
              {!deleting && cancelStatus === 'loading' ? 'Canceling…' : 'Continue'}
            </Button>
          </div>
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
        <MenuAction icon={Shield} label="Privacy Settings" onClick={() => go('/settings#privacy')} />
        <MenuAction icon={UserRoundX} label="Blocked Users" onClick={() => go('/settings#blocked-users')} />
        <MenuAction icon={Shield} label="Safety Settings" onClick={() => go('/settings#safety')} />
        <MenuAction icon={Bell} label="Notifications" onClick={() => go('/settings#notifications')} />
      </MenuGroup>
      <MenuGroup title="Membership">
        <MenuAction icon={CreditCard} label="Manage Subscription" onClick={() => go('/settings#membership')} />
        <MenuAction icon={Sparkles} label="View / Upgrade Membership" onClick={() => go('/founding-500')} />
        <MenuAction
          icon={billingLoading ? Loader2 : WalletCards}
          label={billingLoading ? 'Opening billing…' : 'Billing Information'}
          onClick={async () => {
            if (billingLoading) return
            setBillingLoading(true)
            setBillingError('')
            try {
              const { url } = await createBillingPortalSession(window.location.origin + '/settings')
              window.location.href = url
            } catch (err) {
              setBillingError(err instanceof Error ? err.message : 'Could not open billing. Please try again.')
              setBillingLoading(false)
            }
          }}
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
        <MenuAction icon={Trash2} label="Close / Delete Account" danger onClick={() => setConfirming('delete-account')} />
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
