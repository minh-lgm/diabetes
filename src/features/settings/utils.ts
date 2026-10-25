import { useCallback, useEffect, useRef, useState } from 'react'

/** Transient "Đã lưu" flag that clears itself after `ms`. */
export function useFlash(ms = 2000): [boolean, () => void] {
  const [on, setOn] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const trigger = useCallback(() => {
    setOn(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOn(false), ms)
  }, [ms])
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])
  return [on, trigger]
}

/** Trigger a browser download of text content. */
export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Parse a numeric input string; undefined for empty, NaN for invalid. */
export function parseNum(s: string): number | undefined {
  const t = s.trim().replace(',', '.')
  if (!t) return undefined
  return Number(t)
}
