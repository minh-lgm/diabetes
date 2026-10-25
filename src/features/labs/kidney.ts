/** KDIGO 2012 GFR categories. */
export type GfrStage = 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5'

export function gfrStage(egfr: number): GfrStage {
  if (egfr >= 90) return 'G1'
  if (egfr >= 60) return 'G2'
  if (egfr >= 45) return 'G3a'
  if (egfr >= 30) return 'G3b'
  if (egfr >= 15) return 'G4'
  return 'G5'
}

export const GFR_STAGE_LABEL: Record<GfrStage, string> = {
  G1: 'G1 – Bình thường hoặc cao (≥ 90)',
  G2: 'G2 – Giảm nhẹ (60–89)',
  G3a: 'G3a – Giảm nhẹ đến trung bình (45–59)',
  G3b: 'G3b – Giảm trung bình đến nặng (30–44)',
  G4: 'G4 – Giảm nặng (15–29)',
  G5: 'G5 – Suy thận (< 15)',
}

/** KDIGO albuminuria categories (UACR mg/g). */
export type AlbuminuriaCategory = 'A1' | 'A2' | 'A3'

export function albuminuriaCategory(uacr: number): AlbuminuriaCategory {
  if (uacr < 30) return 'A1'
  if (uacr <= 300) return 'A2'
  return 'A3'
}

export const ALBUMINURIA_LABEL: Record<AlbuminuriaCategory, string> = {
  A1: 'A1 – Bình thường đến tăng nhẹ (< 30)',
  A2: 'A2 – Tăng trung bình (30–300)',
  A3: 'A3 – Tăng nặng (> 300)',
}

export type KidneyKey = 'creatinineMgdl' | 'egfr' | 'uacr'
export const KIDNEY_LABEL: Record<KidneyKey, string> = {
  creatinineMgdl: 'Creatinine',
  egfr: 'eGFR',
  uacr: 'UACR',
}
export const KIDNEY_UNIT: Record<KidneyKey, string> = {
  creatinineMgdl: 'mg/dL',
  egfr: 'mL/phút/1,73m²',
  uacr: 'mg/g',
}
