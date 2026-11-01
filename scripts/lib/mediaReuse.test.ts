import { describe, expect, it } from 'vitest'
import { decideMedia, describeConflict } from './mediaReuse'

describe('decideMedia', () => {
  it('reuses a row whose size matches the local file', () => {
    expect(decideMedia({ id: 61, filesize: 2048 }, 2048)).toEqual({ kind: 'reuse', id: 61 })
  })

  it('refuses a row with the same name but a different size', () => {
    // A new image that happens to share a name with an older upload would
    // otherwise be replaced by the old one.
    expect(decideMedia({ id: 61, filesize: 2048 }, 4096)).toEqual({ kind: 'conflict', id: 61, rowSize: 2048, localSize: 4096 })
  })

  it('compares a filesize the database returned as a string', () => {
    // Postgres numeric columns can come back as strings.
    expect(decideMedia({ id: 61, filesize: '2048' as unknown as number }, 2048).kind).toBe('reuse')
  })

  it('reuses a row when there is no local file, or the row has no size, to compare', () => {
    expect(decideMedia({ id: 61, filesize: 2048 }, null)).toEqual({ kind: 'reuse', id: 61 })
    expect(decideMedia({ id: 61, filesize: null }, 4096)).toEqual({ kind: 'reuse', id: 61 })
  })

  it('uploads a local file with no row, and reports a file that is in neither place', () => {
    expect(decideMedia(null, 4096)).toEqual({ kind: 'upload' })
    expect(decideMedia(null, null)).toEqual({ kind: 'missing' })
  })
})

describe('describeConflict', () => {
  it('names the row, both sizes and what to do', () => {
    const d = decideMedia({ id: 61, filesize: 2048 }, 10240)
    if (d.kind !== 'conflict') throw new Error('expected a conflict')
    expect(describeConflict('chart.png', d)).toBe(
      'media 61 has the same name as chart.png but a different file (2 KB there, 10 KB here); rename the image',
    )
  })
})
