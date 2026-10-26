import { describe, it, expect } from 'vitest'
import {
  mgdlToMmol, mmolToMgdl, formatGlucose, hba1cToEag, eagToHba1c, gmi, hba1cToIfcc,
  bmi, bmiClass, glucoseStatus, hba1cStatus, bmiStatus, bpStatus, ldlStatus, hdlStatus,
  tgStatus, egfrStatus, uacrStatus, tshStatus, ft4Status, mean, stddev, cv, timeInRange,
} from '../calc'
import { DEFAULT_TARGETS as T } from '../targets'

describe('unit conversion', () => {
  it('converts mg/dL ↔ mmol/L', () => {
    expect(mgdlToMmol(180)).toBeCloseTo(9.99, 2)
    expect(mmolToMgdl(5.5)).toBeCloseTo(99.1, 1)
    expect(mgdlToMmol(mmolToMgdl(7.2))).toBeCloseTo(7.2, 6)
  })
  it('formats per unit', () => {
    expect(formatGlucose(126, 'mgdl')).toBe('126')
    expect(formatGlucose(126, 'mmol')).toBe('7.0')
  })
})

describe('HbA1c formulas', () => {
  it('eAG (ADAG)', () => {
    expect(hba1cToEag(7)).toBeCloseTo(154.2, 1)
    expect(hba1cToEag(6)).toBeCloseTo(125.5, 1)
    expect(eagToHba1c(hba1cToEag(8.3))).toBeCloseTo(8.3, 6)
  })
  it('GMI and IFCC', () => {
    expect(gmi(154)).toBeCloseTo(6.99, 2)
    expect(hba1cToIfcc(7)).toBeCloseTo(53, 0)
    expect(hba1cToIfcc(6.5)).toBeCloseTo(48, 0)
  })
})

describe('BMI', () => {
  it('computes and classifies with Asian cut-offs', () => {
    const v = bmi(70, 170)
    expect(v).toBeCloseTo(24.2, 1)
    expect(bmiClass(v)).toBe('overweight')
    expect(bmiClass(18.4)).toBe('underweight')
    expect(bmiClass(22.9)).toBe('normal')
    expect(bmiClass(25)).toBe('obese1')
    expect(bmiClass(30)).toBe('obese2')
  })
})

describe('status evaluation against default targets', () => {
  it('glucose fasting', () => {
    expect(glucoseStatus(65, 'fasting', T)).toBe('low')
    expect(glucoseStatus(75, 'fasting', T)).toBe('low')
    expect(glucoseStatus(100, 'fasting', T)).toBe('ok')
    expect(glucoseStatus(140, 'fasting', T)).toBe('high')
    expect(glucoseStatus(200, 'fasting', T)).toBe('very_high')
  })
  it('glucose after meal', () => {
    expect(glucoseStatus(170, 'after_meal', T)).toBe('ok')
    expect(glucoseStatus(190, 'after_meal', T)).toBe('high')
    expect(glucoseStatus(260, 'after_meal', T)).toBe('very_high')
  })
  it('hba1c / bmi / bp', () => {
    expect(hba1cStatus(6.8, T)).toBe('ok')
    expect(hba1cStatus(7.5, T)).toBe('high')
    expect(hba1cStatus(9.5, T)).toBe('very_high')
    expect(bmiStatus(17, T)).toBe('low')
    expect(bmiStatus(21, T)).toBe('ok')
    expect(bmiStatus(24, T)).toBe('high')
    expect(bmiStatus(31, T)).toBe('very_high')
    expect(bpStatus(118, 76, T)).toBe('ok')
    expect(bpStatus(135, 78, T)).toBe('high')
    expect(bpStatus(185, 95, T)).toBe('very_high')
    expect(bpStatus(85, 55, T)).toBe('low')
  })
  it('lipids and kidney', () => {
    expect(ldlStatus(90, T)).toBe('ok')
    expect(ldlStatus(120, T)).toBe('high')
    expect(ldlStatus(170, T)).toBe('very_high')
    expect(hdlStatus(38, 'male', T)).toBe('low')
    expect(hdlStatus(45, 'female', T)).toBe('low')
    expect(hdlStatus(55, 'female', T)).toBe('ok')
    expect(tgStatus(140, T)).toBe('ok')
    expect(tgStatus(200, T)).toBe('high')
    expect(tgStatus(520, T)).toBe('very_high')
    expect(egfrStatus(90, T)).toBe('ok')
    expect(egfrStatus(50, T)).toBe('high')
    expect(egfrStatus(25, T)).toBe('very_high')
    expect(uacrStatus(20, T)).toBe('ok')
    expect(uacrStatus(100, T)).toBe('high')
    expect(uacrStatus(400, T)).toBe('very_high')
  })
  it('thyroid', () => {
    expect(tshStatus(0.2, T)).toBe('low')
    expect(tshStatus(0.4, T)).toBe('ok')
    expect(tshStatus(2.5, T)).toBe('ok')
    expect(tshStatus(4.0, T)).toBe('ok')
    expect(tshStatus(6.5, T)).toBe('high')
    expect(tshStatus(12, T)).toBe('very_high')
    expect(ft4Status(0.7)).toBe('low')
    expect(ft4Status(1.2)).toBe('ok')
    expect(ft4Status(2.0)).toBe('high')
  })
})

describe('aggregates', () => {
  it('mean / sd / cv', () => {
    expect(mean([])).toBeUndefined()
    expect(mean([100, 120, 140])).toBe(120)
    expect(stddev([100, 120, 140])).toBeCloseTo(20, 6)
    expect(cv([100, 120, 140])).toBeCloseTo(16.67, 2)
    expect(stddev([100])).toBeUndefined()
  })
  it('time in range', () => {
    const r = timeInRange([60, 100, 150, 200])
    expect(r.below).toBe(25)
    expect(r.inRange).toBe(50)
    expect(r.above).toBe(25)
    expect(timeInRange([])).toEqual({ below: 0, inRange: 0, above: 0 })
  })
})
