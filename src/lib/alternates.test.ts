import { describe, expect, it } from 'vitest'
import { localeAlternates } from './alternates'

describe('localeAlternates', () => {
  it('points canonical at the page itself and lists every locale', () => {
    expect(localeAlternates('zh', '/blog/tag/go/page/2', 'https://x.test')).toEqual({
      canonical: 'https://x.test/zh/blog/tag/go/page/2',
      languages: {
        en: 'https://x.test/en/blog/tag/go/page/2',
        zh: 'https://x.test/zh/blog/tag/go/page/2',
        'x-default': 'https://x.test/blog/tag/go/page/2',
      },
    })
  })

  it('handles the locale root', () => {
    const home = localeAlternates('en', '', 'https://x.test')
    expect(home.canonical).toBe('https://x.test/en')
    expect(home.languages['x-default']).toBe('https://x.test/')
  })
})
