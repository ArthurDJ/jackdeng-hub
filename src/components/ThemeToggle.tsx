'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

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
  { value: 'light', label: 'Light', icon: <SunIcon /> },
  { value: 'dark',  label: 'Dark',  icon: <MoonIcon /> },
  { value: 'system', label: 'System', icon: <SystemIcon /> },
] as const

/**
 * Three-state theme toggle: Light → Dark → System.
 * Persists choice to localStorage under key "jd-theme".
 * Mounted check prevents SSR hydration mismatch.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="w-8 h-8" aria-hidden />

  const current = THEMES.find((t) => t.value === theme) ?? THEMES[2]
  const next = THEMES[(THEMES.findIndex((t) => t.value === theme) + 1) % THEMES.length]

  return (
    <button
      onClick={() => setTheme(next.value)}
      title={`Current: ${current.label} — Click for ${next.label}`}
      aria-label={`Switch to ${next.label} mode`}
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
        el.style.background = 'rgba(255,255,255,0.05)'
        el.style.color = 'var(--text-secondary)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = 'transparent'
        el.style.color = 'var(--text-tertiary)'
      }}
      className=""
    >
      {current.icon}
      <span className="sr-only">{current.label} mode</span>
    </button>
  )
}
