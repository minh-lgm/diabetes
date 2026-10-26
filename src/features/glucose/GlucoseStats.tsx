import type { GlucoseUnit, Targets } from '../../types'
import { formatGlucose, glucoseUnitLabel, hba1cStatus } from '../../lib/calc'
import type { GlucoseSummary } from './stats'
import { MetricCard } from './MetricCard'

const CV_GOAL = 36

export function GlucoseStats({ summary, unit, targets }: { summary: GlucoseSummary; unit: GlucoseUnit; targets: Targets }) {
  const unitLabel = glucoseUnitLabel(unit)
  const fmt = (mgdl: number | undefined) => (mgdl === undefined ? '—' : formatGlucose(mgdl, unit))

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard
        label="Trung bình"
        value={fmt(summary.mean)}
        unit={unitLabel}
        status={summary.meanStatus}
        hint={summary.count ? `${summary.count} lần đo` : undefined}
      />
      <MetricCard
        label="Độ lệch chuẩn"
        value={fmt(summary.sd)}
        unit={unitLabel}
        status={summary.cv === undefined ? undefined : summary.cv < CV_GOAL ? 'ok' : 'high'}
        statusLabel={summary.cv === undefined ? undefined : `CV ${summary.cv.toFixed(0)}%`}
        hint={`Mục tiêu CV <${CV_GOAL}%`}
      />
      <MetricCard
        label="GMI"
        value={summary.gmi === undefined ? '—' : summary.gmi.toFixed(1)}
        unit="%"
        status={summary.gmi === undefined ? undefined : hba1cStatus(summary.gmi, targets)}
        hint="Ước tính HbA1c từ đường huyết"
      />
      <MetricCard
        label="Hạ đường huyết"
        value={summary.hypoCount}
        unit="lần"
        status={summary.count ? (summary.hypoCount > 0 ? 'very_high' : 'ok') : undefined}
        statusLabel={summary.hypoCount > 0 ? 'Cần chú ý' : 'Không có'}
        hint={`Dưới ${formatGlucose(targets.hypoBelow, unit)} ${unitLabel}`}
      />
    </div>
  )
}
