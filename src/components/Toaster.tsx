'use client'

import { Toaster as SonnerToaster } from 'sonner'
import { useTheme } from 'next-themes'

/**
 * Site-wide toast host. Mounted once in [locale]/layout.tsx.
 *
 * Colours come from the `[data-sonner-toast]` overrides in globals.css so
 * toasts read as part of the design system rather than as sonner's defaults —
 * notably `box-shadow: none`, since DESIGN.md forbids shadows for elevation.
 * `theme` is handed sonner explicitly: it otherwise sniffs
 * prefers-color-scheme, which disagrees with next-themes whenever the visitor
 * has picked a theme that differs from their OS setting.
 */
export function Toaster() {
  const { resolvedTheme } = useTheme()

  return (
    <SonnerToaster
      theme={resolvedTheme === 'light' ? 'light' : 'dark'}
      position="bottom-right"
      duration={3500}
      gap={8}
      offset={20}
      toastOptions={{ className: 'ds-toast' }}
    />
  )
}
