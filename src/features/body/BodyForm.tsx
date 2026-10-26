import { useState, type FormEvent } from 'react'
import type { BodyMetric, Profile } from '../../types'
import { bmi, bmiClass, BMI_CLASS_LABEL, bmiStatus } from '../../lib/calc'
import { toDateInput } from '../../lib/dates'
import { dateInputToIso, isValidDateInput } from '../labs/labsUtils'
import { Button, Field, Input, StatusBadge, Textarea } from '../../components/ui'
import { parseNum, rangeError } from './bodyUtils'

export type BodyFormValues = Omit<BodyMetric, 'id'>

interface Props {
  initial?: BodyMetric
  profile: Profile
  onSubmit: (values: BodyFormValues) => void | Promise<void>
  onCancel: () => void
}

interface Errors { at?: string; weight?: string; height?: string; waist?: string }

export function BodyForm({ initial, profile, onSubmit, onCancel }: Props) {
  const [at, setAt] = useState(toDateInput(initial?.at ?? new Date()))
  const [weight, setWeight] = useState(initial?.weightKg?.toString() ?? '')
  const [height, setHeight] = useState((initial?.heightCm ?? profile.heightCm)?.toString() ?? '')
  const [waist, setWaist] = useState(initial?.waistCm?.toString() ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  const w = parseNum(weight)
  const h = parseNum(height)
  const previewBmi = w && h && w > 0 && h > 0 ? bmi(w, h) : undefined

  function validate(): Errors {
    const e: Errors = {}
    if (!isValidDateInput(at)) e.at = 'Vui lòng chọn ngày hợp lệ'
    e.weight = rangeError(w, 20, 300, 'Cân nặng', 'kg', true)
    e.height = rangeError(h, 100, 250, 'Chiều cao', 'cm')
    e.waist = rangeError(parseNum(waist), 40, 200, 'Vòng eo', 'cm')
    return e
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.values(e).some(Boolean)) return
    setBusy(true)
    try {
      await onSubmit({
        at: dateInputToIso(at, initial?.at),
        weightKg: w,
        heightCm: h,
        waistCm: parseNum(waist),
        note: note.trim() || undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Ngày" error={errors.at}>
        <Input type="date" value={at} onChange={(e) => setAt(e.target.value)} required />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Cân nặng" error={errors.weight}>
          <Input type="number" inputMode="decimal" step="0.1" min={20} max={300} suffix="kg" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="VD: 68.5" autoFocus />
        </Field>
        <Field label="Chiều cao (tuỳ chọn)" error={errors.height} hint={!profile.heightCm ? 'Sẽ được lưu vào hồ sơ của bạn' : undefined}>
          <Input type="number" inputMode="decimal" step="0.5" min={100} max={250} suffix="cm" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="VD: 165" />
        </Field>
        <Field label="Vòng eo (tuỳ chọn)" error={errors.waist}>
          <Input type="number" inputMode="decimal" step="0.5" min={40} max={200} suffix="cm" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="VD: 85" />
        </Field>
        <div className="rounded-xl bg-surface-2 px-3 py-2 flex flex-col justify-center">
          <span className="text-xs text-muted">BMI dự tính</span>
          {previewBmi !== undefined ? (
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xl font-bold tabular-nums">{previewBmi.toFixed(1)}</span>
              <StatusBadge status={bmiStatus(previewBmi, profile.targets)} label={BMI_CLASS_LABEL[bmiClass(previewBmi)]} />
            </div>
          ) : (
            <span className="text-sm text-muted mt-0.5">Nhập cân nặng và chiều cao</span>
          )}
        </div>
      </div>
      <Field label="Ghi chú">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: cân buổi sáng, trước ăn" />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>Huỷ</Button>
        <Button type="submit" disabled={busy}>{initial ? 'Lưu thay đổi' : 'Lưu'}</Button>
      </div>
    </form>
  )
}
