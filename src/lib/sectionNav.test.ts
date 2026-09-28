import { describe, expect, it } from 'vitest'
import { activeSection } from './sectionNav'

const H = 900 // line at 300

describe('activeSection', () => {
  it('marks the last section whose top has passed a third of the way down', () => {
    expect(activeSection([-800, -100, 250, 900], H, 1200, false)).toBe(2)
    expect(activeSection([-800, -100, 350, 900], H, 1200, false)).toBe(1)
  })

  it('marks the first section at the very top, even a short one', () => {
    expect(activeSection([100, 280, 900], H, 0, false)).toBe(0)
  })

  it('marks the last section at the very bottom, even one that never reaches the line', () => {
    expect(activeSection([-2000, -900, 500], H, 2400, true)).toBe(2)
  })

  it('does not jump to the last section on a page too short to scroll', () => {
    expect(activeSection([100, 400], H, 0, true)).toBe(0)
  })

  it('handles no sections', () => {
    expect(activeSection([], H, 0, false)).toBe(-1)
  })
})
