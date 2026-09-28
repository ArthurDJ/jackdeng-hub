'use client'

import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 3v1m0 16v1m8.485-8.485h-1M4.515 12h-1m14.142-5.657-.707.707M6.05 17.95l-.707.707m0-12.728.707.707M17.95 17.95l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
)

const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)

const SystemIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const THEMES = [
  { value: 'light', label: 'themeLight', icon: <SunIcon /> },
  { value: 'dark',  label: 'themeDark',  icon: <MoonIcon /> },
  { value: 'system', label: 'themeSystem', icon: <SystemIcon /> },
] as const

/** Left to right in the segmented control: light, follow the system, dark. */
const SEGMENTS = [THEMES[0], THEMES[2], THEMES[1]] as const

/**
 * Theme choice: Light, System, Dark. Persists to localStorage under "jd-theme".
 *
 * From md up it is a segmented radio group, so all three options and the
 * current one are visible; arrow keys move between them. The single button
 * cycled Light → Dark → System and showed only the current icon, which hid
 * the other two choices. Phones keep that button, where the navbar has no
 * room for three. The mounted check prevents an SSR hydration mismatch.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('nav')
  const [mounted, setMounted] = useState(false)
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="w-8 h-8 md:w-[86px]" aria-hidden />

  const current = THEMES.find((m) => m.value === theme) ?? THEMES[2]
  const next = THEMES[(THEMES.findIndex((m) => m.value === theme) + 1) % THEMES.length]
  const selected = SEGMENTS.findIndex((m) => m.value === current.value)

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const i = (selected + step + SEGMENTS.length) % SEGMENTS.length
    setTheme(SEGMENTS[i].value)
    refs.current[i]?.focus()
  }

  return (
    <>
    <div role="radiogroup" aria-label={t('themeGroup')} className="ds-seg-group hidden md:flex" onKeyDown={onKeyDown}>
      {SEGMENTS.map((m, i) => (
        <button
          key={m.value}
          ref={(el) => { refs.current[i] = el }}
          type="button"
          role="radio"
          aria-checked={i === selected}
          tabIndex={i === selected ? 0 : -1}
          aria-label={t(m.label)}
          title={t(m.label)}
          onClick={() => setTheme(m.value)}
          className="ds-seg"
        >
          {m.icon}
        </button>
      ))}
    </div>
    <span className="md:hidden">
    <button
      onClick={() => setTheme(next.value)}
      title={t('themeTitle', { current: t(current.label), next: t(next.label) })}
      aria-label={t('themeSwitchTo', { mode: t(next.label) })}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        borderRadius: 6,
        color: 'var(--text-tertiary)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 150ms, color 150ms',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = 'var(--bg-hover)'
        el.style.color = 'var(--text-secondary)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = 'transparent'
        el.style.color = 'var(--text-tertiary)'
      }}
    >
      {current.icon}
    </button>
    </span>
    </>
  )
}
