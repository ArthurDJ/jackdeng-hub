import type { Metadata } from 'next'
import { getPayload } from '@/lib/payload'
import { BlogCard } from '@/components/BlogCard'
import { Sidebar } from '@/components/Sidebar'
import { buildSidebarData } from '@/lib/sidebarData'

export const revalidate = 3600 // ISR: re-generate every hour

export const metadata: Metadata = {
  title: 'Blog — Jack Deng',
  description: 'Thoughts on software engineering, AI, and system design.',
}

export default async function BlogListPage() {
  const payload = await getPayload()

  const [blogsResult] = await Promise.all([
    payload.find({
      collection: 'blogs',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 2,
      limit: 12,
    }),
  ])

  const sidebar = await buildSidebarData()

  const blogs = blogsResult.docs as any[]

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Page header */}
      <section className="border-b border-zinc-200 dark:border-zinc-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Blog</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            {blogsResult.totalDocs} post{blogsResult.totalDocs !== 1 ? 's' : ''} — sorted by newest first
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          {/* Posts grid */}
          <section>
            {blogs.length === 0 ? (
              <p className="text-zinc-500 dark:text-zinc-400 py-12 text-center">No posts published yet.</p>
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

          {/* Sidebar */}
          <Sidebar {...sidebar} />
        </div>
      </div>
    </main>
  )
}
