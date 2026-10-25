import { useState, type FormEvent } from 'react'
import { db } from '../../db'
import type { HbA1cReading, Profile } from '../../types'
import { Button, Field, Input, Modal, StatusBadge, Textarea } from '../../components/ui'
import { formatGlucose, glucoseUnitLabel, hba1cStatus, hba1cToEag, hba1cToIfcc } from '../../lib/calc'
import { fromLocalInput, toDateInput } from '../../lib/dates'

const MIN_PERCENT = 3
const MAX_PERCENT = 20
const FORM_ID = 'hba1c-form'

export interface HbA1cFormProps {
  open: boolean
  onClose: () => void
  profile: Profile
  initial?: HbA1cReading | null
}

export function HbA1cForm({ open, onClose, profile, initial }: HbA1cFormProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Sửa kết quả HbA1c' : 'Ghi kết quả HbA1c'}
      footer={<>
        <Button variant="secondary" type="button" onClick={onClose}>Huỷ</Button>
        <Button type="submit" form={FORM_ID}>Lưu</Button>
      </>}
    >
      {open && <HbA1cFormBody profile={profile} initial={initial ?? null} onDone={onClose} />}
    </Modal>
  )
}

function HbA1cFormBody({ profile, initial, onDone }: { profile: Profile; initial: HbA1cReading | null; onDone: () => void }) {
  const unit = profile.glucoseUnit
  const [date, setDate] = useState(() => toDateInput(initial?.at ?? new Date()))
  const [percent, setPercent] = useState(() => (initial ? initial.percent.toFixed(1) : ''))
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const parsed = percent.trim() === '' ? NaN : Number(percent.replace(',', '.'))
  const valid = Number.isFinite(parsed) && parsed >= MIN_PERCENT && parsed <= MAX_PERCENT

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!date) { setError('Vui lòng chọn ngày xét nghiệm.'); return }
    if (!Number.isFinite(parsed)) { setError('Vui lòng nhập kết quả HbA1c.'); return }
    if (!valid) { setError(`HbA1c phải trong khoảng ${MIN_PERCENT}–${MAX_PERCENT}%.`); return }

    // Keep the original time of day when the date is unchanged; otherwise 09:00 local.
    const at = initial && toDateInput(initial.at) === date ? initial.at : fromLocalInput(`${date}T09:00`)
    if (new Date(at).getTime() > Date.now() + DAY_MS) { setError('Ngày xét nghiệm không được ở tương lai.'); return }

    const record: Omit<HbA1cReading, 'id'> = { at, percent: Math.round(parsed * 10) / 10, note: note.trim() || undefined }
    setSaving(true)
    try {
      if (initial?.id !== undefined) await db.hba1c.update(initial.id, record)
      else await db.hba1c.add(record)
      onDone()
    } catch {
      setError('Không lưu được. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4" aria-busy={saving}>
      <Field label="Ngày xét nghiệm">
        <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setError(null) }} />
      </Field>

      <Field label="HbA1c" hint={`Khoảng hợp lệ: ${MIN_PERCENT}–${MAX_PERCENT}%`}>
        <Input
          type="number"
          inputMode="decimal"
          step={0.1}
          placeholder="VD: 6.8"
          suffix="%"
          value={percent}
          onChange={(e) => { setPercent(e.target.value); setError(null) }}
          autoFocus
        />
      </Field>

      <Field label="Ghi chú">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nơi xét nghiệm, thay đổi thuốc…" rows={2} />
      </Field>

      {valid && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2 text-sm">
          <span className="text-muted tabular-nums">
            eAG ≈ <span className="font-medium text-fg">{formatGlucose(hba1cToEag(parsed), unit)} {glucoseUnitLabel(unit)}</span>
            {' · '}IFCC {Math.round(hba1cToIfcc(parsed))} mmol/mol
          </span>
          <StatusBadge status={hba1cStatus(parsed, profile.targets)} />
        </div>
      )}

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </form>
  )
}

const DAY_MS = 86_400_000
