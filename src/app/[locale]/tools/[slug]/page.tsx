import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getPayload } from '@/lib/payload'
import { Navbar } from '@/components/Navbar'
import { getBuiltinTool } from '@/components/tools/registry'
import { asLocale, routing } from '@/i18n/routing'

export const revalidate = 3600

// Prerender only tools anyone may see. The page itself does not check
// accessControl (see the query below), so a private tool must not be baked
// into a static page ahead of time; unlisted slugs still render on demand.
export async function generateStaticParams() {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'tools',
    where: {
      and: [
        { status: { not_equals: 'offline' } },
        { accessControl: { equals: 'public' } },
      ],
    },
    depth: 0,
    limit: 100,
  })
  return docs
    .filter((doc) => doc.slug)
    .flatMap((doc) => routing.locales.map((locale) => ({ locale, slug: doc.slug })))
}

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'tools',
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
    locale: asLocale(locale),
  })

  const tool = docs[0]
  if (!tool) return {}

  const title = tool.name
  const description = tool.description ?? ''
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}/${locale}/tools/${slug}`,
      languages: {
        en: `${BASE}/en/tools/${slug}`,
        zh: `${BASE}/zh/tools/${slug}`,
      },
    },
    openGraph: { title: `${title} — Jack Deng`, description },
  }
}

const TOOL_STATUS_COLOR: Record<string, string> = {
  online:      '#10b981',
  offline:     '#71717a',
  maintenance: '#f59e0b',
}

export default async function ToolDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'tools' })

  // Static map — next-intl keys must stay statically analysable (no t('status.' + x))
  const STATUS_LABEL: Record<string, string> = {
    online: t('status.online'),
    offline: t('status.offline'),
    maintenance: t('status.maintenance'),
  }

  const payload = await getPayload()

  // 查询工具（不过滤 accessControl/toolType，权限在渲染层处理）
  const { docs } = await payload.find({
    collection: 'tools',
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { not_equals: 'offline' } },
      ],
    },
    depth: 0,
    limit: 1,
    locale: asLocale(locale),
  })

  const tool = docs[0]
  if (!tool) notFound()

  const statusColor = TOOL_STATUS_COLOR[tool.status] ?? TOOL_STATUS_COLOR.online
  // Resolved by slug, not by toolType. The old code rendered the visa monitor
  // for *any* automation tool, and never handled embedType 'builtin' at all.
  const BuiltinTool = getBuiltinTool(slug)
  const isAutomation = tool.toolType === 'automation'
  const hasIframe = Boolean(tool.embedUrl) && tool.embedType === 'iframe'
  const hasScript = Boolean(tool.embedUrl) && tool.embedType === 'script'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <Navbar />

      <main id="main" className="ds-container" style={{ paddingTop: '64px', paddingBottom: '80px' }}>

        {/* ── Breadcrumb ──────────────────────────────────────────────── */}
        <nav style={{ marginBottom: '32px', fontSize: '14px', color: 'var(--text-tertiary)' }}>
          <Link href="/tools" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            {t('title')}
          </Link>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ color: 'var(--text-primary)' }}>{tool.name}</span>
        </nav>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {tool.icon && (
            <span style={{ fontSize: '48px', lineHeight: 1 }}>{tool.icon}</span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h1 style={{
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}>
                {tool.name}
              </h1>
              <span style={{
                fontSize: '11px', fontWeight: 600,
                color: statusColor,
                background: statusColor + '18',
                border: `1px solid ${statusColor}30`,
                borderRadius: '4px', padding: '2px 8px',
              }}>
                {STATUS_LABEL[tool.status] ?? STATUS_LABEL.online}
              </span>
              {isAutomation && (
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  color: '#a78bfa',
                  background: '#a78bfa18',
                  border: '1px solid #a78bfa30',
                  borderRadius: '4px', padding: '2px 8px',
                }}>
                  {t('automation')}
                </span>
              )}
            </div>
            {tool.description && (
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                {tool.description}
              </p>
            )}
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────────── */}
        {BuiltinTool ? (
          // In-repo page: automation dashboards and client-side toys alike.
          <BuiltinTool slug={slug} />
        ) : hasIframe ? (
          <div style={{
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-panel)',
            minHeight: '600px',
          }}>
            <iframe
              src={tool.embedUrl}
              title={tool.name}
              style={{ width: '100%', height: '700px', border: 'none', display: 'block' }}
              loading="lazy"
              allow="clipboard-write"
            />
          </div>
        ) : hasScript ? (
          <ScriptEmbed url={tool.embedUrl} noScriptText={t('enableJs')} />
        ) : (
          <div style={{
            borderRadius: '12px',
            border: '1px dashed var(--border-default)',
            backgroundColor: 'var(--bg-panel)',
            padding: '80px 40px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '40px', marginBottom: '16px' }}>🚧</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
              {t('comingSoon')}
            </p>
          </div>
        )}

        {/* ── Back link ───────────────────────────────────────────────── */}
        <div style={{ marginTop: '40px' }}>
          <Link href="/tools" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none',
          }}>
            {t('backToTools')}
          </Link>
        </div>

      </main>
    </div>
  )
}

function ScriptEmbed({ url, noScriptText }: { url: string; noScriptText: string }) {
  return (
    <div style={{
      borderRadius: '12px',
      border: '1px solid var(--border-default)',
      backgroundColor: 'var(--bg-panel)',
      padding: '40px',
      minHeight: '400px',
    }}>
      <div id="tool-embed-root" style={{ width: '100%', minHeight: '360px' }} />
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src={url} async defer data-container="tool-embed-root" />
      <noscript>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
          {noScriptText}
        </p>
      </noscript>
    </div>
  )
}
