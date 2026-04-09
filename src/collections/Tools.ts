import type { CollectionConfig } from 'payload'

export const Tools: CollectionConfig = {
  slug: 'tools',
  labels: {
    singular: { en: 'Tool', zh: '工具' },
    plural: { en: 'Tools', zh: '工具' },
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: { en: 'Name', zh: '名称' },
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: { en: 'Slug', zh: '别名' },
      required: true,
      unique: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: { en: 'Description', zh: '描述' },
      localized: true,
    },
    {
      name: 'status',
      type: 'select',
      label: { en: 'Status', zh: '状态' },
      defaultValue: 'online',
      options: [
        { label: { en: 'Online', zh: '在线' }, value: 'online' },
        { label: { en: 'Offline', zh: '离线' }, value: 'offline' },
        { label: { en: 'Maintenance', zh: '维护中' }, value: 'maintenance' },
      ],
    },
    {
      name: 'accessControl',
      type: 'select',
      label: { en: 'Access Control', zh: '访问控制' },
      defaultValue: 'public',
      options: [
        { label: { en: 'Public', zh: '公开' }, value: 'public' },
        { label: { en: 'Private', zh: '私有' }, value: 'private' },
      ],
    },
    {
      name: 'apiRoute',
      type: 'text',
      label: { en: 'API Route', zh: 'API 路由' },
      required: true,
    },
  ],
}
