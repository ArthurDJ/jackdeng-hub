'use client'

import { useEffect, useState } from 'react'
import { activeSection } from '@/lib/sectionNav'

/**
 * The home page's section list in the sticky left column (lg and up), after
 * brittanychiang.com: each entry is a line and a label, and the section
 * being read gets the long line. In-page anchors, so it works without
 * JavaScript; the tracking is the only client-side part.
 */
export function SectionNav({ label, items }: { label: string; items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const tops = items.map((i) => document.getElementById(i.id)?.getBoundingClientRect().top ?? Infinity)
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      setActive(items[activeSection(tops, window.innerHeight, window.scrollY, atBottom)]?.id)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [items])

  return (
    <nav aria-label={label} className="hidden lg:block print:hidden!">
      <ul className="ds-toc">
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} aria-current={active === i.id ? 'true' : undefined}>
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
