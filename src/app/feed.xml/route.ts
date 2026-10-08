import { getTranslations } from 'next-intl/server'
import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'
import { asLocale, type Locale } from '@/i18n/routing'
import { getPayload } from '@/lib/payload'
import { CACHE_TAGS } from '@/lib/revalidate'
import { latest, postModified } from '@/lib/sitemapDates'

// Rendered on every request, from data cached under a tag, for the reason
// sitemap.ts gives: on Vercel nothing expires a route handler's cached
// response. It used to go out with `max-age=86400`, which the CDN kept for a
// day, so a new post could be missing from the feed until the next day.
export const dynamic = 'force-dynamic'

// Hourly, like the pages; saves and POST /api/revalidate expire it at once
// (src/lib/revalidate.ts). The locale argument is part of the cache key.
const getFeedPosts = unstable_cache(
  async (locale: Locale) => {
    const payload = await getPayload()
    const { docs } = await payload.find({
      collection: 'blogs',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 20,
      depth: 0,
      locale,
      // Only what the feed prints: the data cache caps an entry at 2 MB, and
      // twenty post bodies would be most of it.
      select: { slug: true, title: true, excerpt: true, publishedAt: true, updatedAt: true },
    })
    return docs
  },
  ['feed-posts'],
  { revalidate: 3600, tags: [CACHE_TAGS.feed] },
)

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

function escape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // An unknown ?locale= used to reach payload.find as-is; it now means English.
  const locale = asLocale(searchParams.get('locale') ?? 'en')
  const t = await getTranslations({ locale, namespace: 'feed' })

  const docs = await getFeedPosts(locale)

  const title = t('title')
  const description = t('description')
  // When the channel's content last changed: its newest post edit, not the
  // moment this response was built (src/lib/sitemapDates.ts has the why).
  const changed = latest(docs.map(postModified))

  const items = docs
    .map((post) => {
      const url = `${BASE}/${locale}/blog/${post.slug}`
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date().toUTCString()
      const titleStr = escape(String(post.title ?? ''))
      const excerptStr = escape(String(post.excerpt ?? ''))

      return `
    <item>
      <title>${titleStr}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      ${excerptStr ? `<description>${excerptStr}</description>` : ''}
    </item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(title)}</title>
    <link>${BASE}/${locale}/blog</link>
    <description>${escape(description)}</description>
    <language>${t('language')}</language>
    <atom:link href="${BASE}/feed.xml?locale=${locale}" rel="self" type="application/rss+xml"/>
    ${changed ? `<lastBuildDate>${new Date(changed).toUTCString()}</lastBuildDate>` : ''}
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // No shared copy: one on the CDN could not be expired (see above).
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
