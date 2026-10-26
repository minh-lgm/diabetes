import { db } from '../../db'
import { GLUCOSE_CONTEXT_LABEL } from '../../lib/labels'

export type CsvTable = 'glucose' | 'hba1c' | 'body' | 'bloodPressure' | 'lipids' | 'kidney' | 'thyroid'

export const CSV_TABLE_LABEL: Record<CsvTable, string> = {
  glucose: 'Đường huyết',
  hba1c: 'HbA1c',
  body: 'Cơ thể',
  bloodPressure: 'Huyết áp',
  lipids: 'Mỡ máu',
  kidney: 'Chức năng thận',
  thyroid: 'Tuyến giáp',
}
export const CSV_TABLES: CsvTable[] = ['glucose', 'hba1c', 'body', 'bloodPressure', 'lipids', 'kidney', 'thyroid']

const CSV_FILE: Record<CsvTable, string> = {
  glucose: 'duong-huyet',
  hba1c: 'hba1c',
  body: 'co-the',
  bloodPressure: 'huyet-ap',
  lipids: 'mo-mau',
  kidney: 'chuc-nang-than',
  thyroid: 'tuyen-giap',
}
export function csvFileName(table: CsvTable, date: string): string {
  return `${CSV_FILE[table]}-${date}.csv`
}

type Cell = string | number | undefined

function esc(v: Cell): string {
  if (v === undefined || v === null) return ''
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(headers: string[], rows: Cell[][]): string {
  const lines = [headers.join(','), ...rows.map((r) => r.map(esc).join(','))]
  // BOM so Excel opens Vietnamese text correctly
  return '﻿' + lines.join('\r\n')
}

/** Build a CSV (Vietnamese snake_case headers) for one table, sorted by time ascending. */
export async function buildCsv(table: CsvTable): Promise<string> {
  switch (table) {
    case 'glucose': {
      const rows = await db.glucose.orderBy('at').toArray()
      return toCsv(
        ['thoi_diem', 'gia_tri_mgdl', 'boi_canh', 'boi_canh_mo_ta', 'ghi_chu'],
        rows.map((r) => [r.at, r.valueMgdl, r.context, GLUCOSE_CONTEXT_LABEL[r.context], r.note]),
      )
    }
    case 'hba1c': {
      const rows = await db.hba1c.orderBy('at').toArray()
      return toCsv(['thoi_diem', 'hba1c_phan_tram', 'ghi_chu'], rows.map((r) => [r.at, r.percent, r.note]))
    }
    case 'body': {
      const rows = await db.body.orderBy('at').toArray()
      return toCsv(
        ['thoi_diem', 'can_nang_kg', 'chieu_cao_cm', 'vong_eo_cm', 'ghi_chu'],
        rows.map((r) => [r.at, r.weightKg, r.heightCm, r.waistCm, r.note]),
      )
    }
    case 'bloodPressure': {
      const rows = await db.bloodPressure.orderBy('at').toArray()
      return toCsv(
        ['thoi_diem', 'tam_thu_mmhg', 'tam_truong_mmhg', 'nhip_tim', 'ghi_chu'],
        rows.map((r) => [r.at, r.systolic, r.diastolic, r.pulse, r.note]),
      )
    }
    case 'lipids': {
      const rows = await db.lipids.orderBy('at').toArray()
      return toCsv(
        ['thoi_diem', 'cholesterol_toan_phan_mgdl', 'ldl_mgdl', 'hdl_mgdl', 'triglycerides_mgdl', 'ghi_chu'],
        rows.map((r) => [r.at, r.totalChol, r.ldl, r.hdl, r.triglycerides, r.note]),
      )
    }
    case 'kidney': {
      const rows = await db.kidney.orderBy('at').toArray()
      return toCsv(
        ['thoi_diem', 'creatinine_mgdl', 'egfr', 'uacr_mg_g', 'ghi_chu'],
        rows.map((r) => [r.at, r.creatinineMgdl, r.egfr, r.uacr, r.note]),
      )
    }
    case 'thyroid': {
      const rows = await db.thyroid.orderBy('at').toArray()
      return toCsv(['thoi_diem', 'tsh_miu_l', 'ft4_ng_dl', 'ghi_chu'], rows.map((r) => [r.at, r.tsh, r.ft4, r.note]))
    }
  }
}
