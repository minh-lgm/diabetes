import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Activity, Ellipsis } from 'lucide-react'
import clsx from 'clsx'
import { useProfile } from '../hooks/useProfile'
import { useApplyTheme } from '../hooks/useTheme'
import { NAV_ITEMS, MOBILE_PRIMARY, MOBILE_MORE } from './navItems'
import { ThemeToggle } from './ui/ThemeToggle'
import { BottomSheet } from './ui/BottomSheet'

const APP_NAME = 'Theo dõi Tiểu đường'

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <NavLink to="/" className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg" aria-label={APP_NAME}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-fg shadow-sm">
        <Activity size={20} aria-hidden />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-bold tracking-tight">{APP_NAME}</span>
          <span className="block text-[11px] text-muted">Sổ theo dõi sức khoẻ cá nhân</span>
        </span>
      )}
    </NavLink>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (a + b).toUpperCase()
}

export function AppShell() {
  const profile = useProfile()
  useApplyTheme(profile.theme)
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname])

  const name = profile.name?.trim() || 'Hồ sơ của bạn'
  const moreActive = MOBILE_MORE.some((n) => pathname.startsWith(n.to))

  return (
    <div className="min-h-full md:pl-64">
      {/* ── Sidebar (md+) ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border bg-surface">
        <div className="px-5 h-16 flex items-center border-b border-border">
          <Brand />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Điều hướng chính">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-3 rounded-xl px-3 min-h-[44px] text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:text-fg hover:bg-surface-2',
                  )}
                >
                  <Icon size={18} aria-hidden />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-border p-3 flex items-center gap-2">
          <NavLink
            to="/settings"
            className="flex flex-1 min-w-0 items-center gap-3 rounded-xl px-2 min-h-[44px] hover:bg-surface-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label="Mở hồ sơ và cài đặt"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
              {profile.name ? initials(profile.name) : '?'}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block text-[11px] text-muted">Xem hồ sơ</span>
            </span>
          </NavLink>
          <ThemeToggle theme={profile.theme} />
        </div>
      </aside>

      {/* ── Top bar (< md) ────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-30 h-14 flex items-center justify-between px-4 border-b border-border bg-surface/90 backdrop-blur">
        <Brand />
        <ThemeToggle theme={profile.theme} />
      </header>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <main className="p-4 md:p-6 max-w-6xl mx-auto w-full"><Outlet /></main>
      </div>

      {/* ── Bottom tab bar (< md) ─────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
        aria-label="Điều hướng nhanh"
      >
        <ul className="grid grid-cols-5">
          {MOBILE_PRIMARY.map(({ label, to, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => clsx(
                  'flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50',
                  isActive ? 'text-primary' : 'text-muted hover:text-fg',
                )}
              >
                <Icon size={20} aria-hidden />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              className={clsx(
                'w-full flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50',
                moreActive ? 'text-primary' : 'text-muted hover:text-fg',
              )}
            >
              <Ellipsis size={20} aria-hidden />
              <span>Thêm…</span>
            </button>
          </li>
        </ul>
      </nav>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Thêm">
        <ul className="space-y-1 pb-2">
          {MOBILE_MORE.map(({ label, to, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 rounded-xl px-3 min-h-[48px] text-sm font-medium transition',
                  isActive ? 'bg-primary/10 text-primary' : 'text-fg hover:bg-surface-2',
                )}
              >
                <Icon size={18} aria-hidden />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </div>
  )
}
