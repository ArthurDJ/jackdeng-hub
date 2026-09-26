import { APIError, type CollectionConfig } from 'payload'
// Relative, not `@/` — this module is also loaded through the Payload CLI
// (`payload migrate`) and the tsx scripts, which do not read tsconfig paths.
import type { CommentRejection } from '../lib/commentSubmission'
import { revalidateAfterChange, revalidateAfterDelete } from '../lib/revalidate'

/** Anonymous submissions per IP per window. */
const RATE_MAX = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

const isApproved = (doc: Record<string, unknown>) => doc.status === 'approved'

export const Comments: CollectionConfig = {
  slug: 'comments',
  labels: {
    singular: { en: 'Comment', zh: '评论' },
    plural: { en: 'Comments', zh: '评论' },
  },
  admin: {
    useAsTitle: 'authorName',
    defaultColumns: ['authorName', 'post', 'status', 'createdAt'],
    listSearchableFields: ['authorName', 'authorEmail', 'content'],
    group: { en: 'Content', zh: '内容' },
    description: {
      en: 'Blog post comments. Approve or mark as spam before they appear publicly.',
      zh: '博客文章评论。在公开显示之前批准或标记为垃圾评论。',
    },
  },
  access: {
    // Public submission goes through `POST /api/comments/submit`, which
    // verifies Turnstile and then writes with `overrideAccess`. Leaving create
    // open to anonymous callers is what made the widget optional: skipping the
    // form and posting straight to `/api/comments` wrote a comment anyway.
    create: ({ req }) => Boolean(req.user),
    // Admins only. Approved comments reach the page through the Local API
    // (CommentList: `overrideAccess` plus its own `status` filter), so nothing
    // public needs this route. It used to answer anonymous callers with every
    // approved comment, and a REST read returns whole documents: commenters'
    // email and IP address along with their name.
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    // Only approved comments are shown, so a new submission (always pending)
    // leaves the caches alone; approving, unapproving or deleting one does not.
    afterChange: [revalidateAfterChange(isApproved)],
    afterDelete: [revalidateAfterDelete(isApproved)],
    beforeChange: [
      // ── Anti-spam for anonymous submissions ───────────────────────────────
      //
      // This lives in the collection rather than in the route so that it covers
      // every path into the table, including one a later change forgets about.
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data

        // An authenticated create is the admin panel: no trap, no rate limit,
        // and the author picks the status.
        if (req.user) return data

        // The message is a code, not a sentence: the submission route maps it
        // to a translated string, so no English leaks to a Chinese visitor.
        if (typeof data.honeypot === 'string' && data.honeypot.trim() !== '') {
          throw new APIError('bot_detected' satisfies CommentRejection, 400)
        }

        // Supplied by the submission route from the header the platform sets.
        // Deliberately not read from the request here: a header the submitter
        // can write is a rate limit the submitter can reset.
        const context = req.context as Record<string, unknown> | undefined
        const ip = typeof context?.clientIp === 'string' && context.clientIp
          ? context.clientIp
          : 'unknown'

        const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
        const recent = await req.payload.count({
          collection: 'comments',
          where: {
            and: [
              { ip: { equals: ip } },
              { createdAt: { greater_than: windowStart } },
            ],
          },
          overrideAccess: true,
        })

        if (recent.totalDocs >= RATE_MAX) {
          throw new APIError('rate_limited' satisfies CommentRejection, 429)
        }

        return {
          ...data,
          ip,
          status: 'pending', // always start as pending regardless of what client sends
          honeypot: undefined, // strip from stored data
        }
      },
    ],
  },
  fields: [
    // ── Visible fields ────────────────────────────────────────────────────
    {
      name: 'authorName',
      type: 'text',
      label: { en: 'Name', zh: '姓名' },
      required: true,
      minLength: 1,
      maxLength: 60,
    },
    {
      name: 'authorEmail',
      type: 'email',
      label: { en: 'Email', zh: '邮箱' },
      required: true,
      // Personal data. Collection `read` is admin-only already; this keeps the
      // field hidden if that is ever reopened to show approved comments.
      access: { read: ({ req }) => Boolean(req.user) },
      admin: {
        description: { en: 'Not displayed publicly.', zh: '不会公开显示。' },
      },
    },
    {
      name: 'content',
      type: 'textarea',
      label: { en: 'Comment', zh: '评论内容' },
      required: true,
      minLength: 2,
      maxLength: 500,
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'blogs',
      required: true,
      label: { en: 'Post', zh: '所属文章' },
    },

    // ── Moderation ────────────────────────────────────────────────────────
    {
      name: 'status',
      type: 'select',
      label: { en: 'Status', zh: '状态' },
      defaultValue: 'pending',
      options: [
        { label: { en: '⏳ Pending', zh: '⏳ 待审核' }, value: 'pending' },
        { label: { en: '✅ Approved', zh: '✅ 已批准' }, value: 'approved' },
        { label: { en: '🚫 Spam', zh: '🚫 垃圾评论' }, value: 'spam' },
      ],
      admin: {
        position: 'sidebar',
      },
    },

    // ── Anti-spam (server-side only) ──────────────────────────────────────
    {
      name: 'ip',
      type: 'text',
      label: { en: 'IP Address', zh: 'IP 地址' },
      // Personal data, for the same reason as authorEmail. The rate limit
      // queries it with `overrideAccess`, which skips field access too.
      access: { read: ({ req }) => Boolean(req.user) },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: { en: 'Auto-captured for rate limiting.', zh: '自动获取用于频率限制。' },
      },
    },
    {
      // Deprecated, and no longer written to. The token is verified against
      // Cloudflare during the submission and is single-use, so a stored copy
      // is a spent one — it proves nothing after the fact. The column stays
      // until a follow-up migration drops it, the same two-step used for the
      // legacy category and tool columns (#29, #32).
      name: 'turnstileToken',
      type: 'text',
      label: { en: 'Turnstile Token', zh: 'Turnstile 令牌' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: {
          en: 'Deprecated. Verification now happens server-side during submission.',
          zh: '已弃用。验证现在于提交时在服务端完成。',
        },
      },
    },

    // ── Honeypot (hidden from UI, only relevant on create) ────────────────
    {
      name: 'honeypot',
      type: 'text',
      label: { en: 'Leave blank', zh: '请留空' },
      admin: {
        hidden: true,
      },
    },
  ],
  timestamps: true,
}
