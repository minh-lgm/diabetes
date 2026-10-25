import Dexie, { type EntityTable } from 'dexie'
import type {
  GlucoseReading, HbA1cReading, BodyMetric, BloodPressureReading,
  LipidPanel, KidneyPanel, Profile, ExportBundle,
} from './types'
import { DEFAULT_PROFILE, DEFAULT_TARGETS } from './lib/targets'

export class DiabetesDB extends Dexie {
  glucose!: EntityTable<GlucoseReading, 'id'>
  hba1c!: EntityTable<HbA1cReading, 'id'>
  body!: EntityTable<BodyMetric, 'id'>
  bloodPressure!: EntityTable<BloodPressureReading, 'id'>
  lipids!: EntityTable<LipidPanel, 'id'>
  kidney!: EntityTable<KidneyPanel, 'id'>
  profile!: EntityTable<Profile, 'id'>

  constructor() {
    super('diabetes-tracker')
    this.version(1).stores({
      glucose: '++id, at, context',
      hba1c: '++id, at',
      body: '++id, at',
      bloodPressure: '++id, at',
      lipids: '++id, at',
      kidney: '++id, at',
      profile: 'id',
    })
  }
}

export const db = new DiabetesDB()

/** Always returns a profile (seeds the default on first run). */
export async function getProfile(): Promise<Profile> {
  const p = await db.profile.get('me')
  if (p) return { ...DEFAULT_PROFILE, ...p, targets: { ...DEFAULT_TARGETS, ...p.targets } }
  await db.profile.put(DEFAULT_PROFILE)
  return DEFAULT_PROFILE
}

export async function saveProfile(patch: Partial<Profile>): Promise<Profile> {
  const cur = await getProfile()
  const next: Profile = { ...cur, ...patch, id: 'me', targets: { ...cur.targets, ...(patch.targets ?? {}) } }
  await db.profile.put(next)
  return next
}

export async function exportAll(): Promise<ExportBundle> {
  const [profile, glucose, hba1c, body, bloodPressure, lipids, kidney] = await Promise.all([
    getProfile(), db.glucose.toArray(), db.hba1c.toArray(), db.body.toArray(),
    db.bloodPressure.toArray(), db.lipids.toArray(), db.kidney.toArray(),
  ])
  return { app: 'diabetes-tracker', version: 1, exportedAt: new Date().toISOString(), profile, glucose, hba1c, body, bloodPressure, lipids, kidney }
}

/** Replace everything with the bundle contents (ids are dropped and regenerated). */
export async function importAll(bundle: ExportBundle): Promise<void> {
  if (bundle.app !== 'diabetes-tracker') throw new Error('Tệp không đúng định dạng')
  const strip = <T extends { id?: number }>(xs: T[]) => xs.map((x) => { const { id: _id, ...rest } = x; void _id; return rest as T })
  const tables = [db.glucose, db.hba1c, db.body, db.bloodPressure, db.lipids, db.kidney, db.profile]
  await db.transaction('rw', tables, async () => {
    await Promise.all([db.glucose.clear(), db.hba1c.clear(), db.body.clear(), db.bloodPressure.clear(), db.lipids.clear(), db.kidney.clear()])
    await db.glucose.bulkAdd(strip(bundle.glucose ?? []))
    await db.hba1c.bulkAdd(strip(bundle.hba1c ?? []))
    await db.body.bulkAdd(strip(bundle.body ?? []))
    await db.bloodPressure.bulkAdd(strip(bundle.bloodPressure ?? []))
    await db.lipids.bulkAdd(strip(bundle.lipids ?? []))
    await db.kidney.bulkAdd(strip(bundle.kidney ?? []))
    if (bundle.profile) await db.profile.put({ ...DEFAULT_PROFILE, ...bundle.profile, id: 'me' })
  })
}

export async function clearAll(): Promise<void> {
  const tables = [db.glucose, db.hba1c, db.body, db.bloodPressure, db.lipids, db.kidney]
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()))
  })
}
