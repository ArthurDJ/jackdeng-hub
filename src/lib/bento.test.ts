import { describe, expect, it } from 'vitest'
import { bentoSpan } from './bento'

// How many of the three lg columns each card takes.
const lgWidth = (cls: string) => Number(cls.match(/lg:col-span-(\d)/)![1])

// Split cards into lg rows of three columns and return each row's widths.
function lgRows(count: number): number[][] {
  const rows: number[][] = [[]]
  for (let i = 0; i < count; i++) {
    const w = lgWidth(bentoSpan(i, count))
    const row = rows[rows.length - 1]
    if (row.reduce((a, b) => a + b, 0) + w > 3) rows.push([w])
    else row.push(w)
  }
  return rows
}

describe('bentoSpan', () => {
  it('fills every lg row for any count from 1 to 12', () => {
    for (let n = 1; n <= 12; n++) {
      for (const row of lgRows(n)) expect(row.reduce((a, b) => a + b, 0)).toBe(3)
    }
  })

  it('alternates wide and narrow: four cards make [2, 1] and [1, 2]', () => {
    expect(lgRows(4)).toEqual([[2, 1], [1, 2]])
  })

  it('lets an odd last card take the whole row, and both sm columns', () => {
    expect(lgRows(5)).toEqual([[2, 1], [1, 2], [3]])
    expect(bentoSpan(4, 5)).toContain('sm:col-span-2')
    expect(bentoSpan(0, 5)).not.toContain('sm:col-span-2')
  })
})
