// Demo data generator – 90 days of plausible readings for a type-2 patient.
import { subDays, setHours, setMinutes } from 'date-fns'
import { db, saveProfile } from '../db'
import type { GlucoseReading, HbA1cReading, BodyMetric, BloodPressureReading, LipidPanel, KidneyPanel } from '../types'

function rnd(min: number, max: number) { return min + Math.random() * (max - min) }
function at(daysAgo: number, h: number, m = 0) { return setMinutes(setHours(subDays(new Date(), daysAgo), h), m).toISOString() }

export async function seedDemoData(): Promise<void> {
  const glucose: GlucoseReading[] = []
  const body: BodyMetric[] = []
  const bp: BloodPressureReading[] = []
  for (let d = 89; d >= 0; d--) {
    const trend = 1 - d / 400 // slowly improving control
    glucose.push({ at: at(d, 6, 30), valueMgdl: Math.round(rnd(95, 145) * trend), context: 'fasting' })
    if (d % 2 === 0) glucose.push({ at: at(d, 13, 30), valueMgdl: Math.round(rnd(140, 210) * trend), context: 'after_meal' })
    if (d % 3 === 0) glucose.push({ at: at(d, 22, 0), valueMgdl: Math.round(rnd(110, 160) * trend), context: 'bedtime' })
    if (d % 7 === 0) body.push({ at: at(d, 7, 0), weightKg: +(76 - (89 - d) * 0.03 + rnd(-0.4, 0.4)).toFixed(1), heightCm: 168, waistCm: Math.round(93 - (89 - d) * 0.02) })
    if (d % 5 === 0) bp.push({ at: at(d, 7, 15), systolic: Math.round(rnd(118, 142)), diastolic: Math.round(rnd(74, 90)), pulse: Math.round(rnd(62, 82)) })
  }
  const hba1c: HbA1cReading[] = [
    { at: at(270, 9), percent: 8.4 },
    { at: at(180, 9), percent: 7.9 },
    { at: at(90, 9), percent: 7.3 },
    { at: at(2, 9), percent: 6.8 },
  ]
  const lipids: LipidPanel[] = [
    { at: at(180, 9), totalChol: 212, ldl: 134, hdl: 41, triglycerides: 186 },
    { at: at(2, 9), totalChol: 188, ldl: 108, hdl: 46, triglycerides: 152 },
  ]
  const kidney: KidneyPanel[] = [
    { at: at(180, 9), creatinineMgdl: 0.98, egfr: 88, uacr: 24 },
    { at: at(2, 9), creatinineMgdl: 1.01, egfr: 85, uacr: 19 },
  ]
  await db.transaction('rw', [db.glucose, db.hba1c, db.body, db.bloodPressure, db.lipids, db.kidney, db.profile], async () => {
    await db.glucose.bulkAdd(glucose)
    await db.hba1c.bulkAdd(hba1c)
    await db.body.bulkAdd(body)
    await db.bloodPressure.bulkAdd(bp)
    await db.lipids.bulkAdd(lipids)
    await db.kidney.bulkAdd(kidney)
    await saveProfile({ name: 'Người dùng demo', birthYear: 1975, sex: 'male', diabetesType: 'type2', heightCm: 168 })
  })
}
