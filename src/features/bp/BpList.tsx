import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Pencil, Trash2, HeartPulse } from 'lucide-react'
import type { BloodPressureReading, Targets } from '../../types'
import { bpStatus } from '../../lib/calc'
import { Button, StatusBadge } from '../../components/ui'
import { bpGrade, BP_GRADE_LABEL } from './classify'

interface Props {
  entries: BloodPressureReading[]   // sorted desc
  targets: Targets
  onEdit: (e: BloodPressureReading) => void
  onDelete: (e: BloodPressureReading) => void
}

interface Group { day: string; label: string; items: BloodPressureReading[] }

function groupByDay(entries: BloodPressureReading[]): Group[] {
  const groups: Group[] = []
  for (const e of entries) {
    const d = parseISO(e.at)
    const day = format(d, 'yyyy-MM-dd')
    const last = groups.at(-1)
    if (last && last.day === day) last.items.push(e)
    else groups.push({ day, label: format(d, 'EEEE, dd/MM/yyyy', { locale: vi }), items: [e] })
  }
  return groups
}

export function BpList({ entries, targets, onEdit, onDelete }: Props) {
  const groups = groupByDay(entries)
  return (
    <div className="-mx-5">
      {groups.map((g) => (
        <div key={g.day}>
          <div className="px-5 py-1.5 bg-surface-2/60 text-xs font-medium text-muted capitalize sticky top-0">{g.label}</div>
          <ul className="divide-y divide-border">
            {g.items.map((e) => (
              <li key={e.id} className="px-5 py-3 flex items-center gap-3">
                <span className="w-12 shrink-0 text-sm text-muted tabular-nums">{format(parseISO(e.at), 'HH:mm')}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-base font-semibold tabular-nums">{e.systolic}/{e.diastolic} <span className="text-xs text-muted font-normal">mmHg</span></span>
                    {e.pulse !== undefined && (
                      <span className="inline-flex items-center gap-1 text-sm text-muted tabular-nums"><HeartPulse size={14} />{e.pulse}</span>
                    )}
                    <StatusBadge status={bpStatus(e.systolic, e.diastolic, targets)} label={BP_GRADE_LABEL[bpGrade(e.systolic, e.diastolic)]} />
                  </div>
                  {e.note && <p className="mt-0.5 text-sm text-muted truncate">{e.note}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" aria-label="Sửa" onClick={() => onEdit(e)} icon={<Pencil size={16} />} />
                  <Button variant="ghost" size="sm" aria-label="Xoá" className="text-danger" onClick={() => onDelete(e)} icon={<Trash2 size={16} />} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
