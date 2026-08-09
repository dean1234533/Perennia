import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from '@/context/AppContext'
import { AuthProvider } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { RequireFoundingMembership } from '@/components/layout/RequireFoundingMembership'
import { Welcome } from '@/screens/Welcome'
import { SignUp } from '@/screens/SignUp'
import { Login } from '@/screens/Login'
import { Verify } from '@/screens/Verify'
import { ProfilePhoto } from '@/screens/ProfilePhoto'
import { BirthDetails } from '@/screens/BirthDetails'
import { AboutYouDetails } from '@/screens/AboutYouDetails'
import { RelationshipGoalsStep } from '@/screens/RelationshipGoalsStep'
import { LifestyleStep } from '@/screens/LifestyleStep'
import { InterestsStep } from '@/screens/InterestsStep'
import { ValuesStep } from '@/screens/ValuesStep'
import { YourStoryStep } from '@/screens/YourStoryStep'
import { Preferences } from '@/screens/Preferences'
import { CosmicProfile } from '@/screens/CosmicProfile'
import { Discovery } from '@/screens/Discovery'
import { ProfileDetail } from '@/screens/ProfileDetail'
import { MyProfile } from '@/screens/MyProfile'
import { MatchScreen } from '@/screens/MatchScreen'
import { Matches } from '@/screens/Matches'
import { MessagesList } from '@/screens/MessagesList'
import { MessageThread } from '@/screens/MessageThread'
import { CompatibilityReport } from '@/screens/CompatibilityReport'
import { CompatibilityHub } from '@/screens/CompatibilityHub'
import { Settings } from '@/screens/Settings'
import { MatchingPreferences } from '@/screens/MatchingPreferences'
import { Founding500 } from '@/screens/Founding500'
import { Founding500Checkout } from '@/screens/Founding500Checkout'
import { Founding500Success } from '@/screens/Founding500Success'

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/founding-500" element={<Founding500 />} />
            <Route path="/founding-500/checkout" element={<Founding500Checkout />} />
            <Route path="/founding-500/success" element={<Founding500Success />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile-photo" element={<ProfilePhoto />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/birth-details" element={<BirthDetails />} />
            <Route path="/about-you" element={<AboutYouDetails />} />
            <Route path="/relationship-goals" element={<RelationshipGoalsStep />} />
            <Route path="/lifestyle" element={<LifestyleStep />} />
            <Route path="/interests" element={<InterestsStep />} />
            <Route path="/values" element={<ValuesStep />} />
            <Route path="/your-story" element={<YourStoryStep />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/cosmic-profile" element={<CosmicProfile />} />

            <Route path="/discovery" element={<RequireFoundingMembership><AppShell><Discovery /></AppShell></RequireFoundingMembership>} />
            <Route path="/profile/:id" element={<RequireFoundingMembership><AppShell><ProfileDetail /></AppShell></RequireFoundingMembership>} />
            <Route path="/my-profile" element={<RequireFoundingMembership><AppShell><MyProfile /></AppShell></RequireFoundingMembership>} />
            <Route path="/match/:id" element={<RequireFoundingMembership><MatchScreen /></RequireFoundingMembership>} />
            <Route path="/matches" element={<RequireFoundingMembership><AppShell><Matches /></AppShell></RequireFoundingMembership>} />
            <Route path="/messages" element={<RequireFoundingMembership><AppShell><MessagesList /></AppShell></RequireFoundingMembership>} />
            <Route path="/messages/:id" element={<RequireFoundingMembership><AppShell><MessageThread /></AppShell></RequireFoundingMembership>} />
            <Route path="/compatibility" element={<RequireFoundingMembership><AppShell><CompatibilityHub /></AppShell></RequireFoundingMembership>} />
            <Route path="/compatibility/:id" element={<RequireFoundingMembership><AppShell><CompatibilityReport /></AppShell></RequireFoundingMembership>} />
            <Route path="/settings" element={<RequireFoundingMembership><AppShell><Settings /></AppShell></RequireFoundingMembership>} />
            <Route path="/matching-preferences" element={<RequireFoundingMembership><AppShell><MatchingPreferences /></AppShell></RequireFoundingMembership>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  )
}

export default App
