import { ArrowDown, ArrowUp, Minus, Percent, Droplet, FlaskConical, Activity } from 'lucide-react'
import type { GlucoseReading, HbA1cReading, Profile } from '../../types'
import { formatGlucose, glucoseUnitLabel, gmi, hba1cStatus, hba1cToEag, hba1cToIfcc, mean } from '../../lib/calc'
import { fmtDate } from '../../lib/dates'
import { StatTile } from '../../components/ui'

const EMPTY = '—'

export function HbA1cTiles({ records, glucose90d, profile }: {
  /** Sorted descending by `at`. */
  records: HbA1cReading[]
  /** Glucose readings from the last 90 days (any order). */
  glucose90d: GlucoseReading[]
  profile: Profile
}) {
  const { glucoseUnit: unit, targets } = profile
  const latest = records[0]
  const previous = records[1]
  const unitLabel = glucoseUnitLabel(unit)
  const latestStatus = latest ? hba1cStatus(latest.percent, targets) : 'unknown'

  const glucoseMean = mean(glucose90d.map((g) => g.valueMgdl))
  const gmiValue = glucoseMean === undefined ? undefined : gmi(glucoseMean)
  const gmiGap = gmiValue !== undefined && latest ? Math.round((gmiValue - latest.percent) * 10) / 10 : undefined

  const delta = latest && previous ? Math.round((latest.percent - previous.percent) * 10) / 10 : undefined

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      <StatTile
        label="HbA1c gần nhất"
        icon={<Percent size={16} aria-hidden />}
        value={latest ? latest.percent.toFixed(1) : EMPTY}
        unit={latest ? '%' : undefined}
        status={latestStatus}
        hint={latest ? fmtDate(latest.at) : 'Chưa có kết quả'}
      />
      <StatTile
        label="Đường huyết TB (eAG)"
        icon={<Droplet size={16} aria-hidden />}
        value={latest ? formatGlucose(hba1cToEag(latest.percent), unit) : EMPTY}
        unit={latest ? unitLabel : undefined}
        status={latestStatus}
        statusLabel={latest ? 'Ước tính từ HbA1c' : undefined}
      />
      <StatTile
        label="IFCC"
        icon={<FlaskConical size={16} aria-hidden />}
        value={latest ? Math.round(hba1cToIfcc(latest.percent)).toString() : EMPTY}
        unit={latest ? 'mmol/mol' : undefined}
        status={latestStatus}
        statusLabel={latest ? 'Chuẩn quốc tế' : undefined}
      />
      <StatTile
        label="GMI 90 ngày"
        icon={<Activity size={16} aria-hidden />}
        value={gmiValue === undefined ? EMPTY : gmiValue.toFixed(1)}
        unit={gmiValue === undefined ? undefined : '%'}
        status={gmiValue === undefined ? 'unknown' : hba1cStatus(gmiValue, targets)}
        hint={
          gmiValue === undefined
            ? 'Chưa có đường huyết'
            : gmiGap !== undefined
              ? `Lệch ${gmiGap > 0 ? '+' : ''}${gmiGap.toFixed(1)} so với HbA1c`
              : `${glucose90d.length} lần đo`
        }
      />
      <StatTile
        label="So với lần trước"
        icon={delta === undefined || delta === 0 ? <Minus size={16} aria-hidden /> : delta < 0 ? <ArrowDown size={16} aria-hidden /> : <ArrowUp size={16} aria-hidden />}
        value={delta === undefined ? EMPTY : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`}
        unit={delta === undefined ? undefined : 'điểm'}
        status={delta === undefined ? 'unknown' : delta < 0 ? 'ok' : delta > 0 ? 'high' : 'unknown'}
        statusLabel={delta === undefined ? undefined : delta < 0 ? 'Giảm' : delta > 0 ? 'Tăng' : 'Không đổi'}
        hint={previous ? `Lần trước ${fmtDate(previous.at)}` : 'Cần ít nhất 2 kết quả'}
      />
    </div>
  )
}
