import { type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, Heart, MessageCircle, Settings, UserRound, Star } from 'lucide-react'
import { Starfield } from '@/components/shared/Starfield'
import { SelfAvatar } from '@/components/shared/SelfAvatar'
import { CelestialHeart } from '@/components/shared/CelestialHeart'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/discovery', label: 'Discover', mobileLabel: 'Discover', icon: Compass },
  { to: '/matches', label: 'Matches', mobileLabel: 'Matches', icon: Heart },
  { to: '/messages', label: 'Messages', mobileLabel: 'Messages', icon: MessageCircle },
  { to: '/compatibility', label: 'Compatibility', mobileLabel: 'Compat', icon: Star },
  { to: '/my-profile', label: 'Profile', mobileLabel: 'Profile', icon: UserRound },
  { to: '/settings', label: 'Settings', mobileLabel: 'Settings', icon: Settings },
]

// Mobile bottom nav shows Profile first (leftmost) — everything else keeps
// the same relative order.
const mobileNavItems = [
  navItems[4], // Profile
  navItems[0], // Discover
  navItems[1], // Matches
  navItems[2], // Messages
  navItems[3], // Compatibility
  navItems[5], // Settings
]

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { hideBottomNav } = useApp()

  return (
    <div className="relative min-h-screen bg-midnight text-white">
      <div
        className="fixed inset-0 z-0"
        style={{ background: 'radial-gradient(120% 90% at 50% -10%, #1a1140 0%, #0c1433 42%, #060b1d 78%)' }}
      >
        <Starfield density={40} />
      </div>

      {/* Desktop sidebar */}
      <aside className="glass-strong fixed left-0 top-0 z-40 hidden h-full w-24 flex-col items-center gap-8 border-r border-white/5 py-8 lg:flex xl:w-64 xl:items-stretch xl:px-6">
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
                    isActive && 'text-champagne'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-2xl bg-gold/10 border border-gold/20"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    {isProfileTab ? (
                      <SelfAvatar
                        className={cn(
                          'relative z-10 h-6 w-6 shrink-0 mx-auto rounded-full ring-2 xl:mx-0',
                          isActive ? 'ring-gold' : 'ring-white/20'
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
      <main className="relative z-10 min-h-screen pb-24 lg:pb-8 lg:pl-24 xl:pl-64">{children}</main>

      {/* Mobile bottom nav — icons only, no labels. Each tab gets a
          distinct icon shape plus a clear active-state pill (background
          highlight + dot) so which tab is current is still obvious without
          text. Profile is the leftmost tab. */}
      <motion.nav
        initial={false}
        animate={hideBottomNav ? { y: '100%', opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2.5 lg:hidden"
        style={{ pointerEvents: hideBottomNav ? 'none' : 'auto' }}
      >
        {mobileNavItems.map((item) => {
          const isProfileTab = item.to === '/my-profile'
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  'relative flex h-12 w-12 items-center justify-center rounded-2xl text-white/45 transition-colors',
                  isActive && 'bg-gold/10 border border-gold/20 text-champagne'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-mobile"
                      className="absolute -top-2.5 h-1 w-5 rounded-full bg-gradient-to-r from-gold to-champagne"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  {isProfileTab ? (
                    <SelfAvatar className={cn('h-8 w-8 rounded-full ring-2', isActive ? 'ring-gold' : 'ring-white/35')} />
                  ) : (
                    <item.icon className="h-6 w-6" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </motion.nav>
    </div>
  )
}
