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

import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const config = buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  admin: {
    components: {
      beforeLogin: ['@/components/GoogleLoginButton#GoogleLoginButton'],
      afterNavLinks: [
        '@/components/AdminLangSwitcher#AdminLangSwitcher',
        '@/components/AdminViewSiteLink#AdminViewSiteLink',
      ],
    },
  },
  // Admin UI 双语：英文 + 简体中文，默认中文
  i18n: {
    supportedLanguages: { en, zh },
    fallbackLanguage: 'zh',
  },
  collections: [
    Users,
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

