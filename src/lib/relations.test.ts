import { describe, expect, it } from 'vitest'
import { populated, populatedList } from './relations'

type Doc = { id: number; name: string }
const doc: Doc = { id: 1, name: 'PostgreSQL' }

describe('populated', () => {
  it('returns the document when the relation was populated', () => {
    expect(populated<Doc>(doc)).toBe(doc)
  })

  it('returns null for a bare id', () => {
    // depth 0, or a relation Payload could not resolve
    expect(populated<Doc>(7)).toBeNull()
  })

  it('returns null for an empty field', () => {
    expect(populated<Doc>(null)).toBeNull()
    expect(populated<Doc>(undefined)).toBeNull()
  })
})

describe('populatedList', () => {
  it('keeps documents and drops bare ids', () => {
    expect(populatedList<Doc>([doc, 3, { id: 2, name: 'Docker' }])).toEqual([doc, { id: 2, name: 'Docker' }])
  })

  it('drops nulls inside the list', () => {
    expect(populatedList<Doc>([doc, null as unknown as Doc])).toEqual([doc])
  })

  it('returns an empty list for an empty field', () => {
    expect(populatedList<Doc>(null)).toEqual([])
    expect(populatedList<Doc>(undefined)).toEqual([])
  })
})
