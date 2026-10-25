import { useMemo } from 'react'
import { BarChart, Bar, Cell, LabelList, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, type LabelProps } from 'recharts'
import { BarChart3 } from 'lucide-react'
import type { GlucoseReading, GlucoseUnit, Targets } from '../../types'
import { formatGlucose, glucoseStatus, glucoseUnitLabel, toDisplayGlucose } from '../../lib/calc'
import { GLUCOSE_CONTEXT_LABEL } from '../../lib/labels'
import { AXIS_TICK, tooltipStyle, useChartColors } from '../../components/charts/theme'
import { EmptyState, StatusBadge } from '../../components/ui'
import { CONTEXT_COLOR_KEY, CONTEXT_SHORT_LABEL } from './context'
import { meanByContext, type ContextMean } from './stats'

interface BarPoint extends ContextMean { label: string; display: number }

export function GlucoseContextChart({ readings, unit, targets }: { readings: GlucoseReading[]; unit: GlucoseUnit; targets: Targets }) {
  const colors = useChartColors()
  const unitLabel = glucoseUnitLabel(unit)

  const data = useMemo<BarPoint[]>(
    () => meanByContext(readings).map((m) => ({ ...m, label: CONTEXT_SHORT_LABEL[m.context], display: toDisplayGlucose(m.mean, unit) })),
    [readings, unit],
  )

  if (!data.length) {
    return <EmptyState icon={<BarChart3 size={28} />} title="Chưa có dữ liệu" description="Trung bình theo từng thời điểm đo sẽ hiển thị ở đây." />
  }

  const maxDisplay = Math.max(toDisplayGlucose(targets.postMealMax, unit), ...data.map((d) => d.display))

  return (
    <div className="h-[300px] -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 28, right: 12, bottom: 0, left: 0 }} barCategoryGap="25%">
          <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ ...AXIS_TICK, fill: colors.muted }} stroke={colors.border} interval={0} tickMargin={6} />
          <YAxis
            domain={[0, Math.ceil(maxDisplay * 1.1)]}
            width={44}
            tick={{ ...AXIS_TICK, fill: colors.muted }}
            stroke={colors.border}
            label={{ value: unitLabel, position: 'insideTopLeft', fontSize: 10, fill: colors.muted, dy: -22, dx: -6 }}
          />
          <ReferenceLine y={toDisplayGlucose(targets.fastingMax, unit)} stroke={colors.ok} strokeDasharray="4 4" />
          <ReferenceLine y={toDisplayGlucose(targets.postMealMax, unit)} stroke={colors.warn} strokeDasharray="4 4" />
          <Tooltip
            cursor={{ fill: colors.border, fillOpacity: 0.3 }}
            contentStyle={tooltipStyle(colors)}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0]?.payload as BarPoint | undefined
              if (!p) return null
              return (
                <div style={tooltipStyle(colors)} className="px-3 py-2 space-y-1">
                  <div className="font-medium">{GLUCOSE_CONTEXT_LABEL[p.context]}</div>
                  <div className="tabular-nums">
                    Trung bình <span className="font-semibold">{formatGlucose(p.mean, unit)}</span> {unitLabel} · {p.count} lần đo
                  </div>
                  <StatusBadge status={glucoseStatus(p.mean, p.context, targets)} />
                </div>
              )
            }}
          />
          <Bar dataKey="display" radius={[8, 8, 0, 0]} isAnimationActive={false} maxBarSize={64}>
            {data.map((d) => <Cell key={d.context} fill={colors[CONTEXT_COLOR_KEY[d.context]]} fillOpacity={0.85} />)}
            <LabelList
              dataKey="count"
              content={(props: LabelProps) => {
                const vb = props.viewBox as { x?: number; y?: number; width?: number } | undefined
                if (!vb || vb.x === undefined || vb.y === undefined) return <g />
                return (
                  <text x={vb.x + (vb.width ?? 0) / 2} y={vb.y - 6} textAnchor="middle" fontSize={11} fill={colors.muted}>
                    {String(props.value ?? '')} lần
                  </text>
                )
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
