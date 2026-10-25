import { formatDistanceToNow, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

/** "khoảng 2 giờ trước", "3 ngày trước" … */
export function relativeTime(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: vi })
}
