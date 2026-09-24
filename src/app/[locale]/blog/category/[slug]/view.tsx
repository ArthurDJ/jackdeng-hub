// Rendering for the list at /blog/category/[slug] and its /page/N continuations, so the
// two routes share one implementation. Page 1 lives on the unnumbered URL.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getPayload } from '@/lib/payload'
import { BlogCard } from '@/components/BlogCard'
import { Pagination } from '@/components/Pagination'
import { Sidebar } from '@/components/Sidebar'
import { buildSidebarData } from '@/lib/sidebarData'
import { asLocale } from '@/i18n/routing'
import { populated, populatedList } from '@/lib/relations'
import { POSTS_PER_PAGE, pageHref } from '@/lib/pagination'
import { localeAlternates } from '@/lib/alternates'

export async function categoryMetadata(locale: string, slug: string, page: number): Promise<Metadata> {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    locale: asLocale(locale),
  })
  const cat = docs[0]
  const t = await getTranslations({ locale, namespace: 'blog' })
  if (!cat) return { title: t('categoryNotFound') }
  return {
    title: page > 1
      ? `${t('categoryMetaTitle', { name: cat.name })} · ${t('pagination.page', { page })}`
      : t('categoryMetaTitle', { name: cat.name }),
    description: cat.description ?? t('categoryMetaDescription', { name: cat.name }),
    // Each page is its own canonical URL, as on /blog.
    alternates: localeAlternates(locale, pageHref(`/blog/category/${slug}`, page)),
  }
}

export async function CategoryView({ locale, slug, page }: { locale: string; slug: string; page: number }) {
  const t = await getTranslations({ locale, namespace: 'blog' })
  const payload = await getPayload()


  const [catResult, blogsResult] = await Promise.all([
    payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1, locale: asLocale(locale) }),
    payload.find({
      collection: 'blogs',
      where: { status: { equals: 'published' }, 'category.slug': { equals: slug } },
      sort: '-publishedAt',
      depth: 1,
      limit: POSTS_PER_PAGE,
      page,
      locale: asLocale(locale),
    }),
  ])

  const category = catResult.docs[0]
  if (!category) notFound()

  const sidebar = await buildSidebarData({ locale: asLocale(locale), activeCategory: slug })
  const blogs = blogsResult.docs
  const totalPages = blogsResult.totalPages ?? 1
  // A page past the end is a URL that should not exist, not an empty list.
  if (page > 1 && page > totalPages) notFound()

  return (
    <main id="main">
      {/* Header */}
      <section className="border-b border-subtle ds-section-padding">
        <div className="ds-container">
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            {t('categoryEyebrow')}
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 590, letterSpacing: '-0.8px', color: 'var(--text-primary)', marginBottom: 8 }}>
            {category.name}
          </h1>
          {category.description && (
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 560 }}>{category.description}</p>
          )}
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-tertiary)' }}>
            {blogsResult.totalDocs} {blogsResult.totalDocs !== 1 ? t('posts') : t('post')}
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="ds-container py-10">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }} className="blog-layout">
          <style>{`@media (min-width: 1024px) { .blog-layout { grid-template-columns: 1fr 260px !important; } }`}</style>

          <section>
            {blogs.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '48px 0', fontSize: 15 }}>
                {t('noPostsFound')}
              </p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {blogs.map((blog) => (
                    <BlogCard
                      key={blog.id}
                      title={blog.title}
                      slug={blog.slug}
                      excerpt={blog.excerpt}
                      coverImage={populated(blog.coverImage)}
                      category={populated(blog.category)}
                      tags={populatedList(blog.tags)}
                      publishedAt={blog.publishedAt}
                      featured={blog.featured}
                      content={blog.content}
                    />
                  ))}
                </div>
                <Pagination page={page} totalPages={totalPages} basePath={`/blog/category/${slug}`} />
              </>
            )}
          </section>
          <Sidebar {...sidebar} activeCategory={slug} />
        </div>
      </div>
    </main>
  )
}
