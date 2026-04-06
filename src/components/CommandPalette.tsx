'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCommandPaletteStore } from '@/store/commandPaletteStore'
import { useCommandPalette } from '@/hooks/useCommandPalette'

// ─── Types ─────────────────────────────────────────────────────────────────────

type ResultItem = {
  id: string
  type: 'post' | 'category' | 'tag' | 'page'
  label: string
  description?: string
  href: string
}

// ─── Static navigation items ───────────────────────────────────────────────────

const STATIC_PAGES: ResultItem[] = [
  { id: 'home',  type: 'page', label: 'Home',  description: 'Back to homepage', href: '/' },
  { id: 'blog',  type: 'page', label: 'Blog',  description: 'All posts',        href: '/blog' },
  { id: 'about', type: 'page', label: 'About', description: 'About me',         href: '/about' },
]

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
    default:         return <IconPage />
  }
}

function typeColor(type: ResultItem['type']) {
  switch (type) {
    case 'post':     return 'text-blue-500 dark:text-blue-400'
    case 'category': return 'text-violet-500 dark:text-violet-400'
    case 'tag':      return 'text-emerald-500 dark:text-emerald-400'
    default:         return 'text-zinc-400 dark:text-zinc-500'
  }
}

// ─── Search fetch ───────────────────────────────────────────────────────────────

async function fetchResults(query: string): Promise<ResultItem[]> {
  if (!query.trim()) return []

  const q = encodeURIComponent(query)

  try {
    const [postsRes, categoriesRes, tagsRes] = await Promise.all([
      fetch(`/api/blogs?where[or][0][title][like]=${q}&where[or][1][excerpt][like]=${q}&where[status][equals]=published&limit=5`),
      fetch(`/api/categories?where[name][like]=${q}&limit=5`),
      fetch(`/api/tags?where[name][like]=${q}&limit=5`),
    ])

    const [posts, categories, tags] = await Promise.all([
      postsRes.ok ? postsRes.json() : { docs: [] },
      categoriesRes.ok ? categoriesRes.json() : { docs: [] },
      tagsRes.ok ? tagsRes.json() : { docs: [] },
    ])

    const results: ResultItem[] = []

    for (const post of posts.docs ?? []) {
      results.push({
        id: `post-${post.id}`,
        type: 'post',
        label: post.title,
        description: post.excerpt ?? '',
        href: `/blog/${post.slug}`,
      })
    }
    for (const cat of categories.docs ?? []) {
      results.push({
        id: `cat-${cat.id}`,
        type: 'category',
        label: cat.name,
        description: cat.description ?? 'Category',
        href: `/blog/category/${cat.slug}`,
      })
    }
    for (const tag of tags.docs ?? []) {
      results.push({
        id: `tag-${tag.id}`,
        type: 'tag',
        label: tag.name,
        description: tag.description ?? 'Tag',
        href: `/blog/tag/${tag.slug}`,
      })
    }

    return results
  } catch {
    return []
  }
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function CommandPalette() {
  // Register global keyboard shortcut
  useCommandPalette()

  const { isOpen, close } = useCommandPaletteStore()
  const router = useRouter()

  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<ResultItem[]>([])
  const [loading, setLoading]   = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  const inputRef    = useRef<HTMLInputElement>(null)
  const listRef     = useRef<HTMLUListElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const res = await fetchResults(query)
      setResults(res)
      setActiveIdx(0)
      setLoading(false)
    }, 280)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLLIElement>('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const displayItems: ResultItem[] = query.trim() ? results : STATIC_PAGES

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <svg className="w-4 h-4 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search posts, categories, tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && (
            <svg className="w-4 h-4 text-zinc-400 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700">
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
            <li className="px-4 py-8 text-center text-sm text-zinc-400">
              No results for <span className="font-medium text-zinc-600 dark:text-zinc-300">"{query}"</span>
            </li>
          )}

          {displayItems.map((item, idx) => (
            <li
              key={item.id}
              data-active={idx === activeIdx}
              role="option"
              aria-selected={idx === activeIdx}
              className={`
                flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none
                ${idx === activeIdx
                  ? 'bg-zinc-100 dark:bg-zinc-800'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}
              `}
              onMouseEnter={() => setActiveIdx(idx)}
              onClick={() => navigate(item.href)}
            >
              <span className={typeColor(item.type)}>{typeIcon(item.type)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {item.label}
                </p>
                {item.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {item.description}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-600 shrink-0 capitalize">
                {item.type}
              </span>
            </li>
          ))}
        </ul>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 font-mono">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 font-mono">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 font-mono">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  )
}
