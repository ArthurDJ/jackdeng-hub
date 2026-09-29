import { describe, expect, it } from 'vitest'
import { bearerMatches, revalidateSecret } from './revalidateAuth'

const secret = 'a'.repeat(32) + 'b'.repeat(8)

describe('revalidateSecret', () => {
  it('is off when unset, blank or short', () => {
    expect(revalidateSecret({})).toBeNull()
    expect(revalidateSecret({ REVALIDATE_SECRET: '   ' })).toBeNull()
    expect(revalidateSecret({ REVALIDATE_SECRET: 'x'.repeat(31) })).toBeNull()
  })

  it('takes a long enough secret, trimmed', () => {
    expect(revalidateSecret({ REVALIDATE_SECRET: ` ${secret}\n` })).toBe(secret)
  })
})

describe('bearerMatches', () => {
  it('accepts the secret as a bearer token', () => {
    expect(bearerMatches(`Bearer ${secret}`, secret)).toBe(true)
  })

  it('refuses anything else', () => {
    expect(bearerMatches(null, secret)).toBe(false)
    expect(bearerMatches(secret, secret)).toBe(false)
    expect(bearerMatches(`Basic ${secret}`, secret)).toBe(false)
    expect(bearerMatches(`Bearer ${secret}x`, secret)).toBe(false)
    expect(bearerMatches(`Bearer ${secret.slice(1)}`, secret)).toBe(false)
    expect(bearerMatches('Bearer ', secret)).toBe(false)
  })
})
