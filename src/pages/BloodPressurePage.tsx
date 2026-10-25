import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, HeartPulse } from 'lucide-react'
import { db } from '../db'
import type { BloodPressureReading } from '../types'
import { useProfile } from '../hooks/useProfile'
import { bpStatus, mean } from '../lib/calc'
import { RANGE_OPTIONS, rangeStartIso, type RangeKey } from '../lib/dates'
import { Button, Card, ConfirmDialog, EmptyState, Modal, PageHeader, Segmented, StatTile } from '../components/ui'
import { BpForm, type BpFormValues } from '../features/bp/BpForm'
import { BpChart } from '../features/bp/BpChart'
import { BpList } from '../features/bp/BpList'
import { bpGrade, BP_GRADE_LABEL, BP_GRADE_RANGE, bpGradeStatus } from '../features/bp/classify'

export default function BloodPressurePage() {
  const profile = useProfile()
  const targets = profile.targets
  const [params, setParams] = useSearchParams()
  const [range, setRange] = useState<RangeKey>('30d')
  const [modal, setModal] = useState<{ open: boolean; editing?: BloodPressureReading }>({ open: false })
  const [deleting, setDeleting] = useState<BloodPressureReading | undefined>()

  useEffect(() => {
    if (params.get('add') === '1') setModal({ open: true })
  }, [params])
  const closeModal = useCallback(() => {
    setModal({ open: false })
    if (params.has('add')) {
      const next = new URLSearchParams(params)
      next.delete('add')
      setParams(next, { replace: true })
    }
  }, [params, setParams])

  const all = useLiveQuery(() => db.bloodPressure.orderBy('at').toArray(), [])
  const asc = useMemo(() => all ?? [], [all])
  const start = rangeStartIso(range)
  const inRange = useMemo(() => (start ? asc.filter((e) => e.at >= start) : asc), [asc, start])
  const desc = useMemo(() => [...inRange].reverse(), [inRange])

  const latest = asc.at(-1)
  const avgSys = mean(inRange.map((e) => e.systolic))
  const avgDia = mean(inRange.map((e) => e.diastolic))
  const grade = latest ? bpGrade(latest.systolic, latest.diastolic) : undefined

  async function handleSubmit(values: BpFormValues) {
    if (modal.editing?.id !== undefined) await db.bloodPressure.update(modal.editing.id, values)
    else await db.bloodPressure.add(values)
    closeModal()
  }
  async function handleDelete() {
    if (deleting?.id !== undefined) await db.bloodPressure.delete(deleting.id)
  }

  const rangeLabel = RANGE_OPTIONS.find((o) => o.value === range)?.label ?? ''

  return (
    <div>
      <PageHeader
        title="Huyết áp"
        description="Theo dõi huyết áp tâm thu, tâm trương và nhịp tim"
        actions={<Button icon={<Plus size={18} />} onClick={() => setModal({ open: true })}>Ghi huyết áp</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile label="Gần nhất" value={latest ? `${latest.systolic}/${latest.diastolic}` : '—'} unit="mmHg"
          status={latest ? bpStatus(latest.systolic, latest.diastolic, targets) : 'unknown'}
          hint={latest ? (latest.pulse !== undefined ? `Nhịp tim ${latest.pulse} lần/phút` : 'Không ghi nhịp tim') : 'Chưa có dữ liệu'} />
        <StatTile label={`Trung bình (${rangeLabel.toLowerCase()})`}
          value={avgSys !== undefined && avgDia !== undefined ? `${Math.round(avgSys)}/${Math.round(avgDia)}` : '—'} unit="mmHg"
          status={avgSys !== undefined && avgDia !== undefined ? bpStatus(avgSys, avgDia, targets) : 'unknown'}
          hint={`Mục tiêu < ${targets.bpSysMax}/${targets.bpDiaMax}`} />
        <StatTile label="Số lần đo" value={inRange.length} unit="lần" status={inRange.length ? 'ok' : 'unknown'} hint={rangeLabel} />
        <StatTile label="Phân loại" value={<span className="text-xl leading-tight">{grade ? BP_GRADE_LABEL[grade] : '—'}</span>}
          status={grade ? bpGradeStatus(grade) : 'unknown'} hint={grade ? `ESC/ESH: ${BP_GRADE_RANGE[grade]}` : 'Theo ESC/ESH'} />
      </div>

      <Card title="Diễn biến" subtitle="Tâm thu, tâm trương và nhịp tim" className="mb-5"
        action={<Segmented value={range} onChange={setRange} options={RANGE_OPTIONS} />}>
        {inRange.length >= 2 ? (
          <BpChart entries={inRange} targets={targets} />
        ) : (
          <EmptyState title="Chưa đủ dữ liệu để vẽ biểu đồ" description="Cần ít nhất 2 lần đo trong khoảng thời gian đã chọn." />
        )}
      </Card>

      <Card title="Lịch sử" subtitle={`${inRange.length} lần đo`}>
        {all === undefined ? null : desc.length === 0 ? (
          <EmptyState icon={<HeartPulse size={32} />} title="Chưa có dữ liệu huyết áp"
            description="Đo huyết áp vào buổi sáng và tối, sau khi ngồi nghỉ 5 phút, rồi ghi lại tại đây."
            action={<Button onClick={() => setModal({ open: true })} icon={<Plus size={16} />}>Ghi huyết áp</Button>} />
        ) : (
          <BpList entries={desc} targets={targets} onEdit={(e) => setModal({ open: true, editing: e })} onDelete={setDeleting} />
        )}
      </Card>

      <Modal open={modal.open} onClose={closeModal} title={modal.editing ? 'Sửa lần đo' : 'Ghi huyết áp'}>
        {modal.open && <BpForm key={modal.editing?.id ?? 'new'} initial={modal.editing} targets={targets} onSubmit={handleSubmit} onCancel={closeModal} />}
      </Modal>
      <ConfirmDialog open={deleting !== undefined} onClose={() => setDeleting(undefined)} onConfirm={handleDelete}
        title="Xoá lần đo này?" description="Dữ liệu đã xoá không thể khôi phục." />
    </div>
  )
}
