import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/Navbar'
import { BlogCard } from '@/components/BlogCard'
import { getPayload } from '@/lib/payload'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  return {
    title: t('title'),
    description: 'Software engineer building at the intersection of AI, data, and systems.',
  }
}

function ProjectCard({
  name, shortDescription, link, status, t,
}: {
  name: string
  shortDescription: string
  link?: string | null
  status?: string | null
  t: ReturnType<typeof useTranslations<'home'>>
}) {
  const statusColors: Record<string, string> = {
    active:    'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400',
    completed: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400',
    'on-hold': 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400',
  }
  const statusLabel: Record<string, string> = {
    active:    t('active'),
    completed: t('completed'),
    'on-hold': t('onHold'),
  }

  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base leading-snug">{name}</h3>
        {status && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[status] ?? ''}`}>
            {statusLabel[status] ?? status}
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed flex-1">{shortDescription}</p>
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-auto">
          {t('viewProject')}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </a>
      )}
    </div>
  )
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  const tFooter = await getTranslations({ locale, namespace: 'footer' })

  const payload = await getPayload()
  const [blogsResult, projectsResult] = await Promise.all([
    payload.find({
      collection: 'blogs',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 2,
      limit: 3,
      locale: locale as any,
    }),
    payload.find({
      collection: 'projects',
      where: { isPinned: { equals: true } },
      sort: '-createdAt',
      depth: 1,
      limit: 2,
    }),
  ])

  const blogs = blogsResult.docs as any[]
  const projects = projectsResult.docs as any[]

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      <Navbar />
      <main className="flex-1">

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 pt-20 pb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 mb-6 border border-zinc-200 dark:border-zinc-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('available')}
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8 max-w-xl">
              {t.rich('bio', {
                ai:      (c) => <span className="text-zinc-900 dark:text-zinc-100 font-medium">{c}</span>,
                data:    (c) => <span className="text-zinc-900 dark:text-zinc-100 font-medium">{c}</span>,
                systems: (c) => <span className="text-zinc-900 dark:text-zinc-100 font-medium">{c}</span>,
              })}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/blog"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-opacity">
                {t('ctaBlog')}
              </Link>
              <Link href="/about"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                {t('ctaAbout')}
              </Link>
            </div>
          </div>
        </section>

        {/* Latest Posts */}
        {blogs.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t('latestPosts')}</h2>
              <Link href="/blog" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{t('viewAll')}</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12 border-t border-zinc-100 dark:border-zinc-800">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-6">{t('projects')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {projects.map((project: any) => (
                <ProjectCard key={project.id} name={project.name} shortDescription={project.shortDescription} link={project.link} status={project.status} t={t} />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-zinc-100 dark:border-zinc-800 py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
          <span>© {new Date().getFullYear()} Jack Deng</span>
          <span>{tFooter('builtWith')}</span>
        </div>
      </footer>
    </div>
  )
}
