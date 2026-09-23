/**
 * One generation of Conway's Game of Life, B3/S23, on a torus.
 *
 * Pulled out of the component so the rule can be tested against known patterns
 * — a block that must not move, a blinker that must flip, a glider that must
 * travel one cell diagonally every four generations. None of that is checkable
 * by looking at a canvas, and an automaton with a subtly wrong neighbour count
 * still produces something that flickers convincingly.
 *
 * Edges wrap rather than clip: a glider that reaches a wall keeps going instead
 * of collapsing, which is most of the point of leaving the toy running.
 *
 * `next` is passed in and returned so the caller can swap two buffers between
 * frames rather than allocating a grid 12 times a second.
 */
export function lifeStep(
  cur: Uint8Array,
  next: Uint8Array,
  cols: number,
  rows: number,
): Uint8Array {
  for (let y = 0; y < rows; y++) {
    const up = ((y - 1 + rows) % rows) * cols
    const mid = y * cols
    const down = ((y + 1) % rows) * cols
    for (let x = 0; x < cols; x++) {
      const l = (x - 1 + cols) % cols
      const r = (x + 1) % cols
      const n =
        cur[up + l] + cur[up + x] + cur[up + r] +
        cur[mid + l] + cur[mid + r] +
        cur[down + l] + cur[down + x] + cur[down + r]
      next[mid + x] = n === 3 || (n === 2 && cur[mid + x]) ? 1 : 0
    }
  }
  return next
}
