import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ReferenceLine, ResponsiveContainer } from 'recharts'
import { TrendingDown } from 'lucide-react'
import type { GlucoseUnit, HbA1cReading, Targets } from '../../types'
import { formatGlucose, glucoseUnitLabel, hba1cStatus, hba1cToEag } from '../../lib/calc'
import { fmtDate, fmtShort } from '../../lib/dates'
import { AXIS_TICK, tooltipStyle, useChartColors } from '../../components/charts/theme'
import { EmptyState, StatusBadge } from '../../components/ui'
import { sortByAtAsc } from '../glucose/stats'

interface Point { t: number; percent: number; record: HbA1cReading }

const PREDIABETES_BAND: [number, number] = [5.7, 6.4]

export function HbA1cChart({ records, unit, targets }: { records: HbA1cReading[]; unit: GlucoseUnit; targets: Targets }) {
  const colors = useChartColors()

  const data = useMemo<Point[]>(
    () => sortByAtAsc(records).map((r) => ({ t: new Date(r.at).getTime(), percent: r.percent, record: r })),
    [records],
  )

  const yMax = useMemo(() => Math.ceil(Math.max(targets.hba1cMax, ...data.map((d) => d.percent)) + 1), [data, targets])

  if (!records.length) {
    return <EmptyState icon={<TrendingDown size={28} />} title="Chưa có kết quả HbA1c" description="Ghi kết quả xét nghiệm để theo dõi diễn tiến theo thời gian." />
  }

  return (
    <div className="h-[280px] -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
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
            padding={{ left: 12, right: 12 }}
          />
          <YAxis
            domain={[4, yMax]}
            width={36}
            tick={{ ...AXIS_TICK, fill: colors.muted }}
            stroke={colors.border}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ReferenceArea
            y1={PREDIABETES_BAND[0]} y2={PREDIABETES_BAND[1]}
            fill={colors.info} fillOpacity={0.07} stroke="none"
            label={{ value: 'Tiền tiểu đường', position: 'insideBottomLeft', fontSize: 10, fill: colors.info }}
          />
          <ReferenceLine
            y={targets.hba1cMax} stroke={colors.ok} strokeDasharray="4 4"
            label={{ value: `Mục tiêu <${targets.hba1cMax}%`, position: 'insideTopRight', fontSize: 10, fill: colors.ok }}
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
                  <div className="text-muted">{fmtDate(p.record.at)}</div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums text-sm">{p.percent.toFixed(1)}%</span>
                    <StatusBadge status={hba1cStatus(p.percent, targets)} />
                  </div>
                  <div className="text-muted tabular-nums">eAG ≈ {formatGlucose(hba1cToEag(p.percent), unit)} {glucoseUnitLabel(unit)}</div>
                  {p.record.note && <div className="text-muted max-w-[220px] whitespace-pre-wrap">{p.record.note}</div>}
                </div>
              )
            }}
          />
          <Line
            type="monotone"
            dataKey="percent"
            name="HbA1c"
            stroke={colors.primary}
            strokeWidth={2}
            dot={{ r: 4, fill: colors.primary, stroke: colors.surface, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
