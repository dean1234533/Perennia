import { lazy, Suspense } from 'react'
import { MotionConfig } from 'framer-motion'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { Welcome } from '@/screens/Welcome'
import { getOnboardingStep } from '@/lib/onboardingFlow'

const AppProviders = lazy(() => import('@/components/layout/AppProviders').then((module) => ({ default: module.AppProviders })))
const AppShell = lazy(() => import('@/components/layout/AppShell').then((module) => ({ default: module.AppShell })))
const RequireFoundingMembership = lazy(() => import('@/components/layout/RequireFoundingMembership').then((module) => ({ default: module.RequireFoundingMembership })))
const RequireOnboardingStep = lazy(() => import('@/components/layout/RequireOnboardingStep').then((module) => ({ default: module.RequireOnboardingStep })))
const SignUp = lazy(() => import('@/screens/SignUp').then((module) => ({ default: module.SignUp })))
const Login = lazy(() => import('@/screens/Login').then((module) => ({ default: module.Login })))
const Verify = lazy(() => import('@/screens/Verify').then((module) => ({ default: module.Verify })))
const ProfilePhoto = lazy(() => import('@/screens/ProfilePhoto').then((module) => ({ default: module.ProfilePhoto })))
const BirthDetails = lazy(() => import('@/screens/BirthDetails').then((module) => ({ default: module.BirthDetails })))
const AboutYouDetails = lazy(() => import('@/screens/AboutYouDetails').then((module) => ({ default: module.AboutYouDetails })))
const RelationshipGoalsStep = lazy(() => import('@/screens/RelationshipGoalsStep').then((module) => ({ default: module.RelationshipGoalsStep })))
const InterestsStep = lazy(() => import('@/screens/InterestsStep').then((module) => ({ default: module.InterestsStep })))
const LifestyleStep = lazy(() => import('@/screens/LifestyleStep').then((module) => ({ default: module.LifestyleStep })))
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
const Settings = lazy(() => import('@/screens/Settings').then((module) => ({ default: module.Settings })))
const MatchingPreferences = lazy(() => import('@/screens/MatchingPreferences').then((module) => ({ default: module.MatchingPreferences })))
const Safeguarding = lazy(() => import('@/screens/Safeguarding').then((module) => ({ default: module.Safeguarding })))
const Founding500 = lazy(() => import('@/screens/Founding500').then((module) => ({ default: module.Founding500 })))
const Founding500Checkout = lazy(() => import('@/screens/Founding500Checkout').then((module) => ({ default: module.Founding500Checkout })))
const Founding500Success = lazy(() => import('@/screens/Founding500Success').then((module) => ({ default: module.Founding500Success })))
const DesignPreview = lazy(() => import('@/screens/DesignPreview').then((module) => ({ default: module.DesignPreview })))

const onboardingRoutes = {
  signup: getOnboardingStep('signup').route,
  verification: getOnboardingStep('verification').route,
  birthDetails: getOnboardingStep('birthDetails').route,
  preferences: getOnboardingStep('preferences').route,
  relationshipGoals: getOnboardingStep('relationshipGoals').route,
  interests: getOnboardingStep('interests').route,
  aboutYou: getOnboardingStep('aboutYou').route,
  lifestyle: getOnboardingStep('lifestyle').route,
  values: getOnboardingStep('values').route,
  profilePhoto: getOnboardingStep('profilePhoto').route,
  yourStory: getOnboardingStep('yourStory').route,
  cosmicProfile: getOnboardingStep('cosmicProfile').route,
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-[100svh] bg-midnight" aria-label="Loading" />}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/dev/design-preview" element={<DesignPreview />} />

          <Route element={<AppProviders />}>
            <Route path="/founding-500" element={<Founding500 />} />
            <Route path="/founding-500/checkout" element={<Founding500Checkout />} />
            <Route path="/founding-500/success" element={<Founding500Success />} />
            <Route path={onboardingRoutes.signup} element={<RequireOnboardingStep stepId="signup"><SignUp /></RequireOnboardingStep>} />
            <Route path="/login" element={<Login />} />
            <Route path={onboardingRoutes.verification} element={<RequireOnboardingStep stepId="verification"><Verify /></RequireOnboardingStep>} />
            <Route path={onboardingRoutes.birthDetails} element={<RequireOnboardingStep stepId="birthDetails"><BirthDetails /></RequireOnboardingStep>} />
            <Route path={onboardingRoutes.preferences} element={<RequireOnboardingStep stepId="preferences"><Preferences /></RequireOnboardingStep>} />
            <Route path={onboardingRoutes.relationshipGoals} element={<RequireOnboardingStep stepId="relationshipGoals"><RelationshipGoalsStep /></RequireOnboardingStep>} />
            <Route path={onboardingRoutes.interests} element={<RequireOnboardingStep stepId="interests"><InterestsStep /></RequireOnboardingStep>} />
            <Route path={onboardingRoutes.aboutYou} element={<RequireOnboardingStep stepId="aboutYou"><AboutYouDetails /></RequireOnboardingStep>} />
            <Route path={onboardingRoutes.lifestyle} element={<RequireOnboardingStep stepId="lifestyle"><LifestyleStep /></RequireOnboardingStep>} />
            <Route path={onboardingRoutes.values} element={<RequireOnboardingStep stepId="values"><ValuesStep /></RequireOnboardingStep>} />
            <Route path={onboardingRoutes.profilePhoto} element={<RequireOnboardingStep stepId="profilePhoto"><ProfilePhoto /></RequireOnboardingStep>} />
            <Route path={onboardingRoutes.yourStory} element={<RequireOnboardingStep stepId="yourStory"><YourStoryStep /></RequireOnboardingStep>} />
            <Route path={onboardingRoutes.cosmicProfile} element={<RequireOnboardingStep stepId="cosmicProfile"><CosmicProfile /></RequireOnboardingStep>} />
            <Route path="/discovery" element={<RequireFoundingMembership><AppShell><Discovery /></AppShell></RequireFoundingMembership>} />
            <Route path="/profile/:id" element={<RequireFoundingMembership><AppShell><ProfileDetail /></AppShell></RequireFoundingMembership>} />
            <Route path="/my-profile" element={<RequireFoundingMembership><AppShell><MyProfile /></AppShell></RequireFoundingMembership>} />
            <Route path="/match/:id" element={<RequireFoundingMembership><MatchScreen /></RequireFoundingMembership>} />
            <Route path="/matches" element={<RequireFoundingMembership><AppShell><Matches /></AppShell></RequireFoundingMembership>} />
            <Route path="/messages" element={<RequireFoundingMembership><AppShell><MessagesList /></AppShell></RequireFoundingMembership>} />
            <Route path="/messages/:id" element={<RequireFoundingMembership><AppShell><MessageThread /></AppShell></RequireFoundingMembership>} />
            <Route path="/compatibility/:id" element={<RequireFoundingMembership><AppShell><CompatibilityReport /></AppShell></RequireFoundingMembership>} />
            <Route path="/settings" element={<RequireFoundingMembership><AppShell><Settings /></AppShell></RequireFoundingMembership>} />
            <Route path="/matching-preferences" element={<RequireFoundingMembership><AppShell><MatchingPreferences /></AppShell></RequireFoundingMembership>} />
            <Route path="/safeguarding" element={<RequireFoundingMembership><AppShell><Safeguarding /></AppShell></RequireFoundingMembership>} />

            {import.meta.env.DEV && (
              <Route path="/dev/profile-preview" element={<AppShell><MyProfile preview /></AppShell>} />
            )}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </BrowserRouter>
    </MotionConfig>
  )
}

export default App
