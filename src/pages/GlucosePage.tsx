import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { db } from '../db'
import type { GlucoseReading } from '../types'
import { useProfile } from '../hooks/useProfile'
import { Button, Card, ConfirmDialog, PageHeader, Segmented, Select } from '../components/ui'
import { formatGlucose, glucoseUnitLabel } from '../lib/calc'
import { RANGE_OPTIONS, fmtDateTime, rangeStartIso, toDateInput } from '../lib/dates'
import { CONTEXT_FILTER_OPTIONS, type ContextFilter } from '../features/glucose/context'
import { useGlucoseRange, useGlucoseReadings } from '../features/glucose/useGlucose'
import { sortByAtDesc, summarizeGlucose } from '../features/glucose/stats'
import { GlucoseStats } from '../features/glucose/GlucoseStats'
import { GlucoseTrendChart } from '../features/glucose/GlucoseTrendChart'
import { GlucoseContextChart } from '../features/glucose/GlucoseContextChart'
import { GlucoseLog } from '../features/glucose/GlucoseLog'
import { GlucoseForm } from '../features/glucose/GlucoseForm'
import { downloadGlucoseCsv } from '../features/glucose/exportCsv'

const DAY_MS = 86_400_000

export default function GlucosePage() {
  const profile = useProfile()
  const { glucoseUnit: unit, targets } = profile
  const [range, setRange] = useGlucoseRange()
  const [ctxFilter, setCtxFilter] = useState<ContextFilter>('all')
  const readings = useGlucoseReadings(range)
  const loading = readings === undefined

  // Modal state (add / edit) – `?add=1` in the URL also opens the add form.
  const [searchParams, setSearchParams] = useSearchParams()
  const [formOpenState, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<GlucoseReading | null>(null)
  const [pendingDelete, setPendingDelete] = useState<GlucoseReading | null>(null)
  const formOpen = formOpenState || searchParams.get('add') === '1'
  const [now] = useState(() => Date.now())

  const openAdd = useCallback(() => { setEditing(null); setFormOpen(true) }, [])
  const openEdit = useCallback((r: GlucoseReading) => { setEditing(r); setFormOpen(true) }, [])
  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditing(null)
    if (searchParams.has('add')) {
      const next = new URLSearchParams(searchParams)
      next.delete('add')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const all = useMemo(() => sortByAtDesc(readings ?? []), [readings])
  const filtered = useMemo(() => (ctxFilter === 'all' ? all : all.filter((r) => r.context === ctxFilter)), [all, ctxFilter])
  const summary = useMemo(() => summarizeGlucose(filtered, targets, ctxFilter), [filtered, targets, ctxFilter])

  const rangeDays = useMemo(() => {
    const start = rangeStartIso(range)
    if (start) return Math.max(1, Math.round((now - new Date(start).getTime()) / DAY_MS))
    if (!all.length) return undefined
    const oldest = new Date(all[all.length - 1].at).getTime()
    return Math.max(1, Math.round((now - oldest) / DAY_MS) + 1)
  }, [range, all, now])

  const rangeLabel = RANGE_OPTIONS.find((o) => o.value === range)?.label ?? ''
  const unitLabel = glucoseUnitLabel(unit)

  async function confirmDelete() {
    if (pendingDelete?.id !== undefined) await db.glucose.delete(pendingDelete.id)
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Đường huyết"
        description={`Theo dõi chỉ số đường huyết mao mạch, đơn vị ${unitLabel}. Mục tiêu nhịn ăn ${formatGlucose(targets.fastingMin, unit)}–${formatGlucose(targets.fastingMax, unit)}, sau ăn <${formatGlucose(targets.postMealMax, unit)} ${unitLabel}.`}
        actions={<>
          <Button
            variant="secondary"
            icon={<Download size={16} />}
            disabled={!filtered.length}
            onClick={() => downloadGlucoseCsv(filtered, `duong-huyet-${toDateInput(new Date())}.csv`)}
          >
            <span className="hidden sm:inline">Xuất CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button icon={<Plus size={16} />} onClick={openAdd}>Ghi chỉ số</Button>
        </>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={range} onChange={setRange} options={RANGE_OPTIONS} />
        <Select
          aria-label="Lọc theo thời điểm đo"
          value={ctxFilter}
          onChange={(e) => setCtxFilter(e.target.value as ContextFilter)}
          className="w-auto min-w-[160px]"
        >
          {CONTEXT_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        {!loading && (
          <span className="text-sm text-muted ml-auto">
            {filtered.length} chỉ số · {rangeLabel}
          </span>
        )}
      </div>

      <GlucoseStats summary={summary} unit={unit} targets={targets} days={rangeDays} />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card
          className="lg:col-span-3"
          title="Xu hướng"
          subtitle={`Từng lần đo theo thời điểm, vùng xanh là mục tiêu nhịn ăn, đường mảnh là trung bình 7 ngày${filtered.length ? ` · cập nhật ${fmtDateTime(filtered[0].at)}` : ''}`}
        >
          <GlucoseTrendChart readings={filtered} allReadings={all} unit={unit} targets={targets} />
        </Card>
        <Card
          className="lg:col-span-2"
          title="Theo thời điểm trong ngày"
          subtitle="Trung bình theo từng thời điểm đo; vạch xanh/vàng là mục tiêu nhịn ăn và sau ăn"
        >
          <GlucoseContextChart readings={filtered} unit={unit} targets={targets} />
        </Card>
      </div>

      <Card title="Nhật ký" subtitle={loading ? 'Đang tải…' : `${filtered.length} chỉ số, mới nhất trước`}>
        {!loading && (
          <GlucoseLog readings={filtered} unit={unit} targets={targets} onEdit={openEdit} onDelete={setPendingDelete} />
        )}
      </Card>

      <GlucoseForm open={formOpen} onClose={closeForm} profile={profile} initial={editing} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => { void confirmDelete() }}
        title="Xoá chỉ số này?"
        description={pendingDelete
          ? `${formatGlucose(pendingDelete.valueMgdl, unit)} ${unitLabel} lúc ${fmtDateTime(pendingDelete.at)} sẽ bị xoá vĩnh viễn.`
          : undefined}
      />
    </div>
  )
}
