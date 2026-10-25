import type { GlucoseContext } from '../../types'
import type { ChartColors } from '../../components/charts/theme'
import { GLUCOSE_CONTEXTS, GLUCOSE_CONTEXT_LABEL } from '../../lib/labels'

/** Context filter for the glucose page: everything, or one measuring context. */
export type ContextFilter = 'all' | GlucoseContext

export const CONTEXT_FILTER_OPTIONS: { value: ContextFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  ...GLUCOSE_CONTEXTS.map((c) => ({ value: c, label: GLUCOSE_CONTEXT_LABEL[c] })),
]

/** Chart colour key per context (resolved through useChartColors). */
export const CONTEXT_COLOR_KEY: Record<GlucoseContext, keyof ChartColors> = {
  fasting: 'primary',
  before_meal: 'ok',
  after_meal: 'warn',
  bedtime: 'info',
  random: 'muted',
}

/** Tailwind chip classes per context (mirrors CONTEXT_COLOR_KEY). */
export const CONTEXT_CHIP_CLASS: Record<GlucoseContext, string> = {
  fasting: 'bg-primary/15 text-primary',
  before_meal: 'bg-ok/15 text-ok',
  after_meal: 'bg-warn/15 text-warn',
  bedtime: 'bg-info/15 text-info',
  random: 'bg-surface-2 text-muted',
}

/** Short labels for tight spaces (chips, bar-chart axis). */
export const CONTEXT_SHORT_LABEL: Record<GlucoseContext, string> = {
  fasting: 'Nhịn ăn',
  before_meal: 'Trước ăn',
  after_meal: 'Sau ăn',
  bedtime: 'Trước ngủ',
  random: 'Bất kỳ',
}
