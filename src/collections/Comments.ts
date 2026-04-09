import type { CollectionConfig } from 'payload'

export const Comments: CollectionConfig = {
  slug: 'comments',
  labels: {
    singular: { en: 'Comment', zh: '评论' },
    plural: { en: 'Comments', zh: '评论' },
  },
  admin: {
    useAsTitle: 'authorName',
    defaultColumns: ['authorName', 'post', 'status', 'createdAt'],
    description: {
      en: 'Blog post comments. Approve or mark as spam before they appear publicly.',
      zh: '博客文章评论。在公开显示之前批准或标记为垃圾评论。',
    },
  },
  access: {
    // Public can create (submit a comment)
    create: () => true,
    // Only admins can read, update, delete
    read: ({ req }) => {
      if (req.user) return true
      // Public can read approved comments (filtered in frontend query)
      return {
        status: { equals: 'approved' },
      }
    },
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeOperation: [
      // ── IP Rate Limiting ──────────────────────────────────────────────────
      async ({ operation, req, args }) => {
        if (operation !== 'create') return args

        const forwarded = req.headers?.get?.('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

        // Store ip for use in beforeChange
        if (req.context) {
          (req.context as Record<string, unknown>).clientIp = ip
        }

        return args
      },
    ],
    beforeChange: [
      // ── Honeypot check ────────────────────────────────────────────────────
      async ({ data, operation }) => {
        if (operation !== 'create') return data

        if (data.honeypot && data.honeypot.trim() !== '') {
          throw new Error('Bot detected.')
        }

        return data
      },

      // ── Inject IP + set default status ───────────────────────────────────
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data

        const ip = (req.context as Record<string, unknown> | undefined)?.clientIp ?? 'unknown'

        // Check recent submission count for this IP (last 1 hour, max 5)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
        const recentCount = await req.payload.count({
          collection: 'comments',
          where: {
            and: [
              { ip: { equals: ip } },
              { createdAt: { greater_than: oneHourAgo } },
            ],
          },
          overrideAccess: true,
        })

        if (recentCount.totalDocs >= 5) {
          throw new Error('Too many comments. Please wait before submitting again.')
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
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: { en: 'Auto-captured for rate limiting.', zh: '自动获取用于频率限制。' },
      },
    },
    {
      name: 'turnstileToken',
      type: 'text',
      label: { en: 'Turnstile Token', zh: 'Turnstile 令牌' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: { en: 'Cloudflare Turnstile verification token.', zh: 'Cloudflare Turnstile 验证令牌。' },
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
