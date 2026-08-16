import { Outlet } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext'
import { AuthProvider } from '@/context/AuthContext'

/** Loads the authenticated app state only after someone leaves the public
 * landing route, keeping Firebase and profile data out of the first visit. */
export function AppProviders() {
  return (
    <AuthProvider>
      <AppProvider>
        <Outlet />
      </AppProvider>
    </AuthProvider>
  )
}
