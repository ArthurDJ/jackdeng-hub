import type { CollectionConfig } from 'payload'

export const Blogs: CollectionConfig = {
  slug: 'blogs',
  labels: {
    singular: { en: 'Blog', zh: '博客' },
    plural: { en: 'Blogs', zh: '博客' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'category', 'publishedAt'],
    preview: (doc) => `${process.env.NEXT_PUBLIC_SERVER_URL}/blog/${doc.slug}`,
  },
  access: {
    read: ({ req }) => {
      // Published posts are public; drafts visible only to authenticated users
      if (req.user) return true
      return { status: { equals: 'published' } }
    },
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-set publishedAt when transitioning to published
        if (data.status === 'published' && !data.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
  fields: [
    // ── Core ─────────────────────────────────────────────────────
    {
      name: 'title',
      type: 'text',
      label: { en: 'Title', zh: '标题' },
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: { en: 'Slug', zh: '别名' },
      required: true,
      unique: true,
      admin: {
        description: {
          en: 'URL path — auto-generated from title if left blank.',
          zh: 'URL 路径 — 如果留空则从标题自动生成。',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return (data.title as string)
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: { en: 'Excerpt', zh: '摘要' },
      required: false,
      maxLength: 150,
      localized: true,
      admin: {
        description: {
          en: 'Short summary shown in blog cards. Max 150 characters.',
          zh: '博客卡片中显示的简短摘要。最多 150 个字符。',
        },
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: { en: 'Cover Image', zh: '封面图' },
      required: false,
    },
    {
      name: 'content',
      type: 'richText',
      label: { en: 'Content', zh: '内容' },
      required: true,
      localized: true,
    },

    // ── Taxonomy ─────────────────────────────────────────────────
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: { en: 'Category', zh: '分类' },
      required: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      label: { en: 'Tags', zh: '标签' },
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: {
          en: 'Maximum 5 tags per post.',
          zh: '每篇文章最多 5 个标签。',
        },
      },
      validate: (value: unknown) => {
        if (Array.isArray(value) && value.length > 5) {
          return 'Maximum 5 tags allowed per post.'
        }
        return true
      },
    },

    // ── Publishing ────────────────────────────────────────────────
    {
      name: 'status',
      type: 'select',
      label: { en: 'Status', zh: '状态' },
      required: true,
      defaultValue: 'draft',
      options: [
        { label: { en: 'Draft', zh: '草稿' }, value: 'draft' },
        { label: { en: 'Published', zh: '已发布' }, value: 'published' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: { en: 'Published At', zh: '发布时间' },
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: {
          en: 'Auto-set when status changes to Published.',
          zh: '当状态变为已发布时自动设置。',
        },
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: { en: 'Featured', zh: '推荐' },
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: {
          en: 'Pinned to homepage highlights.',
          zh: '置顶到首页高亮区域。',
        },
      },
    },

    // ── SEO ───────────────────────────────────────────────────────
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          label: { en: 'Meta Title', zh: 'SEO 标题' },
          admin: {
            description: {
              en: 'Defaults to post title if left blank.',
              zh: '如果留空则默认为文章标题。',
            },
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: { en: 'Meta Description', zh: 'SEO 描述' },
          maxLength: 160,
          admin: {
            description: {
              en: 'Defaults to excerpt if left blank. Max 160 chars.',
              zh: '如果留空则默认为摘要。最多 160 个字符。',
            },
          },
        },
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
          label: { en: 'OG Image', zh: '社交分享图' },
          admin: {
            description: {
              en: 'Defaults to cover image if left blank.',
              zh: '如果留空则默认为封面图。',
            },
          },
        },
      ],
    },
  ],
}
