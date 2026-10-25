import { Sun, Moon, Monitor } from 'lucide-react'
import clsx from 'clsx'
import type { Profile } from '../../types'
import { saveProfile } from '../../db'

type Theme = Profile['theme']
const ORDER: Theme[] = ['light', 'dark', 'system']
const LABEL: Record<Theme, string> = { light: 'Sáng', dark: 'Tối', system: 'Theo hệ thống' }
const ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor }

/** Cycles light → dark → system and persists to the profile. */
export function ThemeToggle({ theme, className, showLabel = false }: { theme: Theme; className?: string; showLabel?: boolean }) {
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
  const Icon = ICON[theme]
  return (
    <button
      type="button"
      onClick={() => { void saveProfile({ theme: next }) }}
      aria-label={`Giao diện: ${LABEL[theme]}. Nhấn để chuyển sang ${LABEL[next].toLowerCase()}`}
      title={`Giao diện: ${LABEL[theme]}`}
      className={clsx(
        'inline-flex items-center gap-2 min-h-[44px] min-w-[44px] justify-center rounded-xl px-2.5 text-sm text-muted hover:text-fg hover:bg-surface-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        className,
      )}
    >
      <Icon size={18} aria-hidden />
      {showLabel && <span>{LABEL[theme]}</span>}
    </button>
  )
}
