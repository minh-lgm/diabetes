import { useNavigate } from 'react-router-dom'
import { Droplet, Percent, Scale, HeartPulse, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

const ACTIONS: { label: string; to: string; icon: LucideIcon; tone: string }[] = [
  { label: 'Ghi đường huyết', to: '/glucose?add=1', icon: Droplet, tone: 'text-primary bg-primary/10' },
  { label: 'Ghi HbA1c', to: '/hba1c?add=1', icon: Percent, tone: 'text-warn bg-warn/10' },
  { label: 'Ghi cân nặng', to: '/body?add=1', icon: Scale, tone: 'text-info bg-info/10' },
  { label: 'Ghi huyết áp', to: '/blood-pressure?add=1', icon: HeartPulse, tone: 'text-danger bg-danger/10' },
]

/** Row of shortcuts that open each feature page with its add-modal pre-opened (?add=1). */
export function QuickAdd() {
  const navigate = useNavigate()
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Ghi nhanh">
      {ACTIONS.map(({ label, to, icon: Icon, tone }) => (
        <button
          key={to}
          type="button"
          onClick={() => navigate(to)}
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 min-h-[56px] text-left text-sm font-medium shadow-sm hover:border-primary/50 hover:shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <span className={clsx('relative grid h-9 w-9 shrink-0 place-items-center rounded-xl', tone)}>
            <Icon size={18} aria-hidden />
            <Plus size={10} strokeWidth={3} className="absolute -right-1 -bottom-1 rounded-full bg-surface" aria-hidden />
          </span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
