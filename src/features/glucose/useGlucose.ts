import { useCallback, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import type { GlucoseReading } from '../../types'
import { RANGE_OPTIONS, rangeStartIso, type RangeKey } from '../../lib/dates'

const RANGE_STORAGE_KEY = 'glucose.range'

function readStoredRange(): RangeKey {
  try {
    const v = localStorage.getItem(RANGE_STORAGE_KEY)
    if (v && RANGE_OPTIONS.some((o) => o.value === v)) return v as RangeKey
  } catch {
    /* storage unavailable */
  }
  return '30d'
}

/** Range selection persisted in localStorage. */
export function useGlucoseRange(): [RangeKey, (r: RangeKey) => void] {
  const [range, setRangeState] = useState<RangeKey>(readStoredRange)
  const setRange = useCallback((r: RangeKey) => {
    setRangeState(r)
    try { localStorage.setItem(RANGE_STORAGE_KEY, r) } catch { /* ignore */ }
  }, [])
  return [range, setRange]
}

/** Live glucose readings within the range; undefined while loading. Unsorted. */
export function useGlucoseReadings(range: RangeKey): GlucoseReading[] | undefined {
  const start = useMemo(() => rangeStartIso(range), [range])
  return useLiveQuery(
    () => (start ? db.glucose.where('at').aboveOrEqual(start).toArray() : db.glucose.toArray()),
    [start],
  )
}
