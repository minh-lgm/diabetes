import { toDateInput } from '../../lib/dates'

/**
 * Convert an <input type="date"> value to ISO. If the day is unchanged from
 * `original`, the original timestamp is kept; otherwise 09:00 local is used.
 */
export function dateInputToIso(value: string, original?: string): string {
  if (original && toDateInput(original) === value) return original
  return new Date(`${value}T09:00`).toISOString()
}

export function isValidDateInput(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T09:00`).getTime())
}
