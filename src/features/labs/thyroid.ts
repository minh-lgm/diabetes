import type { Targets } from '../../types'
import { tshStatus, ft4Status, FT4_MIN, FT4_MAX } from '../../lib/calc'

export type ThyroidKey = 'tsh' | 'ft4'
export const THYROID_LABEL: Record<ThyroidKey, string> = { tsh: 'TSH', ft4: 'FT4' }
export const THYROID_UNIT: Record<ThyroidKey, string> = { tsh: 'mIU/L', ft4: 'ng/dL' }

/** Short interpretation for a TSH value (hint text, not a diagnosis). */
export function tshInterpretation(v: number, t: Targets): string {
  switch (tshStatus(v, t)) {
    case 'low': return 'Thấp – hướng cường giáp, nên trao đổi với bác sĩ'
    case 'high': return 'Tăng nhẹ – có thể suy giáp dưới lâm sàng'
    case 'very_high': return 'Cao (> 10) – gợi ý suy giáp, cần khám chuyên khoa'
    default: return `Trong khoảng tham chiếu ${t.tshMin}–${t.tshMax}`
  }
}
export function ft4Interpretation(v: number): string {
  switch (ft4Status(v)) {
    case 'low': return 'Thấp'
    case 'high': return 'Cao'
    default: return `Trong khoảng ${FT4_MIN}–${FT4_MAX}`
  }
}

/** Pattern of TSH + FT4 together, for the form preview. */
export function thyroidPattern(tsh: number | undefined, ft4: number | undefined, t: Targets): string | undefined {
  if (tsh === undefined) return undefined
  const s = tshStatus(tsh, t)
  if (ft4 === undefined) return tshInterpretation(tsh, t)
  const f = ft4Status(ft4)
  if (s === 'ok' && f === 'ok') return 'TSH và FT4 đều trong khoảng tham chiếu'
  if ((s === 'high' || s === 'very_high') && f === 'low') return 'TSH cao + FT4 thấp – kiểu suy giáp rõ'
  if ((s === 'high' || s === 'very_high') && f === 'ok') return 'TSH cao + FT4 bình thường – kiểu suy giáp dưới lâm sàng'
  if (s === 'low' && f === 'high') return 'TSH thấp + FT4 cao – kiểu cường giáp rõ'
  if (s === 'low' && f === 'ok') return 'TSH thấp + FT4 bình thường – kiểu cường giáp dưới lâm sàng'
  return 'Kết quả không điển hình – nên hỏi bác sĩ'
}
