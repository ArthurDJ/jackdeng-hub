import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getPayload } from '@/lib/payload'
import { BlogCard } from '@/components/BlogCard'
import { Sidebar } from '@/components/Sidebar'
import { buildSidebarData } from '@/lib/sidebarData'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'blog' })
  return { title: t('title'), description: t('subtitle') }
}

export default async function BlogListPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'blog' })

  const payload = await getPayload()
  const blogsResult = await payload.find({
    collection: 'blogs',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    depth: 2,
    limit: 12,
    locale: locale as any,
  })

  const sidebar = await buildSidebarData()
  const blogs = blogsResult.docs as any[]

  return (
    <main>
      <section className="border-b border-zinc-200 dark:border-zinc-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t('title')}</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t('subtitle')}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          <section>
            {blogs.length === 0 ? (
              <p className="text-zinc-500 dark:text-zinc-400 py-12 text-center">{t('noPostsFound')}</p>
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
          <Sidebar {...sidebar} />
        </div>
      </div>
    </main>
  )
}
