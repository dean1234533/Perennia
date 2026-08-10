// Real Firebase Cloud Messaging service worker — handles push notifications
// that arrive while the app isn't in the foreground. Registered at a narrow
// scope (see src/lib/pushNotifications.ts) so it doesn't collide with the
// app-shell service worker (sw.js) at the root scope.
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js')

// Same values as src/lib/firebase.ts — this is the public Firebase Web SDK
// config (not a secret; it's shipped to every client either way), and can't
// read import.meta.env since this file is served as-is, not bundled.
firebase.initializeApp({
  apiKey: 'AIzaSyCt2JZXgjy9VPtHH9ahAMrmofCrmDG0xgU',
  authDomain: 'perennia-982a6.firebaseapp.com',
  projectId: 'perennia-982a6',
  storageBucket: 'perennia-982a6.firebasestorage.app',
  messagingSenderId: '142875030263',
  appId: '1:142875030263:web:29a302a5a4a644505119f2',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Perennia'
  const body = payload.notification?.body || 'You have a new update.'
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data,
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/messages'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return self.clients.openWindow(target)
    })
  )
})
