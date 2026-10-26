import { useMemo } from 'react'
import {
  ComposedChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend,
  ReferenceArea, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { Activity } from 'lucide-react'
import type { GlucoseReading, GlucoseUnit, Targets } from '../../types'
import { formatGlucose, glucoseStatus, glucoseUnitLabel, toDisplayGlucose, type Status } from '../../lib/calc'
import { GLUCOSE_CONTEXT_LABEL } from '../../lib/labels'
import { fmtDateTime, timeTickFormatter } from '../../lib/dates'
import { AXIS_TICK, tooltipStyle, useChartColors, type ChartColors } from '../../components/charts/theme'
import { EmptyState, StatusBadge } from '../../components/ui'
import { sortByAtAsc } from './stats'

interface Point { t: number; v: number; reading: GlucoseReading }

/** Points are coloured by how the reading compares with the user's targets. */
type Bucket = 'ok' | 'high' | 'low'
const BUCKETS: { key: Bucket; label: string; color: keyof ChartColors }[] = [
  { key: 'ok', label: 'Đạt mục tiêu', color: 'ok' },
  { key: 'high', label: 'Cao', color: 'warn' },
  { key: 'low', label: 'Hạ đường huyết', color: 'danger' },
]
function bucketOf(status: Status): Bucket {
  if (status === 'low') return 'low'
  if (status === 'high' || status === 'very_high') return 'high'
  return 'ok'
}

export function GlucoseTrendChart({ readings, unit, targets }: {
  readings: GlucoseReading[]
  unit: GlucoseUnit
  targets: Targets
}) {
  const colors = useChartColors()
  const unitLabel = glucoseUnitLabel(unit)
  const disp = (mgdl: number) => toDisplayGlucose(mgdl, unit)

  const byBucket = useMemo(() => {
    const map = new Map<Bucket, Point[]>(BUCKETS.map((b) => [b.key, []]))
    for (const r of sortByAtAsc(readings)) {
      const b = bucketOf(glucoseStatus(r.valueMgdl, r.context, targets))
      map.get(b)?.push({ t: new Date(r.at).getTime(), v: toDisplayGlucose(r.valueMgdl, unit), reading: r })
    }
    return map
  }, [readings, unit, targets])

  const yDomain = useMemo<[number, number]>(() => {
    const vals = readings.map((r) => r.valueMgdl)
    const lo = toDisplayGlucose(Math.min(targets.hypoBelow, ...vals), unit)
    const hi = toDisplayGlucose(Math.max(targets.postMealMax, ...vals), unit)
    const pad = unit === 'mmol' ? 1 : 20
    return [Math.max(0, Math.floor(lo - pad)), Math.ceil(hi + pad)]
  }, [readings, targets, unit])

  const tickX = timeTickFormatter(readings.map((r) => new Date(r.at).getTime()))

  if (!readings.length) {
    return <EmptyState icon={<Activity size={28} />} title="Chưa có dữ liệu để vẽ biểu đồ" description="Ghi chỉ số đường huyết để theo dõi xu hướng theo thời gian." />
  }

  return (
    <div className="h-[300px] -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 22, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
          <XAxis
            type="number"
            dataKey="t"
            domain={['dataMin', 'dataMax']}
            scale="time"
            tickFormatter={tickX}
            tick={{ ...AXIS_TICK, fill: colors.muted }}
            stroke={colors.border}
            tickMargin={6}
            minTickGap={28}
          />
          <YAxis
            type="number"
            dataKey="v"
            domain={yDomain}
            width={44}
            tick={{ ...AXIS_TICK, fill: colors.muted }}
            stroke={colors.border}
            label={{ value: unitLabel, position: 'insideTopLeft', fontSize: 10, fill: colors.muted, dy: -16, dx: -6 }}
          />
          <ZAxis type="number" range={[38, 38]} />

          <ReferenceArea
            y1={disp(targets.fastingMin)} y2={disp(targets.fastingMax)}
            fill={colors.ok} fillOpacity={0.08} stroke="none" ifOverflow="extendDomain"
          />
          <ReferenceLine
            y={disp(targets.postMealMax)} stroke={colors.warn} strokeDasharray="4 4"
            label={{ value: `Sau ăn ≤${formatGlucose(targets.postMealMax, unit)}`, position: 'insideBottomRight', fontSize: 10, fill: colors.warn }}
          />
          <ReferenceLine
            y={disp(targets.hypoBelow)} stroke={colors.danger} strokeDasharray="4 4"
            label={{ value: `Hạ <${formatGlucose(targets.hypoBelow, unit)}`, position: 'insideTopRight', fontSize: 10, fill: colors.danger }}
          />

          <Tooltip
            cursor={{ stroke: colors.border, strokeDasharray: '3 3' }}
            contentStyle={tooltipStyle(colors)}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0]?.payload as Point | undefined
              if (!p) return null
              return (
                <div style={tooltipStyle(colors)} className="px-3 py-2 space-y-1">
                  <div className="text-muted">{fmtDateTime(p.reading.at)}</div>
                  <div className="font-semibold tabular-nums text-sm">
                    {formatGlucose(p.reading.valueMgdl, unit)} <span className="text-xs font-normal text-muted">{unitLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{GLUCOSE_CONTEXT_LABEL[p.reading.context]}</span>
                    <StatusBadge status={glucoseStatus(p.reading.valueMgdl, p.reading.context, targets)} />
                  </div>
                  {p.reading.note && <div className="text-muted max-w-[220px] whitespace-pre-wrap">{p.reading.note}</div>}
                </div>
              )
            }}
          />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

          {BUCKETS.map((b) => {
            const pts = byBucket.get(b.key) ?? []
            if (!pts.length) return null
            return (
              <Scatter
                key={b.key}
                data={pts}
                dataKey="v"
                name={b.label}
                fill={colors[b.color]}
                fillOpacity={0.9}
                isAnimationActive={false}
                legendType="circle"
              />
            )
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
