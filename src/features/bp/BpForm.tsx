import { useState, type FormEvent } from 'react'
import type { BloodPressureReading, Targets } from '../../types'
import { bpStatus } from '../../lib/calc'
import { toLocalInput, fromLocalInput } from '../../lib/dates'
import { Button, Field, Input, StatusBadge, Textarea } from '../../components/ui'
import { parseNum, rangeError } from '../body/bodyUtils'
import { bpGrade, BP_GRADE_LABEL, BP_GRADE_RANGE, bpGradeStatus } from './classify'

export type BpFormValues = Omit<BloodPressureReading, 'id'>

interface Props {
  initial?: BloodPressureReading
  targets: Targets
  onSubmit: (values: BpFormValues) => void | Promise<void>
  onCancel: () => void
}

interface Errors { at?: string; sys?: string; dia?: string; pulse?: string }

export function BpForm({ initial, targets, onSubmit, onCancel }: Props) {
  const [at, setAt] = useState(toLocalInput(initial?.at ?? new Date()))
  const [sys, setSys] = useState(initial?.systolic?.toString() ?? '')
  const [dia, setDia] = useState(initial?.diastolic?.toString() ?? '')
  const [pulse, setPulse] = useState(initial?.pulse?.toString() ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  const s = parseNum(sys)
  const d = parseNum(dia)
  const valid = s !== undefined && d !== undefined && !Number.isNaN(s) && !Number.isNaN(d) && s > 0 && d > 0
  const grade = valid ? bpGrade(s, d) : undefined

  function validate(): Errors {
    const e: Errors = {}
    if (!at || Number.isNaN(new Date(at).getTime())) e.at = 'Vui lòng chọn thời điểm hợp lệ'
    e.sys = rangeError(s, 60, 250, 'Tâm thu', 'mmHg', true)
    e.dia = rangeError(d, 30, 150, 'Tâm trương', 'mmHg', true)
    if (!e.sys && !e.dia && s !== undefined && d !== undefined && d >= s) e.dia = 'Tâm trương phải nhỏ hơn tâm thu'
    e.pulse = rangeError(parseNum(pulse), 30, 220, 'Nhịp tim', 'lần/phút')
    return e
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.values(e).some(Boolean) || s === undefined || d === undefined) return
    setBusy(true)
    const p = parseNum(pulse)
    try {
      await onSubmit({
        at: fromLocalInput(at),
        systolic: Math.round(s),
        diastolic: Math.round(d),
        pulse: p === undefined ? undefined : Math.round(p),
        note: note.trim() || undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Thời điểm" error={errors.at}>
        <Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} required />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Tâm thu" error={errors.sys}>
          <Input type="number" inputMode="numeric" min={60} max={250} suffix="mmHg" value={sys} onChange={(e) => setSys(e.target.value)} placeholder="VD: 125" autoFocus />
        </Field>
        <Field label="Tâm trương" error={errors.dia}>
          <Input type="number" inputMode="numeric" min={30} max={150} suffix="mmHg" value={dia} onChange={(e) => setDia(e.target.value)} placeholder="VD: 80" />
        </Field>
        <Field label="Nhịp tim (tuỳ chọn)" error={errors.pulse}>
          <Input type="number" inputMode="numeric" min={30} max={220} suffix="lần/phút" value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="VD: 72" />
        </Field>
      </div>
      <div className="rounded-xl bg-surface-2 px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="block text-xs text-muted">Phân loại (ESC/ESH)</span>
          {grade ? (
            <span className="text-sm font-semibold">{BP_GRADE_LABEL[grade]} <span className="text-muted font-normal tabular-nums">({BP_GRADE_RANGE[grade]})</span></span>
          ) : <span className="text-sm text-muted">Nhập tâm thu và tâm trương</span>}
        </div>
        {grade && valid && (
          <div className="flex gap-1.5">
            <StatusBadge status={bpGradeStatus(grade)} label={BP_GRADE_LABEL[grade]} />
            <StatusBadge status={bpStatus(s, d, targets)} />
          </div>
        )}
      </div>
      <Field label="Ghi chú">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: đo buổi sáng, sau khi ngồi nghỉ 5 phút" />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>Huỷ</Button>
        <Button type="submit" disabled={busy}>{initial ? 'Lưu thay đổi' : 'Lưu'}</Button>
      </div>
    </form>
  )
}
