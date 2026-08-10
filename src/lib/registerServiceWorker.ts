/** Registers the real app-shell service worker (public/sw.js) — this is
 *  what makes the site installable as a PWA and lets an already-visited
 *  screen load offline. No-ops outside a browser or when unsupported. */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  // A cache-first app-shell worker is useful in production, but in local
  // development it can keep serving yesterday's CSS/JS after a Vite
  // rebuild. Remove only Perennia's own shell worker/cache locally so
  // responsive visual changes are always visible on refresh.
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations
        .filter((registration) => registration.scope === `${window.location.origin}/`)
        .forEach((registration) => registration.unregister())
    })
    if ('caches' in window) {
      window.caches.keys().then((keys) => {
        keys.filter((key) => key.startsWith('perennia-shell-')).forEach((key) => window.caches.delete(key))
      })
    }
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Installability/offline support is a real enhancement, not a hard
      // requirement — the app still works fully without it.
    })
  })
}
