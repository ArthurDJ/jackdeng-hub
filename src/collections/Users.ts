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
    useAsTitle: 'email',
  },
  hooks: {
    beforeLogin: [
      async ({ req, user }) => {
        // MFA Logic
        // In a real Payload 3.0 setup, if mfa: true is supported in auth, 
        // it would handle the second step. If not, we'd need a custom endpoint/hook.
        // For now, we ensure the fields exist for the UI to consume.
        return user
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: { en: 'Name', zh: '姓名' },
    },
    {
      name: 'mfaEnabled',
      type: 'checkbox',
      label: { en: 'Enable 2FA (TOTP)', zh: '启用 2FA (TOTP)' },
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'mfaSecret',
      type: 'text',
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'emailMfaEnabled',
      type: 'checkbox',
      label: { en: 'Enable Email 2FA', zh: '启用邮件 2FA' },
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
