'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { ThemeToggle } from './ThemeToggle'
import { commandPaletteStore } from '@/store/commandPaletteStore'

export function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const otherLocale = locale === 'en' ? 'zh' : 'en'

  const switchLocale = () => {
    router.replace(pathname, { locale: otherLocale })
  }

  const NAV_LINKS = [
    { href: '/blog' as const,  label: t('blog') },
    { href: '/about' as const, label: t('about') },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="font-semibold text-zinc-900 dark:text-zinc-100 hover:opacity-75 transition-opacity text-sm tracking-tight"
        >
          Jack Deng
        </Link>

        {/* Centre nav */}
        <ul className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="px-3 py-1.5 rounded-md text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Search — desktop */}
          <button
            onClick={commandPaletteStore.open}
            aria-label={`${t('search')} (${t('searchShortcut')})`}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-400 dark:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors bg-white dark:bg-zinc-900"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>{t('search')}</span>
            <kbd className="text-[10px] font-mono opacity-70">{t('searchShortcut')}</kbd>
          </button>

          {/* Search — mobile */}
          <button
            onClick={commandPaletteStore.open}
            aria-label={t('search')}
            className="sm:hidden p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {/* Language switcher */}
          <button
            onClick={switchLocale}
            aria-label={`Switch to ${otherLocale === 'zh' ? '中文' : 'English'}`}
            className="px-2 py-1 rounded-md text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700"
          >
            {otherLocale === 'zh' ? '中文' : 'EN'}
          </button>

          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
