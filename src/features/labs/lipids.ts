import type { Status } from '../../lib/calc'
import type { LipidPanel } from '../../types'

/** Total cholesterol (NCEP ATP III): <200 desirable, 200–239 borderline high, ≥240 high. */
export function totalCholStatus(v: number): Status {
  if (v >= 240) return 'very_high'
  if (v >= 200) return 'high'
  return 'ok'
}

/** Non-HDL cholesterol = TC − HDL; undefined if either is missing. */
export function nonHdl(p: Pick<LipidPanel, 'totalChol' | 'hdl'>): number | undefined {
  if (p.totalChol === undefined || p.hdl === undefined) return undefined
  return p.totalChol - p.hdl
}

/** Non-HDL (NCEP): <130 optimal, 130–159 near optimal/borderline, ≥160 high. */
export function nonHdlStatus(v: number): Status {
  if (v >= 190) return 'very_high'
  if (v >= 130) return 'high'
  return 'ok'
}

/** mmol/L → mg/dL conversion factors. */
export const CHOL_MGDL_PER_MMOL = 38.67
export const TG_MGDL_PER_MMOL = 88.57

export type LipidKey = 'totalChol' | 'ldl' | 'hdl' | 'triglycerides'
export const LIPID_LABEL: Record<LipidKey, string> = {
  totalChol: 'Cholesterol toàn phần',
  ldl: 'LDL-C',
  hdl: 'HDL-C',
  triglycerides: 'Triglycerides',
}
export const LIPID_SHORT: Record<LipidKey, string> = { totalChol: 'TC', ldl: 'LDL', hdl: 'HDL', triglycerides: 'TG' }
export const LIPID_KEYS: LipidKey[] = ['totalChol', 'ldl', 'hdl', 'triglycerides']
