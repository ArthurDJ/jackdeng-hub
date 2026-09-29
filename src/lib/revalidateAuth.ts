import { createHash, timingSafeEqual } from 'crypto'

/**
 * Who may call POST /api/revalidate: whoever sends REVALIDATE_SECRET as a
 * bearer token. The write scripts do, after writing (scripts/lib/refreshSite.ts).
 *
 * A secret under 32 characters counts as unset, so the route stays off
 * rather than guessable. Both sides are hashed before the constant-time
 * compare, which needs equal lengths and would otherwise leak the secret's.
 */
export const MIN_SECRET_LENGTH = 32

export function revalidateSecret(env: { REVALIDATE_SECRET?: string }): string | null {
  const s = env.REVALIDATE_SECRET?.trim()
  return s && s.length >= MIN_SECRET_LENGTH ? s : null
}

export function bearerMatches(authorization: string | null, secret: string): boolean {
  const m = authorization?.match(/^Bearer (.+)$/)
  if (!m) return false
  const digest = (v: string) => createHash('sha256').update(v).digest()
  return timingSafeEqual(digest(m[1]), digest(secret))
}
