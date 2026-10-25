import clsx from 'clsx'
import type { GlucoseUnit, Targets } from '../../types'
import { hba1cStatus, hba1cToEag, hba1cToIfcc, mgdlToMmol } from '../../lib/calc'
import { STATUS_DOT } from '../../components/ui'

const ROWS = [5, 6, 7, 8, 9, 10, 11, 12]

export function HbA1cReferenceTable({ targets, latest, unit }: { targets: Targets; latest?: number; unit: GlucoseUnit }) {
  const nearest = latest === undefined ? undefined : ROWS.reduce((best, r) => (Math.abs(r - latest) < Math.abs(best - latest) ? r : best), ROWS[0])
  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-xs text-muted text-left">
            <th className="py-1.5 pr-3 font-medium">HbA1c</th>
            <th className={clsx('py-1.5 pr-3 font-medium', unit === 'mmol' && 'hidden sm:table-cell')}>eAG mg/dL</th>
            <th className={clsx('py-1.5 pr-3 font-medium', unit === 'mgdl' && 'hidden sm:table-cell')}>eAG mmol/L</th>
            <th className="py-1.5 font-medium">IFCC mmol/mol</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ROWS.map((p) => {
            const eag = hba1cToEag(p)
            const status = hba1cStatus(p, targets)
            const highlight = p === nearest
            return (
              <tr key={p} className={clsx(highlight && 'bg-primary/5 font-medium')}>
                <td className="py-1.5 pr-3">
                  <span className="inline-flex items-center gap-2">
                    <span className={clsx('h-2 w-2 rounded-full', STATUS_DOT[status])} />
                    {p}%
                    {highlight && <span className="text-xs text-primary font-normal whitespace-nowrap">gần bạn</span>}
                  </span>
                </td>
                <td className={clsx('py-1.5 pr-3', unit === 'mmol' && 'hidden sm:table-cell')}>{Math.round(eag)}</td>
                <td className={clsx('py-1.5 pr-3', unit === 'mgdl' && 'hidden sm:table-cell')}>{mgdlToMmol(eag).toFixed(1)}</td>
                <td className="py-1.5">{Math.round(hba1cToIfcc(p))}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs text-muted mt-3">
        eAG (đường huyết trung bình ước tính) theo công thức ADAG: eAG = 28,7 × HbA1c − 46,7. Chấm màu theo mục tiêu HbA1c &lt;{targets.hba1cMax}% của bạn.
      </p>
    </div>
  )
}
