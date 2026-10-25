import { useMemo } from 'react'
import { Info } from 'lucide-react'
import type { GlucoseReading, Profile } from '../../types'
import { timeInRange, mean, cv, gmi, formatGlucose, glucoseUnitLabel } from '../../lib/calc'
import type { RangeKey } from '../../lib/dates'
import { EmptyState } from '../../components/ui'

const TIR_LOW = 70
const TIR_HIGH = 180
const RANGE_DAYS: Record<RangeKey, number> = { '7d': 7, '14d': 14, '30d': 30, '90d': 90, '1y': 365, all: 365 }

function pct(v: number) { return `${Math.round(v)}%` }

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted truncate">{label}</div>
      <div className="text-lg font-semibold tabular-nums leading-tight">
        {value}{unit && <span className="text-xs font-normal text-muted ml-1">{unit}</span>}
      </div>
    </div>
  )
}

export function TimeInRangeBar({ readings, profile, range }: { readings: GlucoseReading[]; profile: Profile; range: RangeKey }) {
  const unit = profile.glucoseUnit
  const unitLabel = glucoseUnitLabel(unit)
  const stats = useMemo(() => {
    const values = readings.map((r) => r.valueMgdl)
    const tir = timeInRange(values, TIR_LOW, TIR_HIGH)
    const m = mean(values)
    return {
      tir, m, cv: cv(values), gmi: m !== undefined ? gmi(m) : undefined,
      n: values.length,
      hypo: values.filter((v) => v < profile.targets.hypoBelow).length,
    }
  }, [readings, profile.targets.hypoBelow])

  if (!stats.n) {
    return <EmptyState title="Chưa có dữ liệu để tính thời gian trong khoảng" />
  }

  const rough = RANGE_DAYS[range] < 14 || stats.n < 20
  const segments = [
    { key: 'low', label: `Thấp < ${formatGlucose(TIR_LOW, unit)}`, value: stats.tir.below, cls: 'bg-info' },
    { key: 'in', label: `Trong khoảng ${formatGlucose(TIR_LOW, unit)}–${formatGlucose(TIR_HIGH, unit)}`, value: stats.tir.inRange, cls: 'bg-ok' },
    { key: 'high', label: `Cao > ${formatGlucose(TIR_HIGH, unit)}`, value: stats.tir.above, cls: 'bg-warn' },
  ]

  return (
    <div className="space-y-4">
      <div
        className="flex h-4 w-full overflow-hidden rounded-full bg-surface-2"
        role="img"
        aria-label={segments.map((s) => `${s.label}: ${pct(s.value)}`).join(', ')}
      >
        {segments.map((s) => s.value > 0 && (
          <div key={s.key} className={s.cls} style={{ width: `${s.value}%` }} title={`${s.label}: ${pct(s.value)}`} />
        ))}
      </div>
      <ul className="grid grid-cols-3 gap-2 text-xs">
        {segments.map((s) => (
          <li key={s.key} className="flex items-start gap-1.5 min-w-0">
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${s.cls}`} aria-hidden />
            <span className="min-w-0">
              <span className="block text-base font-semibold tabular-nums leading-tight">{pct(s.value)}</span>
              <span className="block text-muted leading-tight">{s.label}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-border pt-3">
        <Stat label="Trung bình" value={stats.m !== undefined ? formatGlucose(stats.m, unit) : '—'} unit={unitLabel} />
        <Stat label="CV" value={stats.cv !== undefined ? stats.cv.toFixed(0) : '—'} unit="%" />
        <Stat label="GMI" value={stats.gmi !== undefined ? stats.gmi.toFixed(1) : '—'} unit="%" />
        <Stat label="Số lần đo" value={String(stats.n)} />
        <Stat label="Hạ đường huyết" value={String(stats.hypo)} unit="lần" />
      </div>
      {rough && (
        <p className="flex items-start gap-1.5 text-xs text-muted">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
          Dưới 14 ngày hoặc dưới 20 lần đo nên các ước tính (CV, GMI, thời gian trong khoảng) chỉ mang tính tham khảo.
        </p>
      )}
    </div>
  )
}
