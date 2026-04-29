import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

// Static per locale — generated at build time
export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }]
}

type Props = { params: Promise<{ locale: string }> }

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return {
    title: 'About',
    description: `${t('subtitle')} — ${t('title')}`,
    alternates: {
      canonical: `${BASE}/${locale}/about`,
      languages: { en: `${BASE}/en/about`, zh: `${BASE}/zh/about` },
    },
  }
}

const SKILLS = [
  { group: 'Database',     items: ['PostgreSQL', 'NetSuite', 'SQL Server', 'Supabase'] },
  { group: 'Integration',  items: ['Boomi', 'REST APIs', 'EDI / SFTP', 'Webhooks'] },
  { group: 'Development',  items: ['TypeScript', 'Python', 'Node.js', 'Next.js'] },
  { group: 'Tools',        items: ['Docker', 'Vercel', 'GitHub Actions', 'CI/CD'] },
]

const TIMELINE = [
  {
    year: '2023 – present',
    role: { en: 'Senior Software Engineer | Backend & Data Systems', zh: '高级软件工程师 | 后端与数据系统' },
    place: 'Value Wholesaler',
    desc: {
      en: 'Owns the NetSuite ERP data layer and Boomi integration platform. Designs and maintains pipelines that keep inventory, finance, and fulfillment systems in sync across the business.',
      zh: '负责 NetSuite ERP 数据层与 Boomi 集成平台，设计并维护保持库存、财务和履约系统同步的数据管道。',
    },
  },
  {
    year: '2021 – 2023',
    role: { en: 'Database Administrator', zh: '数据库管理员' },
    place: 'Previous Role',
    desc: {
      en: 'Managed PostgreSQL and SQL Server instances at scale. Designed ETL pipelines, implemented data governance policies, and reduced query latency by 40%.',
      zh: '管理规模化的 PostgreSQL 和 SQL Server 实例，设计 ETL 管道，落地数据治理策略，查询延迟降低 40%。',
    },
  },
  {
    year: '2017 – 2021',
    role: { en: 'Information Technology', zh: '信息技术' },
    place: 'University',
    desc: {
      en: 'Bachelor of Information Technology. Majored in database systems and enterprise architecture.',
      zh: '信息技术学士，主修数据库系统与企业架构。',
    },
  },
]

const LINKS = [
  { label: 'GitHub',    href: 'https://github.com/ArthurDJ', icon: 'github' },
  { label: 'LinkedIn',  href: 'https://linkedin.com/in/jackdeng', icon: 'linkedin' },
  { label: 'Email',     href: 'mailto:hello@jackdeng.cc', icon: 'email' },
]

/* ── inline icon helpers ── */
function GithubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  )
}
function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}
function EmailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}

const ICON_MAP: Record<string, React.ReactNode> = {
  github: <GithubIcon />,
  linkedin: <LinkedInIcon />,
  email: <EmailIcon />,
}

/* ── section heading helper ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 510,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)',
      marginBottom: 20,
    }}>
      {children}
    </p>
  )
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  const lang = locale as 'en' | 'zh'

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 720, margin: '0 auto', padding: '64px 24px', display: 'flex', flexDirection: 'column', gap: 56 }}>

        {/* ── Bio ─────────────────────────────────────────────────────── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 590, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: 6 }}>
                {t('title')}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                {t('subtitle')}
              </p>
            </div>
            {/* Avatar — initials */}
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 590,
              color: 'var(--accent-primary)',
              flexShrink: 0,
              letterSpacing: '-0.5px',
            }}>
              JD
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7 }}>
            <p>{t('bio1')}</p>
            <p>
              {t.rich('bio2', {
                nextjs:   (c) => <a href="https://nextjs.org" target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{c}</a>,
                payload:  (c) => <a href="https://payloadcms.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{c}</a>,
                supabase: (c) => <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{c}</a>,
              })}
            </p>
            <p>{t('bio3')}</p>
          </div>
        </section>

        {/* ── Skills ──────────────────────────────────────────────────── */}
        <section>
          <SectionLabel>{t('skillsHeading')}</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {SKILLS.map(({ group, items }) => (
              <div key={group} style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-default)',
                borderRadius: 12,
                padding: '16px 18px',
              }}>
                <p style={{ fontSize: 11, fontWeight: 510, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                  {group}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {items.map((item) => (
                    <span key={item} style={{
                      fontSize: 12,
                      fontWeight: 400,
                      padding: '3px 10px',
                      borderRadius: 9999,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                    }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Timeline ────────────────────────────────────────────────── */}
        <section>
          <SectionLabel>{t('experienceHeading')}</SectionLabel>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {TIMELINE.map(({ year, role, place, desc }, i) => (
              <li key={year} style={{ display: 'flex', gap: 20, position: 'relative', paddingBottom: i < TIMELINE.length - 1 ? 32 : 0 }}>
                {/* Spine */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', marginTop: 6, flexShrink: 0 }} />
                  {i < TIMELINE.length - 1 && (
                    <div style={{ width: 1, flex: 1, background: 'var(--border-default)', marginTop: 6 }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < TIMELINE.length - 1 ? 0 : 0 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4, fontFamily: 'var(--font-geist-mono, monospace)' }}>
                    {year}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 510, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {role[lang]}{' '}
                    <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>@ {place}</span>
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    {desc[lang]}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Links ───────────────────────────────────────────────────── */}
        <section>
          <SectionLabel>{t('findMeHeading')}</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LINKS.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                className="ds-link-pill"
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noreferrer' : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 16px',
                  borderRadius: 9999,
                  border: '1px solid var(--border-default)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 510,
                  textDecoration: 'none',
                }}
              >
                {ICON_MAP[icon]}
                {label}
              </a>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <section style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          padding: '40px 32px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 380 }}>
            {t('ctaText')}
          </p>
          <a
            href="mailto:hello@jackdeng.cc"
            className="ds-accent-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 9999,
              background: 'var(--accent-primary)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            {t('ctaBtn')}
          </a>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {t.rich('ctaBlogNote', {
              link: (chunks) => (
                <Link href="/blog" style={{ color: 'var(--accent-primary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </section>

      </main>
    </div>
  )
}
