// Chart colours resolved from CSS variables so charts follow light/dark theme.
import { useEffect, useState } from 'react'

export interface ChartColors {
  primary: string; ok: string; warn: string; danger: string; info: string
  muted: string; border: string; fg: string; surface: string
}

function readVar(name: string, alpha = 1): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return raw ? `rgb(${raw} / ${alpha})` : '#888'
}
export function readChartColors(): ChartColors {
  return {
    primary: readVar('--c-primary'),
    ok: readVar('--c-ok'),
    warn: readVar('--c-warn'),
    danger: readVar('--c-danger'),
    info: readVar('--c-info'),
    muted: readVar('--c-muted'),
    border: readVar('--c-border'),
    fg: readVar('--c-fg'),
    surface: readVar('--c-surface'),
  }
}

/** Re-reads colours whenever the `dark` class on <html> toggles. */
export function useChartColors(): ChartColors {
  const [c, setC] = useState<ChartColors>(() => readChartColors())
  useEffect(() => {
    const obs = new MutationObserver(() => setC(readChartColors()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return c
}

/** Recharts Tooltip contentStyle that matches the surface. */
export function tooltipStyle(c: ChartColors) {
  return {
    backgroundColor: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 12,
    color: c.fg,
    fontSize: 12,
    boxShadow: '0 4px 16px rgb(0 0 0 / 0.08)',
  }
}
export const AXIS_TICK = { fontSize: 11 }
