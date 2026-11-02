import { describe, expect, it, vi } from 'vitest'
import { listedTools } from '@/lib/listedTools'

// The data cache is a pass-through here; the database answers per collection.
vi.mock('next/cache', () => ({ unstable_cache: <T>(fn: T) => fn }))
const docs: Record<string, unknown[]> = {
  blogs: [
    { slug: 'newer', publishedAt: '2026-10-08T00:00:00Z', updatedAt: '2026-10-09T00:00:00Z', category: 1, tags: [10] },
    { slug: 'older', publishedAt: '2026-09-22T00:00:00Z', updatedAt: '2026-09-22T00:00:00Z', category: 1, tags: [] },
  ],
  categories: [{ id: 1, slug: 'data' }, { id: 2, slug: 'empty' }],
  tags: [{ id: 10, slug: 'dbt' }, { id: 11, slug: 'unused' }],
  projects: [{ slug: 'data-hub', updatedAt: '2026-11-02T00:00:00Z' }, { slug: null, updatedAt: '2026-01-01T00:00:00Z' }],
  tools: [{ slug: 'cron-explainer', updatedAt: '2026-10-31T00:00:00Z' }],
}
const find = vi.fn(async ({ collection }: { collection: string }) => ({ docs: docs[collection] }))
vi.mock('@/lib/payload', () => ({ getPayload: async () => ({ find }) }))

const { default: sitemap } = await import('./sitemap')
const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

describe('sitemap', async () => {
  const entries = await sitemap()
  const calls = find.mock.calls.map(([a]) => a as { collection: string; where?: unknown })
  const urls = entries.map((e) => e.url.replace(`${BASE}/en`, ''))
  const byPath = (p: string) => entries.find((e) => e.url === `${BASE}/en${p}`)

  it('asks only for published posts and for the tools the site lists', () => {
    const where = (c: string) => calls.find((a) => a.collection === c)?.where
    expect(where('blogs')).toEqual({ status: { equals: 'published' } })
    expect(where('tools')).toEqual(listedTools())
  })

  it('lists posts, used taxonomy, projects with a slug and tools', () => {
    expect(urls).toEqual(expect.arrayContaining([
      '/blog/newer', '/blog/older', '/blog/category/data', '/blog/tag/dbt', '/projects/data-hub', '/tools/cron-explainer',
    ]))
  })

  // An empty category or tag page says "no posts" and carries noindex.
  it('leaves out categories and tags no post uses, and projects without a slug', () => {
    expect(urls).not.toContain('/blog/category/empty')
    expect(urls).not.toContain('/blog/tag/unused')
    expect(urls.filter((u) => u.startsWith('/projects/') && u !== '/projects/archive')).toEqual(['/projects/data-hub'])
  })

  it('dates pages by their content and leaves undated pages undated', () => {
    expect(byPath('/blog/newer')?.lastModified).toEqual(new Date('2026-10-09T00:00:00Z'))
    expect(byPath('/blog')?.lastModified).toEqual(new Date('2026-10-09T00:00:00Z'))
    expect(byPath('/about')).not.toHaveProperty('lastModified')
  })

  it('gives every entry both languages and x-default', () => {
    for (const e of entries) {
      expect(Object.keys(e.alternates?.languages ?? {}).sort()).toEqual(['en', 'x-default', 'zh'])
    }
  })
})
