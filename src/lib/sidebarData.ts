import 'server-only'
import { unstable_cache } from 'next/cache'
import { getPayload } from './payload'
import { populated } from './relations'
import { countPostsByTaxonomy, withPosts } from './taxonomyCounts'
import { CACHE_TAGS } from './revalidate'

type Locale = 'en' | 'zh'

interface SidebarOptions {
  locale?: Locale
  activeCategory?: string
  activeTag?: string
}

// Cached per-locale (the `locale` arg becomes part of the cache key automatically).
const getCachedSidebarBase = unstable_cache(
  async (locale: Locale) => {
    const payload = await getPayload()

    const [categoriesResult, tagsResult, recentResult, countSource] = await Promise.all([
      payload.find({ collection: 'categories', limit: 50, depth: 0, locale }),
      payload.find({ collection: 'tags', limit: 100, depth: 0, locale }),
      payload.find({
        collection: 'blogs',
        where: { status: { equals: 'published' } },
        sort: '-publishedAt',
        depth: 1,
        limit: 5,
        locale,
        select: { title: true, slug: true, publishedAt: true, coverImage: true },
      }),
      payload.find({
        collection: 'blogs',
        where: { status: { equals: 'published' } },
        sort: '-publishedAt',
        depth: 0,
        limit: 200,
        locale,
        select: { publishedAt: true, category: true, tags: true },
      }),
    ])

    // Archive grouped by year+month
    const monthCounts: Record<string, number> = {}
    for (const blog of countSource.docs) {
      if (!blog.publishedAt) continue
      const d = new Date(blog.publishedAt)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`
      monthCounts[key] = (monthCounts[key] ?? 0) + 1
    }

    const archives = Object.entries(monthCounts)
      .map(([key, count]) => {
        const [y, m] = key.split('-').map(Number)
        return { year: y, month: m, count }
      })
      .sort((a, b) => b.year - a.year || b.month - a.month)
      .slice(0, 12)

    // Only the categories and tags some published post uses, most-used first:
    // "Tags" listed the whole seeded set, most of it leading to empty pages.
    const counts = countPostsByTaxonomy(countSource.docs)

    const categories = withPosts(
      categoriesResult.docs.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
      counts.categories,
    )

    const tags = withPosts(
      tagsResult.docs.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        color: t.color ?? '#3B82F6',
      })),
      counts.tags,
    )

    const recentPosts = recentResult.docs.map((b) => ({
      title: b.title,
      slug: b.slug,
      publishedAt: b.publishedAt ?? null,
      coverImage: populated(b.coverImage),
    }))

    return { categories, tags, recentPosts, archives }
  },
  ['sidebar-base'],
  // An hour at most; content changes expire it at once (src/lib/revalidate.ts).
  { revalidate: 3600, tags: [CACHE_TAGS.sidebar] },
)

export async function buildSidebarData(options: SidebarOptions = {}) {
  const locale: Locale = options.locale ?? 'en'
  const base = await getCachedSidebarBase(locale)
  return {
    ...base,
    activeCategory: options.activeCategory,
    activeTag: options.activeTag,
  }
}
