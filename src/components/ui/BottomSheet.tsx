import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

/** Small mobile sheet anchored to the bottom edge (used by the "Thêm" tab). */
export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full bg-surface border-t border-border rounded-t-2xl shadow-xl pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" aria-hidden />
        <div className="flex items-center justify-between px-5 pt-2 pb-1">
          {title && <h3 className="text-base font-semibold">{title}</h3>}
          <button onClick={onClose} aria-label="Đóng" className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-muted hover:bg-surface-2">
            <X size={18} />
          </button>
        </div>
        <div className="px-3">{children}</div>
      </div>
    </div>
  )
}
