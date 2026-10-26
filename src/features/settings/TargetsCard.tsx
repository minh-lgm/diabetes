import { useEffect, useState, type FormEvent } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import type { GlucoseUnit, Profile, Targets } from '../../types'
import { saveProfile } from '../../db'
import { DEFAULT_TARGETS } from '../../lib/targets'
import { fromDisplayGlucose, glucoseUnitLabel, toDisplayGlucose } from '../../lib/calc'
import { Button, Card, Field, Input } from '../../components/ui'
import { parseNum, useFlash } from './utils'

type Key = keyof Targets
interface FieldDef { key: Key; label: string; unit: string; glucose?: boolean; step?: string }
interface Group { title: string; fields: FieldDef[] }

const GROUPS: Group[] = [
  { title: 'Đường huyết', fields: [
    { key: 'hypoBelow', label: 'Hạ đường huyết dưới', unit: 'mg/dL', glucose: true },
    { key: 'fastingMin', label: 'Nhịn ăn / trước ăn – tối thiểu', unit: 'mg/dL', glucose: true },
    { key: 'fastingMax', label: 'Nhịn ăn / trước ăn – tối đa', unit: 'mg/dL', glucose: true },
    { key: 'postMealMax', label: 'Sau ăn 1–2h – tối đa', unit: 'mg/dL', glucose: true },
  ] },
  { title: 'HbA1c', fields: [
    { key: 'hba1cMax', label: 'HbA1c tối đa', unit: '%', step: '0.1' },
  ] },
  { title: 'Cơ thể', fields: [
    { key: 'bmiMin', label: 'BMI tối thiểu', unit: 'kg/m²', step: '0.1' },
    { key: 'bmiMax', label: 'BMI tối đa', unit: 'kg/m²', step: '0.1' },
    { key: 'waistMaxMale', label: 'Vòng eo tối đa (nam)', unit: 'cm' },
    { key: 'waistMaxFemale', label: 'Vòng eo tối đa (nữ)', unit: 'cm' },
  ] },
  { title: 'Huyết áp', fields: [
    { key: 'bpSysMax', label: 'Tâm thu tối đa', unit: 'mmHg' },
    { key: 'bpDiaMax', label: 'Tâm trương tối đa', unit: 'mmHg' },
  ] },
  { title: 'Mỡ máu', fields: [
    { key: 'ldlMax', label: 'LDL-C tối đa', unit: 'mg/dL' },
    { key: 'hdlMinMale', label: 'HDL-C tối thiểu (nam)', unit: 'mg/dL' },
    { key: 'hdlMinFemale', label: 'HDL-C tối thiểu (nữ)', unit: 'mg/dL' },
    { key: 'tgMax', label: 'Triglycerides tối đa', unit: 'mg/dL' },
  ] },
  { title: 'Thận', fields: [
    { key: 'egfrMin', label: 'eGFR tối thiểu', unit: 'mL/phút/1,73m²' },
    { key: 'uacrMax', label: 'UACR tối đa', unit: 'mg/g' },
  ] },
  { title: 'Tuyến giáp', fields: [
    { key: 'tshMin', label: 'TSH tối thiểu', unit: 'mIU/L', step: '0.01' },
    { key: 'tshMax', label: 'TSH tối đa', unit: 'mIU/L', step: '0.01' },
  ] },
]
const ALL_FIELDS = GROUPS.flatMap((g) => g.fields)

type Form = Record<Key, string>
type Errors = Partial<Record<Key | 'form', string>>

function display(def: FieldDef, v: number, unit: GlucoseUnit): string {
  if (def.glucose) return unit === 'mmol' ? toDisplayGlucose(v, unit).toFixed(1) : Math.round(v).toString()
  return String(v)
}
function toForm(t: Targets, unit: GlucoseUnit): Form {
  const f = {} as Form
  for (const d of ALL_FIELDS) f[d.key] = display(d, t[d.key], unit)
  return f
}

export function TargetsCard({ profile }: { profile: Profile }) {
  const unit = profile.glucoseUnit
  const [form, setForm] = useState<Form>(() => toForm(profile.targets, unit))
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [saved, flash] = useFlash()

  useEffect(() => { if (!dirty) setForm(toForm(profile.targets, unit)) }, [profile.targets, unit, dirty])

  function update(k: Key, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
    setDirty(true)
  }

  function parse(): { targets?: Targets; errors: Errors } {
    const e: Errors = {}
    const t = { ...profile.targets }
    for (const d of ALL_FIELDS) {
      const n = parseNum(form[d.key])
      if (n === undefined || Number.isNaN(n) || n <= 0) { e[d.key] = 'Nhập số dương'; continue }
      t[d.key] = d.glucose ? Math.round(fromDisplayGlucose(n, unit) * 10) / 10 : n
    }
    if (!Object.keys(e).length) {
      if (t.hypoBelow >= t.fastingMin) e.form = 'Ngưỡng hạ đường huyết phải nhỏ hơn mức tối thiểu khi nhịn ăn'
      else if (t.fastingMin >= t.fastingMax) e.form = 'Mức tối thiểu khi nhịn ăn phải nhỏ hơn mức tối đa'
      else if (t.bmiMin >= t.bmiMax) e.form = 'BMI tối thiểu phải nhỏ hơn BMI tối đa'
      else if (t.bpDiaMax >= t.bpSysMax) e.form = 'Tâm trương tối đa phải nhỏ hơn tâm thu tối đa'
      else if (t.tshMin >= t.tshMax) e.form = 'TSH tối thiểu phải nhỏ hơn TSH tối đa'
    }
    return { targets: Object.keys(e).length ? undefined : t, errors: e }
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    const { targets, errors: e } = parse()
    setErrors(e)
    if (!targets) return
    await saveProfile({ targets })
    setDirty(false)
    flash()
  }

  async function restoreDefaults() {
    await saveProfile({ targets: DEFAULT_TARGETS })
    setForm(toForm(DEFAULT_TARGETS, unit))
    setErrors({})
    setDirty(false)
    flash()
  }

  return (
    <Card title="Ngưỡng mục tiêu" subtitle="Ngưỡng mặc định theo ADA Standards of Care; hãy điều chỉnh theo chỉ định của bác sĩ.">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {GROUPS.map((g) => (
          <fieldset key={g.title}>
            <legend className="text-sm font-semibold mb-2">{g.title}</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {g.fields.map((d) => {
                const u = d.glucose ? glucoseUnitLabel(unit) : d.unit
                const def = display(d, DEFAULT_TARGETS[d.key], unit)
                return (
                  <Field key={d.key} label={d.label} error={errors[d.key]} hint={`Mặc định: ${def} ${u}`}>
                    <Input type="number" inputMode="decimal" step={d.glucose && unit === 'mmol' ? '0.1' : d.step ?? '1'} min={0}
                      suffix={u} value={form[d.key]} onChange={(e) => update(d.key, e.target.value)} />
                  </Field>
                )
              })}
            </div>
          </fieldset>
        ))}
        {errors.form && <p className="text-sm text-danger">{errors.form}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!dirty}>Lưu ngưỡng</Button>
          <Button type="button" variant="secondary" icon={<RotateCcw size={16} />} onClick={restoreDefaults}>Khôi phục mặc định</Button>
          {saved && <span className="inline-flex items-center gap-1 text-sm text-ok"><Check size={16} /> Đã lưu</span>}
        </div>
      </form>
    </Card>
  )
}
