import { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { parseISO } from 'date-fns'
import type { BodyMetric, Profile } from '../../types'
import { bmi, bmiClass, BMI_CLASS_LABEL } from '../../lib/calc'
import { timeTickFormatter, fmtDate } from '../../lib/dates'
import { useChartColors, tooltipStyle, AXIS_TICK } from '../../components/charts/theme'
import { ChartLegend } from '../../components/charts/ChartLegend'
import { EmptyState } from '../../components/ui'

interface Point { t: number; w: number; bmi?: number; at: string }

export function WeightTrendChart({ entries, profile }: { entries: BodyMetric[]; profile: Profile }) {
  const c = useChartColors()
  const data = useMemo<Point[]>(() => entries
    .filter((e): e is BodyMetric & { weightKg: number } => e.weightKg !== undefined)
    .map((e) => {
      const h = e.heightCm ?? profile.heightCm
      return { t: parseISO(e.at).getTime(), w: e.weightKg, bmi: h ? bmi(e.weightKg, h) : undefined, at: e.at }
    }), [entries, profile.heightCm])

  const yDomain = useMemo<[number, number]>(() => {
    const vals = data.map((d) => d.w)
    if (!vals.length) return [0, 100]
    return [Math.floor(Math.min(...vals) - 2), Math.ceil(Math.max(...vals) + 2)]
  }, [data])

  const tickX = timeTickFormatter(data.map((d) => d.t))

  if (!data.length) {
    return <EmptyState title="Chưa có cân nặng trong khoảng này" description="Ghi cân nặng mỗi tuần để theo dõi xu hướng." />
  }

  return (
    <div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={c.border} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time"
              tickFormatter={tickX}
              tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} tickLine={false} minTickGap={28}
            />
            <YAxis
              dataKey="w" type="number" domain={yDomain} width={40}
              tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} tickLine={false} axisLine={false}
            />
            <Tooltip
              cursor={{ stroke: c.border, strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as Point | undefined
                if (!active || !p) return null
                return (
                  <div style={tooltipStyle(c)} className="px-3 py-2">
                    <div className="text-muted">{fmtDate(p.at)}</div>
                    <div className="font-semibold tabular-nums text-sm">{p.w.toFixed(1)} <span className="font-normal text-muted">kg</span></div>
                    {p.bmi !== undefined && <div className="text-muted">BMI {p.bmi.toFixed(1)} · {BMI_CLASS_LABEL[bmiClass(p.bmi)]}</div>}
                  </div>
                )
              }}
            />
            <Line type="monotone" dataKey="w" stroke={c.info} strokeWidth={2} dot={{ r: 3, fill: c.info, strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend items={[{ label: 'Cân nặng (kg)', color: c.info }]} />
    </div>
  )
}
