// Rendering for the list at /blog/tag/[slug] and its /page/N continuations, so the
// two routes share one implementation. Page 1 lives on the unnumbered URL.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getPayload } from '@/lib/payload'
import { BlogCard } from '@/components/BlogCard'
import { Pagination } from '@/components/Pagination'
import { Sidebar } from '@/components/Sidebar'
import { TagBadge } from '@/components/TagBadge'
import { buildSidebarData } from '@/lib/sidebarData'
import { asLocale } from '@/i18n/routing'
import { populated, populatedList } from '@/lib/relations'
import { POSTS_PER_PAGE, pageHref } from '@/lib/pagination'
import { localeAlternates } from '@/lib/alternates'

export async function tagMetadata(locale: string, slug: string, page: number): Promise<Metadata> {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'tags',
    where: { slug: { equals: slug } },
    limit: 1,
    locale: asLocale(locale),
  })
  const tag = docs[0]
  const t = await getTranslations({ locale, namespace: 'blog' })
  if (!tag) return { title: t('tagNotFound') }
  const { totalDocs } = await payload.count({
    collection: 'blogs',
    where: { status: { equals: 'published' }, 'tags.slug': { in: [slug] } },
  })
  return {
    title: page > 1
      ? `${t('tagMetaTitle', { name: tag.name })} · ${t('pagination.page', { page })}`
      : t('tagMetaTitle', { name: tag.name }),
    // Tags are not localized: their descriptions are written in English, so
    // the Chinese page gets the translated template rather than English copy.
    description: locale === 'en' && tag.description
      ? `${t('tagMetaDescription', { name: tag.name })} ${tag.description.trim().replace(/[.!?]+$/, '')}.`
      : t('tagMetaDescription', { name: tag.name }),
    // Each page is its own canonical URL, as on /blog.
    alternates: localeAlternates(locale, pageHref(`/blog/tag/${slug}`, page)),
    // A tag no published post uses yet renders "no posts found". Keep it out
    // of the index; the sitemap leaves it out too.
    ...(totalDocs === 0 && { robots: { index: false, follow: true } }),
  }
}

export async function TagView({ locale, slug, page }: { locale: string; slug: string; page: number }) {
  const t = await getTranslations({ locale, namespace: 'blog' })
  const payload = await getPayload()


  const [tagResult, blogsResult] = await Promise.all([
    payload.find({ collection: 'tags', where: { slug: { equals: slug } }, limit: 1, locale: asLocale(locale) }),
    payload.find({
      collection: 'blogs',
      where: { status: { equals: 'published' }, 'tags.slug': { in: [slug] } },
      sort: '-publishedAt',
      depth: 1,
      limit: POSTS_PER_PAGE,
      page,
      locale: asLocale(locale),
    }),
  ])

  const tag = tagResult.docs[0]
  if (!tag) notFound()

  const sidebar = await buildSidebarData({ locale: asLocale(locale), activeTag: slug })
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
            {t('tagEyebrow')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 590, letterSpacing: '-0.8px', color: 'var(--text-primary)' }}>
              #{tag.name}
            </h1>
            <TagBadge name={tag.name} slug={tag.slug} color={tag.color} static />
          </div>
          {tag.description && (
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 560 }}>{tag.description}</p>
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
                <Pagination page={page} totalPages={totalPages} basePath={`/blog/tag/${slug}`} />
              </>
            )}
          </section>
          <Sidebar {...sidebar} activeTag={slug} />
        </div>
      </div>
    </main>
  )
}
