import type { MetadataRoute } from 'next'
import { getPayload, orEmpty } from '@/lib/payload'

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

  // ── Fetch all published blogs, categories, tags, projects, tools in parallel ──
  const [blogsResult, categoriesResult, tagsResult, projectsResult, toolsResult] = await Promise.all([
    orEmpty(payload.find({
      collection: 'blogs',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 0,
      limit: 200,
      select: { slug: true, publishedAt: true, updatedAt: true },
    })),
    orEmpty(payload.find({
      collection: 'categories',
      depth: 0,
      limit: 200,
      select: { slug: true },
    })),
    orEmpty(payload.find({
      collection: 'tags',
      depth: 0,
      limit: 500,
      select: { slug: true },
    })),
    orEmpty(payload.find({
      collection: 'projects',
      depth: 0,
      limit: 200,
      select: { slug: true, updatedAt: true },
    })),
    // Only tools the public list page actually renders — same filter as
    // [locale]/tools/page.tsx, so the sitemap never advertises a 404.
    orEmpty(payload.find({
      collection: 'tools',
      where: {
        and: [
          { status: { equals: 'online' } },
          { accessControl: { equals: 'public' } },
          { toolType: { equals: 'interactive' } },
        ],
      },
      depth: 0,
      limit: 100,
      select: { slug: true, updatedAt: true },
    })),
  ])

  // ── Static pages ──
  const staticEntries: MetadataRoute.Sitemap = [
    entry('', undefined),             // homepage  /en  /zh
    entry('/blog', undefined),        // blog list
    entry('/about', undefined),
    entry('/blog/archive', undefined),
    entry('/projects', undefined),    // projects list
    entry('/tools', undefined),       // tools list
  ]

  // ── Blog posts ──
  const blogEntries: MetadataRoute.Sitemap = blogsResult.docs.map(
    (blog) => entry(`/blog/${blog.slug}`, blog.publishedAt ?? blog.updatedAt),
  )

  // ── Category pages ──
  const categoryEntries: MetadataRoute.Sitemap = categoriesResult.docs.map(
    (cat) => entry(`/blog/category/${cat.slug}`, undefined),
  )

  // ── Tag pages ──
  const tagEntries: MetadataRoute.Sitemap = tagsResult.docs.map(
    (tag) => entry(`/blog/tag/${tag.slug}`, undefined),
  )

  // ── Project pages ──
  const projectEntries: MetadataRoute.Sitemap = projectsResult.docs
    .filter((p) => p.slug)
    .map((p) => entry(`/projects/${p.slug}`, p.updatedAt))

  // ── Tool pages ──
  const toolEntries: MetadataRoute.Sitemap = toolsResult.docs
    .filter((tool) => tool.slug)
    .map((tool) => entry(`/tools/${tool.slug}`, tool.updatedAt))

  return [
    ...staticEntries,
    ...blogEntries,
    ...categoryEntries,
    ...tagEntries,
    ...projectEntries,
    ...toolEntries,
  ]
}
