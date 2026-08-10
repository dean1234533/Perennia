import { type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, Heart, MessageCircle, UserRound } from 'lucide-react'
import { LandingCelestialBackground } from '@/components/shared/AtmosphericBackground'
import { SelfAvatar } from '@/components/shared/SelfAvatar'
import { CelestialHeart } from '@/components/shared/CelestialHeart'
import { InstallAppBanner } from '@/components/shared/InstallAppBanner'
import { NotificationPermissionBanner } from '@/components/shared/NotificationPermissionBanner'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/discovery', label: 'Discovery', mobileLabel: 'Discovery', icon: Compass },
  { to: '/matches', label: 'Likes', mobileLabel: 'Likes', icon: Heart },
  { to: '/messages', label: 'Messages', mobileLabel: 'Messages', icon: MessageCircle },
  { to: '/my-profile', label: 'Profile', mobileLabel: 'Profile', icon: UserRound },
]

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { hideBottomNav } = useApp()

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
      <aside className="glass-strong fixed left-0 top-0 z-40 hidden h-full w-64 flex-col items-stretch gap-8 border-r border-white/5 px-6 py-8 xl:flex">
        <button
          onClick={() => navigate('/discovery')}
          className="mb-6 flex items-center gap-2 xl:px-2 cursor-pointer"
        >
          <CelestialHeart className="h-10 w-10 shrink-0" />
          <span className="hidden font-serif-display text-xl text-gradient-gold xl:inline">Perennia</span>
        </button>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const isProfileTab = item.to === '/my-profile'
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-white/50 transition-all hover:text-white xl:px-4',
                    isActive && 'text-blue-100 drop-shadow-[0_0_9px_rgba(125,145,255,.55)]'
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
      <main className="relative z-10 min-h-screen pb-24 xl:pb-8 xl:pl-64">
        <div className="px-4 pt-4 xl:px-8">
          <InstallAppBanner />
          <NotificationPermissionBanner />
        </div>
        {children}
      </main>

      {/* Mobile bottom navigation mirrors the four-item profile reference. */}
      <motion.nav
        initial={false}
        animate={hideBottomNav ? { y: '100%', opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 items-center border-t border-white/10 px-2 py-2 xl:hidden"
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
                  'relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-white/55 transition-colors',
                  isActive && 'text-blue-100 drop-shadow-[0_0_8px_rgba(125,145,255,.72)]'
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
