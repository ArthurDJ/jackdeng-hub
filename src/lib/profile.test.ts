import { describe, expect, it } from 'vitest'
import { TIMELINE, printableUrl } from './profile'

describe('printableUrl', () => {
  it('drops the scheme and trailing slashes', () => {
    expect(printableUrl('https://leetcode.com/u/dj3013158/')).toBe('leetcode.com/u/dj3013158')
    expect(printableUrl('http://example.com//')).toBe('example.com')
  })
  it('keeps the path', () => {
    expect(printableUrl('https://github.com/ArthurDJ')).toBe('github.com/ArthurDJ')
  })
  it('turns mailto: into the address', () => {
    expect(printableUrl('mailto:someone@example.com')).toBe('someone@example.com')
  })
})

describe('TIMELINE summaries', () => {
  // The home page shows one line per role; past these lengths it wraps.
  const MAX = { en: 140, zh: 70 } as const

  for (const { role, summary } of TIMELINE) {
    it(`has a short summary in both languages for ${role.en}`, () => {
      for (const lang of ['en', 'zh'] as const) {
        const text = summary?.[lang]?.trim() ?? ''
        expect(text, `${lang} summary`).not.toBe('')
        expect(text.length, `${lang} summary length`).toBeLessThanOrEqual(MAX[lang])
      }
    })
  }
})
