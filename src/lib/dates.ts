import { format, subDays, startOfDay, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

export type RangeKey = '7d' | '14d' | '30d' | '90d' | '1y' | 'all'
export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: '7d', label: '7 ngày' },
  { value: '14d', label: '14 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: '1y', label: '1 năm' },
  { value: 'all', label: 'Tất cả' },
]
const RANGE_DAYS: Record<RangeKey, number | null> = { '7d': 7, '14d': 14, '30d': 30, '90d': 90, '1y': 365, all: null }

/** ISO lower bound for a range key, or undefined for "all". */
export function rangeStartIso(key: RangeKey, now = new Date()): string | undefined {
  const d = RANGE_DAYS[key]
  if (d === null) return undefined
  return startOfDay(subDays(now, d - 1)).toISOString()
}

export function fmtDate(iso: string): string {
  return format(parseISO(iso), 'dd/MM/yyyy', { locale: vi })
}
export function fmtDateTime(iso: string): string {
  return format(parseISO(iso), 'dd/MM/yyyy HH:mm', { locale: vi })
}
export function fmtShort(iso: string): string {
  return format(parseISO(iso), 'dd/MM', { locale: vi })
}
export function fmtMonth(iso: string): string {
  return format(parseISO(iso), 'MM/yyyy', { locale: vi })
}

/**
 * X-axis tick formatter that adapts to the span of the plotted timestamps (epoch ms):
 * > ~10 months → "MM/yy"; crossing a year boundary → "dd/MM/yy"; otherwise "dd/MM".
 */
export function timeTickFormatter(times: number[]): (v: number) => string {
  if (!times.length) return (v) => format(new Date(v), 'dd/MM', { locale: vi })
  let lo = Infinity, hi = -Infinity
  for (const t of times) { if (t < lo) lo = t; if (t > hi) hi = t }
  const DAY = 86_400_000
  const pattern = hi - lo > 300 * DAY ? 'MM/yy'
    : new Date(lo).getFullYear() !== new Date(hi).getFullYear() ? 'dd/MM/yy'
    : 'dd/MM'
  return (v) => format(new Date(v), pattern, { locale: vi })
}

/** For <input type="datetime-local"> value (local time, no seconds). */
export function toLocalInput(iso: string | Date = new Date()): string {
  const d = typeof iso === 'string' ? parseISO(iso) : iso
  return format(d, "yyyy-MM-dd'T'HH:mm")
}
/** From <input type="datetime-local"> / <input type="date"> back to ISO. */
export function fromLocalInput(v: string): string {
  return new Date(v).toISOString()
}
export function toDateInput(iso: string | Date = new Date()): string {
  const d = typeof iso === 'string' ? parseISO(iso) : iso
  return format(d, 'yyyy-MM-dd')
}
