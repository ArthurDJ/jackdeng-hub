import { describe, expect, it } from 'vitest'
import { resolveTheme, revealRadius } from './themeReveal'

describe('resolveTheme', () => {
  it('follows the OS for system', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
  it('keeps an explicit choice whatever the OS says', () => {
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')
  })
  it('treats anything unknown as light', () => {
    expect(resolveTheme('sepia', true)).toBe('light')
  })
})

describe('revealRadius', () => {
  it('reaches the farthest corner', () => {
    // From the top-right corner the farthest is bottom-left.
    expect(revealRadius(100, 0, 100, 50)).toBeCloseTo(Math.hypot(100, 50), 9)
    // From the centre every corner is equally far.
    expect(revealRadius(50, 25, 100, 50)).toBeCloseTo(Math.hypot(50, 25), 9)
  })
  it('covers the viewport from a point near an edge', () => {
    const r = revealRadius(1240, 26, 1280, 860)
    for (const [cx, cy] of [[0, 0], [1280, 0], [0, 860], [1280, 860]]) {
      expect(Math.hypot(cx - 1240, cy - 26)).toBeLessThanOrEqual(r + 1e-9)
    }
  })
})
