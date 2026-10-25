import type { GlucoseUnit, Targets } from '../../types'
import { formatGlucose, glucoseUnitLabel, hba1cStatus } from '../../lib/calc'
import type { GlucoseSummary } from './stats'
import { MetricCard } from './MetricCard'

const CV_GOAL = 36

export function GlucoseStats({ summary, unit, targets, days }: { summary: GlucoseSummary; unit: GlucoseUnit; targets: Targets; days?: number }) {
  const unitLabel = glucoseUnitLabel(unit)
  const fmt = (mgdl: number | undefined) => (mgdl === undefined ? '—' : formatGlucose(mgdl, unit))
  const perDay = days && summary.count ? (summary.count / days).toFixed(1) : undefined

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
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
        label="Số lần đo"
        value={summary.count}
        unit="lần"
        hint={perDay ? `≈ ${perDay} lần/ngày` : 'Trong khoảng đã chọn'}
      />
      <MetricCard
        label="Hạ đường huyết"
        value={summary.hypoCount}
        unit="lần"
        status={summary.count ? (summary.hypoCount > 0 ? 'very_high' : 'ok') : undefined}
        statusLabel={summary.hypoCount > 0 ? 'Cần chú ý' : 'Không có'}
        hint={`Dưới ${formatGlucose(targets.hypoBelow, unit)} ${unitLabel}`}
      />
      <MetricCard
        label="Thời gian trong mục tiêu"
        value={summary.count ? summary.tir.inRange.toFixed(0) : '—'}
        unit="%"
        status={summary.count ? (summary.tir.inRange >= 70 ? 'ok' : summary.tir.inRange >= 50 ? 'high' : 'very_high') : undefined}
        statusLabel={summary.count ? (summary.tir.inRange >= 70 ? 'Đạt' : 'Chưa đạt') : undefined}
        hint={summary.count ? `${summary.tir.below.toFixed(0)}% thấp · ${summary.tir.above.toFixed(0)}% cao` : `70–180 mg/dL, mục tiêu ≥70%`}
      />
    </div>
  )
}
