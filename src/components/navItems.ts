import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Droplet, Percent, Scale, HeartPulse, FlaskConical, Settings } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Exact match only (for "/"). */
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Đường huyết', to: '/glucose', icon: Droplet },
  { label: 'HbA1c', to: '/hba1c', icon: Percent },
  { label: 'Cơ thể (BMI)', to: '/body', icon: Scale },
  { label: 'Huyết áp', to: '/blood-pressure', icon: HeartPulse },
  { label: 'Xét nghiệm', to: '/labs', icon: FlaskConical },
  { label: 'Cài đặt', to: '/settings', icon: Settings },
]

/** First four items are shown directly in the mobile tab bar; the rest live under "Thêm". */
export const MOBILE_PRIMARY = NAV_ITEMS.slice(0, 4).map((n) => ({ ...n, label: n.to === '/body' ? 'Cơ thể' : n.label }))
export const MOBILE_MORE = NAV_ITEMS.slice(4)
