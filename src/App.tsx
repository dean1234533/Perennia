import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { Welcome } from '@/screens/Welcome'

const AppProviders = lazy(() => import('@/components/layout/AppProviders').then((module) => ({ default: module.AppProviders })))
const AppShell = lazy(() => import('@/components/layout/AppShell').then((module) => ({ default: module.AppShell })))
const RequireFoundingMembership = lazy(() => import('@/components/layout/RequireFoundingMembership').then((module) => ({ default: module.RequireFoundingMembership })))
const RequireVerifiedIdentity = lazy(() => import('@/components/layout/RequireVerifiedIdentity').then((module) => ({ default: module.RequireVerifiedIdentity })))
const SignUp = lazy(() => import('@/screens/SignUp').then((module) => ({ default: module.SignUp })))
const Login = lazy(() => import('@/screens/Login').then((module) => ({ default: module.Login })))
const Verify = lazy(() => import('@/screens/Verify').then((module) => ({ default: module.Verify })))
const ProfilePhoto = lazy(() => import('@/screens/ProfilePhoto').then((module) => ({ default: module.ProfilePhoto })))
const BirthDetails = lazy(() => import('@/screens/BirthDetails').then((module) => ({ default: module.BirthDetails })))
const AboutYouDetails = lazy(() => import('@/screens/AboutYouDetails').then((module) => ({ default: module.AboutYouDetails })))
const RelationshipGoalsStep = lazy(() => import('@/screens/RelationshipGoalsStep').then((module) => ({ default: module.RelationshipGoalsStep })))
const LifestyleStep = lazy(() => import('@/screens/LifestyleStep').then((module) => ({ default: module.LifestyleStep })))
const InterestsStep = lazy(() => import('@/screens/InterestsStep').then((module) => ({ default: module.InterestsStep })))
const ValuesStep = lazy(() => import('@/screens/ValuesStep').then((module) => ({ default: module.ValuesStep })))
const YourStoryStep = lazy(() => import('@/screens/YourStoryStep').then((module) => ({ default: module.YourStoryStep })))
const Preferences = lazy(() => import('@/screens/Preferences').then((module) => ({ default: module.Preferences })))
const CosmicProfile = lazy(() => import('@/screens/CosmicProfile').then((module) => ({ default: module.CosmicProfile })))
const Discovery = lazy(() => import('@/screens/Discovery').then((module) => ({ default: module.Discovery })))
const ProfileDetail = lazy(() => import('@/screens/ProfileDetail').then((module) => ({ default: module.ProfileDetail })))
const MyProfile = lazy(() => import('@/screens/MyProfile').then((module) => ({ default: module.MyProfile })))
const MatchScreen = lazy(() => import('@/screens/MatchScreen').then((module) => ({ default: module.MatchScreen })))
const Matches = lazy(() => import('@/screens/Matches').then((module) => ({ default: module.Matches })))
const MessagesList = lazy(() => import('@/screens/MessagesList').then((module) => ({ default: module.MessagesList })))
const MessageThread = lazy(() => import('@/screens/MessageThread').then((module) => ({ default: module.MessageThread })))
const CompatibilityReport = lazy(() => import('@/screens/CompatibilityReport').then((module) => ({ default: module.CompatibilityReport })))
const CompatibilityHub = lazy(() => import('@/screens/CompatibilityHub').then((module) => ({ default: module.CompatibilityHub })))
const Settings = lazy(() => import('@/screens/Settings').then((module) => ({ default: module.Settings })))
const MatchingPreferences = lazy(() => import('@/screens/MatchingPreferences').then((module) => ({ default: module.MatchingPreferences })))
const Founding500 = lazy(() => import('@/screens/Founding500').then((module) => ({ default: module.Founding500 })))
const Founding500Checkout = lazy(() => import('@/screens/Founding500Checkout').then((module) => ({ default: module.Founding500Checkout })))
const Founding500Success = lazy(() => import('@/screens/Founding500Success').then((module) => ({ default: module.Founding500Success })))

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-[100svh] bg-midnight" aria-label="Loading" />}>
        <Routes>
          <Route path="/" element={<Welcome />} />

          <Route element={<AppProviders />}>
            <Route path="/founding-500" element={<Founding500 />} />
            <Route path="/founding-500/checkout" element={<Founding500Checkout />} />
            <Route path="/founding-500/success" element={<Founding500Success />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile-photo" element={<ProfilePhoto />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/birth-details" element={<RequireVerifiedIdentity><BirthDetails /></RequireVerifiedIdentity>} />
            <Route path="/about-you" element={<RequireVerifiedIdentity><AboutYouDetails /></RequireVerifiedIdentity>} />
            <Route path="/relationship-goals" element={<RequireVerifiedIdentity><RelationshipGoalsStep /></RequireVerifiedIdentity>} />
            <Route path="/lifestyle" element={<RequireVerifiedIdentity><LifestyleStep /></RequireVerifiedIdentity>} />
            <Route path="/interests" element={<RequireVerifiedIdentity><InterestsStep /></RequireVerifiedIdentity>} />
            <Route path="/values" element={<RequireVerifiedIdentity><ValuesStep /></RequireVerifiedIdentity>} />
            <Route path="/your-story" element={<RequireVerifiedIdentity><YourStoryStep /></RequireVerifiedIdentity>} />
            <Route path="/preferences" element={<RequireVerifiedIdentity><Preferences /></RequireVerifiedIdentity>} />
            <Route path="/cosmic-profile" element={<RequireVerifiedIdentity><CosmicProfile /></RequireVerifiedIdentity>} />

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

            {import.meta.env.DEV && (
              <Route path="/dev/profile-preview" element={<AppShell><MyProfile preview /></AppShell>} />
            )}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
