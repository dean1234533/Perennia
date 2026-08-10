import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

const DISMISS_KEY = 'perennia_install_dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

/** A real "install this app" banner — uses the actual `beforeinstallprompt`
 *  event on Chrome/Edge/Android (nothing fires it unless the browser
 *  genuinely considers the app installable), with honest manual
 *  instructions on iOS Safari, which has no such API. Only ever shown once
 *  a member is fully signed up and inside the real app (mounted from
 *  AppShell, not the public/onboarding routes). */
export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')

  useEffect(() => {
    if (isStandalone()) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    if (isIOS()) setShowIOSInstructions(true)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    dismiss()
  }

  if (dismissed || isStandalone() || (!deferredPrompt && !showIOSInstructions)) return null

  return (
    <div className="glass-strong mb-4 flex items-center gap-3 rounded-2xl border border-gold/15 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
        <Download className="h-4 w-4 text-gold" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">Install Perennia</p>
        {deferredPrompt ? (
          <p className="text-xs text-white/50">Add it to your home screen for the full app experience.</p>
        ) : (
          <p className="flex flex-wrap items-center gap-1 text-xs text-white/50">
            Tap <Share className="h-3 w-3 shrink-0" strokeWidth={2} /> then "Add to Home Screen".
          </p>
        )}
      </div>
      {deferredPrompt && (
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-full bg-gradient-to-r from-gold to-champagne px-3.5 py-1.5 text-xs font-semibold text-midnight cursor-pointer"
        >
          Install
        </button>
      )}
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
