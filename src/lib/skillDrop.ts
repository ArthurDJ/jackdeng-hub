/**
 * Where the Playground's falling skills start: above the box, spread across
 * its width in staggered rows so they do not all land in one column, and
 * never so close to a wall that a pill starts half inside it.
 */

export interface Size { w: number; h: number }
export interface Point { x: number; y: number }

/**
 * Centre points for pills of the given sizes, in box coordinates (y < 0 is
 * above the top edge). `random` is injectable so tests get a fixed layout.
 */
export function spawnPoints(sizes: Size[], boxW: number, random: () => number = Math.random, rowGap = 56): Point[] {
  return sizes.map((s, i) => {
    const half = s.w / 2
    const span = Math.max(0, boxW - s.w)
    const row = Math.floor(i / 4)
    return {
      x: half + random() * span,
      y: -(row + 1) * rowGap - random() * rowGap * 0.5,
    }
  })
}

/** Five colours that read on both panel tokens, one per skill group. */
export const GROUP_RGB = ['59 130 246', '214 158 74', '110 190 140', '232 121 169', '160 140 230'] as const

export function groupColour(group: number): string {
  return GROUP_RGB[((group % GROUP_RGB.length) + GROUP_RGB.length) % GROUP_RGB.length]
}
