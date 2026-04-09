import type { CollectionConfig } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: {
    singular: { en: 'Tag', zh: '标签' },
    plural: { en: 'Tags', zh: '标签' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'color'],
  },
  access: {
    read: () => true, // Public read
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: { en: 'Name', zh: '名称' },
      required: true,
      unique: true,
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
          en: 'URL-friendly identifier, auto-generated from name if left blank.',
          zh: 'URL 友好标识符，如果留空则从名称自动生成。',
        },
      },
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
      name: 'color',
      type: 'text',
      label: { en: 'Color', zh: '颜色' },
      required: true,
      defaultValue: '#3B82F6',
      admin: {
        description: {
          en: 'Hex color code (e.g. #3B82F6) used to render the tag badge.',
          zh: '用于渲染标签徽章的十六进制颜色代码（例如 #3B82F6）。',
        },
      },
      validate: (value: any) => {
        if (!value) return 'Color is required'
        if (typeof value !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(value)) {
          return 'Must be a valid hex color (e.g. #3B82F6)'
        }
        return true
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: { en: 'Description', zh: '描述' },
      localized: true,
    },
  ],
}
