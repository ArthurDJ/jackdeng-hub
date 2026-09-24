import { describe, expect, it } from 'vitest'
import { printableUrl } from './profile'

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
