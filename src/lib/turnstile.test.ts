import { afterEach, describe, expect, it, vi } from 'vitest'
import { verifyTurnstile } from './turnstile'

const SECRET = 'a-secret'

/** Stands in for Cloudflare. Records the call so the URL can be asserted. */
function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response
    return response
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), { status: 200, ...init })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('verifyTurnstile', () => {
  it('posts to the v0 siteverify endpoint', async () => {
    // The endpoint this replaces used /v1/, which Cloudflare answers with an
    // empty 404 — so verification could never have succeeded. This assertion
    // exists to keep that from coming back.
    const fetchMock = stubFetch(json({ success: true }))
    await verifyTurnstile('token', null, SECRET)

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    expect(init.method).toBe('POST')

    const form = init.body as FormData
    expect(form.get('secret')).toBe(SECRET)
    expect(form.get('response')).toBe('token')
  })

  it('passes the client address only when there is one', async () => {
    const withIp = stubFetch(json({ success: true }))
    await verifyTurnstile('token', '203.0.113.7', SECRET)
    expect(((withIp.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData).get('remoteip')).toBe(
      '203.0.113.7',
    )

    const withoutIp = stubFetch(json({ success: true }))
    await verifyTurnstile('token', null, SECRET)
    expect(
      ((withoutIp.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData).has('remoteip'),
    ).toBe(false)
  })

  it('reports ok only when Cloudflare says success', async () => {
    stubFetch(json({ success: true }))
    await expect(verifyTurnstile('token', null, SECRET)).resolves.toBe('ok')

    stubFetch(json({ success: false, 'error-codes': ['invalid-input-response'] }))
    await expect(verifyTurnstile('token', null, SECRET)).resolves.toBe('failed')

    // Anything other than an explicit true is a failure, including a body that
    // does not have the field at all.
    stubFetch(json({}))
    await expect(verifyTurnstile('token', null, SECRET)).resolves.toBe('failed')
  })

  it('fails closed on a non-200 answer', async () => {
    // What the wrong endpoint actually returned: 404, empty body.
    stubFetch(new Response('', { status: 404 }))
    await expect(verifyTurnstile('token', null, SECRET)).resolves.toBe('failed')
  })

  it('fails closed when Cloudflare cannot be reached', async () => {
    stubFetch(new TypeError('fetch failed'))
    await expect(verifyTurnstile('token', null, SECRET)).resolves.toBe('failed')
  })

  it('fails closed on a body that is not JSON', async () => {
    stubFetch(new Response('<html>nope</html>', { status: 200 }))
    await expect(verifyTurnstile('token', null, SECRET)).resolves.toBe('failed')
  })

  it('rejects a missing or non-string token without calling out', async () => {
    const fetchMock = stubFetch(json({ success: true }))
    for (const token of [undefined, null, '', 42, {}]) {
      await expect(verifyTurnstile(token, null, SECRET)).resolves.toBe('failed')
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports unconfigured rather than guessing when no secret is set', async () => {
    // The caller decides what that means: fine in development, refusal in
    // production. Answering 'ok' here is what made the old flow a no-op.
    const fetchMock = stubFetch(json({ success: true }))
    await expect(verifyTurnstile('token', null, undefined)).resolves.toBe('unconfigured')
    await expect(verifyTurnstile('token', null, '')).resolves.toBe('unconfigured')
    await expect(verifyTurnstile('token', null, 'dev')).resolves.toBe('unconfigured')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
