import { describe, expect, it } from 'vitest'
import { decideMedia, describeConflict } from './mediaReuse'

const jpeg = (size: number) => ({ size, width: 1600, height: 900, mimeType: 'image/jpeg' })

describe('decideMedia: formats Payload stores unchanged (size compared)', () => {
  it('reuses a row whose size matches the local file', () => {
    expect(decideMedia({ id: 61, filesize: 2048, mimeType: 'image/jpeg' }, jpeg(2048))).toEqual({ kind: 'reuse', id: 61 })
  })

  it('refuses a jpeg row with the same name but a different size, even with equal dimensions', () => {
    // A new image that happens to share a name with an older upload would
    // otherwise be replaced by the old one.
    expect(decideMedia({ id: 61, filesize: 2048, width: 1600, height: 900, mimeType: 'image/jpeg' }, jpeg(4096)))
      .toEqual({ kind: 'conflict', id: 61, basis: 'size', rowSize: 2048, localSize: 4096 })
  })

  it('compares a filesize the database returned as a string', () => {
    // Postgres numeric columns can come back as strings.
    expect(decideMedia({ id: 61, filesize: '2048', mimeType: 'image/png' }, { size: 2048, mimeType: 'image/png' }).kind).toBe('reuse')
  })

  it('reuses a row with no size, with a note', () => {
    const d = decideMedia({ id: 61, filesize: null, mimeType: 'image/png' }, { size: 4096, mimeType: 'image/png' })
    expect(d).toMatchObject({ kind: 'reuse', id: 61 })
    expect(d.kind === 'reuse' && d.note).toMatch(/no file size/)
  })
})

describe('decideMedia: formats Payload re-encodes (dimensions compared)', () => {
  // media 54: astrbot-whale-girl.webp, stored at 98394 bytes from a 102472-byte file.
  const row = { id: 54, filesize: '98394', width: '800', height: '1422', mimeType: 'image/webp' }

  it('reuses a webp row with the same dimensions although the size differs', () => {
    expect(decideMedia(row, { size: 102472, width: 800, height: 1422, mimeType: 'image/webp' })).toEqual({ kind: 'reuse', id: 54 })
  })

  it('refuses a webp row with different dimensions', () => {
    expect(decideMedia(row, { size: 98394, width: 600, height: 600, mimeType: 'image/webp' })).toEqual({
      kind: 'conflict', id: 54, basis: 'dimensions', rowDims: { width: 800, height: 1422 }, localDims: { width: 600, height: 600 },
    })
  })

  it('treats gif and tiff the same way', () => {
    for (const mimeType of ['image/gif', 'image/tiff']) {
      expect(decideMedia({ ...row, mimeType }, { size: 1, width: 800, height: 1422, mimeType }).kind).toBe('reuse')
    }
  })

  it('falls back to the local type when the row has none', () => {
    expect(decideMedia({ ...row, mimeType: null }, { size: 102472, width: 800, height: 1422, mimeType: 'image/webp' }).kind).toBe('reuse')
  })

  it('reuses a row without dimensions, with a note', () => {
    const d = decideMedia({ id: 54, filesize: 98394, mimeType: 'image/webp' }, { size: 102472, width: 800, height: 1422, mimeType: 'image/webp' })
    expect(d).toMatchObject({ kind: 'reuse', id: 54 })
    expect(d.kind === 'reuse' && d.note).toMatch(/dimensions are unknown/)
  })

  it('reuses with a note when the local dimensions could not be read', () => {
    const d = decideMedia(row, { size: 102472, width: null, height: null, mimeType: 'image/webp' })
    expect(d.kind === 'reuse' && d.note).toMatch(/dimensions are unknown/)
  })
})

describe('decideMedia: no row or no local file', () => {
  it('reuses a row when there is no local file to compare it with', () => {
    expect(decideMedia({ id: 61, filesize: 2048, mimeType: 'image/jpeg' }, null)).toEqual({ kind: 'reuse', id: 61 })
  })

  it('uploads a local file with no row, and reports a file that is in neither place', () => {
    expect(decideMedia(null, jpeg(4096))).toEqual({ kind: 'upload' })
    expect(decideMedia(null, null)).toEqual({ kind: 'missing' })
  })
})

describe('describeConflict', () => {
  it('names the row, both sizes and what to do', () => {
    const d = decideMedia({ id: 61, filesize: 2048, mimeType: 'image/png' }, { size: 10240, mimeType: 'image/png' })
    if (d.kind !== 'conflict') throw new Error('expected a conflict')
    expect(describeConflict('chart.png', d)).toBe(
      'media 61 has the same name as chart.png but a different file (2 KB there, 10 KB here); rename the image',
    )
  })

  it('names both dimensions for a re-encoded format', () => {
    const d = decideMedia({ id: 54, width: 800, height: 1422, mimeType: 'image/webp' }, { size: 1, width: 600, height: 600, mimeType: 'image/webp' })
    if (d.kind !== 'conflict') throw new Error('expected a conflict')
    expect(describeConflict('a.webp', d)).toBe(
      'media 54 has the same name as a.webp but a different file (800×1422 there, 600×600 here); rename the image',
    )
  })
})
