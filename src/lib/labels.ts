import type { GlucoseContext, DiabetesType, Sex } from '../types'

export const GLUCOSE_CONTEXT_LABEL: Record<GlucoseContext, string> = {
  fasting: 'Nhịn ăn (sáng)',
  before_meal: 'Trước ăn',
  after_meal: 'Sau ăn 1–2h',
  bedtime: 'Trước ngủ',
  random: 'Bất kỳ',
}
export const GLUCOSE_CONTEXTS: GlucoseContext[] = ['fasting', 'before_meal', 'after_meal', 'bedtime', 'random']

export const DIABETES_TYPE_LABEL: Record<DiabetesType, string> = {
  type1: 'Tiểu đường type 1',
  type2: 'Tiểu đường type 2',
  prediabetes: 'Tiền tiểu đường',
  gestational: 'Tiểu đường thai kỳ',
  other: 'Khác',
}
export const SEX_LABEL: Record<Sex, string> = { male: 'Nam', female: 'Nữ', other: 'Khác' }
