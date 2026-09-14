import { describe, expect, it } from 'vitest'
import { readingTime } from './readingTime'

/** Wraps text in the shape Payload actually stores: { root: { children } }. */
const doc = (...paragraphs: string[]) => ({
  root: {
    type: 'root',
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      children: [{ type: 'text', text }],
    })),
  },
})

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ')
const han = (n: number) => '字'.repeat(n)

describe('readingTime', () => {
  it('descends into root rather than the document', () => {
    // The bug this replaces: the walk started at the document, which carries
    // neither text nor children, so every post counted 0 words and rendered
    // as "1 min read".
    expect(readingTime(doc(words(933)))).toBe(5)
  })

  it('counts English at 200 words per minute', () => {
    expect(readingTime(doc(words(200)))).toBe(1)
    expect(readingTime(doc(words(201)))).toBe(2)
    expect(readingTime(doc(words(1000)))).toBe(5)
  })

  it('counts CJK by character rather than by whitespace', () => {
    // Chinese has no spaces, so a whitespace split scored a whole article as
    // one word and returned 1 minute for any length.
    expect(readingTime(doc(han(1454)))).toBe(4)
    expect(readingTime(doc(han(400)))).toBe(1)
    expect(readingTime(doc(han(401)))).toBe(2)
  })

  it('adds the two fractions before rounding', () => {
    // 100 words is half a minute and 200 han is half a minute. Rounding each
    // separately would give 2; the sum rounds to 1.
    expect(readingTime(doc(words(100) + ' ' + han(200)))).toBe(1)
  })

  it('does not count mixed text twice', () => {
    // The han characters are stripped before the word split, so this is
    // 200 words and 400 han, not 200 words and 400 han plus the han again.
    expect(readingTime(doc(words(200), han(400)))).toBe(2)
  })

  it('walks nested children', () => {
    const nested = {
      root: {
        children: [
          { type: 'list', children: [
            { type: 'listitem', children: [{ type: 'text', text: words(150) }] },
            { type: 'listitem', children: [{ type: 'text', text: words(150) }] },
          ] },
        ],
      },
    }
    expect(readingTime(nested)).toBe(2)
  })

  it('returns at least one minute, and survives junk input', () => {
    expect(readingTime(doc(''))).toBe(1)
    expect(readingTime(null)).toBe(1)
    expect(readingTime(undefined)).toBe(1)
    expect(readingTime('not an object')).toBe(1)
    expect(readingTime({})).toBe(1)
  })
})
