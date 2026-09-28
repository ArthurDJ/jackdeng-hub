import { describe, expect, it } from 'vitest'
import { GROUP_RGB, groupColour, spawnPoints } from './skillDrop'
import { seeded } from './seeded'

const sizes = Array.from({ length: 26 }, (_, i) => ({ w: 60 + (i % 5) * 12, h: 30 }))

describe('spawnPoints', () => {
  it('starts every pill above the box', () => {
    for (const p of spawnPoints(sizes, 800, seeded(1))) expect(p.y).toBeLessThan(0)
  })

  it('keeps every pill fully between the walls', () => {
    spawnPoints(sizes, 800, seeded(2)).forEach((p, i) => {
      expect(p.x - sizes[i].w / 2).toBeGreaterThanOrEqual(0)
      expect(p.x + sizes[i].w / 2).toBeLessThanOrEqual(800)
    })
  })

  it('stacks later pills higher, four to a row', () => {
    const ps = spawnPoints(sizes, 800, () => 0)
    expect(ps[0].y).toBe(ps[3].y)
    expect(ps[4].y).toBeLessThan(ps[3].y)
  })

  it('centres a pill wider than the box instead of pushing it out', () => {
    expect(spawnPoints([{ w: 900, h: 30 }], 800, () => 0.7)[0].x).toBe(450)
  })

  it('is repeatable with a seeded random', () => {
    expect(spawnPoints(sizes, 800, seeded(9))).toEqual(spawnPoints(sizes, 800, seeded(9)))
  })
})

describe('groupColour', () => {
  it('cycles through the palette', () => {
    expect(groupColour(0)).toBe(GROUP_RGB[0])
    expect(groupColour(GROUP_RGB.length)).toBe(GROUP_RGB[0])
    expect(groupColour(-1)).toBe(GROUP_RGB.at(-1))
  })
})
