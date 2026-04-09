import 'server-only'
import { unstable_cache } from 'next/cache'
import { getPayload } from './payload'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

interface SidebarOptions {
  activeCategory?: string
  activeTag?: string
}

// Cached version: runs at most once per hour across all requests.
// Sidebar data (categories, tags, archive) changes rarely.
const getCachedSidebarBase = unstable_cache(
  async () => {
    const payload = await getPayload()

    // 3 queries instead of 4 — removed the 1000-blog "allPublished" fetch.
    // Category counts and archive are derived from a single modest query (limit 200).
    const [categoriesResult, tagsResult, recentResult, countSource] = await Promise.all([
      payload.find({ collection: 'categories', limit: 50, depth: 0 }),
      payload.find({ collection: 'tags', limit: 100, depth: 0 }),
      payload.find({
        collection: 'blogs',
        where: { status: { equals: 'published' } },
        sort: '-publishedAt',
        depth: 1,
        limit: 5,
        select: { title: true, slug: true, publishedAt: true, coverImage: true } as any,
      }),
      // Used for archive grouping + category counts. 200 is more than enough for a personal blog.
      payload.find({
        collection: 'blogs',
        where: { status: { equals: 'published' } },
        sort: '-publishedAt',
        depth: 0,
        limit: 200,
        select: { publishedAt: true, category: true } as any,
      }),
    ])

    // Archive grouped by year+month
    const monthCounts: Record<string, number> = {}
    for (const blog of countSource.docs as any[]) {
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

    // Count posts per category
    const catCount: Record<string, number> = {}
    for (const blog of countSource.docs as any[]) {
      const catId = typeof blog.category === 'object' ? blog.category?.id : blog.category
      if (catId) catCount[catId] = (catCount[catId] ?? 0) + 1
    }

    const categories = (categoriesResult.docs as any[]).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      _count: catCount[c.id] ?? 0,
    }))

    const tags = (tagsResult.docs as any[]).map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      color: t.color ?? '#3B82F6',
    }))

    const recentPosts = (recentResult.docs as any[]).map((b) => ({
      title: b.title,
      slug: b.slug,
      publishedAt: b.publishedAt ?? null,
      coverImage: b.coverImage ?? null,
    }))

    return { categories, tags, recentPosts, archives }
  },
  ['sidebar-base'],
  { revalidate: 3600 }, // cache for 1 hour
)

export async function buildSidebarData(options: SidebarOptions = {}) {
  const base = await getCachedSidebarBase()
  return {
    ...base,
    activeCategory: options.activeCategory,
    activeTag: options.activeTag,
  }
}
