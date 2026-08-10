import { useEffect, useState } from 'react'
import { BellRing, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { pushNotificationsSupported, requestPushOptIn } from '@/lib/pushNotifications'

const DISMISS_KEY = 'perennia_notifications_dismissed'

/** A real notification opt-in banner — requests the browser's actual
 *  Notification permission and (when a VAPID key is configured) registers
 *  a real FCM push token, rather than just flipping a decorative toggle.
 *  Only shown while permission is genuinely still undecided, and only
 *  inside the real app (mounted from AppShell) once a member is fully
 *  signed up. */
export function NotificationPermissionBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (pushNotificationsSupported) setPermission(Notification.permission)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  const handleEnable = async () => {
    if (!user) return
    setLoading(true)
    const result = await requestPushOptIn(user.uid)
    setLoading(false)
    setPermission(pushNotificationsSupported ? Notification.permission : null)
    if (!result.granted && result.reason === 'denied') dismiss()
    if (result.granted) dismiss()
  }

  if (dismissed || !user || !pushNotificationsSupported || permission !== 'default') return null

  return (
    <div className="glass-strong mb-4 flex items-center gap-3 rounded-2xl border border-lavender/20 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavender/10">
        <BellRing className="h-4 w-4 text-lavender" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">Turn on notifications</p>
        <p className="text-xs text-white/50">Never miss a new match or message.</p>
      </div>
      <button
        onClick={handleEnable}
        disabled={loading}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-gold to-champagne px-3.5 py-1.5 text-xs font-semibold text-midnight cursor-pointer disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Turn On'}
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 text-white/35 hover:text-white/70 cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
