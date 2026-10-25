import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import clsx from 'clsx'
import { Droplets, Pencil, Trash2 } from 'lucide-react'
import type { GlucoseReading, GlucoseUnit, Targets } from '../../types'
import { formatGlucose, glucoseStatus, glucoseUnitLabel } from '../../lib/calc'
import { GLUCOSE_CONTEXT_LABEL } from '../../lib/labels'
import { fmtDate } from '../../lib/dates'
import { Button, EmptyState, StatusBadge } from '../../components/ui'
import { CONTEXT_CHIP_CLASS, CONTEXT_SHORT_LABEL } from './context'

const PAGE_SIZE = 100

interface DayGroup { key: string; title: string; rows: GlucoseReading[] }

function groupByDay(readings: GlucoseReading[]): DayGroup[] {
  const groups: DayGroup[] = []
  let cur: DayGroup | undefined
  for (const r of readings) {
    const key = fmtDate(r.at)
    if (!cur || cur.key !== key) {
      const weekday = format(parseISO(r.at), 'EEEE', { locale: vi })
      cur = { key, title: `${key} · ${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`, rows: [] }
      groups.push(cur)
    }
    cur.rows.push(r)
  }
  return groups
}

export function GlucoseLog({ readings, unit, targets, onEdit, onDelete }: {
  /** Sorted descending by `at`. */
  readings: GlucoseReading[]
  unit: GlucoseUnit
  targets: Targets
  onEdit: (r: GlucoseReading) => void
  onDelete: (r: GlucoseReading) => void
}) {
  const [limit, setLimit] = useState(PAGE_SIZE)
  const unitLabel = glucoseUnitLabel(unit)
  const visible = useMemo(() => readings.slice(0, limit), [readings, limit])
  const groups = useMemo(() => groupByDay(visible), [visible])

  if (!readings.length) {
    return <EmptyState icon={<Droplets size={28} />} title="Chưa có chỉ số nào trong khoảng này" description="Thử chọn khoảng thời gian rộng hơn hoặc ghi chỉ số mới." />
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <section key={g.key}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">{g.title}</h3>
          <ul className="divide-y divide-border">
            {g.rows.map((r) => {
              const status = glucoseStatus(r.valueMgdl, r.context, targets)
              return (
                <li key={r.id ?? r.at} className="flex items-center gap-3 py-2">
                  <span className="w-11 shrink-0 text-sm text-muted tabular-nums">{format(parseISO(r.at), 'HH:mm')}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold tabular-nums">
                        {formatGlucose(r.valueMgdl, unit)} <span className="text-xs font-normal text-muted">{unitLabel}</span>
                      </span>
                      <StatusBadge status={status} />
                      <span
                        title={GLUCOSE_CONTEXT_LABEL[r.context]}
                        className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', CONTEXT_CHIP_CLASS[r.context])}
                      >
                        {CONTEXT_SHORT_LABEL[r.context]}
                      </span>
                    </div>
                    {r.note && <p className="text-xs text-muted truncate mt-0.5" title={r.note}>{r.note}</p>}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="sm" className="px-2" aria-label="Sửa" title="Sửa" onClick={() => onEdit(r)} icon={<Pencil size={16} />} />
                    <Button variant="ghost" size="sm" className="px-2 text-danger" aria-label="Xoá" title="Xoá" onClick={() => onDelete(r)} icon={<Trash2 size={16} />} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      {readings.length > limit && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            Xem thêm ({readings.length - limit} còn lại)
          </Button>
        </div>
      )}
    </div>
  )
}
