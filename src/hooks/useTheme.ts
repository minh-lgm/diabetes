import { useEffect } from 'react'
import type { Profile } from '../types'

/** Applies the `dark` class on <html> following profile.theme (+ OS preference for 'system'). */
export function useApplyTheme(theme: Profile['theme']) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}
