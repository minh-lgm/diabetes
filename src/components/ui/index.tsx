// ─── Shared UI kit ──────────────────────────────────────────────────────────
// Keep this API stable: feature pages import from '../components/ui'.
import { useEffect, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import type { Status } from '../../lib/calc'
import { STATUS_LABEL } from '../../lib/calc'

// ─── Button ─────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}
const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-fg hover:brightness-110 shadow-sm',
  secondary: 'bg-surface border border-border text-fg hover:bg-surface-2',
  ghost: 'text-fg hover:bg-surface-2',
  danger: 'bg-danger text-white hover:brightness-110',
}
const BTN_SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
}
export function Button({ variant = 'primary', size = 'md', icon, className, children, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-xl font-medium transition disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        BTN_VARIANT[variant], BTN_SIZE[size], className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

// ─── Card ───────────────────────────────────────────────────────────────────
export function Card({ title, subtitle, action, children, className, bodyClassName }: {
  title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string
}) {
  return (
    <section className={clsx('bg-surface border border-border rounded-2xl shadow-sm', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
          <div>
            {title && <h2 className="text-base font-semibold leading-tight">{title}</h2>}
            {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={clsx('px-5 pb-5', !(title || action) && 'pt-5', bodyClassName)}>{children}</div>
    </section>
  )
}

// ─── Page header ────────────────────────────────────────────────────────────
export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ─── Form controls ──────────────────────────────────────────────────────────
export function Field({ label, hint, error, children, className }: { label?: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={clsx('block', className)}>
      {label && <span className="block text-sm font-medium mb-1.5">{label}</span>}
      {children}
      {error ? <span className="block text-xs text-danger mt-1">{error}</span>
        : hint ? <span className="block text-xs text-muted mt-1">{hint}</span> : null}
    </label>
  )
}
const CONTROL = 'w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-fg placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { suffix?: ReactNode }
export function Input({ className, suffix, ...rest }: InputProps) {
  if (!suffix) return <input className={clsx(CONTROL, className)} {...rest} />
  return (
    <div className="relative">
      <input className={clsx(CONTROL, 'pr-16', className)} {...rest} />
      <span className="absolute inset-y-0 right-3 flex items-center text-xs text-muted pointer-events-none">{suffix}</span>
    </div>
  )
}
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(CONTROL, 'pr-8', className)} {...rest}>{children}</select>
}
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(CONTROL, 'h-auto min-h-[80px] py-2', className)} {...rest} />
}

/** Pill-style single-choice selector. */
export function Segmented<T extends string>({ value, onChange, options, className }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string
}) {
  return (
    <div role="radiogroup" className={clsx('inline-flex flex-wrap gap-1 p-1 rounded-xl bg-surface-2', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'px-3 h-8 rounded-lg text-sm font-medium transition',
            o.value === value ? 'bg-surface shadow-sm text-fg' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Status ─────────────────────────────────────────────────────────────────
export const STATUS_TONE: Record<Status, string> = {
  low: 'bg-info/15 text-info',
  ok: 'bg-ok/15 text-ok',
  high: 'bg-warn/15 text-warn',
  very_high: 'bg-danger/15 text-danger',
  unknown: 'bg-surface-2 text-muted',
}
export const STATUS_DOT: Record<Status, string> = {
  low: 'bg-info', ok: 'bg-ok', high: 'bg-warn', very_high: 'bg-danger', unknown: 'bg-muted',
}
export function StatusBadge({ status, label, className }: { status: Status; label?: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_TONE[status], className)}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />
      {label ?? STATUS_LABEL[status]}
    </span>
  )
}

/** KPI tile. `value` already formatted. */
export function StatTile({ label, value, unit, status = 'unknown', statusLabel, hint, icon, onClick, className }: {
  label: ReactNode; value: ReactNode; unit?: ReactNode; status?: Status; statusLabel?: ReactNode; hint?: ReactNode; icon?: ReactNode; onClick?: () => void; className?: string
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={clsx(
        'text-left bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col gap-2',
        onClick && 'hover:border-primary/50 hover:shadow transition cursor-pointer',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums tracking-tight">{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
        <StatusBadge status={status} label={statusLabel} className="shrink-0" />
        {hint && <span className="text-muted min-w-0 text-right leading-snug">{hint}</span>}
      </div>
    </Comp>
  )
}

// ─── Empty state ────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 gap-2">
      {icon && <div className="text-muted mb-1">{icon}</div>}
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm text-muted max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

// ─── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, size = 'md' }: {
  open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const width = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg'
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={clsx('relative w-full bg-surface border border-border rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col', width)}>
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Đóng" className="p-1.5 rounded-lg text-muted hover:bg-surface-2"><X size={18} /></button>
        </div>
        <div className="px-5 pb-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Xoá', danger = true }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: ReactNode; description?: ReactNode; confirmLabel?: string; danger?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button>
      </>}>
      {description && <p className="text-sm text-muted">{description}</p>}
    </Modal>
  )
}
