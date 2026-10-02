import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { ConnectionHeartsIcon } from '@/components/shared/ConnectionHeartsIcon'
import type { CompatibilityResult } from '@/lib/compatibilityApi'
import { useModalAccessibility } from '@/hooks/useModalAccessibility'

export function CompatibilityWhyDialog({
  memberName,
  result,
  onClose,
}: {
  memberName: string
  result: CompatibilityResult
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLElement>(null)
  useModalAccessibility({ open: true, dialogRef, onClose })

  const sections = [
    { title: 'Your connection', body: result.insights.understanding },
    { title: 'How you may connect', body: result.insights.communication },
    { title: 'Looking ahead', body: result.insights.longTermPotential },
  ].filter((section) => section.body.trim())

  return createPortal(
    <div
      className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-[#01040ed1] p-4 backdrop-blur-lg"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={dialogRef}
        className="relative max-h-[calc(100svh-2rem)] w-full max-w-[32.5rem] overflow-y-auto rounded-[1.6rem] border border-blue-200/30 bg-[radial-gradient(circle_at_50%_0,rgba(123,77,206,.18),transparent_42%),linear-gradient(155deg,rgba(15,28,65,.98),rgba(4,9,25,.99))] p-5 text-center shadow-[0_28px_90px_rgba(0,0,0,.58),0_0_35px_rgba(109,96,255,.16)] sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compatibility-why-title"
        data-modal-surface
        tabIndex={-1}
      >
        <button type="button" data-modal-initial-focus className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/[.06] text-white/70" onClick={onClose} aria-label="Close match explanation">
          <X className="h-4.5 w-4.5" />
        </button>
        <ConnectionHeartsIcon className="mx-auto mb-2 h-13 w-13 object-contain drop-shadow-[0_0_14px_rgba(176,108,255,.28)]" />
        <p className="text-[.72rem] font-bold uppercase tracking-[.12em] text-[#f3cc83]">{result.compatibility}% compatible</p>
        <h2 id="compatibility-why-title" className="mx-auto mt-1 mb-5 max-w-sm font-serif-display text-[clamp(1.75rem,4vw,2.35rem)] font-medium leading-[1.12] text-white">Why you matched with {memberName}</h2>
        {sections.length > 0 ? (
          <div className="grid gap-3 text-left">
            {sections.map((section) => (
              <div key={section.title} className="rounded-2xl border border-blue-200/15 bg-white/[.035] px-4 py-3.5">
                <h3 className="text-[.82rem] font-bold text-[#d7e5ff]">{section.title}</h3>
                <p className="mt-1 text-[.82rem] leading-[1.55] text-white/70">{section.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="my-2 text-[.82rem] leading-[1.55] text-white/70">A detailed explanation is unavailable right now.</p>
        )}
        <p className="mx-auto mt-4 max-w-sm text-[.68rem] leading-5 text-white/40">Compatibility offers guidance, not a guarantee of relationship success.</p>
      </section>
    </div>,
    document.body,
  )
}
