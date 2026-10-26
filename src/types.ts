// ─── Shared data model ──────────────────────────────────────────────────────
// All timestamps are ISO-8601 strings.
// Glucose is ALWAYS stored in mg/dL; convert for display via profile.glucoseUnit.

export type GlucoseUnit = 'mgdl' | 'mmol'

export type GlucoseContext =
  | 'fasting'       // nhịn ăn (sáng, trước ăn sáng)
  | 'before_meal'   // trước ăn
  | 'after_meal'    // sau ăn 1–2h
  | 'bedtime'       // trước ngủ
  | 'random'        // bất kỳ

export interface GlucoseReading {
  id?: number
  at: string
  valueMgdl: number
  context: GlucoseContext
  note?: string
}

export interface HbA1cReading {
  id?: number
  at: string
  percent: number
  note?: string
}

export interface BodyMetric {
  id?: number
  at: string
  weightKg?: number
  heightCm?: number
  waistCm?: number
  note?: string
}

export interface BloodPressureReading {
  id?: number
  at: string
  systolic: number
  diastolic: number
  pulse?: number
  note?: string
}

/** Lipid panel – all values in mg/dL */
export interface LipidPanel {
  id?: number
  at: string
  totalChol?: number
  ldl?: number
  hdl?: number
  triglycerides?: number
  note?: string
}

/** Kidney panel */
export interface KidneyPanel {
  id?: number
  at: string
  creatinineMgdl?: number
  egfr?: number        // mL/min/1.73m²
  uacr?: number        // mg/g (albumin/creatinine ratio)
  note?: string
}

/** Thyroid panel – TSH (mIU/L) and free T4 (ng/dL) */
export interface ThyroidPanel {
  id?: number
  at: string
  tsh?: number         // mIU/L
  ft4?: number         // ng/dL
  note?: string
}

export type DiabetesType ='type1' | 'type2' | 'prediabetes' | 'gestational' | 'other'
export type Sex = 'male' | 'female' | 'other'

export interface Targets {
  fastingMin: number      // mg/dL (ADA 80)
  fastingMax: number      // mg/dL (ADA 130)
  postMealMax: number     // mg/dL (ADA <180)
  hypoBelow: number       // mg/dL (<70 = hạ đường huyết)
  hba1cMax: number        // % (ADA <7)
  bmiMin: number          // 18.5
  bmiMax: number          // Asian cut-off 23 (WHO 25)
  waistMaxMale: number    // cm (Asian 90)
  waistMaxFemale: number  // cm (Asian 80)
  bpSysMax: number        // mmHg (<130)
  bpDiaMax: number        // mmHg (<80)
  ldlMax: number          // mg/dL (<100)
  hdlMinMale: number      // mg/dL (>40)
  hdlMinFemale: number    // mg/dL (>50)
  tgMax: number           // mg/dL (<150)
  egfrMin: number         // (>=60)
  uacrMax: number         // mg/g (<30)
  tshMin: number          // mIU/L (0.4)
  tshMax: number          // mIU/L (4.0)
}

export interface Profile {
  id: 'me'
  name?: string
  birthYear?: number
  sex?: Sex
  diabetesType?: DiabetesType
  heightCm?: number
  glucoseUnit: GlucoseUnit
  theme: 'light' | 'dark' | 'system'
  targets: Targets
}

/** Shape of the JSON export/import file */
export interface ExportBundle {
  app: 'diabetes-tracker'
  version: 1
  exportedAt: string
  profile: Profile
  glucose: GlucoseReading[]
  hba1c: HbA1cReading[]
  body: BodyMetric[]
  bloodPressure: BloodPressureReading[]
  lipids: LipidPanel[]
  kidney: KidneyPanel[]
  /** Added in app 1.1 – absent in older backups. */
  thyroid?: ThyroidPanel[]
}
