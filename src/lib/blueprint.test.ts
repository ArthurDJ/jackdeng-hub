import { describe, expect, it } from 'vitest'
import { clamp, layoutWord, moveBox, snap } from './blueprint'

describe('snap', () => {
  it('rounds to the nearest grid line', () => {
    expect(snap(11)).toBe(8)
    expect(snap(12)).toBe(16)
    expect(snap(-3)).toBe(-0)
    expect(snap(37, 10)).toBe(40)
  })
  it('passes values through with no grid', () => {
    expect(snap(11.3, 0)).toBe(11.3)
  })
})

describe('clamp', () => {
  it('keeps a value in range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })
  it('falls back to the minimum when the range is empty', () => {
    expect(clamp(5, 10, 0)).toBe(10)
  })
})

describe('moveBox', () => {
  const sheet = { w: 400, h: 200 }
  const box = { x: 40, y: 40, w: 50, h: 60 }

  it('moves and snaps', () => {
    expect(moveBox(box, 13, 3, sheet, 8)).toMatchObject({ x: 56, y: 40 })
  })
  it('moves freely without snapping', () => {
    expect(moveBox(box, 13, 3, sheet, null)).toMatchObject({ x: 53, y: 43 })
  })
  it('stays on the sheet', () => {
    expect(moveBox(box, -500, 500, sheet, 8)).toMatchObject({ x: 0, y: 140 })
    expect(moveBox(box, 1000, -1000, sheet, null)).toMatchObject({ x: 350, y: 0 })
  })
  it('keeps its size', () => {
    expect(moveBox(box, 9, 9, sheet, 8)).toMatchObject({ w: 50, h: 60 })
  })
})

describe('layoutWord', () => {
  it('centres the word and snaps each letter', () => {
    const xs = layoutWord([40, 40, 40], 400, 8)
    // total 136, start (400 - 136) / 2 = 132, snapped to 136
    expect(xs[0]).toBe(136)
    for (const x of xs) expect(x % 8).toBe(0)
    expect(xs).toEqual([...xs].sort((a, b) => a - b))
  })
  it('starts at 0 when the word is wider than the sheet', () => {
    expect(layoutWord([300, 300], 400, 8)[0]).toBe(0)
  })
  it('handles an empty word', () => {
    expect(layoutWord([], 400, 8)).toEqual([])
  })
})
