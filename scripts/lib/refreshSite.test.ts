import { describe, expect, it } from 'vitest'
import { refreshLiveSite } from './refreshSite'

const secret = 's'.repeat(40)

function fakeFetch(status: number) {
  const calls: { url: string; init?: RequestInit }[] = []
  const impl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    return new Response(null, { status })
  }) as unknown as typeof fetch
  return { impl, calls }
}

describe('refreshLiveSite', () => {
  it('leaves a non-production write alone', async () => {
    const f = fakeFetch(200)
    expect(await refreshLiveSite({ isProduction: false, env: { REVALIDATE_SECRET: secret }, fetchImpl: f.impl, log: () => {} })).toBe('skipped')
    expect(f.calls).toHaveLength(0)
  })

  it('says so when there is no secret, without calling out', async () => {
    const f = fakeFetch(200)
    const lines: string[] = []
    expect(await refreshLiveSite({ isProduction: true, env: {}, fetchImpl: f.impl, log: (l) => lines.push(l) })).toBe('skipped')
    expect(f.calls).toHaveLength(0)
    expect(lines[0]).toContain('REVALIDATE_SECRET is not set')
  })

  it('posts the secret as a bearer token to the live site', async () => {
    const f = fakeFetch(200)
    expect(await refreshLiveSite({ isProduction: true, env: { REVALIDATE_SECRET: secret }, fetchImpl: f.impl, log: () => {} })).toBe('refreshed')
    expect(f.calls[0].url).toBe('https://www.jackdeng.cc/api/revalidate')
    expect(f.calls[0].init?.method).toBe('POST')
    expect((f.calls[0].init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${secret}`)
  })

  it('explains a refusal and never throws', async () => {
    for (const [status, text] of [[503, 'has no REVALIDATE_SECRET'], [401, 'different values'], [500, 'answered 500']] as const) {
      const lines: string[] = []
      expect(await refreshLiveSite({ isProduction: true, env: { REVALIDATE_SECRET: secret }, fetchImpl: fakeFetch(status).impl, log: (l) => lines.push(l) })).toBe('failed')
      expect(lines[0]).toContain(text)
    }
    const down = (async () => { throw new Error('ECONNREFUSED') }) as unknown as typeof fetch
    const lines: string[] = []
    expect(await refreshLiveSite({ isProduction: true, env: { REVALIDATE_SECRET: secret, SITE_URL: 'http://localhost:3100/' }, fetchImpl: down, log: (l) => lines.push(l) })).toBe('failed')
    expect(lines[0]).toContain('could not reach http://localhost:3100 (ECONNREFUSED)')
  })
})
