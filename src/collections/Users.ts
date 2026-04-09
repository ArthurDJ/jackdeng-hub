import type { CollectionConfig } from 'payload'
import { authenticator } from 'otplib'

export const Users: CollectionConfig = {
  slug: 'users',
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
    labels: {
      singular: { en: 'User', zh: '用户' },
      plural: { en: 'Users', zh: '用户' },
    },
  },
  hooks: {
    beforeLogin: [
      async ({ req, user }) => {
        // 1. Turnstile Check (Existing logic)
        if (process.env.NODE_ENV !== 'development') {
          const token = (req as any).body?.turnstileToken || 
                        (req.headers && typeof req.headers.get === 'function' ? req.headers.get('x-turnstile-token') : (req.headers as any)?.['x-turnstile-token'])
          
          if (!token) throw new Error('Missing Turnstile token')
          
          const secret = process.env.TURNSTILE_SECRET_KEY
          if (secret) {
            const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `secret=${secret}&response=${token}`,
            })
            const data = await response.json()
            if (!data.success) throw new Error('Invalid Turnstile token')
          }
        }

        // 2. MFA Logic
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
