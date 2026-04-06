'use client'

import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { commandPaletteStore } from '@/store/commandPaletteStore'

const NAV_LINKS = [
  { href: '/blog',    label: 'Blog' },
  { href: '/about',   label: 'About' },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo / wordmark */}
        <Link
          href="/"
          className="font-semibold text-zinc-900 dark:text-zinc-100 hover:opacity-75 transition-opacity text-sm tracking-tight"
        >
          Jack Deng
        </Link>

        {/* Centre nav links */}
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
          {/* Search trigger */}
          <button
            onClick={commandPaletteStore.open}
            aria-label="Open search (Cmd+K)"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-400 dark:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors bg-white dark:bg-zinc-900"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>Search</span>
            <kbd className="text-[10px] font-mono opacity-70">⌘K</kbd>
          </button>
          {/* Mobile search icon only */}
          <button
            onClick={commandPaletteStore.open}
            aria-label="Open search"
            className="sm:hidden p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
