/** Registers the real app-shell service worker (public/sw.js) — this is
 *  what makes the site installable as a PWA and lets an already-visited
 *  screen load offline. No-ops outside a browser or when unsupported. */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Installability/offline support is a real enhancement, not a hard
      // requirement — the app still works fully without it.
    })
  })
}
