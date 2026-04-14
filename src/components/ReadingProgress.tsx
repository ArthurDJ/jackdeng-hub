'use client'

import { useEffect, useState } from 'react'

/**
 * Thin accent-coloured bar fixed at the very top of the viewport.
 * Fills from 0% → 100% as the user scrolls through the page.
 * Zero layout shift — height is 2 px and z-index sits above the navbar.
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: 2,
        width: `${progress}%`,
        background: 'var(--accent-primary)',
        zIndex: 9999,
        transition: 'width 80ms linear',
        borderRadius: '0 1px 1px 0',
        pointerEvents: 'none',
      }}
    />
  )
}
