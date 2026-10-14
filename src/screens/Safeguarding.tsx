import { useEffect, useState, type ElementType, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgeHelp,
  Ban,
  CalendarClock,
  Clock3,
  CreditCard,
  Flag,
  HandHeart,
  HeartOff,
  Leaf,
  Loader2,
  LockKeyhole,
  Pause,
  Phone,
  Shield,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { getLocalAccountPause, pauseAccount, resumeAccount, type AccountPauseDuration } from '@/lib/accountPause'
import { createBillingPortalSession } from '@/lib/founding500'
import { firebaseConfigured } from '@/lib/firebase'
import { getPublicProfile, subscribeMyConnections, type DiscoveryCandidate } from '@/lib/firestore'
import { endConnectionRemote, reportProfileRemote } from '@/lib/privacyApi'
import './Safeguarding.css'

type SafeguardingProps = {
  preview?: boolean
}

type ActionCardProps = {
  accent: 'rose' | 'blue' | 'gold'
  buttonLabel: string
  children: ReactNode
  description: string
  icon: ElementType
  onClick: () => void
  title: string
}

type MemberSafetyAction = 'end' | 'block' | 'report'

function ActionCard({ accent, buttonLabel, children, description, icon: Icon, onClick, title }: ActionCardProps) {
  return (
    <article className={`safeguarding-action-card safeguarding-action-card--${accent}`}>
      <div className="safeguarding-action-heading">
        <span className="safeguarding-action-icon"><Icon aria-hidden="true" /></span>
        <h3>{title}</h3>
      </div>
      <p className="safeguarding-action-lead">{description}</p>
      <p className="safeguarding-action-copy">{children}</p>
      <button type="button" onClick={onClick} className="safeguarding-card-button">
        {buttonLabel}
      </button>
    </article>
  )
}

export function Safeguarding({ preview = false }: SafeguardingProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { onboarding, safeMode, updateSafeMode, blockProfile } = useApp()
  const [notice, setNotice] = useState<string | null>(null)
  const [safeModeBusy, setSafeModeBusy] = useState(false)
  const [billingBusy, setBillingBusy] = useState(false)
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
  const [pauseDuration, setPauseDuration] = useState<AccountPauseDuration>('14-days')
  const [pauseBusy, setPauseBusy] = useState(false)
  const [pauseUntil, setPauseUntil] = useState<string | null>(() => getLocalAccountPause())
  const [memberAction, setMemberAction] = useState<MemberSafetyAction | null>(null)
  const [connections, setConnections] = useState<Array<{ uid: string; profile: DiscoveryCandidate }>>([])
  const [connectionsLoading, setConnectionsLoading] = useState(false)
  const [memberActionBusy, setMemberActionBusy] = useState<string | null>(null)
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const [guidelinesOpen, setGuidelinesOpen] = useState(false)

  useEffect(() => {
    const remotePause = onboarding.accountPausedUntil
    setPauseUntil(remotePause && new Date(remotePause).getTime() > Date.now() ? remotePause : getLocalAccountPause())
  }, [onboarding.accountPausedUntil])

  const pauseIsActive = Boolean(pauseUntil && new Date(pauseUntil).getTime() > Date.now())
  const pauseEndLabel = pauseUntil
    ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(pauseUntil))
    : ''

  const handleSafeModeChange = async (enabled: boolean) => {
    setSafeModeBusy(true)
    setNotice(null)
    try {
      await updateSafeMode(enabled)
      setNotice(`Safe Mode is ${enabled ? 'on' : 'off'} and has been saved.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Safe Mode could not be updated. Please try again.')
    } finally {
      setSafeModeBusy(false)
    }
  }

  useEffect(() => {
    if (!memberAction) return
    if (!firebaseConfigured || !user) {
      setConnections([])
      setConnectionsLoading(false)
      return
    }
    setConnectionsLoading(true)
    return subscribeMyConnections(user.uid, (items) => {
      Promise.all(items.map(async (connection) => {
        const otherUid = connection.users.find((uid) => uid !== user.uid)
        if (!otherUid) return null
        const profile = await getPublicProfile(otherUid)
        return profile ? { uid: otherUid, profile } : null
      })).then((profiles) => {
        setConnections(profiles.filter((item): item is { uid: string; profile: DiscoveryCandidate } => item !== null))
        setConnectionsLoading(false)
      }).catch(() => setConnectionsLoading(false))
    })
  }, [memberAction, user])

  const handlePauseAccount = async () => {
    setPauseBusy(true)
    setNotice(null)
    try {
      const result = await pauseAccount(pauseDuration)
      setPauseUntil(result.pausedUntil)
      setPauseDialogOpen(false)
      const label = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(result.pausedUntil))
      setNotice(`Your account is paused until ${label}. Your profile is now hidden from Explore and new compatibility matches.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Your account could not be paused. Please try again.')
      setPauseDialogOpen(false)
    } finally {
      setPauseBusy(false)
    }
  }

  const handleBilling = async () => {
    if (billingBusy) return
    if (!firebaseConfigured || preview) {
      navigate('/settings#membership')
      return
    }
    setBillingBusy(true)
    setNotice(null)
    try {
      const { url } = await createBillingPortalSession(`${window.location.origin}/safeguarding`)
      window.location.assign(url)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Billing could not be opened. Please try again.')
      setBillingBusy(false)
    }
  }

  const handleMemberAction = async (targetUid: string, name: string) => {
    if (!memberAction || memberActionBusy) return
    setMemberActionBusy(targetUid)
    setNotice(null)
    try {
      if (firebaseConfigured) {
        if (memberAction === 'end') await endConnectionRemote(targetUid)
        if (memberAction === 'block') await blockProfile(targetUid)
        if (memberAction === 'report') await reportProfileRemote(targetUid)
      }
      const firstName = name.split(' ')[0]
      const message = memberAction === 'end'
        ? `Your connection with ${firstName} has ended.`
        : memberAction === 'block'
          ? `${firstName} has been blocked and can no longer contact or find you.`
          : `Your report about ${firstName} has been submitted for review.`
      setConnections((current) => memberAction === 'report' ? current : current.filter((item) => item.uid !== targetUid))
      setMemberAction(null)
      setNotice(message)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'That action could not be completed. Please try again.')
      setMemberAction(null)
    } finally {
      setMemberActionBusy(null)
    }
  }

  const handleResumeAccount = async () => {
    setPauseBusy(true)
    setNotice(null)
    try {
      await resumeAccount()
      setPauseUntil(null)
      setNotice('Your account is active again. Your profile can now appear in Explore and compatibility matches.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Your account could not be resumed. Please try again.')
    } finally {
      setPauseBusy(false)
    }
  }

  return (
    <div className="safeguarding-page">
      <div className="safeguarding-page-glow" aria-hidden="true" />
      <div className="safeguarding-shell">
        <header className="safeguarding-header">
          <button type="button" onClick={() => navigate(-1)} className="safeguarding-back-button" aria-label="Go back">
            <ArrowLeft aria-hidden="true" />
            <span>Back</span>
          </button>
          <div className="safeguarding-title-row">
            <span className="safeguarding-title-mark" aria-hidden="true"><ShieldCheck /></span>
            <div>
              <p className="safeguarding-eyebrow">Safety &amp; support</p>
              <h1>Safeguarding</h1>
            </div>
          </div>
          <p className="safeguarding-intro">
            Your safety and peace of mind come first. Tools and support to help you date with confidence.
          </p>
        </header>

        {notice && (
          <div className="safeguarding-notice" role="status">
            <BadgeHelp aria-hidden="true" />
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notice">Dismiss</button>
          </div>
        )}

        <section className="safeguarding-feature-card safeguarding-safe-mode" aria-labelledby="safe-mode-title">
          <span className="safeguarding-feature-icon safeguarding-feature-icon--violet" aria-hidden="true"><Leaf /></span>
          <div className="safeguarding-feature-content">
            <div className="safeguarding-feature-heading">
              <h2 id="safe-mode-title">Safe Mode</h2>
              <span className="safeguarding-pill safeguarding-pill--violet">Available to all members</span>
            </div>
            <p className="safeguarding-feature-lead">Use Perennia with greater privacy and control.</p>
            <ul className="safeguarding-check-list">
              <li>You are hidden from general Explore.</li>
              <li>Existing conversations remain available.</li>
              <li>You may still appear in high-compatibility match results.</li>
            </ul>
          </div>
          <div className="safeguarding-toggle-wrap">
            <Switch
              checked={safeMode}
              disabled={safeModeBusy}
              onCheckedChange={(enabled) => void handleSafeModeChange(enabled)}
              aria-label="Safe Mode"
              className="safeguarding-switch"
            />
            <strong>Safe Mode is {safeMode ? 'on' : 'off'}</strong>
            <small>{safeModeBusy ? 'Saving…' : 'Saved'}</small>
          </div>
        </section>

        <section className="safeguarding-section" aria-labelledby="pause-account-title">
          <h2 className="safeguarding-section-title" id="pause-account-title">Take a break or manage your visibility</h2>
          <div className="safeguarding-feature-card safeguarding-pause-card">
            <span className="safeguarding-feature-icon safeguarding-feature-icon--gold" aria-hidden="true"><Pause /></span>
            <div className="safeguarding-feature-content">
              <div className="safeguarding-feature-heading">
                <h3>Pause Account</h3>
                <span className="safeguarding-pill safeguarding-pill--gold">{pauseIsActive ? `Paused until ${pauseEndLabel}` : 'Paid feature'}</span>
              </div>
              <p className="safeguarding-feature-lead">Take a complete break from Perennia while keeping your account in place.</p>
              <p className="safeguarding-feature-copy">Your profile will be hidden from Explore and compatibility matches for the pause period.</p>
            </div>
            <div className="safeguarding-pause-rules" aria-label="Pause Account rules">
              <div><Clock3 aria-hidden="true" /><span><small>Minimum pause</small><strong>14 days</strong></span></div>
              <div><CalendarClock aria-hidden="true" /><span><small>Maximum pause</small><strong>4 months</strong></span></div>
              <div><Pause aria-hidden="true" /><span><small>Pause allowance</small><strong>3 in any rolling 12 months</strong></span></div>
            </div>
            <div className="safeguarding-pause-actions">
              <Button
                type="button"
                disabled={pauseBusy}
                onClick={pauseIsActive ? handleResumeAccount : () => setPauseDialogOpen(true)}
                className="safeguarding-primary-button"
              >
                {pauseBusy && <Loader2 className="animate-spin" aria-hidden="true" />}
                {pauseBusy ? 'Updating…' : pauseIsActive ? 'Resume Account' : 'Pause Account'}
              </Button>
              <button type="button" disabled={billingBusy} onClick={() => void handleBilling()} className="safeguarding-link-button">
                {billingBusy ? 'Opening Billing…' : 'Manage Subscription'} <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="safeguarding-subscription-note">
            <CreditCard aria-hidden="true" />
            <span><strong>Your subscription continues during a pause.</strong> No billing changes are made from this screen.</span>
          </div>
        </section>

        <section className="safeguarding-section" aria-labelledby="connection-support-title">
          <h2 className="safeguarding-section-title" id="connection-support-title">End a connection or get support</h2>
          <div className="safeguarding-action-grid">
            <ActionCard
              accent="rose"
              buttonLabel="Use this option"
              description="End a connection respectfully."
              icon={HeartOff}
              onClick={() => setMemberAction('end')}
              title="No Longer Interested"
            >
              The connection will be removed and the conversation will close.
            </ActionCard>
            <ActionCard
              accent="blue"
              buttonLabel="Block Someone"
              description="Prevent unwanted contact."
              icon={Ban}
              onClick={() => setMemberAction('block')}
              title="Block Someone"
            >
              They will not be able to contact you or view or find your profile.
            </ActionCard>
            <ActionCard
              accent="gold"
              buttonLabel="Report Someone"
              description="Report inappropriate or unsafe behaviour."
              icon={Flag}
              onClick={() => setMemberAction('report')}
              title="Report Someone"
            >
              Your report will be submitted privately to the Perennia safety team for review.
            </ActionCard>
          </div>
        </section>

        <section className="safeguarding-section" aria-labelledby="need-help-title">
          <h2 className="safeguarding-section-title" id="need-help-title">Need help?</h2>
          <div className="safeguarding-help-card">
            <div className="safeguarding-help-primary">
              <span className="safeguarding-feature-icon safeguarding-feature-icon--violet" aria-hidden="true"><HandHeart /></span>
              <div>
                <h3>You’re not alone</h3>
                <p>If you are experiencing abuse, harassment or feeling unsafe, support is available.</p>
                <button type="button" onClick={() => navigate('/settings#safety')} className="safeguarding-link-button">
                  Safety Centre <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="safeguarding-emergency">
              <Phone aria-hidden="true" />
              <div>
                <h3>In immediate danger?</h3>
                <p>Contact your local emergency services. Perennia is not an emergency service.</p>
                <button type="button" onClick={() => setEmergencyOpen(true)}>Emergency Contacts</button>
              </div>
            </div>
          </div>
          <button type="button" onClick={() => setGuidelinesOpen(true)} className="safeguarding-guidelines-card">
            <LockKeyhole aria-hidden="true" />
            <span>
              <strong>Community Guidelines</strong>
              <small>Our commitment to a respectful, safe and supportive community.</small>
            </span>
            <ArrowRight aria-hidden="true" />
          </button>
        </section>

        <footer className="safeguarding-footer">
          <Shield aria-hidden="true" />
          <p>Your safety is our priority. If you ever feel unsafe or need support, we’re here to help.</p>
          {preview && <span>Local design preview</span>}
        </footer>
      </div>

      <Dialog open={pauseDialogOpen} onOpenChange={(open) => !pauseBusy && setPauseDialogOpen(open)}>
        <DialogContent className="safeguarding-pause-dialog">
          <DialogHeader>
            <DialogTitle>Pause your account</DialogTitle>
            <DialogDescription className="!text-[#68637b] leading-relaxed">
              Your profile will be hidden from Explore and new compatibility matches. Your subscription and existing conversations will continue.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="pause-duration">Pause for</label>
          <select
            id="pause-duration"
            value={pauseDuration}
            onChange={(event) => setPauseDuration(event.target.value as AccountPauseDuration)}
            disabled={pauseBusy}
          >
            <option value="14-days">14 days</option>
            <option value="1-month">1 month</option>
            <option value="2-months">2 months</option>
            <option value="3-months">3 months</option>
            <option value="4-months">4 months</option>
          </select>
          <p>You can pause your account up to three times in any rolling 12-month period.</p>
          <div className="safeguarding-pause-dialog-actions">
            <button type="button" onClick={() => setPauseDialogOpen(false)} disabled={pauseBusy}>Cancel</button>
            <Button type="button" onClick={handlePauseAccount} disabled={pauseBusy} className="safeguarding-primary-button">
              {pauseBusy && <Loader2 className="animate-spin" aria-hidden="true" />}
              {pauseBusy ? 'Pausing…' : 'Confirm Pause'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={memberAction !== null} onOpenChange={(open) => !open && !memberActionBusy && setMemberAction(null)}>
        <DialogContent className="safeguarding-pause-dialog safeguarding-member-dialog">
          <DialogHeader>
            <DialogTitle>
              {memberAction === 'end' ? 'End a connection' : memberAction === 'block' ? 'Block someone' : 'Report someone'}
            </DialogTitle>
            <DialogDescription className="!text-[#68637b] leading-relaxed">
              {memberAction === 'end'
                ? 'Choose the connection you no longer wish to continue. Your conversation will close.'
                : memberAction === 'block'
                  ? 'Choose a member to prevent them from contacting you or finding your profile.'
                  : 'Choose the member whose behaviour you want Perennia to review.'}
            </DialogDescription>
          </DialogHeader>
          {connectionsLoading ? (
            <div className="safeguarding-dialog-loading" role="status"><Loader2 className="animate-spin" /> Loading your connections…</div>
          ) : connections.length ? (
            <div className="safeguarding-member-list">
              {connections.map(({ uid, profile }) => (
                <button
                  type="button"
                  key={uid}
                  disabled={memberActionBusy !== null}
                  onClick={() => void handleMemberAction(uid, profile.name)}
                >
                  <img src={profile.profilePhotoThumbUrl || profile.profilePhotoUrl} alt="" />
                  <span><strong>{profile.name}</strong><small>{profile.city || profile.country || 'Perennia member'}</small></span>
                  {memberActionBusy === uid ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="safeguarding-dialog-empty">
              <p>You do not have any current connections to choose from.</p>
              <Button type="button" onClick={() => { setMemberAction(null); navigate('/messages') }} className="safeguarding-primary-button">
                Open Messages
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
        <DialogContent className="safeguarding-pause-dialog safeguarding-information-dialog">
          <DialogHeader>
            <DialogTitle>Emergency contacts</DialogTitle>
            <DialogDescription className="!text-[#68637b] leading-relaxed">
              If you or someone else is in immediate danger, contact your local emergency service now. Perennia cannot provide emergency assistance.
            </DialogDescription>
          </DialogHeader>
          <a className="safeguarding-dialog-primary-link" href="tel:112"><Phone aria-hidden="true" /> Call 112</a>
          <p>If 112 is not the emergency number where you are, call the appropriate local emergency number instead.</p>
          <a className="safeguarding-dialog-secondary-link" href="mailto:safety@perennia.com?subject=Safety%20Support">Contact Perennia Safety Support</a>
        </DialogContent>
      </Dialog>

      <Dialog open={guidelinesOpen} onOpenChange={setGuidelinesOpen}>
        <DialogContent className="safeguarding-pause-dialog safeguarding-information-dialog">
          <DialogHeader>
            <DialogTitle>Community Guidelines</DialogTitle>
            <DialogDescription className="!text-[#68637b] leading-relaxed">
              Everyone on Perennia is expected to help keep the community respectful and safe.
            </DialogDescription>
          </DialogHeader>
          <ul className="safeguarding-guidelines-list">
            <li>Be honest about who you are and what you are looking for.</li>
            <li>Treat every member with dignity; harassment and discrimination are not tolerated.</li>
            <li>Respect consent, privacy, personal boundaries and a member’s decision to end contact.</li>
            <li>Never request money, financial details, passwords or identity documents.</li>
            <li>Report suspicious, abusive or unsafe behaviour so it can be reviewed.</li>
          </ul>
          <a className="safeguarding-dialog-secondary-link" href="mailto:safety@perennia.com?subject=Community%20Guidelines">Ask the Safety Team a Question</a>
        </DialogContent>
      </Dialog>
    </div>
  )
}
