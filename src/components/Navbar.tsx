import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

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
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
