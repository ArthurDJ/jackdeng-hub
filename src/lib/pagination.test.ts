import { describe, expect, it } from 'vitest'
import { pageHref, parsePageParam } from './pagination'

describe('parsePageParam', () => {
  it('accepts a plain positive integer', () => {
    expect(parsePageParam('1')).toBe(1)
    expect(parsePageParam('2')).toBe(2)
    expect(parsePageParam('37')).toBe(37)
  })

  it('rejects zero and anything that is not a bare integer', () => {
    for (const raw of ['0', '-1', '02', '2.0', '+2', ' 2', '2 ', 'abc', '', '1e3', '0x2']) {
      expect(parsePageParam(raw)).toBeNull()
    }
  })

  it('rejects absurdly large numbers instead of querying for them', () => {
    expect(parsePageParam('9999999')).toBeNull()
  })
})

describe('pageHref', () => {
  it('keeps page 1 on the unnumbered URL', () => {
    expect(pageHref('/blog', 1)).toBe('/blog')
  })

  it('puts later pages under /page/N', () => {
    expect(pageHref('/blog', 2)).toBe('/blog/page/2')
    expect(pageHref('/blog/category/devops', 3)).toBe('/blog/category/devops/page/3')
  })
})
