import { useState, type FormEvent } from 'react'
import type { LipidPanel } from '../../types'
import { toDateInput } from '../../lib/dates'
import { Button, Field, Input, Textarea } from '../../components/ui'
import { parseNum, rangeError } from '../body/bodyUtils'
import { CHOL_MGDL_PER_MMOL, TG_MGDL_PER_MMOL, LIPID_KEYS, LIPID_LABEL, type LipidKey } from './lipids'
import { dateInputToIso, isValidDateInput } from './labsUtils'

export type LipidFormValues = Omit<LipidPanel, 'id'>

interface Props {
  initial?: LipidPanel
  onSubmit: (values: LipidFormValues) => void | Promise<void>
  onCancel: () => void
}

type Errors = Partial<Record<LipidKey | 'at' | 'form', string>>

export function LipidForm({ initial, onSubmit, onCancel }: Props) {
  const [at, setAt] = useState(toDateInput(initial?.at ?? new Date()))
  const [vals, setVals] = useState<Record<LipidKey, string>>({
    totalChol: initial?.totalChol?.toString() ?? '',
    ldl: initial?.ldl?.toString() ?? '',
    hdl: initial?.hdl?.toString() ?? '',
    triglycerides: initial?.triglycerides?.toString() ?? '',
  })
  const [note, setNote] = useState(initial?.note ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [mmol, setMmol] = useState('')

  const set = (k: LipidKey) => (v: string) => setVals((s) => ({ ...s, [k]: v }))

  function validate(): Errors {
    const e: Errors = {}
    if (!isValidDateInput(at)) e.at = 'Vui lòng chọn ngày hợp lệ'
    let any = false
    for (const k of LIPID_KEYS) {
      const n = parseNum(vals[k])
      if (n !== undefined) any = true
      e[k] = rangeError(n, 1, 1000, LIPID_LABEL[k], 'mg/dL')
    }
    if (!any) e.form = 'Cần nhập ít nhất một chỉ số'
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
        totalChol: parseNum(vals.totalChol),
        ldl: parseNum(vals.ldl),
        hdl: parseNum(vals.hdl),
        triglycerides: parseNum(vals.triglycerides),
        note: note.trim() || undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const mmolNum = parseNum(mmol)
  const showConv = mmolNum !== undefined && !Number.isNaN(mmolNum) && mmolNum > 0

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Ngày xét nghiệm" error={errors.at}>
        <Input type="date" value={at} onChange={(e) => setAt(e.target.value)} required />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {LIPID_KEYS.map((k, i) => (
          <Field key={k} label={LIPID_LABEL[k]} error={errors[k]}>
            <Input type="number" inputMode="decimal" step="1" min={1} max={1000} suffix="mg/dL" value={vals[k]} onChange={(e) => set(k)(e.target.value)} autoFocus={i === 0} />
          </Field>
        ))}
      </div>
      {errors.form && <p className="text-xs text-danger -mt-2">{errors.form}</p>}
      <div className="rounded-xl bg-surface-2 px-3 py-2.5 text-xs text-muted space-y-2">
        <p>Nhập theo mg/dL. Quy đổi: cholesterol mmol/L × 38,67; triglycerides mmol/L × 88,57.</p>
        <div className="flex flex-wrap items-center gap-2">
          <span>Đổi nhanh:</span>
          <Input type="number" inputMode="decimal" step="0.1" min={0} value={mmol} onChange={(e) => setMmol(e.target.value)} placeholder="mmol/L" className="h-8 max-w-[7.5rem] text-xs" />
          {showConv ? (
            <span className="tabular-nums">
              = <b className="text-fg">{Math.round(mmolNum * CHOL_MGDL_PER_MMOL)}</b> mg/dL (cholesterol) · <b className="text-fg">{Math.round(mmolNum * TG_MGDL_PER_MMOL)}</b> mg/dL (triglycerides)
            </span>
          ) : <span>→ mg/dL</span>}
        </div>
      </div>
      <Field label="Ghi chú">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: nhịn ăn 12h, phòng xét nghiệm..." />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>Huỷ</Button>
        <Button type="submit" disabled={busy}>{initial ? 'Lưu thay đổi' : 'Lưu'}</Button>
      </div>
    </form>
  )
}
