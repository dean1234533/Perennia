import { type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, Heart, MessageCircle, Settings, Sparkles } from 'lucide-react'
import { Starfield } from '@/components/shared/Starfield'
import { cn } from '@/lib/utils'
import { useApp } from '@/context/AppContext'
import { selfAvatarUrl } from '@/lib/avatar'

const navItems = [
  { to: '/discovery', label: 'Discovery', icon: Compass },
  { to: '/matches', label: 'Matches', icon: Heart },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { onboarding } = useApp()

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
          {navItems.map((item) => (
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
                  <item.icon className="relative z-10 h-5 w-5 shrink-0 mx-auto xl:mx-0" />
                  <span className="relative z-10 hidden xl:inline">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <NavLink
          to="/cosmic-profile"
          className="glow-gold flex items-center gap-3 rounded-2xl border border-gold/15 bg-white/[0.02] p-2 transition-colors hover:border-gold/30 xl:px-3 xl:py-2"
        >
          <img
            src={selfAvatarUrl(onboarding.gender)}
            alt="Your profile"
            className="h-9 w-9 rounded-full object-cover ring-2 ring-gold/40"
          />
          <span className="hidden text-sm text-white/70 xl:inline">Your Profile</span>
        </NavLink>
      </aside>

      {/* Main content */}
      <main className="relative z-10 min-h-screen pb-24 lg:pb-8 lg:pl-24 xl:pl-64">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="glass-strong fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-3 lg:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-[10px] font-medium uppercase tracking-wide text-white/45 transition-colors',
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
                <item.icon className="h-5 w-5" />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
