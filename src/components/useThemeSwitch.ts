'use client'

import { useCallback } from 'react'
import { useTheme } from 'next-themes'
import { resolveTheme, revealRadius } from '@/lib/themeReveal'

/**
 * Sets the theme, and where the browser supports View Transitions, reveals
 * the new one as a circle growing from the control that was pressed.
 *
 * next-themes only swaps the class on <html> in an effect after its state
 * changes, which may land before or after the transition takes its "old"
 * snapshot. So the class is swapped here, inside the transition callback,
 * and setTheme is called there too to keep next-themes' state and storage in
 * step; its effect then applies the same class again. CSS transitions are
 * off during the switch (.ds-theme-vt) so the "new" snapshot is the finished
 * colours rather than the first frame of a 150ms fade.
 *
 * Instant, as before, when the theme would not change, without View
 * Transitions, or with reduced motion.
 */
export function useThemeSwitch() {
  const { setTheme } = useTheme()

  return useCallback((value: string, from?: Element | null) => {
    const root = document.documentElement
    const next = resolveTheme(value, window.matchMedia('(prefers-color-scheme: dark)').matches)
    const now = root.classList.contains('dark') ? 'dark' : 'light'
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (next === now || !from || reduce || typeof document.startViewTransition !== 'function') {
      setTheme(value)
      return
    }

    const box = from.getBoundingClientRect()
    const x = box.left + box.width / 2
    const y = box.top + box.height / 2
    root.classList.add('ds-theme-vt')
    const vt = document.startViewTransition(() => {
      root.classList.remove('light', 'dark')
      root.classList.add(next)
      root.style.colorScheme = next
      setTheme(value)
    })
    vt.ready
      .then(() => {
        const r = revealRadius(x, y, window.innerWidth, window.innerHeight)
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
      .catch(() => { /* skipped transition: the theme is already applied */ })
    vt.finished.finally(() => root.classList.remove('ds-theme-vt'))
  }, [setTheme])
}
