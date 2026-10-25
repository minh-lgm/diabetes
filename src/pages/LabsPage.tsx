import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { db } from '../db'
import type { KidneyPanel, LipidPanel } from '../types'
import { useProfile } from '../hooks/useProfile'
import { Button, ConfirmDialog, Modal, PageHeader, Segmented } from '../components/ui'
import { LipidsTab } from '../features/labs/LipidsTab'
import { KidneyTab } from '../features/labs/KidneyTab'
import { LipidForm, type LipidFormValues } from '../features/labs/LipidForm'
import { KidneyForm, type KidneyFormValues } from '../features/labs/KidneyForm'

type Tab = 'lipids' | 'kidney'
const TAB_KEY = 'labs.tab'
const TAB_OPTIONS: { value: Tab; label: string }[] = [
  { value: 'lipids', label: 'Mỡ máu' },
  { value: 'kidney', label: 'Chức năng thận' },
]

function readTab(): Tab {
  try {
    const v = localStorage.getItem(TAB_KEY)
    return v === 'kidney' ? 'kidney' : 'lipids'
  } catch { return 'lipids' }
}

type ModalState =
  | { open: false }
  | { open: true; kind: 'lipids'; editing?: LipidPanel }
  | { open: true; kind: 'kidney'; editing?: KidneyPanel }
type Deleting = { kind: 'lipids'; item: LipidPanel } | { kind: 'kidney'; item: KidneyPanel } | undefined

export default function LabsPage() {
  const profile = useProfile()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(readTab)
  const [modal, setModal] = useState<ModalState>({ open: false })
  const [deleting, setDeleting] = useState<Deleting>(undefined)

  useEffect(() => {
    try { localStorage.setItem(TAB_KEY, tab) } catch { /* ignore */ }
  }, [tab])

  const openAdd = useCallback(() => setModal({ open: true, kind: tab }), [tab])
  useEffect(() => {
    if (params.get('add') === '1') setModal({ open: true, kind: readTab() })
  }, [params])
  const closeModal = useCallback(() => {
    setModal({ open: false })
    if (params.has('add')) {
      const next = new URLSearchParams(params)
      next.delete('add')
      setParams(next, { replace: true })
    }
  }, [params, setParams])

  const lipids = useLiveQuery(() => db.lipids.orderBy('at').toArray(), []) ?? []
  const kidney = useLiveQuery(() => db.kidney.orderBy('at').toArray(), []) ?? []

  async function submitLipid(values: LipidFormValues) {
    if (modal.open && modal.kind === 'lipids' && modal.editing?.id !== undefined) await db.lipids.update(modal.editing.id, values)
    else await db.lipids.add(values)
    closeModal()
  }
  async function submitKidney(values: KidneyFormValues) {
    if (modal.open && modal.kind === 'kidney' && modal.editing?.id !== undefined) await db.kidney.update(modal.editing.id, values)
    else await db.kidney.add(values)
    closeModal()
  }
  async function handleDelete() {
    if (!deleting || deleting.item.id === undefined) return
    if (deleting.kind === 'lipids') await db.lipids.delete(deleting.item.id)
    else await db.kidney.delete(deleting.item.id)
  }

  const modalTitle = modal.open
    ? `${modal.editing ? 'Sửa' : 'Ghi'} kết quả ${modal.kind === 'lipids' ? 'mỡ máu' : 'chức năng thận'}`
    : ''

  return (
    <div>
      <PageHeader
        title="Xét nghiệm"
        description="Mỡ máu và chức năng thận – giá trị lưu theo mg/dL"
        actions={<Button icon={<Plus size={18} />} onClick={openAdd}>Ghi kết quả</Button>}
      />
      <Segmented value={tab} onChange={setTab} options={TAB_OPTIONS} className="mb-5" />

      {tab === 'lipids' ? (
        <LipidsTab panels={lipids} profile={profile} onAdd={openAdd}
          onEdit={(p) => setModal({ open: true, kind: 'lipids', editing: p })}
          onDelete={(p) => setDeleting({ kind: 'lipids', item: p })} />
      ) : (
        <KidneyTab panels={kidney} targets={profile.targets} onAdd={openAdd}
          onEdit={(p) => setModal({ open: true, kind: 'kidney', editing: p })}
          onDelete={(p) => setDeleting({ kind: 'kidney', item: p })} />
      )}

      <Modal open={modal.open} onClose={closeModal} title={modalTitle}>
        {modal.open && modal.kind === 'lipids' && (
          <LipidForm key={modal.editing?.id ?? 'new'} initial={modal.editing} onSubmit={submitLipid} onCancel={closeModal} />
        )}
        {modal.open && modal.kind === 'kidney' && (
          <KidneyForm key={modal.editing?.id ?? 'new'} initial={modal.editing} onSubmit={submitKidney} onCancel={closeModal} />
        )}
      </Modal>
      <ConfirmDialog open={deleting !== undefined} onClose={() => setDeleting(undefined)} onConfirm={handleDelete}
        title="Xoá kết quả này?" description="Dữ liệu đã xoá không thể khôi phục." />
    </div>
  )
}
