/**
 * Server-side Cloudflare Turnstile verification.
 *
 * This used to live in `POST /api/verify-turnstile`, which the comment form
 * called *before* posting to `/api/comments`. Nothing tied the two requests
 * together, and `Comments.access.create` was `() => true`, so the check was
 * advisory: a client that simply skipped the first request wrote a comment
 * anyway. Verification now happens inside the write itself.
 */

export type TurnstileOutcome =
  /** Cloudflare confirmed the token. */
  | 'ok'
  /** Token missing, already spent, malformed, or rejected. */
  | 'failed'
  /** No secret configured — the caller decides whether that is acceptable. */
  | 'unconfigured'

/**
 * v0, not v1. The route this replaces posted to `/turnstile/v1/siteverify`,
 * which Cloudflare answers with an empty 404 — so every verification it ever
 * attempted failed. Nobody saw it because `TURNSTILE_SECRET_KEY` is unset in
 * production, and the old route returned success whenever the secret was
 * missing. Two defects cancelling out is not the same as a working check.
 */
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * A Turnstile token is single-use: Cloudflare rejects the second siteverify
 * call for the same token. That is a feature here — it is what stops a token
 * harvested from one submission being replayed across many.
 */
export async function verifyTurnstile(
  token: unknown,
  remoteIp?: string | null,
  secret = process.env.TURNSTILE_SECRET_KEY,
): Promise<TurnstileOutcome> {
  if (!secret || secret === 'dev') return 'unconfigured'
  if (typeof token !== 'string' || token.length === 0) return 'failed'

  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  // Optional, and only as good as the address we pass it; see resolveClientIp.
  if (remoteIp) form.append('remoteip', remoteIp)

  try {
    const res = await fetch(SITEVERIFY, { method: 'POST', body: form })
    if (!res.ok) return 'failed'
    const data = (await res.json()) as { success?: boolean }
    return data.success === true ? 'ok' : 'failed'
  } catch {
    // Cloudflare unreachable. Fail closed: an outage that opens the gate is
    // indistinguishable from not having a gate.
    return 'failed'
  }
}
