'use client'

import { useEffect } from 'react'

/**
 * Feeds the pointer position to `.ds-spotlight` cards, as the CSS variables
 * --spot-x and --spot-y, for the soft highlight that follows the cursor
 * (globals.css). One delegated listener for the whole page, mounted once in
 * the layout, so the cards themselves can stay server components.
 *
 * Only on devices that hover; touch screens never see the highlight.
 */
export function SpotlightTracker() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return
    let frame = 0
    let last: PointerEvent | null = null

    const paint = () => {
      frame = 0
      const e = last
      if (!e) return
      const card = (e.target as Element | null)?.closest?.('.ds-spotlight') as HTMLElement | null
      if (!card) return
      const r = card.getBoundingClientRect()
      card.style.setProperty('--spot-x', `${e.clientX - r.left}px`)
      card.style.setProperty('--spot-y', `${e.clientY - r.top}px`)
    }
    const onMove = (e: PointerEvent) => {
      last = e
      if (!frame) frame = requestAnimationFrame(paint)
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      document.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  return null
}
