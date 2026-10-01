import { useEffect, useRef, type RefObject } from 'react'

type ModalEntry = {
  id: symbol
  dialogRef: RefObject<HTMLElement | null>
}

const modalStack: ModalEntry[] = []
const originalInert = new Map<HTMLElement, boolean>()
let originalBodyOverflow: string | null = null
let originalDocumentOverflow: string | null = null

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'video[controls]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

function isVisible(element: HTMLElement) {
  const style = window.getComputedStyle(element)
  return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0
}

function getFocusableElements(dialog: HTMLElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => (
    isVisible(element) && element.getAttribute('aria-hidden') !== 'true' && !element.closest('[inert]')
  ))
}

function rememberAndSetInert(element: HTMLElement, inert: boolean) {
  if (!originalInert.has(element)) originalInert.set(element, element.inert)
  element.inert = inert
}

function restoreInertElements() {
  originalInert.forEach((wasInert, element) => {
    if (element.isConnected) element.inert = wasInert
  })
  originalInert.clear()
}

function inertEverythingOutside(dialog: HTMLElement) {
  let current: HTMLElement = dialog
  while (current.parentElement) {
    const parent = current.parentElement
    Array.from(parent.children).forEach((sibling) => {
      if (sibling !== current && sibling instanceof HTMLElement) rememberAndSetInert(sibling, true)
    })
    if (parent === document.body) break
    current = parent
  }
}

function syncPageState() {
  restoreInertElements()

  const topmost = modalStack.at(-1)
  const dialog = topmost?.dialogRef.current
  if (dialog) inertEverythingOutside(dialog)

  if (modalStack.length > 0) {
    if (originalBodyOverflow === null) originalBodyOverflow = document.body.style.overflow
    if (originalDocumentOverflow === null) originalDocumentOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  } else {
    if (originalBodyOverflow !== null) document.body.style.overflow = originalBodyOverflow
    if (originalDocumentOverflow !== null) document.documentElement.style.overflow = originalDocumentOverflow
    originalBodyOverflow = null
    originalDocumentOverflow = null
  }
}

/**
 * Applies the keyboard and page-state behaviour shared by modal overlays.
 * Visual presentation and backdrop click handling remain owned by callers.
 */
export function useModalAccessibility({
  open,
  dialogRef,
  onClose,
  initialFocusRef,
}: {
  open: boolean
  dialogRef: RefObject<HTMLElement | null>
  onClose: () => void
  initialFocusRef?: RefObject<HTMLElement | null>
}) {
  const idRef = useRef(Symbol('modal'))
  const onCloseRef = useRef(onClose)
  const initialFocusRefRef = useRef(initialFocusRef)

  onCloseRef.current = onClose
  initialFocusRefRef.current = initialFocusRef

  useEffect(() => {
    if (!open) return

    const entry: ModalEntry = { id: idRef.current, dialogRef }
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    modalStack.push(entry)
    syncPageState()

    const focusFrame = window.requestAnimationFrame(() => {
      if (modalStack.at(-1)?.id !== entry.id) return
      const dialog = dialogRef.current
      if (!dialog) return
      const preferred = initialFocusRefRef.current?.current
        ?? dialog.querySelector<HTMLElement>('[data-modal-initial-focus]')
        ?? getFocusableElements(dialog)[0]
        ?? dialog
      preferred.focus({ preventScroll: true })
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (modalStack.at(-1)?.id !== entry.id) return
      const dialog = dialogRef.current
      if (!dialog) return

      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return
      const focusable = getFocusableElements(dialog)
      if (focusable.length === 0) {
        event.preventDefault()
        dialog.focus({ preventScroll: true })
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault()
        last.focus({ preventScroll: true })
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault()
        first.focus({ preventScroll: true })
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown, true)
      const wasTopmost = modalStack.at(-1)?.id === entry.id
      const entryIndex = modalStack.findIndex((candidate) => candidate.id === entry.id)
      if (entryIndex >= 0) modalStack.splice(entryIndex, 1)
      syncPageState()

      if (wasTopmost && previouslyFocused?.isConnected) {
        window.requestAnimationFrame(() => previouslyFocused.focus({ preventScroll: true }))
      }
    }
  }, [dialogRef, open])
}
