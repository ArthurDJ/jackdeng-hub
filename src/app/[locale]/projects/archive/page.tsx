import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/Navbar'
import { getPayload } from '@/lib/payload'
import { asLocale } from '@/i18n/routing'
import { linkLabel, sortArchive } from '@/lib/projectArchive'

/**
 * Every project in one table (after brittanychiang.com/archive): year,
 * name, where it was made, what it was built with, and its links.
 *
 * Year and "made at" are optional fields an editor fills in /admin; an
 * empty one shows as a dash rather than a guess. Narrow screens drop the
 * columns from the right: links from sm, "made at" from md, the stack
 * from lg.
 */

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'projects' })
  return {
    title: t('archiveTitle'),
    description: t('archiveSubtitle'),
    alternates: {
      canonical: `${BASE}/${locale}/projects/archive`,
      languages: { en: `${BASE}/en/projects/archive`, zh: `${BASE}/zh/projects/archive` },
    },
  }
}

export default async function ProjectArchivePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'projects' })

  const payload = await getPayload()
  // Same set as /projects: every project record is public.
  const { docs } = await payload.find({
    collection: 'projects',
    depth: 0,
    limit: 200,
    sort: '-createdAt',
    locale: asLocale(locale),
  })
  const rows = sortArchive(docs)
  const dash = (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{t('notSet')}</span>
    </>
  )

  return (
    <>
      <Navbar />
      <main id="main" className="ds-container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
        <Link href="/projects" style={{ fontSize: 13, fontWeight: 510, color: 'var(--accent-primary)', textDecoration: 'none' }}>
          {t('backToProjects')}
        </Link>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '1rem 0 0.5rem' }}>
          {t('archiveTitle')}
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          {t('archiveSubtitle')}
        </p>

        {rows.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>{t('noProjects')}</p>
        ) : (
          <table className="ds-archive">
            <thead>
              <tr>
                <th scope="col">{t('colYear')}</th>
                <th scope="col">{t('colProject')}</th>
                <th scope="col" className="hidden md:table-cell">{t('colMadeAt')}</th>
                <th scope="col" className="hidden lg:table-cell">{t('colBuiltWith')}</th>
                <th scope="col" className="hidden sm:table-cell">{t('colLink')}</th>
              </tr>
            </thead>
            <tbody className="ds-dim-group">
              {rows.map((p) => {
                const tech = (p.techStack ?? []).map((s) => s.tech).filter(Boolean)
                const links = [p.link, p.githubLink].filter((u): u is string => Boolean(u))
                return (
                  <tr key={p.id} className="ds-dim-item">
                    <td className="ds-archive-year">{p.year || dash}</td>
                    <th scope="row" className="ds-archive-name">
                      {p.slug ? <Link href={`/projects/${p.slug}`}>{p.name}</Link> : p.name}
                    </th>
                    <td className="hidden md:table-cell">{p.madeAt || dash}</td>
                    <td className="hidden lg:table-cell">
                      {tech.length ? (
                        <ul className="ds-archive-tech">
                          {tech.map((s) => <li key={s}>{s}</li>)}
                        </ul>
                      ) : dash}
                    </td>
                    <td className="hidden sm:table-cell">
                      {links.length ? (
                        <ul className="ds-archive-links">
                          {links.map((u) => (
                            <li key={u}>
                              <a href={u} target="_blank" rel="noopener noreferrer">{linkLabel(u)} ↗</a>
                            </li>
                          ))}
                        </ul>
                      ) : dash}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </main>
    </>
  )
}
