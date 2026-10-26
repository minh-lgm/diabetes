import { useNavigate } from 'react-router-dom'
import { Droplet, Percent, Scale, HeartPulse, FlaskConical, Droplets } from 'lucide-react'
import { StatTile } from '../../components/ui'
import type { Profile } from '../../types'
import type { DashboardData } from './useDashboardData'
import {
  formatGlucose, glucoseUnitLabel, glucoseStatus, hba1cStatus, hba1cToEag,
  bmi, bmiClass, bmiStatus, BMI_CLASS_LABEL, bpStatus, ldlStatus, egfrStatus,
} from '../../lib/calc'
import { fmtDate } from '../../lib/dates'
import { relativeTime } from './relativeTime'
import type { GlucoseContext } from '../../types'

const EMPTY = '—'
const CTX_SHORT: Record<GlucoseContext, string> = {
  fasting: 'Nhịn ăn', before_meal: 'Trước ăn', after_meal: 'Sau ăn', bedtime: 'Trước ngủ', random: 'Bất kỳ',
}

export function KpiGrid({ data, profile }: { data: DashboardData; profile: Profile }) {
  const navigate = useNavigate()
  const t = profile.targets
  const unit = profile.glucoseUnit
  const unitLabel = glucoseUnitLabel(unit)

  const g = data.latestGlucose
  const a = data.latestHba1c
  const b = data.latestBody
  const bp = data.latestBp
  const lp = data.latestLipid
  const kd = data.latestKidney

  const heightCm = b?.heightCm ?? profile.heightCm
  const bmiValue = b?.weightKg !== undefined && heightCm ? bmi(b.weightKg, heightCm) : undefined

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <StatTile
        label={g ? `Đường huyết · ${CTX_SHORT[g.context]}` : 'Đường huyết gần nhất'}
        icon={<Droplet size={16} aria-hidden />}
        value={g ? formatGlucose(g.valueMgdl, unit) : EMPTY}
        unit={g ? unitLabel : undefined}
        status={g ? glucoseStatus(g.valueMgdl, g.context, t) : 'unknown'}
        hint={g ? relativeTime(g.at) : 'Chưa có dữ liệu'}
        onClick={() => navigate('/glucose')}
      />
      <StatTile
        label="HbA1c gần nhất"
        icon={<Percent size={16} aria-hidden />}
        value={a ? a.percent.toFixed(1) : EMPTY}
        unit={a ? '%' : undefined}
        status={a ? hba1cStatus(a.percent, t) : 'unknown'}
        hint={a ? `eAG ${formatGlucose(hba1cToEag(a.percent), unit)} ${unitLabel}` : 'Chưa có dữ liệu'}
        onClick={() => navigate('/hba1c')}
      />
      <StatTile
        label="BMI"
        icon={<Scale size={16} aria-hidden />}
        value={bmiValue !== undefined ? bmiValue.toFixed(1) : b?.weightKg !== undefined ? b.weightKg.toFixed(1) : EMPTY}
        unit={bmiValue !== undefined ? 'kg/m²' : b?.weightKg !== undefined ? 'kg' : undefined}
        status={bmiValue !== undefined ? bmiStatus(bmiValue, t) : 'unknown'}
        hint={bmiValue !== undefined ? BMI_CLASS_LABEL[bmiClass(bmiValue)] : b ? 'Cần nhập chiều cao' : 'Chưa có dữ liệu'}
        onClick={() => navigate('/body')}
      />
      <StatTile
        label="Huyết áp"
        icon={<HeartPulse size={16} aria-hidden />}
        value={bp ? `${bp.systolic}/${bp.diastolic}` : EMPTY}
        unit={bp ? 'mmHg' : undefined}
        status={bp ? bpStatus(bp.systolic, bp.diastolic, t) : 'unknown'}
        hint={bp ? relativeTime(bp.at) : 'Chưa có dữ liệu'}
        onClick={() => navigate('/blood-pressure')}
      />
      <StatTile
        label="LDL-C"
        icon={<FlaskConical size={16} aria-hidden />}
        value={lp?.ldl !== undefined ? Math.round(lp.ldl).toString() : EMPTY}
        unit={lp?.ldl !== undefined ? 'mg/dL' : undefined}
        status={lp?.ldl !== undefined ? ldlStatus(lp.ldl, t) : 'unknown'}
        hint={lp ? fmtDate(lp.at) : 'Chưa có dữ liệu'}
        onClick={() => navigate('/labs')}
      />
      <StatTile
        label="eGFR"
        icon={<Droplets size={16} aria-hidden />}
        value={kd?.egfr !== undefined ? Math.round(kd.egfr).toString() : EMPTY}
        unit={kd?.egfr !== undefined ? 'mL/min' : undefined}
        status={kd?.egfr !== undefined ? egfrStatus(kd.egfr, t) : 'unknown'}
        hint={kd ? fmtDate(kd.at) : 'Chưa có dữ liệu'}
        onClick={() => navigate('/labs')}
      />
    </div>
  )
}
