import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Scale } from 'lucide-react'
import { db, saveProfile } from '../db'
import type { BodyMetric } from '../types'
import { useProfile } from '../hooks/useProfile'
import { bmi, bmiClass, BMI_CLASS_LABEL, bmiStatus, waistStatus } from '../lib/calc'
import { RANGE_OPTIONS, rangeStartIso, type RangeKey } from '../lib/dates'
import { Button, Card, ConfirmDialog, EmptyState, Modal, PageHeader, Segmented, StatTile } from '../components/ui'
import { BodyForm, type BodyFormValues } from '../features/body/BodyForm'
import { BmiScale } from '../features/body/BmiScale'
import { BodyChart } from '../features/body/BodyChart'
import { BodyList } from '../features/body/BodyList'
import { fmtNum, heightFor, weightForBmi } from '../features/body/bodyUtils'

export default function BodyPage() {
  const profile = useProfile()
  const [params, setParams] = useSearchParams()
  const [range, setRange] = useState<RangeKey>('90d')
  const [modal, setModal] = useState<{ open: boolean; editing?: BodyMetric }>({ open: false })
  const [deleting, setDeleting] = useState<BodyMetric | undefined>()

  // ?add=1 opens the add modal
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

  const all = useLiveQuery(() => db.body.orderBy('at').toArray(), [])
  const asc = useMemo(() => all ?? [], [all])
  const start = rangeStartIso(range)
  const inRange = useMemo(() => (start ? asc.filter((e) => e.at >= start) : asc), [asc, start])
  const desc = useMemo(() => [...inRange].reverse(), [inRange])

  // Latest values (overall, not range-limited)
  const withWeight = asc.filter((e) => e.weightKg !== undefined)
  const latest = withWeight.at(-1)
  const prev = withWeight.at(-2)
  const delta = latest?.weightKg !== undefined && prev?.weightKg !== undefined ? latest.weightKg - prev.weightKg : undefined
  const height = heightFor(latest, profile) ?? asc.filter((e) => e.heightCm).at(-1)?.heightCm
  const curBmi = latest?.weightKg && height ? bmi(latest.weightKg, height) : undefined
  const latestWaist = asc.filter((e) => e.waistCm !== undefined).at(-1)
  const waistMax = profile.sex === 'female' ? profile.targets.waistMaxFemale : profile.targets.waistMaxMale
  const targetWeight = height ? weightForBmi(height) : undefined

  async function handleSubmit(values: BodyFormValues) {
    if (modal.editing?.id !== undefined) await db.body.update(modal.editing.id, values)
    else await db.body.add(values)
    if (values.heightCm && !profile.heightCm) await saveProfile({ heightCm: values.heightCm })
    closeModal()
  }
  async function handleDelete() {
    if (deleting?.id !== undefined) await db.body.delete(deleting.id)
  }

  const deltaHint = delta === undefined ? 'Chưa có lần đo trước'
    : `${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${Math.abs(delta).toFixed(1)} kg so với lần trước`

  return (
    <div>
      <PageHeader
        title="Cơ thể & BMI"
        description="Theo dõi cân nặng, BMI và vòng eo"
        actions={<Button icon={<Plus size={18} />} onClick={() => setModal({ open: true })}>Ghi cân nặng</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile label="Cân nặng gần nhất" value={fmtNum(latest?.weightKg)} unit="kg"
          status={curBmi !== undefined ? bmiStatus(curBmi, profile.targets) : 'unknown'} hint={latest ? deltaHint : 'Chưa có dữ liệu'} />
        <StatTile label="BMI" value={fmtNum(curBmi)}
          status={curBmi !== undefined ? bmiStatus(curBmi, profile.targets) : 'unknown'}
          hint={curBmi !== undefined ? BMI_CLASS_LABEL[bmiClass(curBmi)]
            : !height ? <Link to="/settings" className="underline hover:text-fg">Nhập chiều cao ở Cài đặt</Link> : 'Chưa có cân nặng'} />
        <StatTile label="Vòng eo" value={fmtNum(latestWaist?.waistCm, 0)} unit="cm"
          status={latestWaist?.waistCm !== undefined ? waistStatus(latestWaist.waistCm, profile.sex, profile.targets) : 'unknown'}
          hint={`Mục tiêu ≤ ${waistMax} cm (${profile.sex === 'female' ? 'nữ' : 'nam'})`} />
        <StatTile label="Cân nặng mục tiêu" value={fmtNum(targetWeight)} unit="kg"
          status={targetWeight !== undefined && latest?.weightKg !== undefined && latest.weightKg <= targetWeight + 0.05 ? 'ok' : 'unknown'}
          statusLabel={targetWeight !== undefined && latest?.weightKg !== undefined
            ? (latest.weightKg <= targetWeight + 0.05 ? 'Đã đạt' : `Giảm ${fmtNum(latest.weightKg - targetWeight)} kg`)
            : undefined}
          hint={height ? `BMI 22,9 · cao ${height} cm` : 'Cần chiều cao để tính'} />
      </div>

      <Card title="Thang BMI" className="mb-5">
        <BmiScale value={curBmi} />
      </Card>

      <Card title="Diễn biến" subtitle="Cân nặng và BMI theo thời gian" className="mb-5"
        action={<Segmented value={range} onChange={setRange} options={RANGE_OPTIONS} />}>
        {inRange.length >= 2 ? (
          <BodyChart entries={inRange} profile={profile} />
        ) : (
          <EmptyState title="Chưa đủ dữ liệu để vẽ biểu đồ" description="Cần ít nhất 2 lần đo trong khoảng thời gian đã chọn." />
        )}
      </Card>

      <Card title="Lịch sử" subtitle={`${inRange.length} lần đo`}>
        {all === undefined ? null : desc.length === 0 ? (
          <EmptyState icon={<Scale size={32} />} title="Chưa có dữ liệu cơ thể"
            description="Ghi lại cân nặng và vòng eo định kỳ (mỗi tuần một lần) để theo dõi tiến triển."
            action={<Button onClick={() => setModal({ open: true })} icon={<Plus size={16} />}>Ghi cân nặng</Button>} />
        ) : (
          <BodyList entries={desc} profile={profile} onEdit={(e) => setModal({ open: true, editing: e })} onDelete={setDeleting} />
        )}
      </Card>

      <Modal open={modal.open} onClose={closeModal} title={modal.editing ? 'Sửa lần đo' : 'Ghi cân nặng'}>
        {modal.open && <BodyForm key={modal.editing?.id ?? 'new'} initial={modal.editing} profile={profile} onSubmit={handleSubmit} onCancel={closeModal} />}
      </Modal>
      <ConfirmDialog open={deleting !== undefined} onClose={() => setDeleting(undefined)} onConfirm={handleDelete}
        title="Xoá lần đo này?" description="Dữ liệu đã xoá không thể khôi phục." />
    </div>
  )
}
