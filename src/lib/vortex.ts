/**
 * Geometry for the Playground's text vortex: where each glyph of a phrase
 * sits on a ring, and how a displaced glyph springs back.
 *
 * A ring holds as many whole copies of the phrase as fit its circumference,
 * then spreads them evenly so the last glyph meets the first without a gap
 * or an overlap. Narrow glyphs (Latin) get more copies than wide ones (CJK).
 */

export interface RingLayout {
  /** Angle of each glyph's centre, radians, in [0, 2π). */
  angles: number[]
  /** Index into the phrase for each glyph. */
  chars: number[]
  repeats: number
}

/** `widths` are the advance widths of the phrase's glyphs, in the same unit as `radius`. */
export function layoutRing(widths: number[], radius: number): RingLayout {
  const phrase = widths.reduce((a, b) => a + b, 0)
  if (!widths.length || phrase <= 0 || radius <= 0) return { angles: [], chars: [], repeats: 0 }
  const circumference = 2 * Math.PI * radius
  const repeats = Math.max(1, Math.floor(circumference / phrase))
  const scale = circumference / (repeats * phrase)
  const angles: number[] = []
  const chars: number[] = []
  let along = 0
  for (let r = 0; r < repeats; r++) {
    widths.forEach((w, i) => {
      angles.push(((along + w / 2) * scale) / radius)
      chars.push(i)
      along += w
    })
  }
  return { angles, chars, repeats }
}

/**
 * Ring radii from `inner` out to `outer`, `gap` apart. Too small an area gets
 * no rings rather than one squeezed ring.
 */
export function ringRadii(inner: number, outer: number, gap: number): number[] {
  const out: number[] = []
  if (gap <= 0) return out
  for (let r = inner; r <= outer; r += gap) out.push(r)
  return out
}

export interface Body { x: number; y: number; vx: number; vy: number }

/**
 * One step of a damped spring toward the origin, plus a push away from a
 * pointer at (px, py) within `reach`. Offsets are relative to the glyph's
 * home position, so (0, 0) is at rest.
 */
export function springStep(
  b: Body,
  pointer: { x: number; y: number } | null,
  reach: number,
  { stiffness = 0.06, damping = 0.86, push = 7 } = {},
): Body {
  let ax = -b.x * stiffness
  let ay = -b.y * stiffness
  if (pointer) {
    const dx = b.x - pointer.x
    const dy = b.y - pointer.y
    const d = Math.hypot(dx, dy)
    if (d < reach && d > 0.001) {
      const f = (1 - d / reach) * push
      ax += (dx / d) * f
      ay += (dy / d) * f
    }
  }
  const vx = (b.vx + ax) * damping
  const vy = (b.vy + ay) * damping
  return { x: b.x + vx, y: b.y + vy, vx, vy }
}
