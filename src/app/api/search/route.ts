import { NextResponse, type NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import { search, MAX_QUERY_LENGTH } from '@/lib/search'
import { getSearchIndex } from '@/lib/searchIndex'

// One request per (debounced) keystroke, answered from the cached index —
// no database query on this path. That is also why there is no rate limit:
// the only thing a flood can cost is a string scan over a few hundred KB,
// and identical queries are absorbed by the CDN before they get here.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const locale = params.get('locale') ?? ''
  if (!(routing.locales as readonly string[]).includes(locale)) {
    return NextResponse.json({ error: 'invalid_locale' }, { status: 400 })
  }

  const q = (params.get('q') ?? '').slice(0, MAX_QUERY_LENGTH).trim()
  const results = q ? search(await getSearchIndex(locale as 'en' | 'zh'), q) : []

  return NextResponse.json(
    { results },
    {
      headers: {
        // Keyed on the full URL, so each (q, locale) pair is cached separately.
        // Shorter than the index's hour: a new post should not wait two hours
        // (index + edge) to become findable.
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    },
  )
}
