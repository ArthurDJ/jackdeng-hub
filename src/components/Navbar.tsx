'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { ThemeToggle } from './ThemeToggle'
import { commandPaletteStore } from '@/store/commandPaletteStore'

export function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const otherLocale = locale === 'en' ? 'zh' : 'en'

  const switchLocale = () => {
    router.replace(pathname, { locale: otherLocale })
  }

  const NAV_LINKS = [
    { href: '/blog' as const,  label: t('blog') },
    { href: '/about' as const, label: t('about') },
  ]

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        height: isMenuOpen ? 'auto' : 52,
        background: 'rgba(8,9,10,0.80)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        transition: 'height 200ms var(--ease-default)',
      }}
    >
      {/* Light-mode override via CSS — background becomes rgba(255,255,255,0.85) */}
      <style>{`
        .light header[data-navbar] {
          background: rgba(255,255,255,0.85) !important;
          border-bottom-color: rgba(0,0,0,0.07) !important;
        }
      `}</style>
      <nav
        data-navbar
        className="max-w-5xl mx-auto px-6 h-[52px] flex items-center justify-between gap-4"
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontSize: 14,
            fontWeight: 590,
            color: 'var(--text-primary)',
            textDecoration: 'none',
            letterSpacing: '-0.2px',
            opacity: 1,
            transition: 'opacity 150ms',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.7' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
        >
          Jack Deng
        </Link>

        {/* Centre nav */}
        <ul className="hidden sm:flex items-center gap-1" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 510,
                  color: 'var(--text-tertiary)',
                  textDecoration: 'none',
                  transition: 'color 150ms, background 150ms',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.color = 'var(--text-primary)'
                  el.style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.color = 'var(--text-tertiary)'
                  el.style.background = 'transparent'
                }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-1">

          {/* Search — desktop */}
          <button
            onClick={commandPaletteStore.open}
            aria-label={`${t('search')} (${t('searchShortcut')})`}
            className="hidden sm:flex items-center gap-2"
            style={{
              padding: '5px 10px',
              borderRadius: 6,
              border: '1px solid var(--border-default)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-tertiary)',
              fontSize: 12,
              fontWeight: 400,
              cursor: 'pointer',
              transition: 'border-color 150ms, color 150ms',
              gap: 6,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.borderColor = 'var(--border-strong)'
              el.style.color = 'var(--text-secondary)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.borderColor = 'var(--border-default)'
              el.style.color = 'var(--text-tertiary)'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>{t('search')}</span>
            <kbd style={{ fontSize: 10, opacity: 0.6, fontFamily: 'monospace' }}>{t('searchShortcut')}</kbd>
          </button>

          {/* Search — mobile */}
          <button
            onClick={commandPaletteStore.open}
            aria-label={t('search')}
            className="sm:hidden"
            style={{
              padding: 6,
              borderRadius: 6,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
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
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {/* Language switcher */}
          <button
            onClick={switchLocale}
            aria-label={`Switch to ${otherLocale === 'zh' ? '中文' : 'English'}`}
            style={{
              padding: '4px 9px',
              borderRadius: 6,
              border: '1px solid var(--border-default)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-tertiary)',
              fontSize: 11,
              fontWeight: 510,
              cursor: 'pointer',
              transition: 'border-color 150ms, color 150ms',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.borderColor = 'var(--border-strong)'
              el.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.borderColor = 'var(--border-default)'
              el.style.color = 'var(--text-tertiary)'
            }}
          >
            {otherLocale === 'zh' ? '中文' : 'EN'}
          </button>

          <ThemeToggle />

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden"
            aria-label="Toggle menu"
            style={{
              padding: 6,
              borderRadius: 6,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
            }}
          >
            {isMenuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="sm:hidden px-6 py-4 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(8,9,10,0.95)] backdrop-blur-md">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 0',
                    fontSize: 15,
                    fontWeight: 510,
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                  }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
