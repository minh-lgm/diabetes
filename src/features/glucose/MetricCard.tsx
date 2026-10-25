import type { ReactNode } from 'react'
import clsx from 'clsx'
import type { Status } from '../../lib/calc'
import { StatusBadge } from '../../components/ui'

/**
 * KPI card matching StatTile's look but with an optional status badge
 * (and a custom badge label), used by the glucose and HbA1c pages.
 */
export function MetricCard({ label, value, unit, status, statusLabel, hint, icon, small, className }: {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  status?: Status
  statusLabel?: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  /** Smaller value text, for long values such as dates. */
  small?: boolean
  className?: string
}) {
  return (
    <div className={clsx('bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className={clsx('font-bold tabular-nums tracking-tight', small ? 'text-xl' : 'text-3xl')}>{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      {(status || hint) && (
        <div className="flex items-center justify-between gap-2 text-xs min-h-5">
          {status ? <StatusBadge status={status} label={statusLabel} className="whitespace-nowrap shrink-0" /> : <span />}
          {hint && <span className="text-muted truncate">{hint}</span>}
        </div>
      )}
    </div>
  )
}
