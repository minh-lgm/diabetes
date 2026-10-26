import { useState, type FormEvent } from 'react'
import { db } from '../../db'
import type { GlucoseContext, GlucoseReading, Profile } from '../../types'
import { Button, Field, Input, Modal, Segmented, StatusBadge, Textarea } from '../../components/ui'
import { formatGlucose, fromDisplayGlucose, glucoseStatus, glucoseUnitLabel, toDisplayGlucose } from '../../lib/calc'
import { GLUCOSE_CONTEXTS, GLUCOSE_CONTEXT_LABEL } from '../../lib/labels'
import { fromLocalInput, toLocalInput } from '../../lib/dates'

const MIN_MGDL = 20
const MAX_MGDL = 600
const FORM_ID = 'glucose-form'

/** True when the timestamp is more than a minute ahead of the device clock. */
function isFuture(iso: string): boolean {
  return new Date(iso).getTime() > Date.now() + 60_000
}

export interface GlucoseFormProps {
  open: boolean
  onClose: () => void
  profile: Profile
  /** When set, the form edits this reading instead of adding a new one. */
  initial?: GlucoseReading | null
}

/** Add / edit modal for a glucose reading. Body is remounted on every open so state resets. */
export function GlucoseForm({ open, onClose, profile, initial }: GlucoseFormProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Sửa chỉ số đường huyết' : 'Ghi chỉ số đường huyết'}
      footer={<>
        <Button variant="secondary" type="button" onClick={onClose}>Huỷ</Button>
        <Button type="submit" form={FORM_ID}>Lưu</Button>
      </>}
    >
      {open && <GlucoseFormBody profile={profile} initial={initial ?? null} onDone={onClose} />}
    </Modal>
  )
}

function GlucoseFormBody({ profile, initial, onDone }: { profile: Profile; initial: GlucoseReading | null; onDone: () => void }) {
  const unit = profile.glucoseUnit
  const unitLabel = glucoseUnitLabel(unit)
  const step = unit === 'mmol' ? 0.1 : 1

  const [at, setAt] = useState(() => toLocalInput(initial?.at ?? new Date()))
  const [value, setValue] = useState(() => (initial ? formatGlucose(initial.valueMgdl, unit) : ''))
  const [context, setContext] = useState<GlucoseContext>(initial?.context ?? 'before_meal')
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const parsed = value.trim() === '' ? NaN : Number(value.replace(',', '.'))
  const mgdl = Number.isFinite(parsed) ? fromDisplayGlucose(parsed, unit) : NaN
  const inRange = Number.isFinite(mgdl) && mgdl >= MIN_MGDL && mgdl <= MAX_MGDL
  const previewStatus = inRange ? glucoseStatus(mgdl, context, profile.targets) : null

  const minDisplay = formatGlucose(MIN_MGDL, unit)
  const maxDisplay = formatGlucose(MAX_MGDL, unit)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!at) { setError('Vui lòng chọn thời điểm đo.'); return }
    if (!Number.isFinite(parsed)) { setError('Vui lòng nhập giá trị đường huyết.'); return }
    if (!inRange) { setError(`Giá trị phải trong khoảng ${minDisplay}–${maxDisplay} ${unitLabel}.`); return }
    const atIso = fromLocalInput(at)
    if (isFuture(atIso)) { setError('Thời điểm đo không được ở tương lai.'); return }

    const record: Omit<GlucoseReading, 'id'> = {
      at: atIso,
      valueMgdl: unit === 'mmol' ? Math.round(mgdl * 10) / 10 : Math.round(mgdl),
      context,
      note: note.trim() || undefined,
    }
    setSaving(true)
    try {
      if (initial?.id !== undefined) await db.glucose.update(initial.id, record)
      else await db.glucose.add(record)
      onDone()
    } catch {
      setError('Không lưu được. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4" aria-busy={saving}>
      <Field label="Thời điểm">
        <Input type="datetime-local" value={at} onChange={(e) => { setAt(e.target.value); setError(null) }} />
      </Field>

      <Field label="Giá trị" hint={`Khoảng hợp lệ: ${minDisplay}–${maxDisplay} ${unitLabel}`}>
        <Input
          type="number"
          inputMode="decimal"
          step={step}
          placeholder={unit === 'mmol' ? 'VD: 6.5' : 'VD: 120'}
          suffix={unitLabel}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null) }}
          autoFocus
        />
      </Field>

      <Field label="Thời điểm đo">
        <Segmented
          value={context}
          onChange={setContext}
          options={GLUCOSE_CONTEXTS.map((c) => ({ value: c, label: GLUCOSE_CONTEXT_LABEL[c] }))}
        />
      </Field>

      <Field label="Ghi chú">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Bữa ăn, vận động, thuốc, cảm giác…"
          rows={2}
        />
      </Field>

      {previewStatus && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2 text-sm">
          <span className="text-muted">
            Đánh giá với mục tiêu hiện tại ({GLUCOSE_CONTEXT_LABEL[context].toLowerCase()})
            {unit === 'mmol' && <span className="tabular-nums"> · {Math.round(mgdl)} mg/dL</span>}
            {unit === 'mgdl' && <span className="tabular-nums"> · {toDisplayGlucose(mgdl, 'mmol').toFixed(1)} mmol/L</span>}
          </span>
          <StatusBadge status={previewStatus} className="whitespace-nowrap shrink-0" />
        </div>
      )}

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </form>
  )
}
