import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts'
import { Pencil, Trash2, FlaskConical, Plus } from 'lucide-react'
import type { LipidPanel, Profile } from '../../types'
import { ldlStatus, hdlStatus, tgStatus, type Status } from '../../lib/calc'
import { fmtDate, fmtShort } from '../../lib/dates'
import { Button, Card, EmptyState, StatTile, StatusBadge } from '../../components/ui'
import { useChartColors, tooltipStyle, AXIS_TICK } from '../../components/charts/theme'
import { fmtNum } from '../body/bodyUtils'
import { totalCholStatus, nonHdl, nonHdlStatus, LIPID_KEYS, LIPID_SHORT, LIPID_LABEL, type LipidKey } from './lipids'

interface Props {
  panels: LipidPanel[]       // sorted ascending
  profile: Profile
  onAdd: () => void
  onEdit: (p: LipidPanel) => void
  onDelete: (p: LipidPanel) => void
}

function statusFor(k: LipidKey, v: number, profile: Profile): Status {
  const t = profile.targets
  switch (k) {
    case 'totalChol': return totalCholStatus(v)
    case 'ldl': return ldlStatus(v, t)
    case 'hdl': return hdlStatus(v, profile.sex, t)
    case 'triglycerides': return tgStatus(v, t)
  }
}

function latestOf(panels: LipidPanel[], k: LipidKey): LipidPanel | undefined {
  for (let i = panels.length - 1; i >= 0; i--) if (panels[i][k] !== undefined) return panels[i]
  return undefined
}

export function LipidsTab({ panels, profile, onAdd, onEdit, onDelete }: Props) {
  const c = useChartColors()
  const t = profile.targets
  const hdlMin = profile.sex === 'female' ? t.hdlMinFemale : t.hdlMinMale
  const desc = [...panels].reverse()

  const tc = latestOf(panels, 'totalChol')
  const ldl = latestOf(panels, 'ldl')
  const hdl = latestOf(panels, 'hdl')
  const tg = latestOf(panels, 'triglycerides')
  const nh = [...panels].reverse().map((p) => ({ p, v: nonHdl(p) })).find((x) => x.v !== undefined)

  const data = panels.map((p) => ({ t: new Date(p.at).getTime(), totalChol: p.totalChol, ldl: p.ldl, hdl: p.hdl, triglycerides: p.triglycerides }))
  const LINE_COLOR: Record<LipidKey, string> = { totalChol: c.muted, ldl: c.danger, hdl: c.ok, triglycerides: c.warn }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatTile label="Cholesterol toàn phần" value={fmtNum(tc?.totalChol, 0)} unit="mg/dL"
          status={tc?.totalChol !== undefined ? totalCholStatus(tc.totalChol) : 'unknown'} hint="Mục tiêu < 200" />
        <StatTile label="LDL-C" value={fmtNum(ldl?.ldl, 0)} unit="mg/dL"
          status={ldl?.ldl !== undefined ? ldlStatus(ldl.ldl, t) : 'unknown'} hint={`Mục tiêu < ${t.ldlMax}`} />
        <StatTile label="HDL-C" value={fmtNum(hdl?.hdl, 0)} unit="mg/dL"
          status={hdl?.hdl !== undefined ? hdlStatus(hdl.hdl, profile.sex, t) : 'unknown'}
          statusLabel={hdl?.hdl !== undefined && hdlStatus(hdl.hdl, profile.sex, t) === 'low' ? 'Thấp (cần tăng)' : undefined} hint={`Mục tiêu > ${hdlMin} (${profile.sex === 'female' ? 'nữ' : 'nam'})`} />
        <StatTile label="Triglycerides" value={fmtNum(tg?.triglycerides, 0)} unit="mg/dL"
          status={tg?.triglycerides !== undefined ? tgStatus(tg.triglycerides, t) : 'unknown'} hint={`Mục tiêu < ${t.tgMax}`} />
        <StatTile label="Non-HDL" value={fmtNum(nh?.v, 0)} unit="mg/dL"
          status={nh?.v !== undefined ? nonHdlStatus(nh.v) : 'unknown'} hint="TC − HDL · mục tiêu < 130" />
      </div>

      <Card title="Diễn biến mỡ máu" subtitle="mg/dL, tất cả các lần xét nghiệm">
        {panels.length >= 2 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={c.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time"
                tickFormatter={(v: number) => fmtShort(new Date(v).toISOString())} tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} minTickGap={32} />
              <YAxis domain={[0, 'auto']} tick={{ ...AXIS_TICK, fill: c.muted }} stroke={c.border} width={44} />
              <Tooltip contentStyle={tooltipStyle(c)}
                labelFormatter={(l) => (typeof l === 'number' ? fmtDate(new Date(l).toISOString()) : String(l))}
                formatter={(v, name) => [`${v ?? ''} mg/dL`, LIPID_LABEL[name as LipidKey] ?? String(name)]} />
              <Legend formatter={(v) => LIPID_SHORT[v as LipidKey] ?? String(v)} wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={t.ldlMax} stroke={c.danger} strokeDasharray="4 4" strokeOpacity={0.7}
                label={{ value: `LDL mục tiêu ${t.ldlMax}`, position: 'insideTopRight', fontSize: 10, fill: c.danger }} />
              {LIPID_KEYS.map((k) => (
                <Line key={k} type="monotone" dataKey={k} stroke={LINE_COLOR[k]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Chưa đủ dữ liệu để vẽ biểu đồ" description="Cần ít nhất 2 lần xét nghiệm." />
        )}
      </Card>

      <Card title="Kết quả xét nghiệm" subtitle={`${panels.length} lần`}>
        {desc.length === 0 ? (
          <EmptyState icon={<FlaskConical size={32} />} title="Chưa có kết quả mỡ máu"
            description="Người bệnh tiểu đường nên kiểm tra mỡ máu ít nhất mỗi năm một lần."
            action={<Button onClick={onAdd} icon={<Plus size={16} />}>Ghi kết quả</Button>} />
        ) : (
          <ul className="divide-y divide-border -mx-5">
            {desc.map((p) => {
              const n = nonHdl(p)
              return (
                <li key={p.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted">{fmtDate(p.at)}</div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                      {LIPID_KEYS.map((k) => {
                        const v = p[k]
                        if (v === undefined) return null
                        return (
                          <span key={k} className="inline-flex items-center gap-1.5">
                            <span className="text-muted">{LIPID_SHORT[k]}</span>
                            <span className="font-semibold tabular-nums">{v}</span>
                            <StatusBadge status={statusFor(k, v, profile)} />
                          </span>
                        )
                      })}
                      {n !== undefined && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-muted">Non-HDL</span>
                          <span className="font-semibold tabular-nums">{n}</span>
                          <StatusBadge status={nonHdlStatus(n)} />
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
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
