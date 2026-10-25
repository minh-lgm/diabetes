import type { GlucoseContext, GlucoseUnit, Targets, Sex } from '../types'

export type Status = 'low' | 'ok' | 'high' | 'very_high' | 'unknown'

// ─── Unit conversion ────────────────────────────────────────────────────────
export const MGDL_PER_MMOL = 18.0182

export function mgdlToMmol(mgdl: number): number {
  return mgdl / MGDL_PER_MMOL
}
export function mmolToMgdl(mmol: number): number {
  return mmol * MGDL_PER_MMOL
}
/** Convert a stored mg/dL value for display in the user's unit. */
export function toDisplayGlucose(mgdl: number, unit: GlucoseUnit): number {
  return unit === 'mmol' ? mgdlToMmol(mgdl) : mgdl
}
/** Convert a user-entered value (in their unit) to stored mg/dL. */
export function fromDisplayGlucose(value: number, unit: GlucoseUnit): number {
  return unit === 'mmol' ? mmolToMgdl(value) : value
}
export function formatGlucose(mgdl: number, unit: GlucoseUnit): string {
  return unit === 'mmol' ? mgdlToMmol(mgdl).toFixed(1) : Math.round(mgdl).toString()
}
export function glucoseUnitLabel(unit: GlucoseUnit): string {
  return unit === 'mmol' ? 'mmol/L' : 'mg/dL'
}

// ─── HbA1c ──────────────────────────────────────────────────────────────────
/** Estimated average glucose (ADAG): eAG mg/dL = 28.7 × A1c − 46.7 */
export function hba1cToEag(percent: number): number {
  return 28.7 * percent - 46.7
}
/** Inverse: estimate HbA1c from mean glucose (mg/dL). */
export function eagToHba1c(mgdl: number): number {
  return (mgdl + 46.7) / 28.7
}
/** Glucose Management Indicator (Bergenstal 2018): GMI% = 3.31 + 0.02392 × mean mg/dL */
export function gmi(meanMgdl: number): number {
  return 3.31 + 0.02392 * meanMgdl
}
/** HbA1c % → IFCC mmol/mol */
export function hba1cToIfcc(percent: number): number {
  return (percent - 2.15) * 10.929
}

// ─── Body ───────────────────────────────────────────────────────────────────
export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100
  return weightKg / (m * m)
}
export type BmiClass = 'underweight' | 'normal' | 'overweight' | 'obese1' | 'obese2'
/** Asian-Pacific BMI classification (WHO 2000 / IDI-WPRO). */
export function bmiClass(value: number): BmiClass {
  if (value < 18.5) return 'underweight'
  if (value < 23) return 'normal'
  if (value < 25) return 'overweight'
  if (value < 30) return 'obese1'
  return 'obese2'
}
export const BMI_CLASS_LABEL: Record<BmiClass, string> = {
  underweight: 'Thiếu cân',
  normal: 'Bình thường',
  overweight: 'Thừa cân',
  obese1: 'Béo phì độ I',
  obese2: 'Béo phì độ II',
}

// ─── Status evaluation ──────────────────────────────────────────────────────
export function glucoseStatus(mgdl: number, ctx: GlucoseContext, t: Targets): Status {
  if (mgdl < t.hypoBelow) return 'low'
  if (ctx === 'after_meal' || ctx === 'random') {
    if (mgdl > t.postMealMax * 1.4) return 'very_high'
    if (mgdl > t.postMealMax) return 'high'
    return 'ok'
  }
  // fasting / before_meal / bedtime
  if (mgdl < t.fastingMin) return 'low'
  if (mgdl > t.fastingMax * 1.4) return 'very_high'
  if (mgdl > t.fastingMax) return 'high'
  return 'ok'
}
export function hba1cStatus(percent: number, t: Targets): Status {
  if (percent > t.hba1cMax + 2) return 'very_high'
  if (percent > t.hba1cMax) return 'high'
  return 'ok'
}
export function bmiStatus(value: number, t: Targets): Status {
  if (value < t.bmiMin) return 'low'
  if (value >= 30) return 'very_high'
  if (value >= t.bmiMax) return 'high'
  return 'ok'
}
export function waistStatus(cm: number, sex: Sex | undefined, t: Targets): Status {
  const max = sex === 'female' ? t.waistMaxFemale : t.waistMaxMale
  return cm > max ? 'high' : 'ok'
}
export function bpStatus(sys: number, dia: number, t: Targets): Status {
  if (sys >= 180 || dia >= 120) return 'very_high'
  if (sys >= t.bpSysMax || dia >= t.bpDiaMax) return 'high'
  if (sys < 90 || dia < 60) return 'low'
  return 'ok'
}
export function ldlStatus(v: number, t: Targets): Status {
  if (v >= t.ldlMax + 60) return 'very_high'
  return v >= t.ldlMax ? 'high' : 'ok'
}
export function hdlStatus(v: number, sex: Sex | undefined, t: Targets): Status {
  const min = sex === 'female' ? t.hdlMinFemale : t.hdlMinMale
  return v < min ? 'low' : 'ok'
}
export function tgStatus(v: number, t: Targets): Status {
  if (v >= 500) return 'very_high'
  return v >= t.tgMax ? 'high' : 'ok'
}
export function egfrStatus(v: number, t: Targets): Status {
  if (v < 30) return 'very_high'
  return v < t.egfrMin ? 'high' : 'ok'
}
export function uacrStatus(v: number, t: Targets): Status {
  if (v >= 300) return 'very_high'
  return v >= t.uacrMax ? 'high' : 'ok'
}

export const STATUS_LABEL: Record<Status, string> = {
  low: 'Thấp',
  ok: 'Đạt mục tiêu',
  high: 'Cao',
  very_high: 'Rất cao',
  unknown: '—',
}

// ─── Aggregates ─────────────────────────────────────────────────────────────
export function mean(xs: number[]): number | undefined {
  if (!xs.length) return undefined
  return xs.reduce((a, b) => a + b, 0) / xs.length
}
export function stddev(xs: number[]): number | undefined {
  const m = mean(xs)
  if (m === undefined || xs.length < 2) return undefined
  const v = xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1)
  return Math.sqrt(v)
}
/** Coefficient of variation (%) – glycaemic variability; <36% is the usual goal. */
export function cv(xs: number[]): number | undefined {
  const m = mean(xs)
  const s = stddev(xs)
  if (!m || s === undefined) return undefined
  return (s / m) * 100
}
/** Time-in-range style breakdown on SMBG readings, 70–180 mg/dL. */
export function timeInRange(values: number[], low = 70, high = 180) {
  const n = values.length
  if (!n) return { below: 0, inRange: 0, above: 0 }
  const below = values.filter((v) => v < low).length
  const above = values.filter((v) => v > high).length
  return {
    below: (below / n) * 100,
    inRange: ((n - below - above) / n) * 100,
    above: (above / n) * 100,
  }
}
