import type { MetadataRoute } from 'next'
import { getPayload } from '@/lib/payload'
import { countPostsByTaxonomy, withPosts } from '@/lib/taxonomyCounts'
import { latest, latestByTaxonomy, postModified } from '@/lib/sitemapDates'
import { localeAlternates } from '@/lib/alternates'

// Hourly, like the pages. Saves in /admin expire it at once (src/lib/revalidate.ts);
// this bounds how stale it gets when something is written outside Next.js.
export const revalidate = 3600

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

/**
 * Build a sitemap entry with en/zh hreflang alternates. Without a date there
 * is no lastmod: a guess would be the generation time, which is not when the
 * page changed (src/lib/sitemapDates.ts).
 */
function entry(
  path: string,
  lastModified?: string,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE}/en${path}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
    changeFrequency: 'weekly',
    priority: path === '' ? 1.0 : 0.8,
    // The same set the page itself lists (src/lib/alternates.ts), x-default
    // included.
    alternates: { languages: localeAlternates('en', path, BASE).languages },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload()

  // ── Fetch all published blogs, categories, tags, projects, tools in parallel ──
  // No fallbacks. An empty result would drop every URL of that type from the
  // sitemap until the next regeneration; a throw keeps the previous version.
  const [blogsResult, categoriesResult, tagsResult, projectsResult, toolsResult] = await Promise.all([
    payload.find({
      collection: 'blogs',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 0,
      limit: 200,
      select: { slug: true, publishedAt: true, updatedAt: true, category: true, tags: true },
    }),
    payload.find({
      collection: 'categories',
      depth: 0,
      limit: 200,
      select: { slug: true },
    }),
    payload.find({
      collection: 'tags',
      depth: 0,
      limit: 500,
      select: { slug: true },
    }),
    payload.find({
      collection: 'projects',
      depth: 0,
      limit: 200,
      select: { slug: true, updatedAt: true },
    }),
    // Only tools the public list page actually renders — same filter as
    // [locale]/tools/page.tsx, so the sitemap never advertises a 404.
    payload.find({
      collection: 'tools',
      where: {
        and: [
          { status: { equals: 'online' } },
          { accessControl: { equals: 'public' } },
        ],
      },
      depth: 0,
      limit: 100,
      select: { slug: true, updatedAt: true },
    }),
  ])

  // ── Static pages ──
  // Each list page is as new as the newest thing it lists. The home page
  // shows posts and projects. About is written in the code and has no date
  // to go on, so it goes without.
  const newestPost = latest(blogsResult.docs.map(postModified))
  const newestProject = latest(projectsResult.docs.map((p) => p.updatedAt))
  const newestTool = latest(toolsResult.docs.map((t) => t.updatedAt))
  const staticEntries: MetadataRoute.Sitemap = [
    entry('', latest([newestPost, newestProject])),   // homepage  /en  /zh
    entry('/blog', newestPost),
    entry('/about'),
    entry('/blog/archive', newestPost),
    entry('/projects', newestProject),
    entry('/projects/archive', newestProject),
    entry('/tools', newestTool),
  ]

  // ── Blog posts ──
  const blogEntries: MetadataRoute.Sitemap = blogsResult.docs.map(
    (blog) => entry(`/blog/${blog.slug}`, postModified(blog)),
  )

  // ── Category and tag pages ──
  // Only the ones some published post uses: the rest render "no posts found"
  // and carry noindex, so listing them here would contradict the page.
  // Each is dated by its newest post.
  const counts = countPostsByTaxonomy(blogsResult.docs)
  const dated = latestByTaxonomy(blogsResult.docs)

  const categoryEntries: MetadataRoute.Sitemap = withPosts(categoriesResult.docs, counts.categories).map(
    (cat) => entry(`/blog/category/${cat.slug}`, dated.categories.get(cat.id)),
  )

  const tagEntries: MetadataRoute.Sitemap = withPosts(tagsResult.docs, counts.tags).map(
    (tag) => entry(`/blog/tag/${tag.slug}`, dated.tags.get(tag.id)),
  )

  // ── Project pages ──
  const projectEntries: MetadataRoute.Sitemap = projectsResult.docs
    .filter((p) => p.slug)
    .map((p) => entry(`/projects/${p.slug}`, p.updatedAt ?? undefined))

  // ── Tool pages ──
  const toolEntries: MetadataRoute.Sitemap = toolsResult.docs
    .filter((tool) => tool.slug)
    .map((tool) => entry(`/tools/${tool.slug}`, tool.updatedAt ?? undefined))

  return [
    ...staticEntries,
    ...blogEntries,
    ...categoryEntries,
    ...tagEntries,
    ...projectEntries,
    ...toolEntries,
  ]
}
