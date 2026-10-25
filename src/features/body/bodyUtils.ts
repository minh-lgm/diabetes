import type { BodyMetric, Profile } from '../../types'
import { bmi } from '../../lib/calc'

/** Height to use for an entry: the entry's own, else the profile's. */
export function heightFor(entry: BodyMetric | undefined, profile: Profile): number | undefined {
  return entry?.heightCm ?? profile.heightCm
}

/** BMI for an entry (undefined when weight or height is missing). */
export function bmiFor(entry: BodyMetric, profile: Profile): number | undefined {
  const h = heightFor(entry, profile)
  if (!entry.weightKg || !h) return undefined
  return bmi(entry.weightKg, h)
}

/** Weight (kg) at which BMI would equal `targetBmi` for the given height. */
export function weightForBmi(heightCm: number, targetBmi = 22.9): number {
  const m = heightCm / 100
  return targetBmi * m * m
}

/** Format a number with fixed digits, or an em dash when missing. */
export function fmtNum(v: number | undefined, digits = 1): string {
  return v === undefined || Number.isNaN(v) ? '—' : v.toFixed(digits)
}

/** Parse a numeric input string; returns undefined for empty, NaN for invalid. */
export function parseNum(s: string): number | undefined {
  const t = s.trim().replace(',', '.')
  if (!t) return undefined
  return Number(t)
}

/** Validate an optional numeric field; returns an error message or undefined. */
export function rangeError(v: number | undefined, min: number, max: number, label: string, unit: string, required = false): string | undefined {
  if (v === undefined) return required ? `Vui lòng nhập ${label.toLowerCase()}` : undefined
  if (Number.isNaN(v)) return `${label} không hợp lệ`
  if (v < min || v > max) return `${label} phải từ ${min} đến ${max} ${unit}`
  return undefined
}
