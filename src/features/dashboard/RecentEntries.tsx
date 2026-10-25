import { Link } from 'react-router-dom'
import { Droplet, Percent, Scale, HeartPulse, FlaskConical, Droplets, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Profile } from '../../types'
import type { DashboardData } from './useDashboardData'
import type { Status } from '../../lib/calc'
import {
  formatGlucose, glucoseUnitLabel, glucoseStatus, hba1cStatus, bmi, bmiStatus, bpStatus, ldlStatus, egfrStatus,
} from '../../lib/calc'
import { GLUCOSE_CONTEXT_LABEL } from '../../lib/labels'
import { fmtDateTime } from '../../lib/dates'
import { StatusBadge, EmptyState } from '../../components/ui'

interface Entry {
  key: string
  at: string
  icon: LucideIcon
  label: string
  value: string
  unit?: string
  status: Status
  to: string
}

function buildEntries(data: DashboardData, profile: Profile): Entry[] {
  const t = profile.targets
  const unit = profile.glucoseUnit
  const unitLabel = glucoseUnitLabel(unit)
  const { glucose, hba1c, body, bp, lipids, kidney } = data.recent
  const out: Entry[] = []

  for (const g of glucose) out.push({
    key: `g-${g.id}`, at: g.at, icon: Droplet, label: `Đường huyết · ${GLUCOSE_CONTEXT_LABEL[g.context]}`,
    value: formatGlucose(g.valueMgdl, unit), unit: unitLabel, status: glucoseStatus(g.valueMgdl, g.context, t), to: '/glucose',
  })
  for (const a of hba1c) out.push({
    key: `a-${a.id}`, at: a.at, icon: Percent, label: 'HbA1c',
    value: a.percent.toFixed(1), unit: '%', status: hba1cStatus(a.percent, t), to: '/hba1c',
  })
  for (const b of body) {
    const h = b.heightCm ?? profile.heightCm
    const bmiV = b.weightKg !== undefined && h ? bmi(b.weightKg, h) : undefined
    const value = b.weightKg !== undefined ? b.weightKg.toFixed(1) : b.waistCm !== undefined ? String(b.waistCm) : '—'
    const unitTxt = b.weightKg !== undefined ? 'kg' : b.waistCm !== undefined ? 'cm' : undefined
    out.push({
      key: `b-${b.id}`, at: b.at, icon: Scale,
      label: b.weightKg !== undefined ? (bmiV !== undefined ? `Cân nặng · BMI ${bmiV.toFixed(1)}` : 'Cân nặng') : 'Vòng eo',
      value, unit: unitTxt, status: bmiV !== undefined ? bmiStatus(bmiV, t) : 'unknown', to: '/body',
    })
  }
  for (const p of bp) out.push({
    key: `p-${p.id}`, at: p.at, icon: HeartPulse, label: 'Huyết áp',
    value: `${p.systolic}/${p.diastolic}`, unit: 'mmHg', status: bpStatus(p.systolic, p.diastolic, t), to: '/blood-pressure',
  })
  for (const l of lipids) out.push({
    key: `l-${l.id}`, at: l.at, icon: FlaskConical,
    label: l.ldl !== undefined ? 'Mỡ máu · LDL-C' : 'Mỡ máu',
    value: l.ldl !== undefined ? String(Math.round(l.ldl)) : l.totalChol !== undefined ? String(Math.round(l.totalChol)) : '—',
    unit: 'mg/dL', status: l.ldl !== undefined ? ldlStatus(l.ldl, t) : 'unknown', to: '/labs',
  })
  for (const k of kidney) out.push({
    key: `k-${k.id}`, at: k.at, icon: Droplets,
    label: k.egfr !== undefined ? 'Chức năng thận · eGFR' : 'Chức năng thận',
    value: k.egfr !== undefined ? String(Math.round(k.egfr)) : k.creatinineMgdl !== undefined ? k.creatinineMgdl.toFixed(2) : '—',
    unit: k.egfr !== undefined ? 'mL/min' : k.creatinineMgdl !== undefined ? 'mg/dL' : undefined,
    status: k.egfr !== undefined ? egfrStatus(k.egfr, t) : 'unknown', to: '/labs',
  })

  return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8)
}

export function RecentEntries({ data, profile }: { data: DashboardData; profile: Profile }) {
  const entries = buildEntries(data, profile)
  if (!entries.length) return <EmptyState title="Chưa có bản ghi nào" />
  return (
    <ul className="divide-y divide-border -mx-5">
      {entries.map((e) => {
        const Icon = e.icon
        return (
          <li key={e.key}>
            <Link to={e.to} className="flex items-center gap-3 px-5 min-h-[56px] py-2 hover:bg-surface-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted"><Icon size={16} aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{e.label}</span>
                <span className="block text-xs text-muted">{fmtDateTime(e.at)}</span>
              </span>
              <span className="text-right shrink-0">
                <span className="block text-base font-semibold tabular-nums leading-tight">
                  {e.value}{e.unit && <span className="ml-1 text-xs font-normal text-muted">{e.unit}</span>}
                </span>
                <StatusBadge status={e.status} className="mt-0.5" />
              </span>
              <ChevronRight size={16} className="text-muted shrink-0" aria-hidden />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
