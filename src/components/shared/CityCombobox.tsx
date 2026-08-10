import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { searchCities, type CityMatch } from '@/lib/citySearchApi'

/** A real searchable city dropdown backed by the `searchCities` Cloud
 *  Function (live query against the ~138k-city dataset), scoped to a
 *  selected country when one is provided. Selecting a suggestion is the
 *  only way to set a value — free text alone never resolves to
 *  coordinates, matching "proper dropdown/select functionality" rather
 *  than a plain text field. */
export function CityCombobox({
  countryCode,
  value,
  onSelect,
  placeholder = 'Select city / town',
  disabled = false,
}: {
  countryCode: string
  value: string
  onSelect: (city: CityMatch) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<CityMatch[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  // Read inside the blur-revert timeout instead of closing over `value`
  // directly — the input blurs (moving focus to the suggestion button)
  // BEFORE that button's onClick/onSelect runs, so a plain closure would
  // see the pre-selection value and could wipe out a selection that
  // completes a few milliseconds later.
  const valueRef = useRef(value)

  useEffect(() => {
    setQuery(value)
    valueRef.current = value
  }, [value])

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([])
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
  }, [query, countryCode, open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Typed text alone never sets a value — only clicking a real suggestion
  // does (see onSelect below). Without this, the box can visually show a
  // city name that was never actually selected, making the field look
  // filled in when it genuinely isn't. On blur, if what's typed doesn't
  // match the last real selection, revert the visible text so the box
  // never lies about what's actually selected. Delayed so a click on a
  // suggestion (which blurs the input first) has time to register.
  const handleBlur = () => {
    window.setTimeout(() => {
      setQuery((current) => (current === valueRef.current ? current : valueRef.current))
    }, 150)
  }

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/50" strokeWidth={1.75} />
      <input
        type="text"
        value={query}
        disabled={disabled}
        placeholder={countryCode ? placeholder : 'Select a country first'}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        className="h-14 w-full rounded-xl border border-blue-200/35 bg-navy/40 pl-11 pr-9 text-base text-white backdrop-blur-sm placeholder:text-white/35 transition focus:border-blue-200/70 focus:outline-none focus:shadow-[0_0_18px_rgba(111,135,255,.16)] disabled:cursor-not-allowed disabled:opacity-50"
      />
      {loading && <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/40" />}

      {open && !disabled && (results.length > 0 || (loading && query.trim().length >= 2)) && (
        <div className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-white/10 bg-navy/95 py-1.5 shadow-xl backdrop-blur-md">
          {results.map((c, i) => (
            <button
              key={`${c.name}-${c.country}-${i}`}
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(c)
                setQuery(c.name)
                setOpen(false)
              }}
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
