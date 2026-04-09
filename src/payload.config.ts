import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { en } from '@payloadcms/translations/languages/en'
import { zh } from '@payloadcms/translations/languages/zh'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'
import { Blogs } from './collections/Blogs'
import { Categories } from './collections/Categories'
import { Comments } from './collections/Comments'
import { Tags } from './collections/Tags'
import { Projects } from './collections/Projects'
import { Tools } from './collections/Tools'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const config = buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  admin: {
    components: {
      beforeLogin: ['@/components/TurnstileLogin#TurnstileLogin'],
    },
    autoLogin: {
      email: 'dev@payloadcms.com',
      password: 'test',
      prefillOnly: true,
    },
  },
  // Admin UI 双语：英文 + 简体中文
  i18n: {
    supportedLanguages: { en, zh },
    fallbackLanguage: 'en',
  },
  collections: [
    {
      slug: 'users',
      auth: {
        maxLoginAttempts: 5,
        lockTime: 600000,
        tokenExpiration: 2592000,
        cookies: {
          sameSite: 'Lax',
          secure: true,
        },
        // @ts-expect-error - Payload 3.0 may not natively support mfa in auth config
        mfa: true,
      },
      hooks: {
        beforeLogin: [
          async ({ req }) => {
            // Skip verification in development
            if (process.env.NODE_ENV === 'development') return

            const token = (req as any).body?.turnstileToken || (req.headers && typeof req.headers.get === 'function' ? req.headers.get('x-turnstile-token') : (req.headers as any)?.['x-turnstile-token'])
            if (!token) {
              throw new Error('Missing Turnstile token')
            }
            const secret = process.env.TURNSTILE_SECRET_KEY
            if (secret) {
              const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `secret=${secret}&response=${token}`,
              })
              const data = await response.json()
              if (!data.success) {
                throw new Error('Invalid Turnstile token')
              }
            }
          }
        ]
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    Categories,
    Comments,
    Tags,
    Blogs,
    Projects,
    Tools,
    Media,
  ],
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: '中文',     code: 'zh' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || 'YOUR_SECRET_HERE',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  editor: lexicalEditor({}),
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
      collections: {
        // disablePayloadAccessControl: true — media 是全公开 collection（read: () => true），
        // 无需通过 Payload 的 /api/media/file/xxx 代理，直接返回 Blob CDN URL
        media: {
          disablePayloadAccessControl: true,
        },
      },
    }),
  ],
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'schema.graphql'),
  },
})

export default config

