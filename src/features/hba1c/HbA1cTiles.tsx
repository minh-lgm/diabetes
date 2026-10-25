import { useState } from 'react'
import { addMonths, differenceInCalendarDays, parseISO } from 'date-fns'
import { ArrowDown, ArrowUp, CalendarClock, Minus } from 'lucide-react'
import type { GlucoseReading, HbA1cReading, Profile } from '../../types'
import { formatGlucose, glucoseUnitLabel, gmi, hba1cStatus, hba1cToEag, hba1cToIfcc, mean } from '../../lib/calc'
import { fmtDate } from '../../lib/dates'
import { MetricCard } from '../glucose/MetricCard'

const RETEST_MONTHS = 3

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

  const glucoseMean = mean(glucose90d.map((g) => g.valueMgdl))
  const gmiValue = glucoseMean === undefined ? undefined : gmi(glucoseMean)

  const delta = latest && previous ? latest.percent - previous.percent : undefined
  const deltaRounded = delta === undefined ? undefined : Math.round(delta * 10) / 10

  const [today] = useState(() => new Date())
  const dueDate = latest ? addMonths(parseISO(latest.at), RETEST_MONTHS) : undefined
  const daysToDue = dueDate ? differenceInCalendarDays(dueDate, today) : undefined

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <MetricCard
        label="HbA1c gần nhất"
        value={latest ? latest.percent.toFixed(1) : '—'}
        unit="%"
        status={latest ? hba1cStatus(latest.percent, targets) : undefined}
        hint={latest ? fmtDate(latest.at) : 'Chưa có kết quả'}
      />
      <MetricCard
        label="eAG tương ứng"
        value={latest ? formatGlucose(hba1cToEag(latest.percent), unit) : '—'}
        unit={unitLabel}
        hint="Đường huyết trung bình ước tính"
      />
      <MetricCard
        label="IFCC"
        value={latest ? Math.round(hba1cToIfcc(latest.percent)) : '—'}
        unit="mmol/mol"
        hint="Đơn vị chuẩn quốc tế"
      />
      <MetricCard
        label="GMI từ đường huyết 90 ngày"
        value={gmiValue === undefined ? '—' : gmiValue.toFixed(1)}
        unit="%"
        status={gmiValue === undefined ? undefined : hba1cStatus(gmiValue, targets)}
        hint={
          gmiValue === undefined
            ? 'Chưa có dữ liệu đường huyết'
            : latest
              ? `Lệch ${(gmiValue - latest.percent >= 0 ? '+' : '')}${(gmiValue - latest.percent).toFixed(1)} điểm so với HbA1c`
              : `${glucose90d.length} lần đo`
        }
      />
      <MetricCard
        label="Thay đổi so với lần trước"
        value={deltaRounded === undefined ? '—' : `${deltaRounded > 0 ? '+' : ''}${deltaRounded.toFixed(1)}`}
        unit="điểm"
        icon={deltaRounded === undefined || deltaRounded === 0 ? <Minus size={18} /> : deltaRounded < 0 ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
        status={deltaRounded === undefined ? undefined : deltaRounded < 0 ? 'ok' : deltaRounded > 0 ? 'high' : 'unknown'}
        statusLabel={deltaRounded === undefined ? undefined : deltaRounded < 0 ? 'Giảm' : deltaRounded > 0 ? 'Tăng' : 'Không đổi'}
        hint={previous ? `So với ${fmtDate(previous.at)}` : 'Cần ít nhất 2 kết quả'}
      />
      <MetricCard
        label="Lần xét nghiệm tiếp theo"
        value={dueDate ? fmtDate(dueDate.toISOString()) : '—'}
        small
        icon={<CalendarClock size={18} />}
        status={daysToDue === undefined ? undefined : daysToDue < 0 ? 'high' : daysToDue <= 14 ? 'low' : 'ok'}
        statusLabel={daysToDue === undefined ? undefined : daysToDue < 0 ? 'Quá hạn' : daysToDue <= 14 ? 'Sắp đến hạn' : 'Đúng lịch'}
        hint={
          daysToDue === undefined
            ? `Mỗi ${RETEST_MONTHS} tháng`
            : daysToDue < 0
              ? `Quá ${Math.abs(daysToDue)} ngày`
              : daysToDue === 0 ? 'Hôm nay' : `Còn ${daysToDue} ngày`
        }
      />
    </div>
  )
}
