'use client'

import { useEffect, useState } from 'react'
import type { TocHeading } from '@/lib/extractHeadings'

interface TableOfContentsProps {
  headings: TocHeading[]
  locale?: string
}

/**
 * Sticky Table of Contents for blog articles.
 * Uses IntersectionObserver to highlight the heading currently in the viewport.
 * Renders nothing if there are fewer than 2 headings.
 */
export function TableOfContents({ headings, locale }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '')

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting entry
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          // The one closest to the top wins
          const top = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
          )
          setActiveId(top.target.id)
        }
      },
      {
        rootMargin: '-10% 0% -75% 0%',
        threshold: 0,
      },
    )

    const els = headings
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 2) return null

  const label = locale === 'zh' ? '目录' : 'On This Page'
  const minLevel = Math.min(...headings.map((h) => h.level))

  return (
    <nav
      aria-label={label}
      style={{
        position: 'sticky',
        top: 80,
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        paddingBottom: 8,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 510,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          marginBottom: 10,
        }}
      >
        {label}
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {headings.map(({ id, text, level }) => {
          const isActive = activeId === id
          const indent = (level - minLevel) * 10
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setActiveId(id)
                }}
                style={{
                  display: 'block',
                  paddingLeft: indent,
                  paddingTop: 4,
                  paddingBottom: 4,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  fontWeight: isActive ? 510 : 400,
                  textDecoration: 'none',
                  borderLeft: `2px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  paddingInlineStart: `calc(${indent}px + 10px)`,
                  transition: 'color 150ms, border-color 150ms',
                  wordBreak: 'break-word',
                }}
              >
                {text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
