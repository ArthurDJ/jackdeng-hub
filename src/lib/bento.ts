/**
 * Column spans for a bento grid of `count` cards: one column on phones, two
 * from `sm`, three from `lg`.
 *
 * At `lg` the rows alternate a wide card with a narrow one ([2, 1], then
 * [1, 2]), so every row is full whatever the count; an odd last card takes
 * the whole row instead of leaving a gap. At `sm` every card is one column
 * and an odd last card spans both.
 *
 * The class names are written out in full so Tailwind finds them.
 */
export function bentoSpan(index: number, count: number): string {
  if (count % 2 === 1 && index === count - 1) return 'sm:col-span-2 lg:col-span-3'
  const wide = index % 4 === 0 || index % 4 === 3
  return wide ? 'lg:col-span-2' : 'lg:col-span-1'
}

/** The grid the spans above are written for. */
export const BENTO_GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
