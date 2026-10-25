import clsx from 'clsx'

const MIN = 15
const MAX = 35
interface Seg { label: string; from: number; to: number; range: string; cls: string }
const SEGMENTS: Seg[] = [
  { label: 'Thiếu cân', from: MIN, to: 18.5, range: '< 18,5', cls: 'bg-info' },
  { label: 'Bình thường', from: 18.5, to: 23, range: '18,5–22,9', cls: 'bg-ok' },
  { label: 'Thừa cân', from: 23, to: 25, range: '23–24,9', cls: 'bg-warn' },
  { label: 'Béo phì I', from: 25, to: 30, range: '25–29,9', cls: 'bg-danger/60' },
  { label: 'Béo phì II', from: 30, to: MAX, range: '≥ 30', cls: 'bg-danger' },
]

function pct(v: number): number {
  const c = Math.min(MAX, Math.max(MIN, v))
  return ((c - MIN) / (MAX - MIN)) * 100
}

/** Horizontal BMI scale (Asian cut-offs) with a marker at the current value. */
export function BmiScale({ value }: { value?: number }) {
  return (
    <div>
      <div className="relative pt-7">
        {value !== undefined && (
          <div className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: `${pct(value)}%` }}>
            <span className="text-xs font-semibold tabular-nums leading-none mb-0.5">{value.toFixed(1)}</span>
            <span className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[6px] border-t-fg" />
          </div>
        )}
        <div className="flex h-3 rounded-full overflow-hidden">
          {SEGMENTS.map((s) => (
            <div key={s.label} className={clsx(s.cls)} style={{ width: `${pct(s.to) - pct(s.from)}%` }} title={`${s.label} (${s.range})`} />
          ))}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-x-3 gap-y-1">
        {SEGMENTS.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-muted">
            <span className={clsx('h-2 w-2 rounded-full shrink-0', s.cls)} />
            <span>{s.label} <span className="tabular-nums">{s.range}</span></span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Phân loại châu Á (WHO/IDI-WPRO)</p>
    </div>
  )
}
