import { describe, it, expect } from 'vitest'
import { timeTickFormatter } from '../dates'

const d = (iso: string) => new Date(iso).getTime()

describe('timeTickFormatter', () => {
  it('uses dd/MM within one year', () => {
    const f = timeTickFormatter([d('2026-03-01'), d('2026-06-27')])
    expect(f(d('2026-06-27T12:00'))).toBe('27/06')
  })
  it('adds the year when crossing a year boundary over a short span', () => {
    const f = timeTickFormatter([d('2025-11-20'), d('2026-02-10')])
    expect(f(d('2026-02-10T12:00'))).toBe('10/02/26')
  })
  it('uses MM/yy over long spans', () => {
    const f = timeTickFormatter([d('2025-04-05'), d('2026-06-27')])
    expect(f(d('2025-04-05T12:00'))).toBe('04/25')
    expect(f(d('2026-06-27T12:00'))).toBe('06/26')
  })
  it('falls back to dd/MM with no data', () => {
    expect(timeTickFormatter([])(d('2026-01-05T12:00'))).toBe('05/01')
  })
})
