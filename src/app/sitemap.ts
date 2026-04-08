import type { MetadataRoute } from 'next'
import { getPayload } from '@/lib/payload'

export const revalidate = 86400 // regenerate once per day

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'
const LOCALES = ['en', 'zh'] as const

/** Build a sitemap entry with en/zh hreflang alternates */
function entry(
  path: string,
  lastModified?: Date | string,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE}/en${path}`,
    lastModified: lastModified ? new Date(lastModified) : new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1.0 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((locale) => [locale, `${BASE}/${locale}${path}`]),
      ),
    },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload()

  // ── Fetch all published blogs, categories, tags in parallel ──
  const [blogsResult, categoriesResult, tagsResult] = await Promise.all([
    payload.find({
      collection: 'blogs',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 0,
      limit: 1000,
      select: { slug: true, publishedAt: true, updatedAt: true } as any,
    }).catch(() => ({ docs: [] })),
    payload.find({
      collection: 'categories',
      depth: 0,
      limit: 200,
      select: { slug: true } as any,
    }).catch(() => ({ docs: [] })),
    payload.find({
      collection: 'tags',
      depth: 0,
      limit: 500,
      select: { slug: true } as any,
    }).catch(() => ({ docs: [] })),
  ])

  // ── Static pages ──
  const staticEntries: MetadataRoute.Sitemap = [
    entry('', undefined),           // homepage  /en  /zh
    entry('/blog', undefined),      // blog list
    entry('/about', undefined),
    entry('/blog/archive', undefined),
  ]

  // ── Blog posts ──
  const blogEntries: MetadataRoute.Sitemap = (blogsResult.docs as any[]).map(
    (blog) => entry(`/blog/${blog.slug}`, blog.publishedAt ?? blog.updatedAt),
  )

  // ── Category pages ──
  const categoryEntries: MetadataRoute.Sitemap = (categoriesResult.docs as any[]).map(
    (cat) => entry(`/blog/category/${cat.slug}`, undefined),
  )

  // ── Tag pages ──
  const tagEntries: MetadataRoute.Sitemap = (tagsResult.docs as any[]).map(
    (tag) => entry(`/blog/tag/${tag.slug}`, undefined),
  )

  return [...staticEntries, ...blogEntries, ...categoryEntries, ...tagEntries]
}
