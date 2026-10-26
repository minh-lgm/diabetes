import { useState, type FormEvent } from 'react'
import type { ThyroidPanel, Targets } from '../../types'
import { toDateInput } from '../../lib/dates'
import { Button, Field, Input, Textarea } from '../../components/ui'
import { parseNum, rangeError } from '../body/bodyUtils'
import { THYROID_LABEL, THYROID_UNIT, thyroidPattern } from './thyroid'
import { dateInputToIso, isValidDateInput } from './labsUtils'

export type ThyroidFormValues = Omit<ThyroidPanel, 'id'>

interface Props {
  initial?: ThyroidPanel
  targets: Targets
  onSubmit: (values: ThyroidFormValues) => void | Promise<void>
  onCancel: () => void
}

interface Errors { at?: string; tsh?: string; ft4?: string; form?: string }

export function ThyroidForm({ initial, targets, onSubmit, onCancel }: Props) {
  const [at, setAt] = useState(toDateInput(initial?.at ?? new Date()))
  const [tsh, setTsh] = useState(initial?.tsh?.toString() ?? '')
  const [ft4, setFt4] = useState(initial?.ft4?.toString() ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  const s = parseNum(tsh)
  const f = parseNum(ft4)

  function validate(): Errors {
    const e: Errors = {}
    if (!isValidDateInput(at)) e.at = 'Vui lòng chọn ngày hợp lệ'
    e.tsh = rangeError(s, 0.01, 200, THYROID_LABEL.tsh, THYROID_UNIT.tsh)
    e.ft4 = rangeError(f, 0.1, 10, THYROID_LABEL.ft4, THYROID_UNIT.ft4)
    if (s === undefined && f === undefined) e.form = 'Cần nhập ít nhất một chỉ số'
    return e
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.values(e).some(Boolean)) return
    setBusy(true)
    try {
      await onSubmit({ at: dateInputToIso(at, initial?.at), tsh: s, ft4: f, note: note.trim() || undefined })
    } finally {
      setBusy(false)
    }
  }

  const sValid = s !== undefined && !Number.isNaN(s) && s > 0
  const fValid = f !== undefined && !Number.isNaN(f) && f > 0
  const pattern = sValid ? thyroidPattern(s, fValid ? f : undefined, targets) : undefined

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Ngày xét nghiệm" error={errors.at}>
        <Input type="date" value={at} onChange={(e) => setAt(e.target.value)} required />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="TSH" error={errors.tsh} hint={`Tham chiếu ${targets.tshMin}–${targets.tshMax} mIU/L`}>
          <Input type="number" inputMode="decimal" step="0.01" min={0.01} max={200} suffix="mIU/L" value={tsh} onChange={(e) => setTsh(e.target.value)} placeholder="VD: 2.5" autoFocus />
        </Field>
        <Field label="FT4 (T4 tự do)" error={errors.ft4} hint="Tham chiếu 0,8–1,8 ng/dL · tuỳ chọn">
          <Input type="number" inputMode="decimal" step="0.01" min={0.1} max={10} suffix="ng/dL" value={ft4} onChange={(e) => setFt4(e.target.value)} placeholder="VD: 1.2" />
        </Field>
      </div>
      {errors.form && <p className="text-xs text-danger -mt-2">{errors.form}</p>}
      {pattern && (
        <div className="rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted">
          <span className="block font-medium text-fg">Nhận định sơ bộ</span>
          <p>{pattern}</p>
        </div>
      )}
      <Field label="Ghi chú">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: đang dùng levothyroxine 50 mcg" />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>Huỷ</Button>
        <Button type="submit" disabled={busy}>{initial ? 'Lưu thay đổi' : 'Lưu'}</Button>
      </div>
    </form>
  )
}
