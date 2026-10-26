import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Upload, FileSpreadsheet, Sparkles, Trash2 } from 'lucide-react'
import { db, exportAll, importAll, clearAll } from '../../db'
import type { ExportBundle } from '../../types'
import { seedDemoData } from '../../lib/seed'
import { toDateInput } from '../../lib/dates'
import { Button, Card, ConfirmDialog, Select } from '../../components/ui'
import { buildCsv, csvFileName, CSV_TABLE_LABEL, CSV_TABLES, type CsvTable } from './csv'
import { downloadText } from './utils'

type Msg = { tone: 'ok' | 'danger'; text: string } | undefined

function isBundle(x: unknown): x is ExportBundle {
  return typeof x === 'object' && x !== null && (x as { app?: unknown }).app === 'diabetes-tracker'
}

export function DataCard() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [csvTable, setCsvTable] = useState<CsvTable>('glucose')
  const [pending, setPending] = useState<ExportBundle | undefined>()
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmSeed, setConfirmSeed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<Msg>()

  const counts = useLiveQuery(async () => {
    const [glucose, hba1c, body, bloodPressure, lipids, kidney, thyroid] = await Promise.all([
      db.glucose.count(), db.hba1c.count(), db.body.count(), db.bloodPressure.count(), db.lipids.count(), db.kidney.count(), db.thyroid.count(),
    ])
    return { glucose, hba1c, body, bloodPressure, lipids, kidney, thyroid } satisfies Record<CsvTable, number>
  }, [])
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true)
    setMsg(undefined)
    try {
      await fn()
      setMsg({ tone: 'ok', text: label })
    } catch (err) {
      setMsg({ tone: 'danger', text: err instanceof Error ? err.message : 'Đã xảy ra lỗi' })
    } finally {
      setBusy(false)
    }
  }

  const today = toDateInput(new Date())

  function exportJson() {
    void run('Đã xuất bản sao lưu.', async () => {
      const bundle = await exportAll()
      downloadText(`theo-doi-tieu-duong-${today}.json`, JSON.stringify(bundle, null, 2), 'application/json')
    })
  }

  async function onFileChosen(file: File | undefined) {
    if (!file) return
    setMsg(undefined)
    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      if (!isBundle(parsed)) throw new Error('Tệp không phải bản sao lưu của ứng dụng này.')
      setPending(parsed)
    } catch (err) {
      setMsg({ tone: 'danger', text: err instanceof SyntaxError ? 'Tệp JSON không hợp lệ.' : err instanceof Error ? err.message : 'Không đọc được tệp.' })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function doImport() {
    const b = pending
    if (!b) return
    setPending(undefined)
    void run('Đã nhập bản sao lưu.', () => importAll(b))
  }

  function exportCsv() {
    void run(`Đã xuất CSV: ${CSV_TABLE_LABEL[csvTable]}.`, async () => {
      const csv = await buildCsv(csvTable)
      downloadText(csvFileName(csvTable, today), csv, 'text/csv;charset=utf-8')
    })
  }

  const pendingSummary = pending
    ? `${(pending.glucose ?? []).length} đường huyết, ${(pending.hba1c ?? []).length} HbA1c, ${(pending.body ?? []).length} cơ thể, ${(pending.bloodPressure ?? []).length} huyết áp, ${(pending.lipids ?? []).length} mỡ máu, ${(pending.kidney ?? []).length} thận, ${(pending.thyroid ?? []).length} tuyến giáp`
    : ''

  return (
    <Card title="Dữ liệu" subtitle="Sao lưu, khôi phục và xuất dữ liệu">
      <div className="space-y-5">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {CSV_TABLES.map((t) => (
            <div key={t} className="rounded-xl bg-surface-2 px-3 py-2">
              <div className="text-lg font-bold tabular-nums leading-tight">{counts ? counts[t] : '—'}</div>
              <div className="text-xs text-muted truncate">{CSV_TABLE_LABEL[t]}</div>
            </div>
          ))}
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Sao lưu</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<Download size={16} />} onClick={exportJson} disabled={busy}>Xuất bản sao lưu (JSON)</Button>
            <Button variant="secondary" icon={<Upload size={16} />} onClick={() => fileRef.current?.click()} disabled={busy}>Nhập bản sao lưu</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void onFileChosen(e.target.files?.[0])} />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Xuất CSV</p>
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={csvTable} onChange={(e) => setCsvTable(e.target.value as CsvTable)} className="w-auto min-w-[12rem]" aria-label="Chọn bảng">
              {CSV_TABLES.map((t) => <option key={t} value={t}>{CSV_TABLE_LABEL[t]} ({counts ? counts[t] : '…'})</option>)}
            </Select>
            <Button variant="secondary" icon={<FileSpreadsheet size={16} />} onClick={exportCsv} disabled={busy || !counts || counts[csvTable] === 0}>Xuất CSV</Button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Khác</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<Sparkles size={16} />} onClick={() => setConfirmSeed(true)} disabled={busy}>Tạo dữ liệu demo</Button>
            <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setConfirmClear(true)} disabled={busy || total === 0}>Xoá toàn bộ dữ liệu</Button>
          </div>
        </div>

        {msg && <p className={msg.tone === 'ok' ? 'text-sm text-ok' : 'text-sm text-danger'} role="status">{msg.text}</p>}
      </div>

      <ConfirmDialog open={pending !== undefined} onClose={() => setPending(undefined)} onConfirm={doImport}
        title="Nhập bản sao lưu?" confirmLabel="Nhập và thay thế"
        description={`Toàn bộ dữ liệu hiện tại sẽ bị thay thế bằng nội dung tệp (${pendingSummary}). Hành động này không thể hoàn tác.`} />
      <ConfirmDialog open={confirmSeed} onClose={() => setConfirmSeed(false)} danger={false} confirmLabel="Tạo dữ liệu demo"
        onConfirm={() => void run('Đã tạo dữ liệu demo (90 ngày).', seedDemoData)}
        title="Tạo dữ liệu demo?" description="Sẽ thêm 90 ngày dữ liệu mẫu vào dữ liệu hiện có và cập nhật hồ sơ thành người dùng demo." />
      <ConfirmDialog open={confirmClear} onClose={() => setConfirmClear(false)} onConfirm={() => void run('Đã xoá toàn bộ dữ liệu.', clearAll)}
        title="Xoá toàn bộ dữ liệu?" confirmLabel="Xoá tất cả"
        description={`Sẽ xoá ${total} bản ghi trong trình duyệt này. Hồ sơ và ngưỡng mục tiêu được giữ lại. Hãy xuất bản sao lưu trước nếu cần.`} />
    </Card>
  )
}
