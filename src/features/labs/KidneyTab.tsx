import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts'
import { Pencil, Trash2, Droplets, Plus } from 'lucide-react'
import type { KidneyPanel, Targets } from '../../types'
import { egfrStatus, uacrStatus } from '../../lib/calc'
import { fmtDate, timeTickFormatter } from '../../lib/dates'
import { Button, Card, EmptyState, StatTile, StatusBadge } from '../../components/ui'
import { useChartColors, tooltipStyle, AXIS_TICK } from '../../components/charts/theme'
import { fmtNum } from '../body/bodyUtils'
import { gfrStage, GFR_STAGE_LABEL, albuminuriaCategory, ALBUMINURIA_LABEL, KIDNEY_LABEL, KIDNEY_UNIT, type KidneyKey } from './kidney'

interface Props {
  panels: KidneyPanel[]      // sorted ascending
  targets: Targets
  onAdd: () => void
  onEdit: (p: KidneyPanel) => void
  onDelete: (p: KidneyPanel) => void
}

function latestOf(panels: KidneyPanel[], k: KidneyKey): number | undefined {
  for (let i = panels.length - 1; i >= 0; i--) { const v = panels[i][k]; if (v !== undefined) return v }
  return undefined
}

export function KidneyTab({ panels, targets, onAdd, onEdit, onDelete }: Props) {
  const c = useChartColors()
  const desc = [...panels].reverse()
  const creat = latestOf(panels, 'creatinineMgdl')
  const egfr = latestOf(panels, 'egfr')
  const uacr = latestOf(panels, 'uacr')

  const data = panels.map((p) => ({ t: new Date(p.at).getTime(), egfr: p.egfr, uacr: p.uacr }))
  const tickX = timeTickFormatter(data.map((d) => d.t))
  const hasEgfr = data.some((d) => d.egfr !== undefined)
  const hasUacr = data.some((d) => d.uacr !== undefined)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile label="Creatinine" value={fmtNum(creat, 2)} unit="mg/dL" status={creat !== undefined ? 'ok' : 'unknown'}
          hint="Tham chiếu ~0,6–1,2 mg/dL" />
        <StatTile label="eGFR" value={fmtNum(egfr, 0)} unit="mL/phút/1,73m²"
          status={egfr !== undefined ? egfrStatus(egfr, targets) : 'unknown'}
          statusLabel={egfr !== undefined ? gfrStage(egfr) : undefined}
          hint={egfr !== undefined ? GFR_STAGE_LABEL[gfrStage(egfr)] : `Mục tiêu ≥ ${targets.egfrMin}`} />
        <StatTile label="UACR" value={fmtNum(uacr, uacr !== undefined && uacr < 10 ? 1 : 0)} unit="mg/g"
          status={uacr !== undefined ? uacrStatus(uacr, targets) : 'unknown'}
          hint={uacr !== undefined ? ALBUMINURIA_LABEL[albuminuriaCategory(uacr)] : `Mục tiêu < ${targets.uacrMax}`} />
      </div>

      <Card title="Diễn biến chức năng thận" subtitle="eGFR (trục trái) và UACR (trục phải)">
        {panels.length >= 2 && (hasEgfr || hasUacr) ? (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={c.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time"
                tickFormatter={tickX} tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} minTickGap={32} />
              <YAxis yAxisId="egfr" domain={[0, 'auto']} tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} width={44} />
              {hasUacr && <YAxis yAxisId="uacr" orientation="right" domain={[0, 'auto']} tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} width={44} />}
              <Tooltip contentStyle={tooltipStyle(c)}
                labelFormatter={(l) => (typeof l === 'number' ? fmtDate(new Date(l).toISOString()) : String(l))}
                formatter={(v, name) => { const k = name as KidneyKey; return [`${v ?? ''} ${KIDNEY_UNIT[k] ?? ''}`, KIDNEY_LABEL[k] ?? String(name)] }} />
              <Legend formatter={(v) => KIDNEY_LABEL[v as KidneyKey] ?? String(v)} wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine yAxisId="egfr" y={targets.egfrMin} stroke={c.primary} strokeDasharray="4 4" strokeOpacity={0.7}
                label={{ value: `eGFR mục tiêu ≥ ${targets.egfrMin}`, position: 'insideTopLeft', fontSize: 10, fill: c.primary }} />
              {hasUacr && (
                <ReferenceLine yAxisId="uacr" y={targets.uacrMax} stroke={c.warn} strokeDasharray="4 4" strokeOpacity={0.7}
                  label={{ value: `UACR < ${targets.uacrMax}`, position: 'insideTopRight', fontSize: 10, fill: c.warn }} />
              )}
              {hasEgfr && <Line yAxisId="egfr" type="monotone" dataKey="egfr" stroke={c.primary} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />}
              {hasUacr && <Line yAxisId="uacr" type="monotone" dataKey="uacr" stroke={c.warn} strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Chưa đủ dữ liệu để vẽ biểu đồ" description="Cần ít nhất 2 lần xét nghiệm có eGFR hoặc UACR." />
        )}
      </Card>

      <Card title="Kết quả xét nghiệm" subtitle={`${panels.length} lần`}>
        {desc.length === 0 ? (
          <EmptyState icon={<Droplets size={32} />} title="Chưa có kết quả chức năng thận"
            description="Nên kiểm tra eGFR và UACR ít nhất mỗi năm một lần để phát hiện sớm bệnh thận do tiểu đường."
            action={<Button onClick={onAdd} icon={<Plus size={16} />}>Ghi kết quả</Button>} />
        ) : (
          <ul className="divide-y divide-border -mx-5">
            {desc.map((p) => (
              <li key={p.id} className="px-5 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted">{fmtDate(p.at)}</div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                    {p.creatinineMgdl !== undefined && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-muted">Creatinine</span>
                        <span className="font-semibold tabular-nums">{p.creatinineMgdl}</span>
                        <span className="text-xs text-muted">mg/dL</span>
                      </span>
                    )}
                    {p.egfr !== undefined && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-muted">eGFR</span>
                        <span className="font-semibold tabular-nums">{p.egfr}</span>
                        <StatusBadge status={egfrStatus(p.egfr, targets)} label={gfrStage(p.egfr)} />
                      </span>
                    )}
                    {p.uacr !== undefined && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-muted">UACR</span>
                        <span className="font-semibold tabular-nums">{p.uacr}</span>
                        <StatusBadge status={uacrStatus(p.uacr, targets)} label={albuminuriaCategory(p.uacr)} />
                      </span>
                    )}
                  </div>
                  {p.note && <p className="mt-1 text-sm text-muted truncate">{p.note}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" aria-label="Sửa" onClick={() => onEdit(p)} icon={<Pencil size={16} />} />
                  <Button variant="ghost" size="sm" aria-label="Xoá" className="text-danger" onClick={() => onDelete(p)} icon={<Trash2 size={16} />} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
