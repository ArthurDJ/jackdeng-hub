'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { TocHeading } from '@/lib/extractHeadings'

interface TableOfContentsProps {
  headings: TocHeading[]
}

/**
 * Sticky Table of Contents for blog articles.
 * Uses IntersectionObserver to highlight the heading currently in the viewport.
 * Renders nothing if there are fewer than 2 headings.
 */
export function TableOfContents({ headings }: TableOfContentsProps) {
  const t = useTranslations('blog')
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '')
  const navRef = useRef<HTMLElement>(null)

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

  // A long TOC scrolls inside its own box (see .post-toc). Keep the
  // highlighted entry in that box's view as the reader moves down the post,
  // scrolling the box only, never the page.
  useEffect(() => {
    const nav = navRef.current
    if (!nav || nav.scrollHeight <= nav.clientHeight) return
    const link = nav.querySelector<HTMLElement>(`a[href="#${CSS.escape(activeId)}"]`)
    if (!link) return
    const pad = 16
    const n = nav.getBoundingClientRect()
    const l = link.getBoundingClientRect()
    if (l.top < n.top + pad) nav.scrollTop -= n.top + pad - l.top
    else if (l.bottom > n.bottom - pad) nav.scrollTop += l.bottom - (n.bottom - pad)
  }, [activeId])

  if (headings.length < 2) return null

  const label = t('tableOfContents')
  const minLevel = Math.min(...headings.map((h) => h.level))

  return (
    // Sticky positioning, the opaque backdrop and the inner scroll live in
    // .post-toc (globals.css), because they only apply when the TOC sits in
    // the desktop side column.
    <nav ref={navRef} aria-label={label} className="post-toc">
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
