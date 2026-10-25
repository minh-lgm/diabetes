import { useMemo } from 'react'
import {
  ComposedChart, Scatter, Line, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend,
  ReferenceArea, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { Activity } from 'lucide-react'
import type { GlucoseContext, GlucoseReading, GlucoseUnit, Targets } from '../../types'
import { formatGlucose, glucoseStatus, glucoseUnitLabel, toDisplayGlucose } from '../../lib/calc'
import { GLUCOSE_CONTEXTS, GLUCOSE_CONTEXT_LABEL } from '../../lib/labels'
import { fmtDateTime, fmtShort } from '../../lib/dates'
import { AXIS_TICK, tooltipStyle, useChartColors } from '../../components/charts/theme'
import { EmptyState, StatusBadge } from '../../components/ui'
import { CONTEXT_COLOR_KEY } from './context'
import { movingAverage7d, sortByAtAsc } from './stats'

interface ReadingPoint { kind: 'reading'; t: number; v: number; reading: GlucoseReading }
interface AveragePoint { kind: 'average'; t: number; v: number }
type TrendPoint = ReadingPoint | AveragePoint

const MA_NAME = 'Trung bình 7 ngày'

export function GlucoseTrendChart({ readings, allReadings, unit, targets }: {
  /** Readings to plot as points (already filtered by context). */
  readings: GlucoseReading[]
  /** Every reading in the range, used for the moving average. */
  allReadings: GlucoseReading[]
  unit: GlucoseUnit
  targets: Targets
}) {
  const colors = useChartColors()
  const unitLabel = glucoseUnitLabel(unit)
  const disp = (mgdl: number) => toDisplayGlucose(mgdl, unit)

  const byContext = useMemo(() => {
    const map = new Map<GlucoseContext, ReadingPoint[]>()
    for (const c of GLUCOSE_CONTEXTS) map.set(c, [])
    for (const r of sortByAtAsc(readings)) {
      map.get(r.context)?.push({ kind: 'reading', t: new Date(r.at).getTime(), v: toDisplayGlucose(r.valueMgdl, unit), reading: r })
    }
    return map
  }, [readings, unit])

  const average = useMemo<AveragePoint[]>(
    () => (allReadings.length >= 2
      ? movingAverage7d(sortByAtAsc(allReadings)).map((p) => ({ kind: 'average', t: p.t, v: toDisplayGlucose(p.ma, unit) }))
      : []),
    [allReadings, unit],
  )

  const yDomain = useMemo<[number, number]>(() => {
    const vals = readings.map((r) => r.valueMgdl)
    const lo = toDisplayGlucose(Math.min(targets.hypoBelow, ...vals), unit)
    const hi = toDisplayGlucose(Math.max(targets.postMealMax, ...vals), unit)
    const pad = unit === 'mmol' ? 1 : 20
    return [Math.max(0, Math.floor(lo - pad)), Math.ceil(hi + pad)]
  }, [readings, targets, unit])

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
            tickFormatter={(t: number) => fmtShort(new Date(t).toISOString())}
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
              const p = payload[0]?.payload as TrendPoint | undefined
              if (!p) return null
              return (
                <div style={tooltipStyle(colors)} className="px-3 py-2 space-y-1">
                  <div className="text-muted">{fmtDateTime(new Date(p.t).toISOString())}</div>
                  <div className="font-semibold tabular-nums text-sm">
                    {unit === 'mmol' ? p.v.toFixed(1) : Math.round(p.v)} <span className="text-xs font-normal text-muted">{unitLabel}</span>
                  </div>
                  {p.kind === 'reading' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span>{GLUCOSE_CONTEXT_LABEL[p.reading.context]}</span>
                        <StatusBadge status={glucoseStatus(p.reading.valueMgdl, p.reading.context, targets)} />
                      </div>
                      {p.reading.note && <div className="text-muted max-w-[220px] whitespace-pre-wrap">{p.reading.note}</div>}
                    </>
                  ) : (
                    <div className="text-muted">{MA_NAME}</div>
                  )}
                </div>
              )
            }}
          />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

          {average.length > 0 && (
            <Line
              data={average}
              dataKey="v"
              name={MA_NAME}
              type="monotone"
              stroke={colors.fg}
              strokeOpacity={0.55}
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              legendType="plainline"
            />
          )}
          {GLUCOSE_CONTEXTS.map((c) => {
            const pts = byContext.get(c) ?? []
            if (!pts.length) return null
            return (
              <Scatter
                key={c}
                data={pts}
                dataKey="v"
                name={GLUCOSE_CONTEXT_LABEL[c]}
                fill={colors[CONTEXT_COLOR_KEY[c]]}
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
