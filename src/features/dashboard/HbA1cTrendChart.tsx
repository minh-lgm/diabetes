import { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { parseISO } from 'date-fns'
import type { HbA1cReading, Profile } from '../../types'
import { hba1cToEag, formatGlucose, glucoseUnitLabel } from '../../lib/calc'
import { fmtMonth, fmtDate } from '../../lib/dates'
import { useChartColors, tooltipStyle, AXIS_TICK } from '../../components/charts/theme'
import { ChartLegend } from '../../components/charts/ChartLegend'
import { EmptyState } from '../../components/ui'

interface Point { t: number; v: number; at: string }

export function HbA1cTrendChart({ readings, profile }: { readings: HbA1cReading[]; profile: Profile }) {
  const c = useChartColors()
  const max = profile.targets.hba1cMax
  const data = useMemo<Point[]>(() => readings.map((r) => ({ t: parseISO(r.at).getTime(), v: r.percent, at: r.at })), [readings])
  const yDomain = useMemo<[number, number]>(() => {
    const vals = data.map((d) => d.v)
    return [Math.floor(Math.min(5, max - 1, ...vals)), Math.ceil(Math.max(max + 1, ...vals) + 0.5)]
  }, [data, max])

  if (!data.length) {
    return <EmptyState title="Chưa có HbA1c trong 2 năm gần đây" description="HbA1c thường được xét nghiệm mỗi 3 tháng." />
  }

  return (
    <div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={c.border} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time"
              tickFormatter={(v: number) => fmtMonth(new Date(v).toISOString())}
              tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} tickLine={false} minTickGap={32}
            />
            <YAxis
              dataKey="v" type="number" domain={yDomain} width={40}
              tickFormatter={(v: number) => `${v}%`} tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} tickLine={false} axisLine={false}
            />
            <ReferenceLine y={max} stroke={c.warn} strokeDasharray="4 4" />
            <Tooltip
              cursor={{ stroke: c.border, strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as Point | undefined
                if (!active || !p) return null
                return (
                  <div style={tooltipStyle(c)} className="px-3 py-2">
                    <div className="text-muted">{fmtDate(p.at)}</div>
                    <div className="font-semibold tabular-nums text-sm">{p.v.toFixed(1)} <span className="font-normal text-muted">%</span></div>
                    <div className="text-muted">eAG ≈ {formatGlucose(hba1cToEag(p.v), profile.glucoseUnit)} {glucoseUnitLabel(profile.glucoseUnit)}</div>
                  </div>
                )
              }}
            />
            <Line type="monotone" dataKey="v" stroke={c.primary} strokeWidth={2} dot={{ r: 4, fill: c.primary, strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend items={[
        { label: 'HbA1c (%)', color: c.primary },
        { label: `Mục tiêu < ${max}%`, color: c.warn, dashed: true },
      ]} />
    </div>
  )
}
