import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceArea, ReferenceLine,
} from 'recharts'
import { endOfDay, parseISO } from 'date-fns'
import type { GlucoseContext, GlucoseReading, Profile } from '../../types'
import { GLUCOSE_CONTEXT_LABEL, GLUCOSE_CONTEXTS } from '../../lib/labels'
import { toDisplayGlucose, formatGlucose, glucoseUnitLabel } from '../../lib/calc'
import { fmtShort, fmtDateTime, rangeStartIso, type RangeKey } from '../../lib/dates'
import { useChartColors, tooltipStyle, AXIS_TICK } from '../../components/charts/theme'
import { contextColor } from '../../components/charts/glucoseContext'
import { ChartLegend } from '../../components/charts/ChartLegend'
import { EmptyState } from '../../components/ui'

interface Point { t: number; v: number; mgdl: number; ctx: GlucoseContext; at: string }

export function GlucoseTrendChart({ readings, profile, range }: { readings: GlucoseReading[]; profile: Profile; range: RangeKey }) {
  const c = useChartColors()
  const unit = profile.glucoseUnit
  const t = profile.targets
  const unitLabel = glucoseUnitLabel(unit)

  const series = useMemo(() => {
    const byCtx = new Map<GlucoseContext, Point[]>()
    for (const r of readings) {
      const p: Point = { t: parseISO(r.at).getTime(), v: toDisplayGlucose(r.valueMgdl, unit), mgdl: r.valueMgdl, ctx: r.context, at: r.at }
      const list = byCtx.get(r.context)
      if (list) list.push(p); else byCtx.set(r.context, [p])
    }
    return GLUCOSE_CONTEXTS.filter((k) => byCtx.has(k)).map((k) => ({ ctx: k, points: byCtx.get(k) ?? [] }))
  }, [readings, unit])

  const yDomain = useMemo<[number, number]>(() => {
    const vals = readings.map((r) => r.valueMgdl)
    const lo = Math.min(t.hypoBelow - 15, ...vals)
    const hi = Math.max(t.postMealMax + 30, ...vals)
    const d = (x: number) => toDisplayGlucose(x, unit)
    return [Math.floor(d(Math.max(0, lo - 5))), Math.ceil(d(hi + 5))]
  }, [readings, t.hypoBelow, t.postMealMax, unit])

  const [now] = useState(() => Date.now())
  // Fit the time axis to the data actually present (padded), clamped to the selected range,
  // so a handful of readings on one or two days does not pile up at the right edge.
  const xDomain = useMemo<[number, number] | ['auto', 'auto']>(() => {
    if (!readings.length) return ['auto', 'auto']
    const times = readings.map((r) => parseISO(r.at).getTime())
    const dataMin = Math.min(...times)
    const dataMax = Math.max(...times)
    const HOUR = 3_600_000
    const pad = Math.max(6 * HOUR, (dataMax - dataMin) * 0.06)
    const start = rangeStartIso(range, new Date(now))
    const lo = Math.max(start ? parseISO(start).getTime() : -Infinity, dataMin - pad)
    const hi = Math.min(endOfDay(now).getTime(), dataMax + pad)
    return [lo, hi]
  }, [readings, range, now])

  if (!readings.length) {
    return <EmptyState title="Chưa có đường huyết trong khoảng này" description="Chọn khoảng thời gian rộng hơn hoặc ghi chỉ số mới." />
  }

  const fmtY = (v: number) => (unit === 'mmol' ? v.toFixed(1) : Math.round(v).toString())

  return (
    <div>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={c.border} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t" type="number" domain={xDomain} scale="time"
              tickFormatter={(v: number) => fmtShort(new Date(v).toISOString())}
              tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} tickLine={false} minTickGap={28}
            />
            <YAxis
              dataKey="v" type="number" domain={yDomain} width={44}
              tickFormatter={fmtY} tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} tickLine={false} axisLine={false}
            />
            <ReferenceArea y1={toDisplayGlucose(t.fastingMin, unit)} y2={toDisplayGlucose(t.fastingMax, unit)} fill={c.ok} fillOpacity={0.1} stroke="none" />
            <ReferenceLine y={toDisplayGlucose(t.postMealMax, unit)} stroke={c.warn} strokeDasharray="4 4" />
            <ReferenceLine y={toDisplayGlucose(t.hypoBelow, unit)} stroke={c.danger} strokeDasharray="4 4" />
            <Tooltip
              cursor={{ stroke: c.border, strokeDasharray: '3 3' }}
              contentStyle={tooltipStyle(c)}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as Point | undefined
                if (!active || !p) return null
                return (
                  <div style={tooltipStyle(c)} className="px-3 py-2">
                    <div className="text-muted">{fmtDateTime(p.at)}</div>
                    <div className="font-semibold tabular-nums text-sm">{formatGlucose(p.mgdl, unit)} <span className="font-normal text-muted">{unitLabel}</span></div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: contextColor(p.ctx, c) }} />
                      {GLUCOSE_CONTEXT_LABEL[p.ctx]}
                    </div>
                  </div>
                )
              }}
            />
            {series.map(({ ctx, points }) => (
              <Scatter key={ctx} name={GLUCOSE_CONTEXT_LABEL[ctx]} data={points} fill={contextColor(ctx, c)} fillOpacity={0.9} isAnimationActive={false} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend items={[
        ...series.map(({ ctx }) => ({ label: GLUCOSE_CONTEXT_LABEL[ctx], color: contextColor(ctx, c) })),
        { label: `Mục tiêu nhịn ăn ${formatGlucose(t.fastingMin, unit)}–${formatGlucose(t.fastingMax, unit)}`, color: c.ok },
        { label: `Sau ăn tối đa ${formatGlucose(t.postMealMax, unit)}`, color: c.warn, dashed: true },
        { label: `Hạ đường huyết < ${formatGlucose(t.hypoBelow, unit)}`, color: c.danger, dashed: true },
      ]} />
    </div>
  )
}
