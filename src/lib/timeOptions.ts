/** Real 15-minute-increment time-of-day options for a birth-time select —
 *  value is 24h "HH:MM" (what the backend expects), label is a human
 *  12-hour "h:mm AM/PM" string. */
export interface TimeOption {
  value: string
  label: string
}

export const TIME_OPTIONS: TimeOption[] = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour24 = Math.floor(i / 4)
  const minute = (i % 4) * 15
  const value = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  const period = hour24 < 12 ? 'AM' : 'PM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const label = `${hour12}:${String(minute).padStart(2, '0')} ${period}`
  return { value, label }
})
