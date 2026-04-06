import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  CalendarDays,
  MapPin,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/domains/auth/useAuth'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Eventos', icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendario', icon: CalendarDays },
  { to: '/places', label: 'Lugares', icon: MapPin },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-surface flex overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-surface-border bg-surface-secondary shrink-0">
        <SidebarContent user={user?.email} onSignOut={() => { void signOut() }} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-30 md:hidden"
              onClick={() => { setMobileOpen(false) }}
            />
            <motion.aside
              initial={{ x: -224 }}
              animate={{ x: 0 }}
              exit={{ x: -224 }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="fixed left-0 inset-y-0 w-56 z-40 flex flex-col border-r border-surface-border bg-surface-secondary"
            >
              <SidebarContent user={user?.email} onSignOut={() => { void signOut() }} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-secondary/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <span className="font-semibold text-zinc-100 text-sm">GastonKatz CRM</span>
          </div>
          <button
            onClick={() => { setMobileOpen(!mobileOpen) }}
            className="btn-ghost p-1.5"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

function SidebarContent({
  user,
  onSignOut,
}: {
  user?: string
  onSignOut: () => void
}) {
  return (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-surface-border">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">G</span>
        </div>
        <div>
          <span className="font-semibold text-zinc-100 text-sm leading-none">GastonKatz</span>
          <span className="block text-zinc-500 text-xs leading-none mt-0.5">CRM</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-100 bg-surface-tertiary border border-surface-border'
                : 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-surface-hover transition-colors'
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-brand-400' : ''} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-surface-border px-3 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center shrink-0">
            <span className="text-brand-200 text-xs font-medium">
              {user?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <span className="text-zinc-400 text-xs truncate flex-1">{user}</span>
        </div>
        <button onClick={onSignOut} className="btn-ghost w-full justify-start text-xs gap-1.5">
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </>
  )
}
