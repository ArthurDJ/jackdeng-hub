import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from '@/lib/payload'
import { BlogCard } from '@/components/BlogCard'
import { Sidebar } from '@/components/Sidebar'
import { TagBadge } from '@/components/TagBadge'
import { buildSidebarData } from '@/lib/sidebarData'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string; locale: string }> }

export async function generateStaticParams() {
  const payload = await getPayload()
  const { docs } = await payload.find({ collection: 'tags', limit: 500, depth: 0 })
  
  const paths = []
  for (const doc of docs as any[]) {
    for (const locale of ['en', 'zh']) {
      paths.push({ locale, slug: doc.slug })
    }
  }
  return paths
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'tags',
    where: { slug: { equals: slug } },
    limit: 1,
    locale: locale as any,
  })
  const tag = docs[0] as any
  if (!tag) return { title: 'Tag not found' }
  return {
    title: `#${tag.name} — Blog — Jack Deng`,
    description: tag.description ?? `Posts tagged with ${tag.name}.`,
  }
}

export default async function TagPage({ params }: Props) {
  const { slug, locale } = await params
  const payload = await getPayload()

  const [tagResult, blogsResult] = await Promise.all([
    payload.find({ collection: 'tags', where: { slug: { equals: slug } }, limit: 1, locale: locale as any }),
    payload.find({
      collection: 'blogs',
      where: {
        status: { equals: 'published' },
        'tags.slug': { in: [slug] },
      },
      sort: '-publishedAt',
      depth: 2,
      limit: 50,
      locale: locale as any,
    }),
  ])

  const tag = tagResult.docs[0] as any
  if (!tag) notFound()

  const sidebar = await buildSidebarData({ activeTag: slug })
  const blogs = blogsResult.docs as any[]

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <section className="border-b border-zinc-200 dark:border-zinc-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-widest">Tag</p>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              #{tag.name}
            </h1>
            <TagBadge name={tag.name} slug={tag.slug} color={tag.color} static />
          </div>
          {tag.description && (
            <p className="text-zinc-500 dark:text-zinc-400 max-w-xl">{tag.description}</p>
          )}
          <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
            {blogsResult.totalDocs} post{blogsResult.totalDocs !== 1 ? 's' : ''}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          <section>
            {blogs.length === 0 ? (
              <p className="text-zinc-500 dark:text-zinc-400 py-12 text-center">No posts with this tag yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {blogs.map((blog) => (
                  <BlogCard
                    key={blog.id}
                    title={blog.title}
                    slug={blog.slug}
                    excerpt={blog.excerpt}
                    coverImage={blog.coverImage}
                    category={typeof blog.category === 'object' ? blog.category : null}
                    tags={Array.isArray(blog.tags) ? blog.tags.filter((t: any) => typeof t === 'object') : []}
                    publishedAt={blog.publishedAt}
                    featured={blog.featured}
                  />
                ))}
              </div>
            )}
          </section>
          <Sidebar {...sidebar} activeTag={slug} />
        </div>
      </div>
    </main>
  )
}
