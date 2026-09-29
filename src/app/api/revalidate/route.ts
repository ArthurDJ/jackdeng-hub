import { revalidateSite } from '@/lib/revalidate'
import { bearerMatches, revalidateSecret } from '@/lib/revalidateAuth'

// Expire every cached page and data cache, the same as saving something in
// /admin does. The write scripts need it: they go through Payload's Local API
// outside Next.js, where the collection hooks cannot reach the cache, so what
// they wrote used to show up only when the hourly revalidation came round.
// They call this after writing (scripts/lib/refreshSite.ts).
//
// Guarded by REVALIDATE_SECRET as a bearer token; while it is unset the route
// answers 503 and does nothing. The worst a caller with the secret can do is
// make the next visitor to each page wait for it to render.
export async function POST(req: Request) {
  const secret = revalidateSecret({ REVALIDATE_SECRET: process.env.REVALIDATE_SECRET })
  if (!secret) return new Response(null, { status: 503 })
  if (!bearerMatches(req.headers.get('authorization'), secret)) return new Response(null, { status: 401 })
  const done = revalidateSite('POST /api/revalidate')
  return Response.json({ revalidated: done }, { status: done ? 200 : 500 })
}
