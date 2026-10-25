import type { Status } from '../../lib/calc'

/** ESC/ESH 2018 office blood-pressure categories. */
export type BpGrade = 'optimal' | 'normal' | 'high_normal' | 'grade1' | 'grade2' | 'grade3'

export const BP_GRADE_LABEL: Record<BpGrade, string> = {
  optimal: 'Tối ưu',
  normal: 'Bình thường',
  high_normal: 'Bình thường cao',
  grade1: 'Tăng HA độ 1',
  grade2: 'Tăng HA độ 2',
  grade3: 'Tăng HA độ 3',
}

export const BP_GRADE_RANGE: Record<BpGrade, string> = {
  optimal: '< 120 / < 80',
  normal: '120–129 / 80–84',
  high_normal: '130–139 / 85–89',
  grade1: '140–159 / 90–99',
  grade2: '160–179 / 100–109',
  grade3: '≥ 180 / ≥ 110',
}

const ORDER: BpGrade[] = ['optimal', 'normal', 'high_normal', 'grade1', 'grade2', 'grade3']

function sysGrade(sys: number): BpGrade {
  if (sys >= 180) return 'grade3'
  if (sys >= 160) return 'grade2'
  if (sys >= 140) return 'grade1'
  if (sys >= 130) return 'high_normal'
  if (sys >= 120) return 'normal'
  return 'optimal'
}
function diaGrade(dia: number): BpGrade {
  if (dia >= 110) return 'grade3'
  if (dia >= 100) return 'grade2'
  if (dia >= 90) return 'grade1'
  if (dia >= 85) return 'high_normal'
  if (dia >= 80) return 'normal'
  return 'optimal'
}

/** The higher of the systolic and diastolic categories (ESC/ESH rule). */
export function bpGrade(sys: number, dia: number): BpGrade {
  const a = sysGrade(sys)
  const b = diaGrade(dia)
  return ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b
}

/** Colour tone for a grade, independent of user targets. */
export function bpGradeStatus(g: BpGrade): Status {
  switch (g) {
    case 'optimal':
    case 'normal':
      return 'ok'
    case 'high_normal':
    case 'grade1':
      return 'high'
    case 'grade2':
    case 'grade3':
      return 'very_high'
  }
}
