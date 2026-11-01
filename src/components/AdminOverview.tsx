import React from 'react'
import Link from 'next/link'
import type { ServerProps } from 'payload'
import { AdminLocalDate } from '@/components/AdminLocalDate'
import {
  type AdminText,
  adminCreateUrl,
  adminEditUrl,
  adminLanguage,
  adminListUrl,
  orNull,
} from '@/lib/adminOverview'

/**
 * The top of /admin: a few counts, quick actions and the posts edited last,
 * above Payload's collection cards. Registered as `admin.components.
 * beforeDashboard` in payload.config.ts, so Payload renders it on the server
 * with the dashboard's props (`payload`, `i18n`, `user`, …).
 *
 * Every query is optional to the dashboard: a failed one is logged and its
 * figure shows a dash (or the list a note), and the collection cards below
 * still render. Styles are in src/app/(payload)/custom.css (`.jd-overview`),
 * built from Payload's theme variables so both admin themes work.
 *
 * The Local API skips access control by default. That is fine here: only a
 * signed-in user reaches the dashboard, and every collection counted lets any
 * signed-in user read all of it.
 */

const TEXT = {
  heading: { en: 'Overview', zh: '概览' },
  published: { en: 'Published posts', zh: '已发布文章' },
  drafts: { en: 'Drafts', zh: '草稿' },
  pending: { en: 'Comments to review', zh: '待审评论' },
  projects: { en: 'Projects', zh: '项目' },
  toolsOnline: { en: 'Tools online', zh: '在线工具' },
  unavailable: { en: 'unavailable', zh: '暂不可用' },
  quickActions: { en: 'Quick actions', zh: '快捷操作' },
  writePost: { en: 'Write a post', zh: '写文章' },
  reviewComments: { en: 'Review comments', zh: '审核评论' },
  uploadMedia: { en: 'Upload media', zh: '上传媒体' },
  openSite: { en: 'Open the site', zh: '打开网站' },
  newTab: { en: '(opens in a new tab)', zh: '（在新标签页打开）' },
  recent: { en: 'Recently edited', zh: '最近编辑' },
  noPosts: { en: 'No posts yet.', zh: '还没有文章。' },
  recentFailed: { en: 'Could not load recent posts.', zh: '最近编辑的文章没能加载。' },
  untitled: { en: '(untitled)', zh: '（无标题）' },
  statusPublished: { en: 'Published', zh: '已发布' },
  statusDraft: { en: 'Draft', zh: '草稿' },
} satisfies Record<string, AdminText>

export async function AdminOverview({ payload, i18n }: ServerProps) {
  const lang = adminLanguage(i18n?.language)
  const t = (key: keyof typeof TEXT) => TEXT[key][lang]
  const admin = payload.config.routes.admin

  const [published, drafts, pending, projects, toolsOnline, recent] = await Promise.all([
    orNull(payload.count({ collection: 'blogs', where: { status: { equals: 'published' } } }), 'overview: published posts'),
    orNull(payload.count({ collection: 'blogs', where: { status: { equals: 'draft' } } }), 'overview: draft posts'),
    orNull(payload.count({ collection: 'comments', where: { status: { equals: 'pending' } } }), 'overview: pending comments'),
    orNull(payload.count({ collection: 'projects' }), 'overview: projects'),
    orNull(payload.count({ collection: 'tools', where: { status: { equals: 'online' } } }), 'overview: online tools'),
    orNull(
      payload.find({
        collection: 'blogs',
        sort: '-updatedAt',
        limit: 5,
        depth: 0,
        pagination: false,
        // The title is localized; without a locale it falls back to zh (CLAUDE.md).
        locale: lang,
        select: { title: true, status: true, updatedAt: true },
      }),
      'overview: recently edited posts',
    ),
  ])

  const pendingUrl = adminListUrl(admin, 'comments', { status: 'pending' })
  const stats: { key: keyof typeof TEXT; count: { totalDocs: number } | null; href: string; attention?: boolean }[] = [
    { key: 'published', count: published, href: adminListUrl(admin, 'blogs', { status: 'published' }) },
    { key: 'drafts', count: drafts, href: adminListUrl(admin, 'blogs', { status: 'draft' }) },
    { key: 'pending', count: pending, href: pendingUrl, attention: (pending?.totalDocs ?? 0) > 0 },
    { key: 'projects', count: projects, href: adminListUrl(admin, 'projects') },
    { key: 'toolsOnline', count: toolsOnline, href: adminListUrl(admin, 'tools', { status: 'online' }) },
  ]

  const actions = [
    { key: 'writePost', href: adminCreateUrl(admin, 'blogs') },
    { key: 'reviewComments', href: pendingUrl },
    { key: 'uploadMedia', href: adminCreateUrl(admin, 'media') },
  ] as const

  return (
    <section className="jd-overview" aria-label={t('heading')}>
      <ul className="jd-overview__stats">
        {stats.map((stat) => (
          <li key={stat.key}>
            <Link
              className={`jd-overview__stat${stat.attention ? ' jd-overview__stat--attention' : ''}`}
              href={stat.href}
            >
              <span className="jd-overview__value">
                {stat.count ? (
                  stat.count.totalDocs
                ) : (
                  <>
                    <span aria-hidden="true">—</span>
                    <span className="jd-overview__sr">{t('unavailable')}</span>
                  </>
                )}
              </span>
              <span className="jd-overview__label">{t(stat.key)}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="jd-overview__panels">
        <section className="jd-overview__panel">
          <h2 className="jd-overview__caption">{t('quickActions')}</h2>
          <ul className="jd-overview__actions">
            {actions.map((action) => (
              <li key={action.key}>
                <Link
                  className={`jd-overview__action${action.key === 'writePost' ? ' jd-overview__action--primary' : ''}`}
                  href={action.href}
                >
                  {t(action.key)}
                </Link>
              </li>
            ))}
            <li>
              {/* The public site, outside the admin: a plain link in a new tab. */}
              <a className="jd-overview__action" href="/" target="_blank" rel="noopener noreferrer">
                {t('openSite')} <span aria-hidden="true">↗</span>
                <span className="jd-overview__sr">{t('newTab')}</span>
              </a>
            </li>
          </ul>
        </section>

        <section className="jd-overview__panel">
          <h2 className="jd-overview__caption">{t('recent')}</h2>
          {!recent ? (
            <p className="jd-overview__note">{t('recentFailed')}</p>
          ) : recent.docs.length === 0 ? (
            <p className="jd-overview__note">{t('noPosts')}</p>
          ) : (
            <ol className="jd-overview__recent">
              {recent.docs.map((post) => (
                <li key={post.id} className="jd-overview__post">
                  <Link className="jd-overview__post-title" href={adminEditUrl(admin, 'blogs', post.id)}>
                    {post.title || t('untitled')}
                  </Link>
                  <span
                    className={`jd-overview__badge jd-overview__badge--${post.status === 'published' ? 'published' : 'draft'}`}
                  >
                    {t(post.status === 'published' ? 'statusPublished' : 'statusDraft')}
                  </span>
                  {post.updatedAt && <AdminLocalDate iso={post.updatedAt} lang={lang} />}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </section>
  )
}
