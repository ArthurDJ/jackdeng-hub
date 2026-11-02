import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { APIError } from 'payload'

// The route's three seams: the database, Cloudflare and the client address.
const create = vi.fn()
vi.mock('@/lib/payload', () => ({ getPayload: async () => ({ create }) }))
const verifyTurnstile = vi.fn()
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: (...a: unknown[]) => verifyTurnstile(...a) }))
vi.mock('@/lib/clientIp', () => ({ resolveClientIp: () => '203.0.113.7' }))

const { POST } = await import('./route')

const valid = { authorName: 'Ada', authorEmail: 'ada@example.com', content: 'Nice post.', post: 1, turnstileToken: 't' }
const submit = (body: unknown) =>
  POST(new Request('https://x.test/api/comments/submit', { method: 'POST', body: JSON.stringify(body) }) as never)
const answer = async (res: Response) => ({ status: res.status, body: await res.json() })

beforeEach(() => {
  create.mockReset()
  verifyTurnstile.mockReset().mockResolvedValue('ok')
})
afterEach(() => vi.unstubAllEnvs())

describe('POST /api/comments/submit', () => {
  it('writes a pending comment, with the address the rate limit reads', async () => {
    expect(await answer(await submit(valid))).toEqual({ status: 201, body: { ok: true } })
    const args = create.mock.calls[0][0]
    expect(args.data).toMatchObject({ authorName: 'Ada', post: 1, status: 'pending' })
    expect(args.data).not.toHaveProperty('turnstileToken')
    expect(args.context).toEqual({ clientIp: '203.0.113.7' })
    expect(verifyTurnstile).toHaveBeenCalledWith('t', '203.0.113.7')
  })

  it('rejects a malformed body before asking Cloudflare', async () => {
    expect(await answer(await submit({ ...valid, authorName: '' }))).toEqual({ status: 400, body: { error: 'invalid_name' } })
    const res = await POST(new Request('https://x.test/api/comments/submit', { method: 'POST', body: 'not json' }) as never)
    expect(res.status).toBe(400)
    expect(verifyTurnstile).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })

  it('writes nothing when the challenge fails', async () => {
    verifyTurnstile.mockResolvedValue('failed')
    expect(await answer(await submit(valid))).toEqual({ status: 403, body: { error: 'turnstile_failed' } })
    expect(create).not.toHaveBeenCalled()
  })

  // Without the secret the route would accept anything; in production that
  // must close comments, not open them.
  it('refuses in production when Turnstile is not configured', async () => {
    verifyTurnstile.mockResolvedValue('unconfigured')
    vi.stubEnv('NODE_ENV', 'production')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await answer(await submit(valid))).toEqual({ status: 503, body: { error: 'unavailable' } })
    expect(create).not.toHaveBeenCalled()
  })

  it('accepts without Turnstile in development', async () => {
    verifyTurnstile.mockResolvedValue('unconfigured')
    vi.stubEnv('NODE_ENV', 'development')
    expect((await submit(valid)).status).toBe(201)
  })

  it("passes the anti-spam hooks' own codes through", async () => {
    create.mockRejectedValue(new APIError('rate_limited', 429))
    expect(await answer(await submit(valid))).toEqual({ status: 429, body: { error: 'rate_limited' } })
    create.mockRejectedValue(new APIError('bot_detected', 400))
    expect(await answer(await submit(valid))).toEqual({ status: 400, body: { error: 'bot_detected' } })
  })

  it('answers anything else as unavailable, without leaking the error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    create.mockRejectedValue(new APIError('relation "comments" does not exist', 500))
    expect(await answer(await submit(valid))).toEqual({ status: 500, body: { error: 'unavailable' } })
    create.mockRejectedValue(new Error('connection refused'))
    expect(await answer(await submit(valid))).toEqual({ status: 500, body: { error: 'unavailable' } })
  })
})
