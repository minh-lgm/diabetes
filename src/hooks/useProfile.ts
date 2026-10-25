import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { DEFAULT_PROFILE, DEFAULT_TARGETS } from '../lib/targets'
import type { Profile } from '../types'

/**
 * Live profile; falls back to defaults until the DB resolves.
 * Read-only on purpose: liveQuery contexts must not write (Dexie ReadOnlyError).
 * The default row is seeded by getProfile() during app bootstrap (main.tsx).
 */
export function useProfile(): Profile {
  const p = useLiveQuery(async () => {
    const row = await db.profile.get('me')
    return row ? { ...DEFAULT_PROFILE, ...row, targets: { ...DEFAULT_TARGETS, ...row.targets } } : DEFAULT_PROFILE
  }, [])
  return p ?? DEFAULT_PROFILE
}
