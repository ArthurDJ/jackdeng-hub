import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/verify-turnstile
 * Server-side Cloudflare Turnstile token verification.
 * Called from the CommentForm before submitting to Payload.
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 })
    }

    const secret = process.env.TURNSTILE_SECRET_KEY

    // If no secret configured (dev mode), skip verification
    if (!secret || secret === 'dev') {
      return NextResponse.json({ success: true })
    }

    const formData = new FormData()
    formData.append('secret', secret)
    formData.append('response', token)

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v1/siteverify', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()

    if (!data.success) {
      return NextResponse.json(
        { success: false, error: 'Turnstile verification failed' },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
