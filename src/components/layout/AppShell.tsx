import { useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Compass, MessageCircle, UserRound } from 'lucide-react'
import { LandingCelestialBackground } from '@/components/shared/AtmosphericBackground'
import { SelfAvatar } from '@/components/shared/SelfAvatar'
import { CelestialHeart } from '@/components/shared/CelestialHeart'
import { InstallAppBanner } from '@/components/shared/InstallAppBanner'
import { NotificationPermissionBanner } from '@/components/shared/NotificationPermissionBanner'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/discovery', label: 'Explore', mobileLabel: 'Explore', icon: Compass },
  { to: '/matches', label: 'Perennia', mobileLabel: 'Perennia', icon: CelestialHeart },
  { to: '/messages', label: 'Inbox', mobileLabel: 'Inbox', icon: MessageCircle },
  { to: '/my-profile', label: 'Profile', mobileLabel: 'Profile', icon: UserRound },
]

const desktopNavItems = [...navItems].reverse()

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { hideBottomNav } = useApp()
  const [brandOpen, setBrandOpen] = useState(false)
  const isProfilePage = location.pathname === '/my-profile' || location.pathname.startsWith('/profile/')

  return (
    <div className="relative min-h-screen bg-midnight text-white">
      {/* Absolutely (not fixed-)positioned so it stretches to cover the
          whole scrollable page rather than just one viewport height — a
          `fixed` full-bleed background gets visibly resized/jumped by
          mobile browsers as the address bar hides/shows mid-scroll. */}
      <div className="absolute inset-0 z-0">
        <LandingCelestialBackground />
      </div>

      {/* Desktop sidebar */}
      <aside className="glass-strong fixed left-0 top-0 z-40 hidden h-full w-72 flex-col items-stretch gap-5 border-r border-white/5 px-6 py-8 xl:flex">
        <button
          onClick={() => setBrandOpen((value) => !value)}
          aria-expanded={brandOpen}
          className="mb-6 flex items-center gap-2 xl:px-2 cursor-pointer"
        >
          <CelestialHeart className="h-10 w-10 shrink-0" />
          <span className="hidden font-serif-display text-xl text-gradient-gold xl:inline">Perennia</span>
        </button>

        {brandOpen && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-medium text-[#5B9DFF]">Perennia</p>
            <p className="mt-1 text-xs text-white/85">For Love That Fits, Naturally.</p>
            <p className="mt-3 text-[11px] leading-relaxed text-white/55">We combine Western and Chinese astrology with compatibility insights designed around meaningful, lasting relationships.</p>
            <button onClick={() => navigate('/')} className="mt-3 flex items-center gap-1 text-xs text-[#5B9DFF]">About Perennia <ArrowRight className="h-3.5 w-3.5" /></button>
          </motion.div>
        )}

        <nav className="flex flex-1 flex-col gap-2">
          {desktopNavItems.map((item) => {
            const isProfileTab = item.to === '/my-profile'
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-white/50 transition-all hover:text-white xl:px-4',
                    isActive && 'text-[#5B9DFF] drop-shadow-[0_0_9px_rgba(91,157,255,.55)]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-2xl border border-blue-300/20 bg-gradient-to-r from-blue-500/10 to-violet-500/10 shadow-[0_0_22px_rgba(92,104,255,.12)]"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    {isProfileTab ? (
                      <SelfAvatar
                        className={cn(
                          'relative z-10 h-6 w-6 shrink-0 mx-auto rounded-full ring-2 xl:mx-0',
                          isActive ? 'ring-blue-300 shadow-[0_0_12px_rgba(108,130,255,.5)]' : 'ring-white/20'
                        )}
                      />
                    ) : (
                      <item.icon className="relative z-10 h-5 w-5 shrink-0 mx-auto xl:mx-0" />
                    )}
                    <span className="relative z-10 hidden xl:inline">{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="relative z-10 min-h-screen pb-24 xl:pb-8 xl:pl-72">
        {!isProfilePage && (
          <div className="px-4 pt-4 xl:px-8">
            <InstallAppBanner />
            <NotificationPermissionBanner />
          </div>
        )}
        {children}
      </main>

      {/* Mobile bottom navigation mirrors the four-item profile reference. */}
      <motion.nav
        initial={false}
        animate={hideBottomNav ? { y: '100%', opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 items-center border-t px-2 py-2 xl:hidden',
          isProfilePage ? 'border-black/10 bg-white shadow-[0_-4px_18px_rgba(20,28,48,.08)]' : 'glass-strong border-white/10'
        )}
        style={{
          pointerEvents: hideBottomNav ? 'none' : 'auto',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        }}
      >
        {navItems.map((item) => {
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 transition-colors',
                  isProfilePage ? 'text-slate-700' : 'text-white/55',
                  isActive && 'text-[#5B9DFF] drop-shadow-[0_0_8px_rgba(91,157,255,.72)]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute inset-x-5 top-1 h-8 rounded-full bg-violet-500/10 blur-md" />}
                  <item.icon className="h-6 w-6" strokeWidth={1.5} />
                  <span className="font-serif-display text-xs">{item.mobileLabel}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </motion.nav>
    </div>
  )
}
