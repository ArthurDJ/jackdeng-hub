import { describe, expect, it } from 'vitest'
import { resolveClientIp } from './clientIp'

const h = (init: Record<string, string>) => new Headers(init)

describe('resolveClientIp', () => {
  it('reads x-real-ip, the header Vercel sets', () => {
    expect(resolveClientIp(h({ 'x-real-ip': '203.0.113.7' }))).toBe('203.0.113.7')
  })

  it('falls back to x-vercel-forwarded-for', () => {
    expect(resolveClientIp(h({ 'x-vercel-forwarded-for': '203.0.113.7' }))).toBe('203.0.113.7')
  })

  it('prefers x-real-ip when both are present', () => {
    const headers = h({ 'x-real-ip': '203.0.113.7', 'x-vercel-forwarded-for': '198.51.100.9' })
    expect(resolveClientIp(headers)).toBe('203.0.113.7')
  })

  it('takes the first entry of a forwarded-for list', () => {
    expect(resolveClientIp(h({ 'x-vercel-forwarded-for': '203.0.113.7, 70.41.3.18' }))).toBe(
      '203.0.113.7',
    )
  })

  it('ignores x-forwarded-for entirely', () => {
    // The whole point of the change: a submitter who can write the header that
    // keys the rate limit is not rate limited. Vercel overwrites this one, so
    // trusting it buys nothing where we deploy and costs everything anywhere
    // else.
    expect(resolveClientIp(h({ 'x-forwarded-for': '1.2.3.4' }))).toBeNull()
    expect(resolveClientIp(h({ 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '203.0.113.7' }))).toBe(
      '203.0.113.7',
    )
  })

  it('ignores cf-connecting-ip, which anyone reaching the origin can set', () => {
    expect(resolveClientIp(h({ 'cf-connecting-ip': '1.2.3.4' }))).toBeNull()
  })

  it('returns null when no trusted header is present', () => {
    // `next dev`, or any host that is not Vercel's edge. The caller buckets
    // these together rather than exempting them.
    expect(resolveClientIp(h({}))).toBeNull()
    expect(resolveClientIp(h({ 'x-real-ip': '' }))).toBeNull()
    expect(resolveClientIp(h({ 'x-real-ip': '   ' }))).toBeNull()
  })
})
