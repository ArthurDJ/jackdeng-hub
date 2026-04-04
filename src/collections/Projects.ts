import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'shortDescription',
      type: 'text',
      required: true,
    },
    {
      name: 'longDescription',
      type: 'richText',
    },
    {
      name: 'link',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'On Hold', value: 'on-hold' },
      ],
    },
    {
      name: 'isPinned',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
