import type { CollectionConfig } from 'payload'
import { appendSetCookie, clearEditorHintCookie, editorHintCookie } from '../lib/editorHint'

/** Seconds a login lasts; the footer's admin-link hint lasts as long. */
const TOKEN_EXPIRATION = 2592000

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: { en: 'User', zh: '用户' },
    plural: { en: 'Users', zh: '用户' },
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 600000,
    tokenExpiration: TOKEN_EXPIRATION,
    cookies: {
      sameSite: 'Lax',
      secure: true,
    },
  },
  // The footer shows an admin link only to a browser signed in here
  // (src/lib/editorHint.ts). Each hook adds a cookie to the REST response the
  // admin's login, refresh and logout calls get.
  hooks: {
    afterLogin: [({ req }) => appendSetCookie(req, editorHintCookie(TOKEN_EXPIRATION))],
    afterRefresh: [({ req, exp }) => appendSetCookie(req, editorHintCookie(exp - Date.now() / 1000))],
    afterLogout: [({ req }) => appendSetCookie(req, clearEditorHintCookie())],
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
