import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from '@/lib/payload'
import { Navbar } from '@/components/Navbar'

export const revalidate = 3600

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
  }) as any

  const tool = docs[0]
  if (!tool) return {}

  const title = `${tool.name} — Jack Deng`
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
    openGraph: { title, description },
  }
}

// ── Status badge colours ────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  online:      '#10b981',
  offline:     '#71717a',
  maintenance: '#f59e0b',
}

// ── Main page ───────────────────────────────────────────────────────────────
export default async function ToolDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const isZh = locale === 'zh'

  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'tools',
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: 'online' } },
        { accessControl: { equals: 'public' } },
        { toolType: { equals: 'interactive' } },
      ],
    },
    depth: 0,
    limit: 1,
  }) as any

  const tool = docs[0]
  if (!tool) notFound()

  const statusColor = STATUS_COLOR[tool.status] ?? STATUS_COLOR.online
  const hasEmbed = Boolean(tool.embedUrl) && tool.embedType === 'iframe'
  const isScript = Boolean(tool.embedUrl) && tool.embedType === 'script'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <Navbar />

      <main className="ds-container" style={{ paddingTop: '64px', paddingBottom: '80px' }}>

        {/* ── Breadcrumb ──────────────────────────────────────────────── */}
        <nav style={{ marginBottom: '32px', fontSize: '14px', color: 'var(--text-tertiary)' }}>
          <a href={`/${locale}/tools`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            {isZh ? '工具箱' : 'Tools'}
          </a>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ color: 'var(--text-primary)' }}>{tool.name}</span>
        </nav>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '32px',
          flexWrap: 'wrap',
        }}>
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
                fontSize: '11px',
                fontWeight: 600,
                color: statusColor,
                background: statusColor + '18',
                border: `1px solid ${statusColor}30`,
                borderRadius: '4px',
                padding: '2px 8px',
                whiteSpace: 'nowrap',
              }}>
                {tool.status === 'online'
                  ? (isZh ? '在线' : 'Online')
                  : tool.status === 'maintenance'
                    ? (isZh ? '维护中' : 'Maintenance')
                    : (isZh ? '离线' : 'Offline')}
              </span>
            </div>
            {tool.description && (
              <p style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                margin: 0,
              }}>
                {tool.description}
              </p>
            )}
          </div>
        </div>

        {/* ── Embed area ──────────────────────────────────────────────── */}
        {hasEmbed ? (
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
              style={{
                width: '100%',
                height: '700px',
                border: 'none',
                display: 'block',
              }}
              loading="lazy"
              allow="clipboard-write"
            />
          </div>
        ) : isScript ? (
          /* Script / Web Component embed — inject at runtime */
          <ScriptEmbed url={tool.embedUrl} name={tool.name} />
        ) : (
          /* Built-in or no embed URL → placeholder */
          <div style={{
            borderRadius: '12px',
            border: '1px dashed var(--border-default)',
            backgroundColor: 'var(--bg-panel)',
            padding: '80px 40px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '40px', marginBottom: '16px' }}>🚧</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
              {isZh ? '工具页面建设中，敬请期待' : 'Tool page coming soon'}
            </p>
          </div>
        )}

        {/* ── Back link ───────────────────────────────────────────────── */}
        <div style={{ marginTop: '40px' }}>
          <a
            href={`/${locale}/tools`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
            }}
          >
            ← {isZh ? '返回工具箱' : 'Back to Tools'}
          </a>
        </div>

      </main>
    </div>
  )
}

// ── Script embed helper (client component) ─────────────────────────────────
// Rendered server-side as a placeholder; actual script injection requires
// a client component. Here we render a container + a noscript fallback.
function ScriptEmbed({ url, name }: { url: string; name: string }) {
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
          Please enable JavaScript to use {name}.
        </p>
      </noscript>
    </div>
  )
}
