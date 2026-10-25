import { useCallback, useState } from 'react'
import { RANGE_OPTIONS, type RangeKey } from '../../lib/dates'

const KEY = 'dashboard.range'
const DEFAULT: RangeKey = '30d'

function isRangeKey(v: unknown): v is RangeKey {
  return typeof v === 'string' && RANGE_OPTIONS.some((o) => o.value === v)
}

function read(): RangeKey {
  try {
    const v = localStorage.getItem(KEY)
    return isRangeKey(v) ? v : DEFAULT
  } catch {
    return DEFAULT
  }
}

/** Range selector state persisted in localStorage (per-device convenience only). */
export function useStoredRange(): [RangeKey, (r: RangeKey) => void] {
  const [range, setRange] = useState<RangeKey>(read)
  const update = useCallback((r: RangeKey) => {
    setRange(r)
    try { localStorage.setItem(KEY, r) } catch { /* storage unavailable – ignore */ }
  }, [])
  return [range, update]
}
