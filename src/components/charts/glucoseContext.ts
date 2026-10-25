import type { GlucoseContext } from '../../types'
import type { ChartColors } from './theme'

/** Which semantic colour each measurement context uses – keep in sync with docs/DESIGN.md. */
export const CONTEXT_COLOR_KEY: Record<GlucoseContext, keyof ChartColors> = {
  fasting: 'primary',
  before_meal: 'ok',
  after_meal: 'warn',
  bedtime: 'info',
  random: 'muted',
}

export function contextColor(ctx: GlucoseContext, c: ChartColors): string {
  return c[CONTEXT_COLOR_KEY[ctx]]
}
