import { describe, expect, it } from 'vitest'
import { latest, latestByTaxonomy, postModified } from './sitemapDates'

describe('latest', () => {
  it('picks the newest instant, whatever the offset', () => {
    expect(latest(['2026-09-20T10:00:00.000Z', '2026-09-28T00:00:00-07:00', null, '2026-09-28T06:00:00.000Z'])).toBe('2026-09-28T00:00:00-07:00')
  })

  it('has nothing to say about no dates', () => {
    expect(latest([])).toBeUndefined()
    expect(latest([null, undefined, '', 'soon'])).toBeUndefined()
  })
})

describe('postModified', () => {
  it('follows an edit after publishing', () => {
    expect(postModified({ publishedAt: '2026-09-22T00:00:00.000Z', updatedAt: '2026-09-27T00:00:00.000Z' })).toBe('2026-09-27T00:00:00.000Z')
  })

  it('falls back to whichever date there is', () => {
    expect(postModified({ publishedAt: '2026-09-22T00:00:00.000Z' })).toBe('2026-09-22T00:00:00.000Z')
    expect(postModified({})).toBeUndefined()
  })
})

describe('latestByTaxonomy', () => {
  it('dates each category and tag by its newest post, at any depth', () => {
    const { categories, tags } = latestByTaxonomy([
      { category: 1, tags: [10, 11], updatedAt: '2026-09-20T00:00:00.000Z' },
      { category: { id: 1 }, tags: [{ id: 11 }], updatedAt: '2026-09-25T00:00:00.000Z' },
      { category: 2, tags: null, publishedAt: '2026-09-21T00:00:00.000Z' },
      { category: null, tags: [12], updatedAt: null },
    ])
    expect(Object.fromEntries(categories)).toEqual({ 1: '2026-09-25T00:00:00.000Z', 2: '2026-09-21T00:00:00.000Z' })
    expect(Object.fromEntries(tags)).toEqual({ 10: '2026-09-20T00:00:00.000Z', 11: '2026-09-25T00:00:00.000Z' })
  })
})
