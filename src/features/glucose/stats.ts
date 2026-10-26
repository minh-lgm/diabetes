import type { GlucoseContext, GlucoseReading, Targets } from '../../types'
import { cv, glucoseStatus, gmi, mean, stddev, timeInRange, type Status } from '../../lib/calc'
import { ALL_GLUCOSE_CONTEXTS } from '../../lib/labels'
import type { ContextFilter } from './context'

export interface GlucoseSummary {
  count: number
  mean?: number
  meanStatus: Status
  sd?: number
  cv?: number
  gmi?: number
  hypoCount: number
  tir: { below: number; inRange: number; above: number }
}

/** Aggregate statistics for a set of readings (all values in mg/dL). */
export function summarizeGlucose(readings: GlucoseReading[], targets: Targets, filter: ContextFilter): GlucoseSummary {
  const values = readings.map((r) => r.valueMgdl)
  const m = mean(values)
  const statusCtx: GlucoseContext = filter === 'fasting' ? 'fasting' : 'random'
  return {
    count: values.length,
    mean: m,
    meanStatus: m === undefined ? 'unknown' : glucoseStatus(m, statusCtx, targets),
    sd: stddev(values),
    cv: cv(values),
    gmi: m === undefined ? undefined : gmi(m),
    hypoCount: values.filter((v) => v < targets.hypoBelow).length,
    tir: timeInRange(values),
  }
}

const DAY_MS = 86_400_000

export interface MovingAveragePoint { t: number; ma: number }

/**
 * Trailing 7-day moving average evaluated at every reading.
 * `readings` must be sorted ascending by `at`. Values stay in mg/dL.
 */
export function movingAverage7d(readings: GlucoseReading[]): MovingAveragePoint[] {
  const out: MovingAveragePoint[] = []
  let start = 0
  let sum = 0
  for (let i = 0; i < readings.length; i++) {
    const t = new Date(readings[i].at).getTime()
    sum += readings[i].valueMgdl
    while (new Date(readings[start].at).getTime() < t - 7 * DAY_MS) {
      sum -= readings[start].valueMgdl
      start++
    }
    out.push({ t, ma: sum / (i - start + 1) })
  }
  return out
}

export interface ContextMean { context: GlucoseContext; mean: number; count: number }

/** Mean glucose per measuring context, in mg/dL; contexts without readings are omitted. */
export function meanByContext(readings: GlucoseReading[]): ContextMean[] {
  const out: ContextMean[] = []
  for (const context of ALL_GLUCOSE_CONTEXTS) {
    const values = readings.filter((r) => r.context === context).map((r) => r.valueMgdl)
    const m = mean(values)
    if (m !== undefined) out.push({ context, mean: m, count: values.length })
  }
  return out
}

export function sortByAtAsc<T extends { at: string }>(xs: T[]): T[] {
  return [...xs].sort((a, b) => a.at.localeCompare(b.at))
}
export function sortByAtDesc<T extends { at: string }>(xs: T[]): T[] {
  return [...xs].sort((a, b) => b.at.localeCompare(a.at))
}
