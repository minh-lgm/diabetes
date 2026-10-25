import { FlaskConical, Pencil, Trash2 } from 'lucide-react'
import type { GlucoseUnit, HbA1cReading, Targets } from '../../types'
import { formatGlucose, glucoseUnitLabel, hba1cStatus, hba1cToEag } from '../../lib/calc'
import { fmtDate } from '../../lib/dates'
import { Button, EmptyState, StatusBadge } from '../../components/ui'

export function HbA1cList({ records, unit, targets, onEdit, onDelete }: {
  /** Sorted descending by `at`. */
  records: HbA1cReading[]
  unit: GlucoseUnit
  targets: Targets
  onEdit: (r: HbA1cReading) => void
  onDelete: (r: HbA1cReading) => void
}) {
  if (!records.length) {
    return <EmptyState icon={<FlaskConical size={28} />} title="Chưa có kết quả nào" description="Nhấn “Ghi kết quả” để thêm kết quả xét nghiệm HbA1c đầu tiên." />
  }
  const unitLabel = glucoseUnitLabel(unit)
  return (
    <ul className="divide-y divide-border">
      {records.map((r, i) => {
        const prev = records[i + 1]
        const delta = prev ? Math.round((r.percent - prev.percent) * 10) / 10 : undefined
        return (
          <li key={r.id ?? r.at} className="flex items-center gap-3 py-2.5">
            <span className="w-24 shrink-0 text-sm text-muted tabular-nums">{fmtDate(r.at)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold tabular-nums">{r.percent.toFixed(1)}%</span>
                <StatusBadge status={hba1cStatus(r.percent, targets)} />
                <span className="text-xs text-muted tabular-nums">eAG {formatGlucose(hba1cToEag(r.percent), unit)} {unitLabel}</span>
                {delta !== undefined && delta !== 0 && (
                  <span className={delta < 0 ? 'text-xs text-ok tabular-nums' : 'text-xs text-warn tabular-nums'}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                  </span>
                )}
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
  )
}
