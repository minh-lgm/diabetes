import { useEffect, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import type { DiabetesType, Profile, Sex } from '../../types'
import { saveProfile } from '../../db'
import { DIABETES_TYPE_LABEL, SEX_LABEL } from '../../lib/labels'
import { Button, Card, Field, Input, Select } from '../../components/ui'
import { parseNum, useFlash } from './utils'

interface Form { name: string; birthYear: string; sex: Sex | ''; diabetesType: DiabetesType | ''; heightCm: string }
interface Errors { birthYear?: string; heightCm?: string }

function fromProfile(p: Profile): Form {
  return {
    name: p.name ?? '',
    birthYear: p.birthYear?.toString() ?? '',
    sex: p.sex ?? '',
    diabetesType: p.diabetesType ?? '',
    heightCm: p.heightCm?.toString() ?? '',
  }
}

const SEXES = Object.keys(SEX_LABEL) as Sex[]
const TYPES = Object.keys(DIABETES_TYPE_LABEL) as DiabetesType[]

export function ProfileCard({ profile }: { profile: Profile }) {
  const [form, setForm] = useState<Form>(() => fromProfile(profile))
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [saved, flash] = useFlash()

  // Re-sync from DB when it changes and the user has no pending edits
  useEffect(() => { if (!dirty) setForm(fromProfile(profile)) }, [profile, dirty])

  function update<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    setDirty(true)
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    const e: Errors = {}
    const year = parseNum(form.birthYear)
    const thisYear = new Date().getFullYear()
    if (year !== undefined && (Number.isNaN(year) || !Number.isInteger(year) || year < 1900 || year > thisYear)) e.birthYear = `Năm sinh phải từ 1900 đến ${thisYear}`
    const h = parseNum(form.heightCm)
    if (h !== undefined && (Number.isNaN(h) || h < 100 || h > 250)) e.heightCm = 'Chiều cao phải từ 100 đến 250 cm'
    setErrors(e)
    if (Object.values(e).some(Boolean)) return
    await saveProfile({
      name: form.name.trim() || undefined,
      birthYear: year,
      sex: form.sex || undefined,
      diabetesType: form.diabetesType || undefined,
      heightCm: h,
    })
    setDirty(false)
    flash()
  }

  return (
    <Card title="Hồ sơ" subtitle="Thông tin dùng để tính BMI, mục tiêu vòng eo và HDL theo giới">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Họ tên">
            <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="VD: Nguyễn Văn A" autoComplete="name" />
          </Field>
          <Field label="Năm sinh" error={errors.birthYear}>
            <Input type="number" inputMode="numeric" min={1900} max={new Date().getFullYear()} value={form.birthYear} onChange={(e) => update('birthYear', e.target.value)} placeholder="VD: 1975" />
          </Field>
          <Field label="Giới tính">
            <Select value={form.sex} onChange={(e) => update('sex', e.target.value as Sex | '')}>
              <option value="">— Chọn —</option>
              {SEXES.map((s) => <option key={s} value={s}>{SEX_LABEL[s]}</option>)}
            </Select>
          </Field>
          <Field label="Loại tiểu đường">
            <Select value={form.diabetesType} onChange={(e) => update('diabetesType', e.target.value as DiabetesType | '')}>
              <option value="">— Chọn —</option>
              {TYPES.map((t) => <option key={t} value={t}>{DIABETES_TYPE_LABEL[t]}</option>)}
            </Select>
          </Field>
          <Field label="Chiều cao" error={errors.heightCm} hint="Dùng để tính BMI">
            <Input type="number" inputMode="decimal" step="0.5" min={100} max={250} suffix="cm" value={form.heightCm} onChange={(e) => update('heightCm', e.target.value)} placeholder="VD: 165" />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!dirty}>Lưu hồ sơ</Button>
          {saved && <span className="inline-flex items-center gap-1 text-sm text-ok"><Check size={16} /> Đã lưu</span>}
        </div>
      </form>
    </Card>
  )
}
