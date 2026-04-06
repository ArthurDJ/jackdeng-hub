import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from '@/lib/payload'
import { BlogCard } from '@/components/BlogCard'
import { Sidebar } from '@/components/Sidebar'
import { buildSidebarData } from '@/lib/sidebarData'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const payload = await getPayload()
  const { docs } = await payload.find({ collection: 'categories', limit: 200, depth: 0 })
  return (docs as any[]).map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const cat = docs[0] as any
  if (!cat) return { title: 'Category not found' }
  return {
    title: `${cat.name} — Blog — Jack Deng`,
    description: cat.description ?? `Posts in the ${cat.name} category.`,
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload()

  const [catResult, blogsResult] = await Promise.all([
    payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1 }),
    payload.find({
      collection: 'blogs',
      where: {
        status: { equals: 'published' },
        'category.slug': { equals: slug },
      },
      sort: '-publishedAt',
      depth: 2,
      limit: 50,
    }),
  ])

  const category = catResult.docs[0] as any
  if (!category) notFound()

  const sidebar = await buildSidebarData({ activeCategory: slug })
  const blogs = blogsResult.docs as any[]

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <section className="border-b border-zinc-200 dark:border-zinc-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-widest">Category</p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{category.name}</h1>
          {category.description && (
            <p className="mt-2 text-zinc-500 dark:text-zinc-400 max-w-xl">{category.description}</p>
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
              <p className="text-zinc-500 dark:text-zinc-400 py-12 text-center">No posts in this category yet.</p>
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
          <Sidebar {...sidebar} activeCategory={slug} />
        </div>
      </div>
    </main>
  )
}
