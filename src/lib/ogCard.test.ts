import { describe, expect, it } from 'vitest'
import { ogCardUrl } from './ogCard'

describe('ogCardUrl', () => {
  it('encodes the title and leaves out what is not given', () => {
    expect(ogCardUrl('https://x.test', { title: 'A & B' })).toBe('https://x.test/og?title=A%20%26%20B')
  })

  it('adds the subtitle and the type', () => {
    expect(ogCardUrl('https://x.test', { title: 'T', subtitle: '全栈 · 数据', type: 'blog' })).toBe(
      'https://x.test/og?title=T&subtitle=%E5%85%A8%E6%A0%88%20%C2%B7%20%E6%95%B0%E6%8D%AE&type=blog',
    )
  })

  it('skips an empty subtitle', () => {
    expect(ogCardUrl('https://x.test', { title: 'T', subtitle: '' })).toBe('https://x.test/og?title=T')
  })
})
