import { Pencil, Trash2 } from 'lucide-react'
import type { BodyMetric, Profile } from '../../types'
import { bmiStatus, bmiClass, BMI_CLASS_LABEL, waistStatus } from '../../lib/calc'
import { fmtDateTime } from '../../lib/dates'
import { Button, StatusBadge } from '../../components/ui'
import { bmiFor, fmtNum } from './bodyUtils'

interface Props {
  entries: BodyMetric[]           // sorted desc
  profile: Profile
  onEdit: (e: BodyMetric) => void
  onDelete: (e: BodyMetric) => void
}

export function BodyList({ entries, profile, onEdit, onDelete }: Props) {
  return (
    <ul className="divide-y divide-border -mx-5">
      {entries.map((e) => {
        const b = bmiFor(e, profile)
        return (
          <li key={e.id} className="px-5 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted">{fmtDateTime(e.at)}</div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span><span className="font-semibold tabular-nums text-base">{fmtNum(e.weightKg)}</span> <span className="text-muted">kg</span></span>
                <span className="flex items-center gap-1.5">
                  <span className="text-muted">BMI</span>
                  <span className="tabular-nums font-medium">{fmtNum(b)}</span>
                  {b !== undefined && <StatusBadge status={bmiStatus(b, profile.targets)} label={BMI_CLASS_LABEL[bmiClass(b)]} />}
                </span>
                {e.waistCm !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-muted">Eo</span>
                    <span className="tabular-nums font-medium">{fmtNum(e.waistCm, 0)} cm</span>
                    <StatusBadge status={waistStatus(e.waistCm, profile.sex, profile.targets)} />
                  </span>
                )}
              </div>
              {e.note && <p className="mt-1 text-sm text-muted truncate">{e.note}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="sm" aria-label="Sửa" onClick={() => onEdit(e)} icon={<Pencil size={16} />} />
              <Button variant="ghost" size="sm" aria-label="Xoá" className="text-danger" onClick={() => onDelete(e)} icon={<Trash2 size={16} />} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
