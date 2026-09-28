/**
 * Which section the home page's section list should mark as current.
 *
 * `tops` are the sections' top edges relative to the viewport, in page
 * order. The current one is the last whose top has passed a line a third
 * of the way down the viewport. Two edges need their own rule: at the very
 * top the first section is current even when it is too short to reach the
 * line, and at the very bottom the last one is, even when it never can.
 */
export function activeSection(tops: number[], viewportH: number, scrollY: number, atBottom: boolean): number {
  if (!tops.length) return -1
  if (atBottom && scrollY > 0) return tops.length - 1
  if (scrollY < 8) return 0
  const line = viewportH / 3
  let current = 0
  tops.forEach((top, i) => { if (top <= line) current = i })
  return current
}
