import { getTranslations } from 'next-intl/server'
import { NextResponse } from 'next/server'
import { asLocale } from '@/i18n/routing'
import { getPayload } from '@/lib/payload'

export const revalidate = 86400 // regenerate once per day

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

  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'blogs',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 20,
    depth: 0,
    locale,
  })

  const title = t('title')
  const description = t('description')

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
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  })
}
