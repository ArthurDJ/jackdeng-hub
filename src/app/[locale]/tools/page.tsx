import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getPayload } from '@/lib/payload'
import { Navbar } from '@/components/Navbar'

export const revalidate = 3600

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://jackdeng.cc'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'zh' ? '工具箱 — Jack Deng' : 'Tools — Jack Deng',
    description: locale === 'zh'
      ? '实用开发工具，免费在线使用'
      : 'Handy dev tools, free to use online',
    alternates: {
      canonical: `${BASE}/${locale}/tools`,
      languages: { en: `${BASE}/en/tools`, zh: `${BASE}/zh/tools` },
    },
  }
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  online:      { label: 'Online',  color: '#10b981' },
  offline:     { label: 'Offline', color: '#71717a' },
  maintenance: { label: '维护中',  color: '#f59e0b' },
}

export default async function ToolsPage({ params }: Props) {
  const { locale } = await params
  const isZh = locale === 'zh'

  const payload = await getPayload()
  const { docs: tools } = await payload.find({
    collection: 'tools',
    where: {
      and: [
        { status: { equals: 'online' } },
        { accessControl: { equals: 'public' } },
        { toolType: { equals: 'interactive' } },
      ],
    },
    depth: 0,
    limit: 50,
  }) as any

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <Navbar />

      <main className="ds-container" style={{ paddingTop: '64px', paddingBottom: '80px' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '12px',
          }}>
            {isZh ? '🛠️ 工具箱' : '🛠️ Tools'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            {isZh
              ? '实用开发小工具，免费在线使用'
              : 'Handy dev tools, free to use online'}
          </p>
        </div>

        {/* Grid */}
        {tools.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)' }}>
            {isZh ? '暂无可用工具' : 'No tools available yet'}
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {tools.map((tool: any) => {
              const badge = STATUS_BADGE[tool.status] ?? STATUS_BADGE.online
              return (
                <Link
                  key={tool.id}
                  href={`/${locale}/tools/${tool.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    backgroundColor: 'var(--bg-panel)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    padding: '24px',
                    transition: 'border-color 0.15s, background 0.15s',
                    cursor: 'pointer',
                    height: '100%',
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'
                      ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-elevated)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'
                      ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-panel)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontSize: '32px' }}>{tool.icon ?? '🔧'}</span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: badge.color,
                        background: badge.color + '18',
                        border: `1px solid ${badge.color}30`,
                        borderRadius: '4px',
                        padding: '2px 8px',
                      }}>
                        {badge.label}
                      </span>
                    </div>
                    <h2 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                      letterSpacing: '-0.01em',
                    }}>
                      {tool.name}
                    </h2>
                    {tool.description && (
                      <p style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.6',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {tool.description}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
