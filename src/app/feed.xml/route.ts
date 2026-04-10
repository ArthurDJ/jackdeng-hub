import { getPayload } from '@/lib/payload'
import { NextResponse } from 'next/server'

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
  const locale = (searchParams.get('locale') ?? 'en') as 'en' | 'zh'

  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'blogs',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 20,
    depth: 0,
    locale,
  })

  const isZh = locale === 'zh'
  const title = isZh ? 'Jack Deng 的博客' : "Jack Deng's Blog"
  const description = isZh ? '技术与思考' : 'Tech & Thoughts'

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
    <language>${isZh ? 'zh-CN' : 'en'}</language>
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
