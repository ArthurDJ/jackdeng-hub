import { describe, expect, it } from 'vitest'
import { layoutRing, ringRadii, springStep } from './vortex'

describe('layoutRing', () => {
  it('fits as many whole copies as the circumference allows', () => {
    const r = 100 // circumference ≈ 628
    expect(layoutRing([10, 10, 10], r).repeats).toBe(20) // 30 per copy
    expect(layoutRing([200, 200], r).repeats).toBe(1)
  })

  it('always places at least one copy, even when it overflows', () => {
    const l = layoutRing([500, 500], 50)
    expect(l.repeats).toBe(1)
    expect(l.angles).toHaveLength(2)
  })

  it('spreads equal glyphs evenly around the whole ring', () => {
    const { angles } = layoutRing([10, 10, 10, 10], 100)
    const step = angles[1] - angles[0]
    for (let i = 1; i < angles.length; i++) expect(angles[i] - angles[i - 1]).toBeCloseTo(step, 9)
    // The gap from the last glyph back to the first is one step too.
    expect(2 * Math.PI - angles.at(-1)! + angles[0]).toBeCloseTo(step, 9)
  })

  it('keeps every angle inside one turn and in order', () => {
    const { angles } = layoutRing([6, 14, 9, 20, 7], 80)
    expect(angles[0]).toBeGreaterThan(0)
    expect(angles.at(-1)!).toBeLessThan(2 * Math.PI)
    for (let i = 1; i < angles.length; i++) expect(angles[i]).toBeGreaterThan(angles[i - 1])
  })

  it('maps each glyph back to its place in the phrase', () => {
    const { chars, repeats } = layoutRing([10, 20, 30], 100)
    expect(chars).toHaveLength(3 * repeats)
    expect(chars.slice(0, 6)).toEqual([0, 1, 2, 0, 1, 2])
  })

  it('returns nothing for an empty phrase or a zero radius', () => {
    expect(layoutRing([], 100).angles).toEqual([])
    expect(layoutRing([10], 0).angles).toEqual([])
  })
})

describe('ringRadii', () => {
  it('steps from inner to outer', () => {
    expect(ringRadii(40, 100, 20)).toEqual([40, 60, 80, 100])
  })
  it('is empty when there is no room', () => {
    expect(ringRadii(40, 30, 20)).toEqual([])
    expect(ringRadii(40, 100, 0)).toEqual([])
  })
})

describe('springStep', () => {
  it('settles back to rest', () => {
    let b = { x: 30, y: -20, vx: 0, vy: 0 }
    for (let i = 0; i < 400; i++) b = springStep(b, null, 50)
    expect(Math.hypot(b.x, b.y)).toBeLessThan(0.01)
  })

  it('stays put at rest with no pointer', () => {
    expect(springStep({ x: 0, y: 0, vx: 0, vy: 0 }, null, 50)).toEqual({ x: 0, y: 0, vx: 0, vy: 0 })
  })

  it('is pushed away from a nearby pointer', () => {
    const b = springStep({ x: 0, y: 0, vx: 0, vy: 0 }, { x: 10, y: 0 }, 50)
    expect(b.x).toBeLessThan(0)
    expect(b.y).toBeCloseTo(0, 9)
  })

  it('ignores a pointer out of reach', () => {
    expect(springStep({ x: 0, y: 0, vx: 0, vy: 0 }, { x: 80, y: 0 }, 50)).toEqual({ x: 0, y: 0, vx: 0, vy: 0 })
  })
})
