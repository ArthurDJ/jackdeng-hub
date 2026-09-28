'use client'

import { useEffect, useState } from 'react'

const DIGITS = '0123456789'
const TICK_MS = 70
/** Ticks before the first tile lands, and the gap between tiles landing. */
const FIRST_STOP = 8
const STAGGER = 4

/**
 * Split-flap tiles for a short string (the 404 page). The server renders the
 * final text, so without JavaScript it simply reads "404". After hydration
 * each tile flips through random digits and the tiles land left to right.
 * Screen readers get the plain text once; reduced motion skips the flipping.
 */
export function SplitFlap({ text }: { text: string }) {
  const [shown, setShown] = useState(text)

  useEffect(() => {
    // Skip it in a background tab too: throttled timers would drag it out.
    if (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const last = FIRST_STOP + (text.length - 1) * STAGGER
    let tick = 0
    const id = window.setInterval(() => {
      tick++
      setShown(
        [...text]
          .map((ch, i) => (tick >= FIRST_STOP + i * STAGGER ? ch : DIGITS[Math.floor(Math.random() * DIGITS.length)]))
          .join(''),
      )
      if (tick >= last) window.clearInterval(id)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [text])

  return (
    <p className="ds-flap-row">
      <span className="sr-only">{text}</span>
      {[...shown].map((ch, i) => (
        <span key={i} className="ds-flap" aria-hidden="true">
          {/* A new key per character replays the flip on each change. */}
          <span key={ch}>{ch}</span>
        </span>
      ))}
    </p>
  )
}
