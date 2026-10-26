import Dexie, { type EntityTable } from 'dexie'
import type {
  GlucoseReading, HbA1cReading, BodyMetric, BloodPressureReading,
  LipidPanel, KidneyPanel, ThyroidPanel, Profile, ExportBundle,
} from './types'
import { DEFAULT_PROFILE, DEFAULT_TARGETS } from './lib/targets'

export class DiabetesDB extends Dexie {
  glucose!: EntityTable<GlucoseReading, 'id'>
  hba1c!: EntityTable<HbA1cReading, 'id'>
  body!: EntityTable<BodyMetric, 'id'>
  bloodPressure!: EntityTable<BloodPressureReading, 'id'>
  lipids!: EntityTable<LipidPanel, 'id'>
  kidney!: EntityTable<KidneyPanel, 'id'>
  thyroid!: EntityTable<ThyroidPanel, 'id'>
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
    // v2: thyroid panel (TSH, FT4)
    this.version(2).stores({
      thyroid: '++id, at',
    })
  }
}

export const db = new DiabetesDB()

/** All record tables (everything except profile). */
function dataTables() {
  return [db.glucose, db.hba1c, db.body, db.bloodPressure, db.lipids, db.kidney, db.thyroid]
}

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
  const [profile, glucose, hba1c, body, bloodPressure, lipids, kidney, thyroid] = await Promise.all([
    getProfile(), db.glucose.toArray(), db.hba1c.toArray(), db.body.toArray(),
    db.bloodPressure.toArray(), db.lipids.toArray(), db.kidney.toArray(), db.thyroid.toArray(),
  ])
  return { app: 'diabetes-tracker', version: 1, exportedAt: new Date().toISOString(), profile, glucose, hba1c, body, bloodPressure, lipids, kidney, thyroid }
}

/** Replace everything with the bundle contents (ids are dropped and regenerated). */
export async function importAll(bundle: ExportBundle): Promise<void> {
  if (bundle.app !== 'diabetes-tracker') throw new Error('Tệp không đúng định dạng')
  const strip = <T extends { id?: number }>(xs: T[]) => xs.map((x) => { const { id: _id, ...rest } = x; void _id; return rest as T })
  await db.transaction('rw', [...dataTables(), db.profile], async () => {
    await Promise.all(dataTables().map((t) => t.clear()))
    await db.glucose.bulkAdd(strip(bundle.glucose ?? []))
    await db.hba1c.bulkAdd(strip(bundle.hba1c ?? []))
    await db.body.bulkAdd(strip(bundle.body ?? []))
    await db.bloodPressure.bulkAdd(strip(bundle.bloodPressure ?? []))
    await db.lipids.bulkAdd(strip(bundle.lipids ?? []))
    await db.kidney.bulkAdd(strip(bundle.kidney ?? []))
    await db.thyroid.bulkAdd(strip(bundle.thyroid ?? []))
    if (bundle.profile) {
      await db.profile.put({ ...DEFAULT_PROFILE, ...bundle.profile, id: 'me', targets: { ...DEFAULT_TARGETS, ...(bundle.profile.targets ?? {}) } })
    }
  })
}

export async function clearAll(): Promise<void> {
  await db.transaction('rw', dataTables(), async () => {
    await Promise.all(dataTables().map((t) => t.clear()))
  })
}
