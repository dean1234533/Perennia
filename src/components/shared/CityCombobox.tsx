import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react'
import { searchCities, type CityMatch } from '@/lib/citySearchApi'

/** A real searchable city dropdown backed by the `searchCities` Cloud
 *  Function (live query against the ~138k-city dataset), scoped to a
 *  selected country when one is provided. Selecting a suggestion is the
 *  only way to produce a value — typing alone never resolves to
 *  coordinates.
 *
 *  Deliberately uncontrolled: this component owns its own text + selection
 *  state and only ever reports outward via onSelect, instead of taking a
 *  `value` prop it has to keep reconciled with its own local text state.
 *  Earlier versions tried to stay in sync with a parent-owned value and
 *  that two-way binding was the root of several real bugs (stale closures,
 *  blur races, the visible text disagreeing with what was actually
 *  selected). To reset it (e.g. when the country changes), remount it
 *  with a new `key` from the parent rather than pushing a new value in. */
export function CityCombobox({
  countryCode,
  initialValue = '',
  onSelect,
  placeholder = 'Select city',
  disabled = false,
}: {
  countryCode: string
  initialValue?: string
  onSelect: (city: CityMatch | null) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [query, setQuery] = useState(initialValue)
  const [selected, setSelected] = useState(Boolean(initialValue))
  const [results, setResults] = useState<CityMatch[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Never searches once a real selection has been made — there's nothing
  // to look up until the member actually edits the text again.
  useEffect(() => {
    if (!open || selected || query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const matches = await searchCities(query, countryCode || undefined)
        if (!cancelled) setResults(matches)
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, countryCode, open, selected])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (city: CityMatch) => {
    setQuery(city.name)
    setSelected(true)
    setOpen(false)
    onSelect(city)
  }

  const handleChange = (text: string) => {
    setQuery(text)
    setOpen(true)
    // Editing after a selection immediately invalidates it — the parent
    // never holds on to a city that no longer matches what's on screen.
    if (selected) {
      setSelected(false)
      onSelect(null)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/50" strokeWidth={1.75} />
      <input
        type="text"
        value={query}
        disabled={disabled}
        placeholder={countryCode ? placeholder : 'Select a country first'}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => !selected && setOpen(true)}
        onBlur={() => {
          // A real selection click can never trigger this — its button
          // uses onPointerDown/preventDefault so the input never loses
          // focus during the click, no race to work around. Anything
          // that does reach here is genuinely "left without selecting",
          // so the typed text is cleared immediately: the box can never
          // visually look filled in when nothing was actually picked.
          if (!selected) {
            setQuery('')
            setOpen(false)
          }
        }}
        className={`h-14 w-full rounded-xl border bg-navy/40 pl-11 pr-9 text-base text-white backdrop-blur-sm placeholder:text-white/35 transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
          selected ? 'border-emerald-400/50 focus:border-emerald-400/70' : 'border-blue-200/35 focus:border-blue-200/70 focus:shadow-[0_0_18px_rgba(111,135,255,.16)]'
        }`}
      />
      {selected && <CheckCircle2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />}
      {!selected && loading && <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/40" />}

      {open && !disabled && !selected && (results.length > 0 || loading || query.trim().length >= 2) && (
        <div className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-white/10 bg-navy/95 py-1.5 shadow-xl backdrop-blur-md">
          {results.map((c, i) => (
            <button
              key={`${c.name}-${c.country}-${i}`}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault()
                handleSelect(c)
              }}
              onClick={() => handleSelect(c)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-white/85 hover:bg-white/[0.06] cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-white/30" />
              {c.name}
            </button>
          ))}
          {!loading && results.length === 0 && (
            <p className="px-4 py-2.5 text-xs text-white/35">No matching cities found</p>
          )}
        </div>
      )}
    </div>
  )
}
