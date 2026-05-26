import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: { en: 'User', zh: '用户' },
    plural: { en: 'Users', zh: '用户' },
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 600000,
    tokenExpiration: 2592000,
    cookies: {
      sameSite: 'Lax',
      secure: true,
    },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email'],
    group: { en: 'System', zh: '系统' },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: { en: 'Name', zh: '姓名' },
    },
  ],
}
