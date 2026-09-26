import type { CollectionConfig } from 'payload'
import { revalidateAfterChange, revalidateAfterDelete } from '../lib/revalidate'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: { en: 'Category', zh: '分类' },
    plural: { en: 'Categories', zh: '分类' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'description'],
    listSearchableFields: ['name', 'slug'],
    group: { en: 'Content', zh: '内容' },
  },
  access: {
    read: () => true, // Public read
  },
  hooks: {
    afterChange: [revalidateAfterChange()],
    afterDelete: [revalidateAfterDelete()],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: { en: 'Name', zh: '名称' },
      required: true,
      unique: true,
      // Localized because the category name is reader-facing in four places —
      // the sidebar, the breadcrumb, the CategoryBadge and the category page's
      // own heading. Before this, /zh showed "Career & Thoughts" and
      // "DevOps & Tools" to Chinese readers. The slug stays unlocalized on
      // purpose: it is the URL, and one URL per category keeps hreflang pairs
      // and existing links intact.
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: { en: 'Slug', zh: '别名' },
      required: true,
      unique: true,
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
      name: 'description',
      type: 'textarea',
      label: { en: 'Description', zh: '描述' },
      localized: true,
    },
  ],
}
