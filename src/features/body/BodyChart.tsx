import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ResponsiveContainer, Legend } from 'recharts'
import type { BodyMetric, Profile } from '../../types'
import { fmtShort, fmtDateTime } from '../../lib/dates'
import { useChartColors, tooltipStyle, AXIS_TICK } from '../../components/charts/theme'
import { bmiFor } from './bodyUtils'

interface Point { t: number; weight?: number; bmi?: number }

/** Weight (left axis) and BMI (right axis) over time. `entries` must be sorted ascending. */
export function BodyChart({ entries, profile }: { entries: BodyMetric[]; profile: Profile }) {
  const c = useChartColors()
  const data: Point[] = entries.map((e) => ({
    t: new Date(e.at).getTime(),
    weight: e.weightKg,
    bmi: bmiFor(e, profile),
  }))
  const hasBmi = data.some((d) => d.bmi !== undefined)
  const { bmiMin, bmiMax } = profile.targets

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={c.border} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time"
          tickFormatter={(v: number) => fmtShort(new Date(v).toISOString())}
          tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} minTickGap={32}
        />
        <YAxis yAxisId="w" domain={['auto', 'auto']} tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} width={48} tickFormatter={(v: number) => `${v}`} />
        {hasBmi && (
          <YAxis yAxisId="bmi" orientation="right" domain={['auto', 'auto']} tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} width={40} />
        )}
        {hasBmi && (
          <ReferenceArea yAxisId="bmi" y1={bmiMin} y2={bmiMax} fill={c.ok} fillOpacity={0.08} stroke="none" ifOverflow="extendDomain" />
        )}
        <Tooltip
          contentStyle={tooltipStyle(c)}
          labelFormatter={(l) => (typeof l === 'number' ? fmtDateTime(new Date(l).toISOString()) : String(l))}
          formatter={(v, name) => [typeof v === 'number' ? v.toFixed(1) : String(v ?? ''), name === 'weight' ? 'Cân nặng (kg)' : 'BMI']}
        />
        <Legend formatter={(v) => (v === 'weight' ? 'Cân nặng (kg)' : 'BMI')} wrapperStyle={{ fontSize: 12 }} />
        <Line yAxisId="w" type="monotone" dataKey="weight" stroke={c.primary} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />
        {hasBmi && (
          <Line yAxisId="bmi" type="monotone" dataKey="bmi" stroke={c.info} strokeWidth={2} dot={{ r: 2 }} strokeDasharray="4 2" connectNulls isAnimationActive={false} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
