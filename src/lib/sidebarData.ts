import 'server-only'
import { unstable_cache } from 'next/cache'
import { getPayload } from './payload'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

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
        select: { title: true, slug: true, publishedAt: true, coverImage: true } as any,
      }),
      payload.find({
        collection: 'blogs',
        where: { status: { equals: 'published' } },
        sort: '-publishedAt',
        depth: 0,
        limit: 200,
        locale,
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
  const locale: Locale = options.locale ?? 'en'
  const base = await getCachedSidebarBase(locale)
  return {
    ...base,
    activeCategory: options.activeCategory,
    activeTag: options.activeTag,
  }
}
