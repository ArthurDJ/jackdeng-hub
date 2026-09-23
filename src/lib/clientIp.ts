/**
 * The address a rate limit may be keyed on.
 *
 * Only headers the platform sets are consulted. `x-real-ip` is what Vercel's
 * proxy writes and what `@vercel/functions`' `ipAddress()` reads; the
 * `x-vercel-` variant is the same value under a name a proxy in front of
 * Vercel cannot overwrite. `x-forwarded-for` is deliberately NOT a fallback:
 * Vercel overwrites it on the way in, so it adds nothing there, and anywhere
 * else it is a header the caller writes — which would make the rate limit
 * something the rate-limited party can reset.
 *
 * Returns null rather than a guess when no trusted header is present (local
 * `next dev`, or any host that is not Vercel's edge). Callers should treat that
 * as one shared bucket, not as an exemption.
 *
 * Known limit: this throttles abuse, it does not identify anyone. A visitor
 * with an IPv6 /64 or a pool of residential proxies has as many buckets as
 * addresses. Verified upstream: www.jackdeng.cc resolves straight to Vercel
 * (no cf-ray, `server: Vercel`), so these headers carry the visitor's address
 * rather than a proxy's. Putting Cloudflare's proxy in front would collapse
 * every visitor into a handful of edge IPs and quietly break this.
 */
const TRUSTED_HEADERS = ['x-real-ip', 'x-vercel-forwarded-for'] as const

export function resolveClientIp(headers: Headers): string | null {
  for (const name of TRUSTED_HEADERS) {
    const value = headers.get(name)
    if (!value) continue
    // `x-vercel-forwarded-for` mirrors the forwarded-for shape, so it can be a
    // list; the client Vercel saw is the first entry.
    const first = value.split(',')[0]?.trim()
    if (first) return first
  }
  return null
}
