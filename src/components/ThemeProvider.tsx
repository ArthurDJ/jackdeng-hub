'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Wraps next-themes' ThemeProvider with class-based dark mode
 * (Tailwind v4 uses .dark class on <html>).
 * `suppressHydrationWarning` is set on <html> in layout.tsx to avoid
 * the mismatch between SSR and client theme hydration.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="jd-theme"
    >
      {children}
    </NextThemesProvider>
  )
}
