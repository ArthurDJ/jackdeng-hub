import { describe, expect, it } from 'vitest'
import { countPostsByTaxonomy, withPosts } from './taxonomyCounts'

describe('countPostsByTaxonomy', () => {
  it('counts bare ids from a depth-0 query', () => {
    const { categories, tags } = countPostsByTaxonomy([
      { category: 1, tags: [10, 11] },
      { category: 1, tags: [11] },
      { category: 2, tags: [] },
    ])
    expect(categories).toEqual(new Map([[1, 2], [2, 1]]))
    expect(tags).toEqual(new Map([[10, 1], [11, 2]]))
  })

  it('reads the id of populated relations', () => {
    const { categories, tags } = countPostsByTaxonomy([
      { category: { id: 3 }, tags: [{ id: 12 }, 13] },
    ])
    expect(categories.get(3)).toBe(1)
    expect(tags).toEqual(new Map([[12, 1], [13, 1]]))
  })

  it('skips posts with no category or no tags', () => {
    const { categories, tags } = countPostsByTaxonomy([
      { category: null, tags: null },
      { category: undefined, tags: [null] },
      {},
    ])
    expect(categories.size).toBe(0)
    expect(tags.size).toBe(0)
  })

  it('counts a post once when it lists the same tag twice', () => {
    const { tags } = countPostsByTaxonomy([{ tags: [10, { id: 10 }] }])
    expect(tags.get(10)).toBe(1)
  })
})

describe('withPosts', () => {
  const items = [
    { id: 1, name: 'Frontend' },
    { id: 2, name: 'Backend' },
    { id: 3, name: 'Database' },
    { id: 4, name: 'Career' },
  ]

  it('drops the items no post uses', () => {
    const result = withPosts(items, new Map([[2, 1], [4, 1]]))
    expect(result.map((i) => i.name)).toEqual(['Backend', 'Career'])
  })

  it('puts the most-used first and keeps input order on ties', () => {
    const result = withPosts(items, new Map([[1, 1], [2, 3], [3, 1]]))
    expect(result.map((i) => [i.name, i._count])).toEqual([
      ['Backend', 3],
      ['Frontend', 1],
      ['Database', 1],
    ])
  })

  it('returns an empty list when nothing has posts', () => {
    expect(withPosts(items, new Map())).toEqual([])
  })
})
