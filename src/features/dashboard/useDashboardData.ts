import { useLiveQuery } from 'dexie-react-hooks'
import { subYears } from 'date-fns'
import { db } from '../../db'
import { rangeStartIso, type RangeKey } from '../../lib/dates'
import type {
  GlucoseReading, HbA1cReading, BodyMetric, BloodPressureReading, LipidPanel, KidneyPanel,
} from '../../types'

export interface DashboardData {
  /** Readings inside the selected range, ascending by time. */
  glucoseInRange: GlucoseReading[]
  bodyInRange: BodyMetric[]
  /** HbA1c in the last two years, ascending. */
  hba1cTwoYears: HbA1cReading[]
  latestFasting?: GlucoseReading
  latestHba1c?: HbA1cReading
  latestBody?: BodyMetric
  latestBp?: BloodPressureReading
  latestLipid?: LipidPanel
  latestKidney?: KidneyPanel
  /** Up to 8 most-recent rows per table, for the "recent entries" card. */
  recent: {
    glucose: GlucoseReading[]
    hba1c: HbA1cReading[]
    body: BodyMetric[]
    bp: BloodPressureReading[]
    lipids: LipidPanel[]
    kidney: KidneyPanel[]
  }
  /** True when the user has no glucose, HbA1c and body data at all. */
  isEmpty: boolean
}

const byAtAsc = <T extends { at: string }>(a: T, b: T) => a.at.localeCompare(b.at)

/** One live query for everything the dashboard shows; `undefined` while loading. */
export function useDashboardData(range: RangeKey): DashboardData | undefined {
  const start = rangeStartIso(range)
  return useLiveQuery(async (): Promise<DashboardData> => {
    const twoYearsAgo = subYears(new Date(), 2).toISOString()
    const [
      glucoseInRange, bodyInRange, hba1cTwoYears,
      latestFasting, latestHba1c, latestBody, latestBp, latestLipid, latestKidney,
      rGlucose, rHba1c, rBody, rBp, rLipids, rKidney,
      nGlucose, nHba1c, nBody,
    ] = await Promise.all([
      start ? db.glucose.where('at').aboveOrEqual(start).toArray() : db.glucose.toArray(),
      start ? db.body.where('at').aboveOrEqual(start).toArray() : db.body.toArray(),
      db.hba1c.where('at').aboveOrEqual(twoYearsAgo).toArray(),
      db.glucose.orderBy('at').reverse().filter((g) => g.context === 'fasting').first(),
      db.hba1c.orderBy('at').last(),
      db.body.orderBy('at').reverse().filter((b) => b.weightKg !== undefined).first(),
      db.bloodPressure.orderBy('at').last(),
      db.lipids.orderBy('at').reverse().filter((l) => l.ldl !== undefined).first(),
      db.kidney.orderBy('at').reverse().filter((k) => k.egfr !== undefined).first(),
      db.glucose.orderBy('at').reverse().limit(8).toArray(),
      db.hba1c.orderBy('at').reverse().limit(8).toArray(),
      db.body.orderBy('at').reverse().limit(8).toArray(),
      db.bloodPressure.orderBy('at').reverse().limit(8).toArray(),
      db.lipids.orderBy('at').reverse().limit(8).toArray(),
      db.kidney.orderBy('at').reverse().limit(8).toArray(),
      db.glucose.count(), db.hba1c.count(), db.body.count(),
    ])

    return {
      glucoseInRange: glucoseInRange.sort(byAtAsc),
      bodyInRange: bodyInRange.sort(byAtAsc),
      hba1cTwoYears: hba1cTwoYears.sort(byAtAsc),
      latestFasting, latestHba1c, latestBody, latestBp, latestLipid, latestKidney,
      recent: { glucose: rGlucose, hba1c: rHba1c, body: rBody, bp: rBp, lipids: rLipids, kidney: rKidney },
      isEmpty: nGlucose === 0 && nHba1c === 0 && nBody === 0,
    }
  }, [start])
}
