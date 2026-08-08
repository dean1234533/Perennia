import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** React Router doesn't reset scroll position between route changes — without
 *  this, navigating to a new screen keeps whatever scroll offset the
 *  previous screen was at, so pages can visibly open mid-way down instead
 *  of at the top. */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
