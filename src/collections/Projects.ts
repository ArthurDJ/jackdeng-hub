import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: {
    singular: { en: 'Project', zh: '项目' },
    plural: { en: 'Projects', zh: '项目' },
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
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: { en: 'Logo', zh: '标志' },
    },
    {
      name: 'shortDescription',
      type: 'text',
      label: { en: 'Short Description', zh: '简短描述' },
      required: true,
    },
    {
      name: 'longDescription',
      type: 'richText',
      label: { en: 'Long Description', zh: '详细描述' },
    },
    {
      name: 'link',
      type: 'text',
      label: { en: 'Link', zh: '链接' },
    },
    {
      name: 'status',
      type: 'select',
      label: { en: 'Status', zh: '状态' },
      defaultValue: 'active',
      options: [
        { label: { en: 'Active', zh: '进行中' }, value: 'active' },
        { label: { en: 'Completed', zh: '已完成' }, value: 'completed' },
        { label: { en: 'On Hold', zh: '挂起' }, value: 'on-hold' },
      ],
    },
    {
      name: 'isPinned',
      type: 'checkbox',
      label: { en: 'Pinned', zh: '置顶' },
      defaultValue: false,
    },
    {
      name: 'slug',
      type: 'text',
      label: { en: 'Slug', zh: '路径标识' },
      unique: true,
      admin: {
        description: { en: 'URL path identifier, e.g. "jackdeng-hub"', zh: 'URL 路径标识，如 "jackdeng-hub"' },
      },
    },
    {
      name: 'techStack',
      type: 'array',
      label: { en: 'Tech Stack', zh: '技术栈' },
      fields: [
        {
          name: 'tech',
          type: 'text',
          label: { en: 'Technology', zh: '技术' },
          required: true,
        },
      ],
    },
    {
      name: 'githubLink',
      type: 'text',
      label: { en: 'GitHub Link', zh: 'GitHub 链接' },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: { en: 'Cover Image', zh: '封面图' },
    },
  ],
}
