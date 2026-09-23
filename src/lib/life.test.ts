import { describe, it, expect } from 'vitest'
import { lifeStep } from './life'

const COLS = 12
const ROWS = 12

function grid(cells: [number, number][], cols = COLS, rows = ROWS) {
  const g = new Uint8Array(cols * rows)
  for (const [x, y] of cells) g[y * cols + x] = 1
  return g
}

function live(g: Uint8Array, cols = COLS) {
  const out: [number, number][] = []
  for (let i = 0; i < g.length; i++) if (g[i]) out.push([i % cols, Math.floor(i / cols)])
  return out.sort((a, b) => a[1] - b[1] || a[0] - b[0])
}

function advance(g: Uint8Array, n: number, cols = COLS, rows = ROWS) {
  let cur: Uint8Array = g
  let next: Uint8Array = new Uint8Array(cols * rows)
  for (let i = 0; i < n; i++) {
    next = lifeStep(cur, next, cols, rows)
    const tmp = cur
    cur = next
    next = tmp
  }
  return cur
}

describe('lifeStep', () => {
  it('leaves an empty board empty', () => {
    expect(live(advance(grid([]), 5))).toEqual([])
  })

  it('holds a block still — the 2x2 still life never changes', () => {
    const block: [number, number][] = [[3, 3], [4, 3], [3, 4], [4, 4]]
    expect(live(advance(grid(block), 1))).toEqual(block.sort((a, b) => a[1] - b[1] || a[0] - b[0]))
    expect(live(advance(grid(block), 10))).toEqual(block.sort((a, b) => a[1] - b[1] || a[0] - b[0]))
  })

  it('oscillates a blinker with period 2', () => {
    const horizontal: [number, number][] = [[3, 4], [4, 4], [5, 4]]
    const vertical: [number, number][] = [[4, 3], [4, 4], [4, 5]]
    expect(live(advance(grid(horizontal), 1))).toEqual(vertical)
    expect(live(advance(grid(horizontal), 2))).toEqual(horizontal)
    // An odd number of steps must land on the other phase, not drift.
    expect(live(advance(grid(horizontal), 7))).toEqual(vertical)
  })

  it('walks a glider one cell diagonally every four generations', () => {
    const glider: [number, number][] = [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]
    const after4 = live(advance(grid(glider), 4))
    const expected = glider.map(([x, y]) => [x + 1, y + 1]).sort((a, b) => a[1] - b[1] || a[0] - b[0])
    expect(after4).toEqual(expected)
    // Still five cells: a glider that gains or loses one is not a glider.
    expect(after4).toHaveLength(5)
  })

  it('wraps at the edges instead of clipping', () => {
    // A blinker straddling the right edge stays three cells wide. With clipped
    // edges the wrapped cell would be lost and the pattern would die.
    const straddling: [number, number][] = [[COLS - 1, 5], [0, 5], [1, 5]]
    expect(live(advance(grid(straddling), 1))).toHaveLength(3)
    expect(live(advance(grid(straddling), 2))).toEqual(
      straddling.sort((a, b) => a[1] - b[1] || a[0] - b[0]),
    )
  })

  it('births on exactly three neighbours and not on two or four', () => {
    // Three in an L: the empty corner has exactly 3 neighbours and must light up.
    const born = live(advance(grid([[1, 1], [2, 1], [1, 2]]), 1))
    expect(born).toContainEqual([2, 2])

    // A lone pair has at most one neighbour each and must die out entirely.
    expect(live(advance(grid([[5, 5], [6, 5]]), 1))).toEqual([])
  })

  it('kills a cell with four or more neighbours', () => {
    // Centre of a filled 3x3 has 8 neighbours; the corners have 3 and survive
    // as part of the ring, but the centre must be gone.
    const filled: [number, number][] = []
    for (let y = 4; y <= 6; y++) for (let x = 4; x <= 6; x++) filled.push([x, y])
    expect(live(advance(grid(filled), 1))).not.toContainEqual([5, 5])
  })
})
