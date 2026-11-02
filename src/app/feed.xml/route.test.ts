import { describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ unstable_cache: <T>(fn: T) => fn }))
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ locale }: { locale: string }) => (key: string) =>
    ({ title: `Blog (${locale})`, description: 'd', language: locale === 'zh' ? 'zh-CN' : 'en-US' })[key] ?? key,
}))
const find = vi.fn(async (_args: { locale?: string }) => ({
  docs: [
    { slug: 'a-post', title: 'Tom & "Jerry" <script>', excerpt: 'x < y', publishedAt: '2026-10-08T00:00:00Z', updatedAt: '2026-10-09T00:00:00Z' },
    { slug: 'no-date', title: 'Undated', excerpt: '', publishedAt: null, updatedAt: '2026-09-01T00:00:00Z' },
  ],
}))
vi.mock('@/lib/payload', () => ({ getPayload: async () => ({ find }) }))

const { GET } = await import('./route')
const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'
const feed = async (query = '') => {
  const res = await GET(new Request(`https://x.test/feed.xml${query}`))
  return { res, xml: await res.text(), locale: find.mock.calls.at(-1)?.[0].locale }
}

describe('GET /feed.xml', () => {
  // A find without a locale falls back to zh: the English feed would carry
  // Chinese titles (CLAUDE.md).
  it('queries in the requested locale, English by default and for junk', async () => {
    expect((await feed()).locale).toBe('en')
    expect((await feed('?locale=zh')).locale).toBe('zh')
    expect((await feed('?locale=fr')).locale).toBe('en')
  })

  it('links each item to the post in that locale', async () => {
    const { xml } = await feed('?locale=zh')
    expect(xml).toContain(`<link>${BASE}/zh/blog/a-post</link>`)
    expect(xml).toContain(`<atom:link href="${BASE}/feed.xml?locale=zh"`)
    expect(xml).toContain('<language>zh-CN</language>')
  })

  it('escapes titles and excerpts', async () => {
    const { xml } = await feed()
    expect(xml).toContain('<title>Tom &amp; &quot;Jerry&quot; &lt;script&gt;</title>')
    expect(xml).toContain('<description>x &lt; y</description>')
    expect(xml).not.toContain('<script>')
  })

  it('dates the channel by its newest edit and leaves an undated post undated', async () => {
    const { xml } = await feed()
    expect(xml).toContain(`<lastBuildDate>${new Date('2026-10-09T00:00:00Z').toUTCString()}</lastBuildDate>`)
    const undated = xml.slice(xml.indexOf('<title>Undated</title>'))
    expect(undated.slice(0, undated.indexOf('</item>'))).not.toContain('<pubDate>')
  })

  it('is served as XML with no shared cache', async () => {
    const { res } = await feed()
    expect(res.headers.get('content-type')).toBe('application/xml; charset=utf-8')
    expect(res.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate')
  })
})
