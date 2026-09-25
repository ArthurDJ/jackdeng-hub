import type { NextRequest } from 'next/server'
import { MAX_REPORT_BYTES, parseCspReports, readCapped } from '@/lib/cspReport'

// Where browsers send Content-Security-Policy violations (report-uri in
// next.config.mjs). While the policy is report-only, this is how we learn
// what a strict policy would break before it breaks anything: each violation
// becomes one `[csp]` line in the Vercel function logs.
//
// Unauthenticated by necessity — browsers post here on their own. So it
// trusts nothing: bodies over 16 KB are refused (unread when Content-Length
// says so, and cut off at 16 KB when it does not), at most 20 reports are
// logged per request, and every URL is cut to origin + path. The worst a
// flood can do is add log lines.
export async function POST(req: NextRequest) {
  const declared = Number(req.headers.get('content-length') ?? 0)
  if (declared > MAX_REPORT_BYTES) return new Response(null, { status: 413 })

  const text = await readCapped(req.body, MAX_REPORT_BYTES)
  if (text === null) return new Response(null, { status: 413 })

  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return new Response(null, { status: 400 })
  }

  for (const v of parseCspReports(body)) console.warn('[csp]', JSON.stringify(v))
  return new Response(null, { status: 204 })
}
