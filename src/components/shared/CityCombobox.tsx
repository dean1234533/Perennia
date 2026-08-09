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

  useEffect(() => {
    setQuery(value)
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
        className="h-12 w-full rounded-xl border border-white/15 bg-navy/40 pl-11 pr-9 text-sm text-white backdrop-blur-sm placeholder:text-white/35 focus:border-gold/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
      {loading && <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/40" />}

      {open && !disabled && (results.length > 0 || (loading && query.trim().length >= 2)) && (
        <div className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-white/10 bg-navy/95 py-1.5 shadow-xl backdrop-blur-md">
          {results.map((c, i) => (
            <button
              key={`${c.name}-${c.country}-${i}`}
              type="button"
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
