import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts'
import type { BloodPressureReading, Targets } from '../../types'
import { fmtShort, fmtDateTime } from '../../lib/dates'
import { useChartColors, tooltipStyle, AXIS_TICK } from '../../components/charts/theme'

interface Point { t: number; sys: number; dia: number; pulse?: number }

const NAME: Record<string, string> = { sys: 'Tâm thu', dia: 'Tâm trương', pulse: 'Nhịp tim' }

/** Systolic/diastolic (and faint pulse) over time with target lines. `entries` sorted ascending. */
export function BpChart({ entries, targets }: { entries: BloodPressureReading[]; targets: Targets }) {
  const c = useChartColors()
  const data: Point[] = entries.map((e) => ({ t: new Date(e.at).getTime(), sys: e.systolic, dia: e.diastolic, pulse: e.pulse }))
  const hasPulse = data.some((d) => d.pulse !== undefined)

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={c.border} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time"
          tickFormatter={(v: number) => fmtShort(new Date(v).toISOString())}
          tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} minTickGap={32}
        />
        <YAxis domain={[40, 'auto']} tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} width={44} />
        <Tooltip
          contentStyle={tooltipStyle(c)}
          labelFormatter={(l) => (typeof l === 'number' ? fmtDateTime(new Date(l).toISOString()) : String(l))}
          formatter={(v, name) => [`${v ?? ''} ${name === 'pulse' ? 'lần/phút' : 'mmHg'}`, NAME[String(name)] ?? String(name)]}
        />
        <Legend formatter={(v) => NAME[String(v)] ?? String(v)} wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine y={targets.bpSysMax} stroke={c.danger} strokeDasharray="4 4" strokeOpacity={0.7}
          label={{ value: `Mục tiêu ${targets.bpSysMax}`, position: 'insideTopRight', fontSize: 10, fill: c.danger }} />
        <ReferenceLine y={targets.bpDiaMax} stroke={c.primary} strokeDasharray="4 4" strokeOpacity={0.7}
          label={{ value: `Mục tiêu ${targets.bpDiaMax}`, position: 'insideTopRight', fontSize: 10, fill: c.primary }} />
        <Line type="monotone" dataKey="sys" stroke={c.danger} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="dia" stroke={c.primary} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        {hasPulse && (
          <Line type="monotone" dataKey="pulse" stroke={c.muted} strokeWidth={1.5} strokeDasharray="2 3" strokeOpacity={0.6} dot={false} connectNulls isAnimationActive={false} />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
