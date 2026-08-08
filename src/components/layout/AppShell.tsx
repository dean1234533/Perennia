import { type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, Heart, MessageCircle, Settings, Sparkles, UserRound, Star } from 'lucide-react'
import { Starfield } from '@/components/shared/Starfield'
import { SelfAvatar } from '@/components/shared/SelfAvatar'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/discovery', label: 'Discover', mobileLabel: 'Discover', icon: Compass },
  { to: '/matches', label: 'Matches', mobileLabel: 'Matches', icon: Heart },
  { to: '/messages', label: 'Messages', mobileLabel: 'Messages', icon: MessageCircle },
  { to: '/compatibility', label: 'Compatibility', mobileLabel: 'Compat', icon: Star },
  { to: '/my-profile', label: 'Profile', mobileLabel: 'Profile', icon: UserRound },
]

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

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
          <Sparkles className="h-7 w-7 text-gold" />
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

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/45 transition-colors hover:text-white xl:px-4',
              isActive && 'text-champagne'
            )
          }
        >
          <Settings className="h-5 w-5 shrink-0 mx-auto xl:mx-0" />
          <span className="hidden xl:inline">Settings</span>
        </NavLink>
      </aside>

      {/* Mobile settings shortcut (bottom nav has no room for a 6th item) */}
      <NavLink
        to="/settings"
        className="glass-strong fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:text-white lg:hidden"
      >
        <Settings className="h-4 w-4" />
      </NavLink>

      {/* Main content */}
      <main className="relative z-10 min-h-screen pb-24 lg:pb-8 lg:pl-24 xl:pl-64">{children}</main>

      {/* Mobile bottom nav — each tab is flex-1 so 5 items are guaranteed to
          fit any phone width, no matter the label length. */}
      <nav className="glass-strong fixed bottom-0 left-0 right-0 z-40 flex items-center px-1 py-3 lg:hidden">
        {navItems.map((item) => {
          const isProfileTab = item.to === '/my-profile'
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-medium uppercase tracking-wide text-white/45 transition-colors',
                  isActive && 'text-champagne'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-mobile"
                      className="absolute -top-3 h-1 w-6 rounded-full bg-gradient-to-r from-gold to-champagne"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  {isProfileTab ? (
                    <SelfAvatar className={cn('h-5 w-5 rounded-full ring-2', isActive ? 'ring-gold' : 'ring-white/20')} />
                  ) : (
                    <item.icon className="h-5 w-5" />
                  )}
                  <span className="max-w-full truncate">{item.mobileLabel}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
