import type { CollectionConfig } from 'payload'

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'authorName',
    defaultColumns: ['authorName', 'post', 'status', 'createdAt'],
    description: 'Blog post comments. Approve or mark as spam before they appear publicly.',
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
      label: 'Name',
      required: true,
      minLength: 1,
      maxLength: 60,
    },
    {
      name: 'authorEmail',
      type: 'email',
      label: 'Email',
      required: true,
      admin: {
        description: 'Not displayed publicly.',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Comment',
      required: true,
      minLength: 2,
      maxLength: 500,
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'blogs',
      required: true,
      label: 'Post',
    },

    // ── Moderation ────────────────────────────────────────────────────────
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'pending',
      options: [
        { label: '⏳ Pending',  value: 'pending' },
        { label: '✅ Approved', value: 'approved' },
        { label: '🚫 Spam',     value: 'spam' },
      ],
      admin: {
        position: 'sidebar',
      },
    },

    // ── Anti-spam (server-side only) ──────────────────────────────────────
    {
      name: 'ip',
      type: 'text',
      label: 'IP Address',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Auto-captured for rate limiting.',
      },
    },
    {
      name: 'turnstileToken',
      type: 'text',
      label: 'Turnstile Token',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Cloudflare Turnstile verification token.',
      },
    },

    // ── Honeypot (hidden from UI, only relevant on create) ────────────────
    {
      name: 'honeypot',
      type: 'text',
      label: 'Leave blank',
      admin: {
        hidden: true,
      },
    },
  ],
  timestamps: true,
}
