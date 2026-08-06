import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext'
import { AuthProvider } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { Welcome } from '@/screens/Welcome'
import { SignUp } from '@/screens/SignUp'
import { Login } from '@/screens/Login'
import { Verify } from '@/screens/Verify'
import { BirthDetails } from '@/screens/BirthDetails'
import { Preferences } from '@/screens/Preferences'
import { CosmicProfile } from '@/screens/CosmicProfile'
import { Discovery } from '@/screens/Discovery'
import { ProfileDetail } from '@/screens/ProfileDetail'
import { MatchScreen } from '@/screens/MatchScreen'
import { Matches } from '@/screens/Matches'
import { MessagesList } from '@/screens/MessagesList'
import { MessageThread } from '@/screens/MessageThread'
import { CompatibilityReport } from '@/screens/CompatibilityReport'
import { Settings } from '@/screens/Settings'

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/birth-details" element={<BirthDetails />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/cosmic-profile" element={<CosmicProfile />} />

            <Route path="/discovery" element={<AppShell><Discovery /></AppShell>} />
            <Route path="/profile/:id" element={<AppShell><ProfileDetail /></AppShell>} />
            <Route path="/match/:id" element={<MatchScreen />} />
            <Route path="/matches" element={<AppShell><Matches /></AppShell>} />
            <Route path="/messages" element={<AppShell><MessagesList /></AppShell>} />
            <Route path="/messages/:id" element={<AppShell><MessageThread /></AppShell>} />
            <Route path="/compatibility/:id" element={<AppShell><CompatibilityReport /></AppShell>} />
            <Route path="/settings" element={<AppShell><Settings /></AppShell>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  )
}

export default App
