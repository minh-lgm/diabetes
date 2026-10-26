import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

/** Short relative time: "2 giờ trước", "3 ngày trước" … (strict → no "khoảng"/"gần") */
export function relativeTime(iso: string): string {
  return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true, locale: vi })
}
