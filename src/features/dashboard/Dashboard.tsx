import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Plus } from 'lucide-react'
import { PageHeader, Segmented, Card, Button, EmptyState } from '../../components/ui'
import { useProfile } from '../../hooks/useProfile'
import { RANGE_OPTIONS, fmtDate } from '../../lib/dates'
import { seedDemoData } from '../../lib/seed'
import { useDashboardData } from './useDashboardData'
import { useStoredRange } from './useStoredRange'
import { KpiGrid } from './KpiGrid'
import { GlucoseTrendChart } from './GlucoseTrendChart'
import { TimeInRangeBar } from './TimeInRangeBar'
import { HbA1cTrendChart } from './HbA1cTrendChart'
import { WeightTrendChart } from './WeightTrendChart'
import { RecentEntries } from './RecentEntries'
import { QuickAdd } from './QuickAdd'

const DISCLAIMER = 'Ứng dụng hỗ trợ tự theo dõi, không thay thế tư vấn của bác sĩ.'

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-surface-2 ${className}`} aria-hidden />
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Đang tải">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-80" />
      <div className="grid md:grid-cols-2 gap-5"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
    </div>
  )
}

export function Dashboard() {
  const profile = useProfile()
  const navigate = useNavigate()
  const [range, setRange] = useStoredRange()
  const data = useDashboardData(range)
  const [seeding, setSeeding] = useState(false)
  const [seedError, setSeedError] = useState<string | null>(null)
  const [today] = useState(() => fmtDate(new Date().toISOString()))

  const rangeLabel = RANGE_OPTIONS.find((o) => o.value === range)?.label ?? ''
  const greeting = profile.name?.trim() ? `Chào, ${profile.name.trim()}` : 'Chào bạn'

  const onSeed = async () => {
    setSeeding(true); setSeedError(null)
    try { await seedDemoData() }
    catch (e) { setSeedError(e instanceof Error ? e.message : 'Không tạo được dữ liệu demo') }
    finally { setSeeding(false) }
  }

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description={`${greeting} · Hôm nay ${today}`}
        actions={<Segmented value={range} onChange={setRange} options={RANGE_OPTIONS} />}
      />

      {!data ? <DashboardSkeleton /> : data.isEmpty ? (
        <Card>
          <EmptyState
            icon={<Sparkles size={32} aria-hidden />}
            title="Chưa có dữ liệu nào"
            description="Bắt đầu bằng cách ghi chỉ số đường huyết đầu tiên, hoặc tạo dữ liệu demo để xem trước các biểu đồ."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button icon={<Plus size={16} aria-hidden />} onClick={() => navigate('/glucose?add=1')}>Ghi chỉ số đầu tiên</Button>
                <Button variant="secondary" onClick={onSeed} disabled={seeding}>{seeding ? 'Đang tạo…' : 'Tạo dữ liệu demo'}</Button>
              </div>
            }
          />
          {seedError && <p role="alert" className="text-center text-sm text-danger">{seedError}</p>}
        </Card>
      ) : (
        <div className="space-y-5">
          <KpiGrid data={data} profile={profile} />

          <QuickAdd />

          <div className="grid lg:grid-cols-5 gap-5">
            <Card className="lg:col-span-3" title="Đường huyết" subtitle={`${rangeLabel} · theo bối cảnh đo`}>
              <GlucoseTrendChart readings={data.glucoseInRange} profile={profile} range={range} />
            </Card>
            <Card className="lg:col-span-2" title="Thời gian trong khoảng" subtitle={`${rangeLabel} · ${data.glucoseInRange.length} lần đo`}>
              <TimeInRangeBar readings={data.glucoseInRange} profile={profile} range={range} />
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <Card title="Xu hướng HbA1c" subtitle="2 năm gần đây">
              <HbA1cTrendChart readings={data.hba1cTwoYears} profile={profile} />
            </Card>
            <Card title="Cân nặng" subtitle={rangeLabel}>
              <WeightTrendChart entries={data.bodyInRange} profile={profile} />
            </Card>
          </div>

          <Card title="Bản ghi gần đây" subtitle="8 bản ghi mới nhất từ tất cả các mục" bodyClassName="pb-0">
            <RecentEntries data={data} profile={profile} />
          </Card>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted">{DISCLAIMER}</p>
    </>
  )
}
