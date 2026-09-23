/**
 * Shape validation for a public comment submission.
 *
 * Kept separate from the route handler so it can be tested without a database
 * or a network, and separate from the Payload collection because the two
 * answer different questions: this one decides whether a request body is even
 * worth sending to Payload, the collection decides what may be stored. The
 * limits below therefore mirror `collections/Comments.ts` — if they drift, the
 * collection wins and the caller sees Payload's error instead of ours.
 */

/**
 * Stable machine-readable reasons, not prose. The browser renders them through
 * next-intl, so the server never picks a language for the visitor — the same
 * mistake the automation dashboard shipped with (v1.9.1).
 *
 * The collection hook throws `bot_detected` / `rate_limited` as the *message*
 * of a Payload `APIError` so the route can map them back without matching on
 * English sentences.
 */
export type CommentRejection =
  | 'invalid_name'
  | 'invalid_email'
  | 'invalid_content'
  | 'invalid_post'
  | 'bot_detected'
  | 'rate_limited'
  | 'turnstile_failed'
  | 'unavailable'

/** The subset this module itself can return. */
type ParseRejection = Extract<CommentRejection, `invalid_${string}`>

export type CommentSubmission = {
  authorName: string
  authorEmail: string
  content: string
  /** Payload's blog id, which is an integer in Postgres. */
  post: number
  honeypot: string
}

/**
 * Discriminated on a string rather than an `ok: boolean`, because this repo
 * compiles with `strict: false`: with `strictNullChecks` off, TypeScript does
 * not narrow a union by a boolean literal, so `if (!result.ok)` would leave
 * `result.reason` a type error. A string discriminant narrows either way.
 */
export type ParsedSubmission =
  | { status: 'ok'; value: CommentSubmission }
  | { status: 'rejected'; reason: ParseRejection }

export const NAME_MAX = 60
export const CONTENT_MIN = 2
export const CONTENT_MAX = 500

// Deliberately loose. Anything stricter rejects addresses that are valid, and
// the collection's `email` field type validates again on the way in.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const asString = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

const rejected = (reason: ParseRejection): ParsedSubmission => ({ status: 'rejected', reason })

export function parseCommentSubmission(body: unknown): ParsedSubmission {
  if (!body || typeof body !== 'object') return rejected('invalid_name')

  const raw = body as Record<string, unknown>

  const authorName = asString(raw.authorName)
  if (authorName.length < 1 || authorName.length > NAME_MAX) return rejected('invalid_name')

  const authorEmail = asString(raw.authorEmail)
  if (!EMAIL.test(authorEmail)) return rejected('invalid_email')

  const content = asString(raw.content)
  if (content.length < CONTENT_MIN || content.length > CONTENT_MAX) {
    return rejected('invalid_content')
  }

  // The id is an integer column, but it reaches here as whatever JSON carried:
  // the React prop types it as a string while the value is a number. Accept
  // both and normalise to the column's type, rather than rejecting a valid id
  // for the shape it arrived in.
  const post = typeof raw.post === 'string' ? Number(raw.post.trim()) : raw.post
  if (typeof post !== 'number' || !Number.isInteger(post) || post <= 0) {
    return rejected('invalid_post')
  }

  return {
    status: 'ok',
    value: { authorName, authorEmail, content, post, honeypot: asString(raw.honeypot) },
  }
}
