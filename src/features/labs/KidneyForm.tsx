import { useState, type FormEvent } from 'react'
import type { KidneyPanel } from '../../types'
import { toDateInput } from '../../lib/dates'
import { Button, Field, Input, Textarea } from '../../components/ui'
import { parseNum, rangeError } from '../body/bodyUtils'
import { gfrStage, GFR_STAGE_LABEL, albuminuriaCategory, ALBUMINURIA_LABEL, KIDNEY_LABEL, KIDNEY_UNIT } from './kidney'
import { dateInputToIso, isValidDateInput } from './labsUtils'

export type KidneyFormValues = Omit<KidneyPanel, 'id'>

interface Props {
  initial?: KidneyPanel
  onSubmit: (values: KidneyFormValues) => void | Promise<void>
  onCancel: () => void
}

interface Errors { at?: string; creatinineMgdl?: string; egfr?: string; uacr?: string; form?: string }

export function KidneyForm({ initial, onSubmit, onCancel }: Props) {
  const [at, setAt] = useState(toDateInput(initial?.at ?? new Date()))
  const [creat, setCreat] = useState(initial?.creatinineMgdl?.toString() ?? '')
  const [egfr, setEgfr] = useState(initial?.egfr?.toString() ?? '')
  const [uacr, setUacr] = useState(initial?.uacr?.toString() ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  const c = parseNum(creat)
  const g = parseNum(egfr)
  const u = parseNum(uacr)

  function validate(): Errors {
    const e: Errors = {}
    if (!isValidDateInput(at)) e.at = 'Vui lòng chọn ngày hợp lệ'
    e.creatinineMgdl = rangeError(c, 0.1, 20, KIDNEY_LABEL.creatinineMgdl, KIDNEY_UNIT.creatinineMgdl)
    e.egfr = rangeError(g, 1, 200, KIDNEY_LABEL.egfr, KIDNEY_UNIT.egfr)
    e.uacr = rangeError(u, 0, 5000, KIDNEY_LABEL.uacr, KIDNEY_UNIT.uacr)
    if (c === undefined && g === undefined && u === undefined) e.form = 'Cần nhập ít nhất một chỉ số'
    return e
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.values(e).some(Boolean)) return
    setBusy(true)
    try {
      await onSubmit({ at: dateInputToIso(at, initial?.at), creatinineMgdl: c, egfr: g, uacr: u, note: note.trim() || undefined })
    } finally {
      setBusy(false)
    }
  }

  const gValid = g !== undefined && !Number.isNaN(g) && g > 0
  const uValid = u !== undefined && !Number.isNaN(u) && u >= 0

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Ngày xét nghiệm" error={errors.at}>
        <Input type="date" value={at} onChange={(e) => setAt(e.target.value)} required />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Creatinine" error={errors.creatinineMgdl}>
          <Input type="number" inputMode="decimal" step="0.01" min={0.1} max={20} suffix="mg/dL" value={creat} onChange={(e) => setCreat(e.target.value)} placeholder="VD: 0.95" autoFocus />
        </Field>
        <Field label="eGFR" error={errors.egfr}>
          <Input type="number" inputMode="decimal" step="1" min={1} max={200} suffix="mL/phút" value={egfr} onChange={(e) => setEgfr(e.target.value)} placeholder="VD: 88" />
        </Field>
        <Field label="UACR" error={errors.uacr}>
          <Input type="number" inputMode="decimal" step="0.1" min={0} max={5000} suffix="mg/g" value={uacr} onChange={(e) => setUacr(e.target.value)} placeholder="VD: 18" />
        </Field>
      </div>
      {errors.form && <p className="text-xs text-danger -mt-2">{errors.form}</p>}
      {(gValid || uValid) && (
        <div className="rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted space-y-1">
          <span className="block font-medium text-fg">Phân giai đoạn KDIGO</span>
          {gValid && <p>eGFR: {GFR_STAGE_LABEL[gfrStage(g)]}</p>}
          {uValid && <p>Albumin niệu: {ALBUMINURIA_LABEL[albuminuriaCategory(u)]}</p>}
        </div>
      )}
      <Field label="Ghi chú">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: xét nghiệm định kỳ 6 tháng" />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>Huỷ</Button>
        <Button type="submit" disabled={busy}>{initial ? 'Lưu thay đổi' : 'Lưu'}</Button>
      </div>
    </form>
  )
}
