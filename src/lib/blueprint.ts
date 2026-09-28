/**
 * Layout helpers for the Playground's blueprint wordmark: snapping to the
 * 8px grid DESIGN.md builds on, keeping a letter inside its sheet, and the
 * starting layout that centres a word on the grid.
 */

export const GRID = 8

export function snap(v: number, grid = GRID): number {
  return grid > 0 ? Math.round(v / grid) * grid : v
}

export function clamp(v: number, min: number, max: number): number {
  return max < min ? min : Math.min(max, Math.max(min, v))
}

export interface Box { x: number; y: number; w: number; h: number }

/** Moves a box by (dx, dy), snapping when asked, without leaving the sheet. */
export function moveBox(box: Box, dx: number, dy: number, sheet: { w: number; h: number }, snapTo: number | null): Box {
  let x = box.x + dx
  let y = box.y + dy
  if (snapTo) { x = snap(x, snapTo); y = snap(y, snapTo) }
  return { ...box, x: clamp(x, 0, sheet.w - box.w), y: clamp(y, 0, sheet.h - box.h) }
}

/**
 * Left edges for letters of the given widths, `gap` apart, centred on a
 * sheet `sheetW` wide and snapped to the grid. A space is just a wider gap.
 * When the word is wider than the sheet it starts at 0 rather than off-sheet.
 */
export function layoutWord(widths: number[], sheetW: number, gap: number, grid = GRID): number[] {
  const total = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, widths.length - 1)
  let x = Math.max(0, (sheetW - total) / 2)
  return widths.map((w) => {
    const at = snap(x, grid)
    x += w + gap
    return at
  })
}
