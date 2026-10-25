import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Info, Plus } from 'lucide-react'
import { db } from '../db'
import type { HbA1cReading } from '../types'
import { useProfile } from '../hooks/useProfile'
import { Button, Card, ConfirmDialog, PageHeader } from '../components/ui'
import { fmtDate, rangeStartIso } from '../lib/dates'
import { sortByAtDesc } from '../features/glucose/stats'
import { HbA1cTiles } from '../features/hba1c/HbA1cTiles'
import { HbA1cChart } from '../features/hba1c/HbA1cChart'
import { HbA1cReferenceTable } from '../features/hba1c/HbA1cReferenceTable'
import { HbA1cList } from '../features/hba1c/HbA1cList'
import { HbA1cForm } from '../features/hba1c/HbA1cForm'

export default function HbA1cPage() {
  const profile = useProfile()
  const { glucoseUnit: unit, targets } = profile

  const rows = useLiveQuery(() => db.hba1c.toArray(), [])
  const glucoseStart = useMemo(() => rangeStartIso('90d') ?? '', [])
  const glucose90d = useLiveQuery(() => db.glucose.where('at').aboveOrEqual(glucoseStart).toArray(), [glucoseStart])
  const loading = rows === undefined
  const records = useMemo(() => sortByAtDesc(rows ?? []), [rows])
  const latest = records[0]

  const [searchParams, setSearchParams] = useSearchParams()
  const [formOpenState, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HbA1cReading | null>(null)
  const [pendingDelete, setPendingDelete] = useState<HbA1cReading | null>(null)
  const formOpen = formOpenState || searchParams.get('add') === '1'

  const openAdd = useCallback(() => { setEditing(null); setFormOpen(true) }, [])
  const openEdit = useCallback((r: HbA1cReading) => { setEditing(r); setFormOpen(true) }, [])
  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditing(null)
    if (searchParams.has('add')) {
      const next = new URLSearchParams(searchParams)
      next.delete('add')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  async function confirmDelete() {
    if (pendingDelete?.id !== undefined) await db.hba1c.delete(pendingDelete.id)
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="HbA1c"
        description={`Chỉ số đường huyết trung bình khoảng 3 tháng. Mục tiêu của bạn: dưới ${targets.hba1cMax}%.`}
        actions={<Button icon={<Plus size={16} />} onClick={openAdd}>Ghi kết quả</Button>}
      />

      <HbA1cTiles records={records} glucose90d={glucose90d ?? []} profile={profile} />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card
          className="lg:col-span-3"
          title="Diễn tiến HbA1c"
          subtitle={records.length ? `${records.length} kết quả · gần nhất ${fmtDate(latest.at)}` : 'Tất cả kết quả theo thời gian'}
        >
          <HbA1cChart records={records} unit={unit} targets={targets} />
        </Card>
        <Card className="lg:col-span-2" title="Thang tham chiếu" subtitle="HbA1c ↔ đường huyết trung bình ước tính">
          <HbA1cReferenceTable targets={targets} latest={latest?.percent} unit={unit} />
        </Card>
      </div>

      <Card title="Kết quả xét nghiệm" subtitle={loading ? 'Đang tải…' : `${records.length} kết quả, mới nhất trước`}>
        {!loading && <HbA1cList records={records} unit={unit} targets={targets} onEdit={openEdit} onDelete={setPendingDelete} />}
      </Card>

      <Card className="bg-surface-2/60" bodyClassName="text-sm text-muted leading-relaxed">
        <div className="flex gap-3">
          <Info size={18} className="shrink-0 mt-0.5 text-info" />
          <div className="space-y-1.5">
            <p>
              <span className="font-medium text-fg">HbA1c là gì?</span> HbA1c (hemoglobin gắn đường) phản ánh mức đường huyết trung bình trong khoảng 2–3 tháng gần nhất,
              vì hồng cầu sống khoảng 120 ngày. Khác với đo đường huyết tại nhà, HbA1c không bị ảnh hưởng bởi bữa ăn hay thời điểm lấy máu.
            </p>
            <p>
              Hiệp hội Đái tháo đường Hoa Kỳ (ADA) khuyến nghị mục tiêu <span className="font-medium text-fg">dưới 7%</span> cho phần lớn người trưởng thành;
              mục tiêu có thể nới lỏng hoặc chặt hơn tuỳ tuổi, bệnh kèm theo và nguy cơ hạ đường huyết. Mức 5,7–6,4% là tiền tiểu đường, từ 6,5% là ngưỡng chẩn đoán.
            </p>
            <p>Nên xét nghiệm mỗi 3 tháng khi chưa đạt mục tiêu hoặc đang đổi điều trị, mỗi 6 tháng khi đã ổn định. Mục tiêu cá nhân do bác sĩ điều trị quyết định; bạn có thể chỉnh trong phần Cài đặt.</p>
          </div>
        </div>
      </Card>

      <HbA1cForm open={formOpen} onClose={closeForm} profile={profile} initial={editing} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => { void confirmDelete() }}
        title="Xoá kết quả này?"
        description={pendingDelete ? `HbA1c ${pendingDelete.percent.toFixed(1)}% ngày ${fmtDate(pendingDelete.at)} sẽ bị xoá vĩnh viễn.` : undefined}
      />
    </div>
  )
}
