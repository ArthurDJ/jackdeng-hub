import type { CollectionConfig } from 'payload'
import { revalidateAfterChange, revalidateAfterDelete } from '../lib/revalidate'

export const Tools: CollectionConfig = {
  slug: 'tools',
  labels: {
    singular: { en: 'Tool', zh: '工具' },
    plural: { en: 'Tools', zh: '工具' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'accessControl'],
    listSearchableFields: ['name', 'slug', 'description'],
    group: { en: 'Tools', zh: '工具' },
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      return {
        and: [
          { status: { equals: 'online' } },
          { accessControl: { equals: 'public' } },
        ],
      }
    },
  },
  hooks: {
    afterChange: [revalidateAfterChange()],
    afterDelete: [revalidateAfterDelete()],
  },
  fields: [
    // ── Identity ──────────────────────────────────────────────────
    {
      name: 'name',
      type: 'text',
      label: { en: 'Name', zh: '名称' },
      required: true,
      // Reader-facing on /tools, on the detail page and in the sitemap. Before
      // this the column was single-valued, so writing the Chinese name simply
      // overwrote the English one and both locales showed whichever was saved
      // last — the same defect Categories had, hidden the same way by an empty
      // collection.
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: { en: 'Slug', zh: '别名' },
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return (data.name as string)
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
      name: 'icon',
      type: 'text',
      label: { en: 'Icon (emoji)', zh: '图标（emoji）' },
      admin: {
        position: 'sidebar',
        description: { en: 'e.g. 🛠️ 🔍 📊', zh: '例如 🛠️ 🔍 📊' },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: { en: 'Description', zh: '描述' },
      localized: true,
    },

    // ── Type & Access ─────────────────────────────────────────────
    {
      name: 'accessControl',
      type: 'select',
      label: { en: 'Access', zh: '访问权限' },
      defaultValue: 'public',
      options: [
        { label: { en: 'Public', zh: '公开' }, value: 'public' },
        { label: { en: 'Private', zh: '私有' }, value: 'private' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      label: { en: 'Status', zh: '状态' },
      defaultValue: 'online',
      options: [
        { label: { en: 'Online',      zh: '在线' },  value: 'online'      },
        { label: { en: 'Offline',     zh: '离线' },  value: 'offline'     },
        { label: { en: 'Maintenance', zh: '维护中' }, value: 'maintenance' },
      ],
      admin: { position: 'sidebar' },
    },

    // ── Embedding ───────────────────────────────────
    {
      name: 'embedUrl',
      type: 'text',
      label: { en: 'Embed URL', zh: '嵌入地址' },
      admin: {
        description: {
          en: 'External URL of the standalone tool (e.g. https://tool.jackdeng.cc)',
          zh: '独立工具的外部地址，留空则使用内置页面',
        },
      },
    },
    {
      name: 'embedType',
      type: 'select',
      label: { en: 'Embed Type', zh: '嵌入方式' },
      defaultValue: 'iframe',
      options: [
        { label: 'iframe',        value: 'iframe'    },
        { label: 'Script / Web Component', value: 'script' },
        { label: { en: 'Built-in page', zh: '内置页面' }, value: 'builtin' },
      ],
      admin: { position: 'sidebar' },
    },

  ],
}
