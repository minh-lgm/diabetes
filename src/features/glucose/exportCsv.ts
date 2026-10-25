import type { GlucoseReading } from '../../types'
import { mgdlToMmol } from '../../lib/calc'
import { GLUCOSE_CONTEXT_LABEL } from '../../lib/labels'
import { fmtDateTime } from '../../lib/dates'

function csvCell(v: string | number): string {
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Build the CSV text (UTF-8 BOM so Excel renders Vietnamese correctly). */
export function glucoseToCsv(readings: GlucoseReading[]): string {
  const header = ['thoi_diem', 'gia_tri_mgdl', 'gia_tri_mmol', 'thoi_diem_do', 'ghi_chu']
  const lines = readings.map((r) => [
    fmtDateTime(r.at),
    Math.round(r.valueMgdl),
    mgdlToMmol(r.valueMgdl).toFixed(1),
    GLUCOSE_CONTEXT_LABEL[r.context],
    r.note ?? '',
  ].map(csvCell).join(','))
  return '﻿' + [header.join(','), ...lines].join('\r\n')
}

/** Trigger a browser download of the CSV. */
export function downloadGlucoseCsv(readings: GlucoseReading[], filename = 'duong-huyet.csv'): void {
  const blob = new Blob([glucoseToCsv(readings)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
