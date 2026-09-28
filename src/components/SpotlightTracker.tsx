'use client'

import { useEffect } from 'react'

/** Degrees a .ds-tilt card leans towards the pointer at its edge. */
const MAX_TILT = 5

/**
 * Feeds the pointer position to cards, for two effects in globals.css:
 *
 * - `.ds-spotlight`: --spot-x / --spot-y, the soft highlight under the cursor.
 * - `.ds-tilt`: --tilt-x / --tilt-y, a slight lean towards the cursor. Reset
 *   as soon as the pointer moves off the card or out of the window.
 *
 * One delegated listener for the whole page, mounted once in the layout, so
 * the cards themselves can stay server components. Only on devices that
 * hover; the tilt also stays off with reduced motion.
 */
export function SpotlightTracker() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return
    const tiltOn = window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    let frame = 0
    let last: PointerEvent | null = null
    let tilted: HTMLElement | null = null

    const untilt = () => {
      if (!tilted) return
      tilted.style.removeProperty('--tilt-x')
      tilted.style.removeProperty('--tilt-y')
      tilted = null
    }

    const paint = () => {
      frame = 0
      const e = last
      if (!e) return
      const target = e.target as Element | null
      const card = target?.closest?.('.ds-spotlight, .ds-tilt') as HTMLElement | null
      if (tilted && tilted !== card) untilt()
      if (!card) return
      const r = card.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (card.classList.contains('ds-spotlight')) {
        card.style.setProperty('--spot-x', `${x}px`)
        card.style.setProperty('--spot-y', `${y}px`)
      }
      if (tiltOn && card.classList.contains('ds-tilt')) {
        card.style.setProperty('--tilt-x', `${((0.5 - y / r.height) * 2 * MAX_TILT).toFixed(2)}deg`)
        card.style.setProperty('--tilt-y', `${((x / r.width - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`)
        tilted = card
      }
    }
    const onMove = (e: PointerEvent) => {
      last = e
      if (!frame) frame = requestAnimationFrame(paint)
    }
    // Leaving the window fires no pointermove on the way out.
    const onOut = (e: PointerEvent) => { if (!e.relatedTarget) untilt() }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
      if (frame) cancelAnimationFrame(frame)
      untilt()
    }
  }, [])
  return null
}
