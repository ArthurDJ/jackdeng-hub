import { describe, expect, it } from 'vitest'
import { extractHeadings, slugifyHeading } from './extractHeadings'

const heading = (tag: string, text: string) => ({
  type: 'heading', tag, children: [{ type: 'text', text }],
})
const para = (text: string) => ({
  type: 'paragraph', children: [{ type: 'text', text }],
})
const doc = (...children: unknown[]) => ({ root: { type: 'root', children } })

describe('slugifyHeading', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyHeading('Where The Work Is')).toBe('where-the-work-is')
  })

  it('keeps CJK characters', () => {
    // The site is bilingual, so a Chinese heading has to produce a usable id
    // rather than collapsing to the fallback.
    expect(slugifyHeading('工作量实际落在哪里')).toBe('工作量实际落在哪里')
  })

  it('drops punctuation but not word characters', () => {
    expect(slugifyHeading('What I would do, first!')).toBe('what-i-would-do-first')
    expect(slugifyHeading('read: () => true')).toBe('read-true')
  })

  it('falls back when nothing survives', () => {
    expect(slugifyHeading('!!!')).toBe('section')
    expect(slugifyHeading('   ')).toBe('section')
  })
})

describe('extractHeadings', () => {
  it('returns headings in document order with their level', () => {
    const toc = extractHeadings(doc(
      para('intro'),
      heading('h2', 'First'),
      para('body'),
      heading('h3', 'Nested'),
      heading('h2', 'Second'),
    ))
    expect(toc).toEqual([
      { id: 'first', text: 'First', level: 2 },
      { id: 'nested', text: 'Nested', level: 3 },
      { id: 'second', text: 'Second', level: 2 },
    ])
  })

  it('deduplicates repeated ids', () => {
    const toc = extractHeadings(doc(
      heading('h2', 'Intro'), heading('h2', 'Intro'), heading('h2', 'Intro'),
    ))
    expect(toc.map((h) => h.id)).toEqual(['intro', 'intro-1', 'intro-2'])
  })

  it('joins text split across child nodes', () => {
    // Bold or code inside a heading arrives as several text nodes.
    const split = {
      type: 'heading', tag: 'h2',
      children: [
        { type: 'text', text: 'Before you give ' },
        { type: 'text', text: 'an agent', format: 1 },
        { type: 'text', text: ' a key' },
      ],
    }
    expect(extractHeadings(doc(split))[0].text).toBe('Before you give an agent a key')
  })

  it('skips empty headings and non-heading nodes', () => {
    expect(extractHeadings(doc(para('body'), heading('h2', '   ')))).toEqual([])
  })

  it('returns an empty list for junk input', () => {
    expect(extractHeadings(null)).toEqual([])
    expect(extractHeadings({})).toEqual([])
    expect(extractHeadings({ root: {} })).toEqual([])
  })
})
