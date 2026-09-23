import 'server-only'
import { unstable_cache } from 'next/cache'
import { getPayload } from './payload'
import { lexicalToText, type SearchDoc } from './search'

type Locale = 'en' | 'zh'

// The whole public corpus for one locale, flattened to plain text and cached
// for an hour — the same window as the pages it points at, so search never
// finds something the page itself would not show yet, or vice versa.
//
// The local API skips access control by default, so every filter below is
// written out to match the public page that lists the collection. They are
// the same conditions sitemap.ts uses.
//
// Size: the Vercel data cache caps an entry at 2 MB. Bodies are stored as
// plain text, not Lexical JSON, which is several times smaller; at a few KB
// per post that is hundreds of posts of headroom. Past that, move the body
// into a Postgres full-text column instead of raising the limit.
export const getSearchIndex = unstable_cache(
  async (locale: Locale): Promise<SearchDoc[]> => {
    const payload = await getPayload()

    const [blogs, categories, tags, tools, projects] = await Promise.all([
      payload.find({
        collection: 'blogs',
        where: { status: { equals: 'published' } },
        sort: '-publishedAt',
        depth: 0,
        limit: 1000,
        locale,
        select: { title: true, slug: true, excerpt: true, content: true, category: true, tags: true },
      }),
      payload.find({ collection: 'categories', depth: 0, limit: 100, locale }),
      payload.find({ collection: 'tags', depth: 0, limit: 200, locale }),
      payload.find({
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
        locale,
      }),
      payload.find({ collection: 'projects', sort: '-createdAt', depth: 0, limit: 100, locale }),
    ])

    const categoryName = new Map(categories.docs.map((c) => [c.id, c.name ?? '']))
    const tagName = new Map(tags.docs.map((t) => [t.id, t.name ?? '']))

    // Order matters: ties in score keep it, so posts come before taxonomy.
    const docs: SearchDoc[] = []

    for (const b of blogs.docs) {
      if (!b.slug) continue
      const catId = typeof b.category === 'object' ? b.category?.id : b.category
      const tagIds = (b.tags ?? []).map((t) => (typeof t === 'object' ? t?.id : t))
      docs.push({
        id: `post-${b.id}`,
        type: 'post',
        label: b.title ?? '',
        description: b.excerpt ?? '',
        href: `/blog/${b.slug}`,
        // A post tagged PostgreSQL should come up for "postgresql" even if the
        // word never appears in its text.
        keywords: [categoryName.get(catId), ...tagIds.map((id) => tagName.get(id))].filter(Boolean).join(' '),
        body: lexicalToText(b.content),
      })
    }
    for (const p of projects.docs) {
      if (!p.slug) continue
      docs.push({
        id: `project-${p.id}`,
        type: 'project',
        label: p.name ?? '',
        description: p.shortDescription ?? '',
        href: `/projects/${p.slug}`,
        keywords: (p.techStack ?? []).map((t) => t?.tech).filter(Boolean).join(' '),
        body: lexicalToText(p.longDescription),
      })
    }
    for (const t of tools.docs) {
      if (!t.slug) continue
      docs.push({
        id: `tool-${t.id}`,
        type: 'tool',
        label: t.name ?? '',
        description: t.description ?? '',
        href: `/tools/${t.slug}`,
        keywords: '',
        body: '',
      })
    }
    for (const c of categories.docs) {
      if (!c.slug) continue
      docs.push({
        id: `category-${c.id}`,
        type: 'category',
        label: c.name ?? '',
        description: c.description ?? '',
        href: `/blog/category/${c.slug}`,
        keywords: '',
        body: '',
      })
    }
    for (const t of tags.docs) {
      if (!t.slug) continue
      docs.push({
        id: `tag-${t.id}`,
        type: 'tag',
        label: t.name ?? '',
        description: t.description ?? '',
        href: `/blog/tag/${t.slug}`,
        keywords: '',
        body: '',
      })
    }

    return docs
  },
  ['search-index'],
  { revalidate: 3600 },
)
