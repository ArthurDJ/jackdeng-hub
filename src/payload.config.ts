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
import { ToolRuns } from './collections/ToolRuns'
import { Media } from './collections/Media'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const config = buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  admin: {
    user: 'users',
    components: {
      actions: ['@/components/AdminHeaderSettings#AdminHeaderSettings'],
      beforeLogin: ['@/components/GoogleLoginButton#GoogleLoginButton'],
      graphics: {
        Logo: '@/components/AdminLogo#AdminLogo',
        Icon: '@/components/AdminLogo#AdminIcon',
      },
    },
  },
  // Admin UI 双语：英文 + 简体中文，默认中文
  // 覆盖 general.locale 翻译，将 "Locale / 语言环境" 改为 "语言 / Language"
  i18n: {
    supportedLanguages: { en, zh },
    fallbackLanguage: 'zh',
    translations: {
      zh: { general: { locale: '语言' } },
      en: { general: { locale: 'Language' } },
    },
  },
  collections: [
    Users,
    Categories,
    Comments,
    Tags,
    Blogs,
    Projects,
    Tools,
    ToolRuns,
    Media,
  ],
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: '中文',     code: 'zh' },
    ],
    defaultLocale: 'zh',
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || 'YOUR_SECRET_HERE',
  // No email service needed — admin uses Google OAuth only
  email: (() => ({
    name: 'noop',
    defaultFromName: 'Jack Deng',
    defaultFromAddress: 'no-reply@jackdeng.cc',
    sendEmail: async () => {},
  })) as any,
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

