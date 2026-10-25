/** Small HTML legend rendered under a chart (more legible than Recharts' SVG legend on mobile). */
export function ChartLegend({ items, className }: { items: { label: string; color: string; dashed?: boolean }[]; className?: string }) {
  if (!items.length) return null
  return (
    <ul className={className ?? 'mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted'} aria-label="Chú giải">
      {items.map((it) => (
        <li key={it.label} className="inline-flex items-center gap-1.5">
          {it.dashed
            ? <span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: it.color }} aria-hidden />
            : <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: it.color }} aria-hidden />}
          <span>{it.label}</span>
        </li>
      ))}
    </ul>
  )
}
