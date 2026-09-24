'use client'

import { Toaster as SonnerToaster } from 'sonner'
import { useTheme } from 'next-themes'

/**
 * Toast host. Mounted on the blog post page, beside the comment form — the
 * one thing that raises toasts. It used to sit in [locale]/layout.tsx, which
 * put sonner (~20 KB gzipped) in the bundle of every page, the home page
 * included, for a toast only a failed comment submit can show. Anything new
 * that calls toast() needs a <Toaster /> on its page.
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
