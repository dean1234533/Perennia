import { getMessaging, getToken } from 'firebase/messaging'
import { app, firebaseConfigured } from '@/lib/firebase'
import { updateUserDoc, savePushTokenRemote } from '@/lib/firestore'

/** Real push-notification opt-in: requests the browser's actual Notification
 *  permission, and — when a VAPID key is configured — registers a real FCM
 *  token so the account can receive push while the app is closed. Without a
 *  VAPID key, permission can still be granted (foreground notifications
 *  work), but no token is registered — never fabricated as "connected". */

export const pushNotificationsSupported =
  typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined
export const fcmConfigured = Boolean(vapidKey && firebaseConfigured)

export type PushOptInResult =
  | { granted: true; tokenRegistered: boolean }
  | { granted: false; reason: 'denied' | 'unsupported' }

/** Registers the Firebase Messaging service worker at a narrow scope so it
 *  never collides with the app-shell service worker (sw.js) at "/". */
async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/fcm-push/' })
}

export async function requestPushOptIn(uid: string): Promise<PushOptInResult> {
  if (!pushNotificationsSupported) {
    return { granted: false, reason: 'unsupported' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { granted: false, reason: 'denied' }
  }

  if (!fcmConfigured) {
    // Real permission granted, but no server-side push channel configured
    // yet in this environment — be honest about the gap rather than
    // pretending a token was registered.
    await updateUserDoc(uid, { pushNotificationsEnabled: true })
    return { granted: true, tokenRegistered: false }
  }

  try {
    const messaging = getMessaging(app)
    const swRegistration = await registerMessagingServiceWorker()
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swRegistration })

    if (token) {
      await savePushTokenRemote(uid, token)
      return { granted: true, tokenRegistered: true }
    }
    await updateUserDoc(uid, { pushNotificationsEnabled: true })
    return { granted: true, tokenRegistered: false }
  } catch {
    await updateUserDoc(uid, { pushNotificationsEnabled: true })
    return { granted: true, tokenRegistered: false }
  }
}
