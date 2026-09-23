import { describe, expect, it } from 'vitest'
import { lexicalToText, parseQuery, search, type SearchDoc } from './search'

/** The shape Payload stores: { root: { children } }. */
const doc = (...children: unknown[]) => ({ root: { type: 'root', children } })
const p = (...children: unknown[]) => ({ type: 'paragraph', children })
const text = (t: string) => ({ type: 'text', text: t })
const link = (t: string) => ({ type: 'link', children: [text(t)] })

const entry = (over: Partial<SearchDoc> & Pick<SearchDoc, 'id'>): SearchDoc => ({
  type: 'post',
  label: '',
  description: '',
  href: `/blog/${over.id}`,
  keywords: '',
  body: '',
  ...over,
})

describe('lexicalToText', () => {
  it('descends into root rather than the document', () => {
    expect(lexicalToText(doc(p(text('hello'))))).toBe('hello')
  })

  it('separates blocks so words do not fuse across paragraphs', () => {
    expect(lexicalToText(doc(p(text('end')), p(text('start'))))).toBe('end start')
  })

  it('does not split a word around an inline link', () => {
    expect(lexicalToText(doc(p(text('see '), link('docs'), text('.'))))).toBe('see docs.')
  })

  it('returns an empty string for missing content', () => {
    expect(lexicalToText(null)).toBe('')
    expect(lexicalToText(undefined)).toBe('')
  })
})

describe('parseQuery', () => {
  it('lowercases, splits on whitespace and drops duplicates', () => {
    expect(parseQuery('  Postgres   postgres INDEX ')).toEqual(['postgres', 'index'])
  })

  it('folds full-width Latin from Chinese input methods', () => {
    expect(parseQuery('ＳＱＬ')).toEqual(['sql'])
  })

  it('keeps an unspaced Chinese query as one term', () => {
    expect(parseQuery('数据库迁移')).toEqual(['数据库迁移'])
  })
})

describe('search', () => {
  const docs = [
    entry({ id: 'a', label: 'Before you give an agent a key', description: 'On credentials.', body: 'An agent needs a token. The token lives in the keychain, never in the remote URL.' }),
    entry({ id: 'b', label: 'Three dates worth checking', description: 'Date handling.', keywords: 'PostgreSQL Backend', body: 'Most of this is about calendars, leap years and the ISO week. Timezones are where it goes wrong.' }),
    entry({ id: 'c', type: 'tag', label: 'PostgreSQL', href: '/blog/tag/postgresql' }),
    entry({ id: 'd', label: '数据库迁移的两步法', description: '先加后删。', body: '零停机的关键是先加列。' }),
  ]

  it('finds text that only appears in the body', () => {
    expect(search(docs, 'keychain').map((r) => r.id)).toEqual(['a'])
  })

  it('requires every term to match', () => {
    expect(search(docs, 'keychain timezones')).toEqual([])
  })

  it('ranks a label match above a keyword match', () => {
    expect(search(docs, 'postgresql').map((r) => r.id)).toEqual(['c', 'b'])
  })

  it('anchors Latin terms to the start of a word', () => {
    const words = [
      entry({ id: 'tool', type: 'tool', label: 'Falling Sand', description: 'A sandbox.' }),
      entry({ id: 'post', label: 'Retries', body: 'On the tens of thousands of calls.' }),
    ]
    expect(search(words, 'sand').map((r) => r.id)).toEqual(['tool'])
    // Prefix, not whole word: a half-typed query still finds it.
    expect(search(words, 'sandb').map((r) => r.id)).toEqual(['tool'])
  })

  it('treats regex characters in a query as literal text', () => {
    const cpp = [entry({ id: 'cpp', label: 'C++ notes' })]
    expect(search(cpp, 'c++').map((r) => r.id)).toEqual(['cpp'])
    expect(search(cpp, '(')).toEqual([])
  })

  it('matches Chinese as a substring', () => {
    expect(search(docs, '两步').map((r) => r.id)).toEqual(['d'])
  })

  it('shows a body snippet when nothing visible explains the match', () => {
    const [hit] = search(docs, 'keychain')
    expect(hit.description).toContain('keychain')
    expect(hit.description).not.toBe('On credentials.')
  })

  it('does not open or close a snippet in the middle of a word', () => {
    const long = [entry({
      id: 'long',
      label: 'Budgets',
      body: 'One dependency with a contractual ceiling consumes the entire budget by itself. No amount of retry logic, caching or redundancy on our side moves a number that a contract pins down.',
    })]
    const d = search(long, 'retry')[0].description
    expect(d).toMatch(/^…[A-Z]?[a-z]+ /)
    expect(d.slice(1)).toMatch(/^\S+ /)
    const words = d.replace(/^…|…$/g, '').split(' ')
    const bodyWords = new Set(long[0].body.split(' '))
    expect(bodyWords.has(words[0])).toBe(true)
    expect(bodyWords.has(words[words.length - 1])).toBe(true)
  })

  it('keeps the description when the label already explains the match', () => {
    // "agent" is in the body too, so a snippet would be non-empty here.
    expect(search(docs, 'agent')[0].description).toBe('On credentials.')
  })

  it('snippets from a term that is in the body, not one that hit a keyword', () => {
    // "backend" matches b's keywords, "timezones" its body; the snippet must
    // come from the second term or it would be empty.
    expect(search(docs, 'backend timezones')[0].description).toContain('Timezones')
  })

  it('returns nothing for a blank query', () => {
    expect(search(docs, '   ')).toEqual([])
  })

  it('honours the limit', () => {
    const many = Array.from({ length: 30 }, (_, i) => entry({ id: `m${i}`, label: 'same' }))
    expect(search(many, 'same', 5)).toHaveLength(5)
  })
})
