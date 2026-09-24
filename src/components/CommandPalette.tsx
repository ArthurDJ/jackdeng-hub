'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
// The next-intl router, not next/navigation's: hrefs here are locale-less and
// this one adds the current prefix. The plain router sent `/blog/x` through the
// middleware for a 307, and the locale it redirected to came from the
// NEXT_LOCALE cookie — or, with cookies blocked, from Accept-Language.
import { useRouter } from '@/i18n/navigation'
import type { SearchResult, SearchType } from '@/lib/search'
import { useCommandPaletteStore } from '@/store/commandPaletteStore'

// ─── Types ─────────────────────────────────────────────────────────────────────

type ResultItem = Omit<SearchResult, 'type'> & { type: SearchType | 'page' }

// ─── Icons ─────────────────────────────────────────────────────────────────────

function IconPost() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  )
}

function IconCategory() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )
}

function IconTag() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  )
}

function IconTool() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  )
}

function IconProject() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function IconPage() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function typeIcon(type: ResultItem['type']) {
  switch (type) {
    case 'post':     return <IconPost />
    case 'category': return <IconCategory />
    case 'tag':      return <IconTag />
    case 'tool':     return <IconTool />
    case 'project':  return <IconProject />
    default:         return <IconPage />
  }
}

// All type icons use the accent colour — keeps it clean and token-aligned.
function typeAccentStyle(type: ResultItem['type']): React.CSSProperties {
  switch (type) {
    case 'post':     return { color: 'var(--accent-primary)' }
    case 'category': return { color: '#a78bfa' }  // purple-400 equivalent
    case 'tag':      return { color: 'var(--status-success)' }
    case 'tool':     return { color: 'var(--status-warning)' }
    case 'project':  return { color: 'var(--status-info)' }
    default:         return { color: 'var(--text-tertiary)' }
  }
}

// ─── Search fetch ───────────────────────────────────────────────────────────────

// One request to our own route (src/app/api/search), which answers from a cached
// index. This used to be three Payload REST calls straight from the browser,
// matching titles and excerpts only; categories and tags were queried without a
// locale, so Payload fell back to zh and English queries missed them.
async function fetchResults(query: string, locale: string, signal: AbortSignal): Promise<ResultItem[]> {
  const res = await fetch(
    `/api/search?q=${encodeURIComponent(query)}&locale=${encodeURIComponent(locale)}`,
    { signal },
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.results ?? []
}

// ─── Component ──────────────────────────────────────────────────────────────────

// Loaded on demand by CommandPaletteHost, which owns the keyboard shortcut.
// Registering it here as well would toggle twice per keypress.
export function CommandPalette() {
  const { isOpen, close } = useCommandPaletteStore()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('search')
  const tNav = useTranslations('nav')

  const staticPages: ResultItem[] = [
    { id: 'home',     type: 'page', label: t('pageHome'),       description: t('pageHomeDesc'),     href: '/' },
    { id: 'blog',     type: 'page', label: tNav('blog'),        description: t('pageBlogDesc'),     href: '/blog' },
    { id: 'projects', type: 'page', label: tNav('projects'),    description: t('pageProjectsDesc'), href: '/projects' },
    { id: 'tools',    type: 'page', label: tNav('tools'),       description: t('pageToolsDesc'),    href: '/tools' },
    { id: 'about',    type: 'page', label: tNav('about'),       description: t('pageAboutDesc'),    href: '/about' },
  ]

  // Static map — next-intl keys must stay statically analysable (no t('type' + x))
  const TYPE_LABEL: Record<ResultItem['type'], string> = {
    post: t('typePost'),
    category: t('typeCategory'),
    tag: t('typeTag'),
    tool: t('typeTool'),
    project: t('typeProject'),
    page: t('typePage'),
  }

  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState<ResultItem[]>([])
  const [loading, setLoading]     = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  const inputRef    = useRef<HTMLInputElement>(null)
  const listRef     = useRef<HTMLUListElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef    = useRef<AbortController | null>(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Debounced search. Each new query aborts the one in flight, so a slow
  // response for "po" cannot land after, and overwrite, the one for "postgres".
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    abortRef.current?.abort()

    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await fetchResults(query, locale, controller.signal)
        setResults(res)
        setActiveIdx(0)
        setLoading(false)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setResults([])
        setLoading(false)
      }
    }, 280)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [query, locale])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLLIElement>('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const displayItems: ResultItem[] = query.trim() ? results : staticPages

  const navigate = useCallback(
    (href: string) => {
      close()
      router.push(href)
    },
    [close, router],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIdx((i) => Math.min(i + 1, displayItems.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (displayItems[activeIdx]) navigate(displayItems[activeIdx].href)
        break
    }
  }

  if (!isOpen) return null

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] px-4"
      onClick={close}
      aria-modal="true"
      role="dialog"
      aria-label="Command palette"
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} aria-hidden="true" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-strong)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder={t('inputPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
            autoComplete="off"
            spellCheck={false}
          />
          {loading && (
            <svg className="w-4 h-4 animate-spin shrink-0" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
          )}
          <kbd
            className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px]"
            style={{ color: 'var(--text-tertiary)', border: '1px solid var(--border-default)' }}
          >
            esc
          </kbd>
        </div>

        {/* Results list */}
        <ul
          ref={listRef}
          className="max-h-72 overflow-y-auto py-2"
          role="listbox"
        >
          {displayItems.length === 0 && !loading && query.trim() && (
            <li className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {t('noResults', { query })}
            </li>
          )}

          {displayItems.map((item, idx) => (
            <li
              key={item.id}
              data-active={idx === activeIdx}
              role="option"
              aria-selected={idx === activeIdx}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none"
              style={{
                backgroundColor: idx === activeIdx ? 'var(--bg-elevated)' : 'transparent',
                transition: 'background-color var(--duration-fast) var(--ease-default)',
              }}
              onMouseEnter={() => setActiveIdx(idx)}
              onClick={() => navigate(item.href)}
            >
              <span style={typeAccentStyle(item.type)}>{typeIcon(item.type)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {item.label}
                </p>
                {item.description && (
                  <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                    {item.description}
                  </p>
                )}
              </div>
              <span className="text-[10px] shrink-0 capitalize" style={{ color: 'var(--text-tertiary)' }}>
                {TYPE_LABEL[item.type]}
              </span>
            </li>
          ))}
        </ul>

        {/* Footer hint */}
        <div
          className="px-4 py-2 flex items-center gap-4 text-[11px]"
          style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}
        >
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded font-mono" style={{ border: '1px solid var(--border-default)' }}>↑↓</kbd>
            {t('keyNavigate')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded font-mono" style={{ border: '1px solid var(--border-default)' }}>↵</kbd>
            {t('keyOpen')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded font-mono" style={{ border: '1px solid var(--border-default)' }}>esc</kbd>
            {t('keyClose')}
          </span>
        </div>
      </div>
    </div>
  )
}
