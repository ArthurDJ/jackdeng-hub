import { describe, expect, it } from 'vitest'
import { localeAlternates } from './alternates'

describe('localeAlternates', () => {
  it('points canonical at the page itself and lists every locale', () => {
    expect(localeAlternates('zh', '/blog/tag/go/page/2', 'https://x.test')).toEqual({
      canonical: 'https://x.test/zh/blog/tag/go/page/2',
      languages: {
        en: 'https://x.test/en/blog/tag/go/page/2',
        zh: 'https://x.test/zh/blog/tag/go/page/2',
      },
    })
  })

  it('handles the locale root', () => {
    expect(localeAlternates('en', '', 'https://x.test').canonical).toBe('https://x.test/en')
  })
})
