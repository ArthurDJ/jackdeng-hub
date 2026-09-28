/**
 * Geometry and naming for the theme switch's circular reveal: the new theme
 * grows as a circle from the control that was pressed until it covers the
 * whole viewport.
 */

export type Resolved = 'light' | 'dark'

/** What a theme choice renders as: "system" follows the OS setting. */
export function resolveTheme(value: string, prefersDark: boolean): Resolved {
  if (value === 'system') return prefersDark ? 'dark' : 'light'
  return value === 'dark' ? 'dark' : 'light'
}

/** Radius from (x, y) to the farthest corner of a w × h viewport. */
export function revealRadius(x: number, y: number, w: number, h: number): number {
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y))
}
