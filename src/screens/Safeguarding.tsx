import { useState, type ElementType, type ReactNode } from 'react'
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
  LockKeyhole,
  Pause,
  Phone,
  Shield,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
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
  const [safeMode, setSafeMode] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const showPreviewNotice = (label: string) => {
    setNotice(`${label} is a preview-only control. No account, connection, report or subscription change was made.`)
  }

  const handleSafeModeChange = (enabled: boolean) => {
    setSafeMode(enabled)
    setNotice(`Safe Mode is ${enabled ? 'on' : 'off'} for this page preview only. This setting has not been saved.`)
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
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss preview notice">Dismiss</button>
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
              onCheckedChange={handleSafeModeChange}
              aria-label="Safe Mode"
              className="safeguarding-switch"
            />
            <strong>Safe Mode is {safeMode ? 'on' : 'off'}</strong>
            <small>Not saved</small>
          </div>
        </section>

        <section className="safeguarding-section" aria-labelledby="pause-account-title">
          <h2 className="safeguarding-section-title" id="pause-account-title">Take a break or manage your visibility</h2>
          <div className="safeguarding-feature-card safeguarding-pause-card">
            <span className="safeguarding-feature-icon safeguarding-feature-icon--gold" aria-hidden="true"><Pause /></span>
            <div className="safeguarding-feature-content">
              <div className="safeguarding-feature-heading">
                <h3>Pause Account</h3>
                <span className="safeguarding-pill safeguarding-pill--gold">Paid feature</span>
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
              <Button type="button" onClick={() => showPreviewNotice('Pause Account')} className="safeguarding-primary-button">
                Pause Account
              </Button>
              <button type="button" onClick={() => showPreviewNotice('Manage Subscription')} className="safeguarding-link-button">
                Manage Subscription <ArrowRight aria-hidden="true" />
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
              onClick={() => showPreviewNotice('No Longer Interested')}
              title="No Longer Interested"
            >
              The other member will be informed and the conversation will close.
            </ActionCard>
            <ActionCard
              accent="blue"
              buttonLabel="Block Someone"
              description="Prevent unwanted contact."
              icon={Ban}
              onClick={() => showPreviewNotice('Block Someone')}
              title="Block Someone"
            >
              They will not be able to contact you or view or find your profile.
            </ActionCard>
            <ActionCard
              accent="gold"
              buttonLabel="Report Someone"
              description="Report inappropriate or unsafe behaviour."
              icon={Flag}
              onClick={() => showPreviewNotice('Report Someone')}
              title="Report Someone"
            >
              Reports can be reviewed and investigated when backend support is connected.
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
                <button type="button" onClick={() => showPreviewNotice('Safety Centre')} className="safeguarding-link-button">
                  Safety Centre <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="safeguarding-emergency">
              <Phone aria-hidden="true" />
              <div>
                <h3>In immediate danger?</h3>
                <p>Contact your local emergency services. Perennia is not an emergency service.</p>
                <button type="button" onClick={() => showPreviewNotice('Emergency Contacts')}>Emergency Contacts</button>
              </div>
            </div>
          </div>
          <button type="button" onClick={() => showPreviewNotice('Community Guidelines')} className="safeguarding-guidelines-card">
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
    </div>
  )
}
