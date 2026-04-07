import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/Navbar'

export const dynamic = 'force-static'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return {
    title: 'About',
    description: `${t('subtitle')} — ${t('title')}`,
  }
}

const SKILLS = [
  { group: 'Languages',      items: ['TypeScript', 'Python', 'Go', 'SQL'] },
  { group: 'Frontend',       items: ['React', 'Next.js', 'Tailwind CSS', 'Framer Motion'] },
  { group: 'Backend',        items: ['Node.js', 'Payload CMS', 'PostgreSQL', 'Redis'] },
  { group: 'Infra / DevOps', items: ['Docker', 'Supabase', 'Vercel', 'GitHub Actions'] },
]

const TIMELINE = [
  {
    year: '2024 – present',
    role: { en: 'Full-Stack Engineer', zh: '全栈工程师' },
    place: 'Independent',
    desc: {
      en: 'Building jackdeng.cc — a personal platform combining a CMS-backed blog, tooling layer, and public portfolio.',
      zh: '构建 jackdeng.cc — 一个集 CMS 博客、工具层与个人作品集于一体的个人平台。',
    },
  },
  {
    year: '2022 – 2024',
    role: { en: 'Software Engineer', zh: '软件工程师' },
    place: 'Previous Role',
    desc: {
      en: 'Designed and shipped internal tooling, data pipelines, and customer-facing features at scale.',
      zh: '设计并交付内部工具、数据管道及规模化面向用户的功能。',
    },
  },
  {
    year: '2018 – 2022',
    role: { en: 'Computer Science', zh: '计算机科学' },
    place: 'University',
    desc: {
      en: 'Bachelor of Computer Science. Focused on distributed systems and algorithms.',
      zh: '计算机科学学士，专注于分布式系统与算法。',
    },
  },
]

const LINKS = [
  { label: 'GitHub',   href: 'https://github.com/ArthurDJ' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/jackdeng' },
  { label: 'Email',    href: 'mailto:hello@jackdeng.cc' },
]

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  const tFooter = await getTranslations({ locale, namespace: 'footer' })
  const lang = locale as 'en' | 'zh'

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-16">

        {/* Bio */}
        <section className="space-y-5">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t('title')}</h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t('subtitle')}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0 flex items-center justify-center text-2xl select-none">👤</div>
          </div>
          <div className="space-y-3 text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm">
            <p>{t('bio1')}</p>
            <p>
              {t.rich('bio2', {
                nextjs:  (c) => <a href="https://nextjs.org" target="_blank" rel="noreferrer" className="text-zinc-900 dark:text-zinc-100 underline underline-offset-2 hover:no-underline">{c}</a>,
                payload: (c) => <a href="https://payloadcms.com" target="_blank" rel="noreferrer" className="text-zinc-900 dark:text-zinc-100 underline underline-offset-2 hover:no-underline">{c}</a>,
                supabase:(c) => <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-zinc-900 dark:text-zinc-100 underline underline-offset-2 hover:no-underline">{c}</a>,
              })}
            </p>
            <p>{t('bio3')}</p>
          </div>
        </section>

        {/* Skills */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t('skills')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SKILLS.map(({ group, items }) => (
              <div key={group} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
                <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <span key={item} className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t('experience')}</h2>
          <ol className="relative border-l border-zinc-200 dark:border-zinc-700 space-y-8 ml-2">
            {TIMELINE.map(({ year, role, place, desc }) => (
              <li key={year} className="ml-6">
                <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600 border-2 border-white dark:border-zinc-900" />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-0.5">{year}</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                  {role[lang]} <span className="font-normal text-zinc-500">@ {place}</span>
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{desc[lang]}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Links */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t('findMe')}</h2>
          <div className="flex flex-wrap gap-3">
            {LINKS.map(({ label, href }) => (
              <a key={label} href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noreferrer' : undefined}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                {label}
                {href.startsWith('http') && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 opacity-50">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                )}
              </a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-4">
          <p className="text-zinc-700 dark:text-zinc-300">{t('cta')}</p>
          <a href="mailto:hello@jackdeng.cc"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-85 transition-opacity">
            {t('ctaButton')}
          </a>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {t.rich('ctaNote', {
              writing: () => <Link href="/blog" className="underline underline-offset-2 hover:no-underline">{t('ctaNoteLink')}</Link>,
            })}
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-xs text-zinc-400 dark:text-zinc-600">
        © {new Date().getFullYear()} Jack Deng. {tFooter('builtWith')}
      </footer>
    </>
  )
}
