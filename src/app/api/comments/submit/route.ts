import { NextRequest, NextResponse } from 'next/server'
import { APIError } from 'payload'
import { getPayload } from '@/lib/payload'
import { resolveClientIp } from '@/lib/clientIp'
import { verifyTurnstile } from '@/lib/turnstile'
import { parseCommentSubmission, type CommentRejection } from '@/lib/commentSubmission'

/**
 * POST /api/comments/submit
 *
 * The only way a visitor can write to the comments collection. It exists
 * because the previous arrangement did not hold: the form called
 * `/api/verify-turnstile`, then posted to Payload's own `/api/comments`, and
 * nothing connected the two — `Comments.access.create` was `() => true`, so a
 * client that skipped the first request was never challenged. Verification and
 * the write are now one request that cannot be taken apart.
 *
 * Replies carry a code, not a sentence, and the browser translates it.
 */

const reject = (error: CommentRejection, status: number) =>
  NextResponse.json({ error }, { status })

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null)

  const parsed = parseCommentSubmission(body)
  if (parsed.status === 'rejected') return reject(parsed.reason, 400)

  // Only from headers the platform sets — see resolveClientIp. null means we
  // could not tell, which buckets this submission with every other unknown
  // rather than exempting it from the limit.
  const ip = resolveClientIp(request.headers)

  const token = (body as Record<string, unknown>).turnstileToken
  const outcome = await verifyTurnstile(token, ip)

  if (outcome === 'failed') return reject('turnstile_failed', 403)

  if (outcome === 'unconfigured') {
    // No secret. In development that is the documented way to work without a
    // Cloudflare account. In production it would silently restore exactly the
    // hole this route closes, so it refuses instead — a missing environment
    // variable should break comments loudly, not open them quietly.
    if (process.env.NODE_ENV === 'production') {
      console.error('[comments] TURNSTILE_SECRET_KEY is not set; refusing submissions')
      return reject('unavailable', 503)
    }
  }

  const payload = await getPayload()

  try {
    await payload.create({
      collection: 'comments',
      // `status` is forced to pending in the collection hook as well; setting
      // it here only keeps the intent visible at the call site.
      data: { ...parsed.value, status: 'pending' },
      // The hook reads the address from here rather than from the request,
      // which is what makes the per-IP limit unforgeable.
      context: { clientIp: ip ?? 'unknown' },
      // Access is closed to anonymous callers by design; this route *is* the
      // permission, and it has just checked it.
      overrideAccess: true,
      depth: 0,
    })
  } catch (err) {
    // The anti-spam hooks throw APIError with the code as the message.
    if (err instanceof APIError) {
      const code = err.message as CommentRejection
      if (code === 'bot_detected' || code === 'rate_limited') return reject(code, err.status)
    }
    console.error('[comments] submission failed', err)
    return reject('unavailable', 500)
  }

  // No body worth returning: the comment is pending review, so there is
  // nothing for the page to render yet.
  return NextResponse.json({ ok: true }, { status: 201 })
}
