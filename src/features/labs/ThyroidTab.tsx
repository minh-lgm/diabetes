import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ReferenceLine, ResponsiveContainer, Legend } from 'recharts'
import { Pencil, Trash2, Activity, Plus } from 'lucide-react'
import type { ThyroidPanel, Targets } from '../../types'
import { tshStatus, ft4Status, FT4_MIN, FT4_MAX } from '../../lib/calc'
import { fmtDate, timeTickFormatter } from '../../lib/dates'
import { Button, Card, EmptyState, StatTile, StatusBadge } from '../../components/ui'
import { useChartColors, tooltipStyle, AXIS_TICK } from '../../components/charts/theme'
import { fmtNum } from '../body/bodyUtils'
import { THYROID_LABEL, THYROID_UNIT, tshInterpretation, ft4Interpretation, type ThyroidKey } from './thyroid'

interface Props {
  panels: ThyroidPanel[]      // sorted ascending
  targets: Targets
  onAdd: () => void
  onEdit: (p: ThyroidPanel) => void
  onDelete: (p: ThyroidPanel) => void
}

function latestOf(panels: ThyroidPanel[], k: ThyroidKey): ThyroidPanel | undefined {
  for (let i = panels.length - 1; i >= 0; i--) if (panels[i][k] !== undefined) return panels[i]
  return undefined
}

export function ThyroidTab({ panels, targets, onAdd, onEdit, onDelete }: Props) {
  const c = useChartColors()
  const desc = [...panels].reverse()
  const lastTsh = latestOf(panels, 'tsh')
  const lastFt4 = latestOf(panels, 'ft4')
  const tsh = lastTsh?.tsh
  const ft4 = lastFt4?.ft4
  const prevTsh = (() => {
    const withTsh = panels.filter((p) => p.tsh !== undefined)
    return withTsh.length >= 2 ? withTsh[withTsh.length - 2].tsh : undefined
  })()

  const data = panels.map((p) => ({ t: new Date(p.at).getTime(), tsh: p.tsh, ft4: p.ft4 }))
  const tickX = timeTickFormatter(data.map((d) => d.t))
  const hasTsh = data.some((d) => d.tsh !== undefined)
  const hasFt4 = data.some((d) => d.ft4 !== undefined)
  const tshMaxY = Math.max(targets.tshMax + 1, ...data.map((d) => d.tsh ?? 0)) * 1.1

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile label="TSH gần nhất" value={fmtNum(tsh, 2)} unit="mIU/L"
          status={tsh !== undefined ? tshStatus(tsh, targets) : 'unknown'}
          hint={tsh !== undefined ? tshInterpretation(tsh, targets) : `Tham chiếu ${targets.tshMin}–${targets.tshMax}`} />
        <StatTile label="FT4 gần nhất" value={fmtNum(ft4, 2)} unit="ng/dL"
          status={ft4 !== undefined ? ft4Status(ft4) : 'unknown'}
          hint={ft4 !== undefined ? ft4Interpretation(ft4) : `Tham chiếu ${FT4_MIN}–${FT4_MAX}`} />
        <StatTile label="Thay đổi TSH" value={tsh !== undefined && prevTsh !== undefined ? `${tsh - prevTsh >= 0 ? '+' : ''}${fmtNum(tsh - prevTsh, 2)}` : '—'} unit={tsh !== undefined && prevTsh !== undefined ? 'mIU/L' : undefined}
          status="unknown" statusLabel={lastTsh ? fmtDate(lastTsh.at) : undefined}
          hint={prevTsh !== undefined ? `So với lần trước ${fmtNum(prevTsh, 2)}` : 'Chưa có lần trước'} />
      </div>

      <Card title="Diễn biến tuyến giáp" subtitle="TSH (trục trái) và FT4 (trục phải) · vùng xanh là khoảng tham chiếu TSH">
        {panels.length >= 2 && (hasTsh || hasFt4) ? (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={c.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time"
                tickFormatter={tickX} tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} minTickGap={32} />
              <YAxis yAxisId="tsh" domain={[0, Math.ceil(tshMaxY)]} tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} width={44} />
              {hasFt4 && <YAxis yAxisId="ft4" orientation="right" domain={[0, 3]} tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} width={40} />}
              <Tooltip contentStyle={tooltipStyle(c)}
                labelFormatter={(l) => (typeof l === 'number' ? fmtDate(new Date(l).toISOString()) : String(l))}
                formatter={(v, name) => { const k = name as ThyroidKey; return [`${v ?? ''} ${THYROID_UNIT[k] ?? ''}`, THYROID_LABEL[k] ?? String(name)] }} />
              <Legend formatter={(v) => THYROID_LABEL[v as ThyroidKey] ?? String(v)} wrapperStyle={{ fontSize: 12 }} />
              <ReferenceArea yAxisId="tsh" y1={targets.tshMin} y2={targets.tshMax} fill={c.ok} fillOpacity={0.1} stroke="none" />
              <ReferenceLine yAxisId="tsh" y={10} stroke={c.danger} strokeDasharray="4 4" strokeOpacity={0.6}
                label={{ value: 'TSH 10', position: 'insideTopLeft', fontSize: 10, fill: c.danger }} />
              {hasTsh && <Line yAxisId="tsh" type="monotone" dataKey="tsh" stroke={c.primary} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />}
              {hasFt4 && <Line yAxisId="ft4" type="monotone" dataKey="ft4" stroke={c.info} strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Chưa đủ dữ liệu để vẽ biểu đồ" description="Cần ít nhất 2 lần xét nghiệm có TSH hoặc FT4." />
        )}
      </Card>

      <Card title="Kết quả xét nghiệm" subtitle={`${panels.length} lần`}>
        {desc.length === 0 ? (
          <EmptyState icon={<Activity size={32} />} title="Chưa có kết quả tuyến giáp"
            description="Người tiểu đường type 1 và người dùng một số thuốc nên kiểm tra TSH định kỳ theo chỉ định của bác sĩ."
            action={<Button onClick={onAdd} icon={<Plus size={16} />}>Ghi kết quả</Button>} />
        ) : (
          <ul className="divide-y divide-border -mx-5">
            {desc.map((p) => (
              <li key={p.id} className="px-5 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted">{fmtDate(p.at)}</div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                    {p.tsh !== undefined && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-muted">TSH</span>
                        <span className="font-semibold tabular-nums">{p.tsh}</span>
                        <span className="text-xs text-muted">mIU/L</span>
                        <StatusBadge status={tshStatus(p.tsh, targets)} />
                      </span>
                    )}
                    {p.ft4 !== undefined && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-muted">FT4</span>
                        <span className="font-semibold tabular-nums">{p.ft4}</span>
                        <span className="text-xs text-muted">ng/dL</span>
                        <StatusBadge status={ft4Status(p.ft4)} />
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

      <p className="text-xs text-muted">
        TSH là hormone kích thích tuyến giáp; TSH cao thường gặp khi tuyến giáp hoạt động kém (suy giáp), TSH thấp khi hoạt động quá mức (cường giáp).
        Khoảng tham chiếu thay đổi theo phòng xét nghiệm, tuổi và thai kỳ; hãy đối chiếu với giấy kết quả và ý kiến bác sĩ.
      </p>
    </div>
  )
}
