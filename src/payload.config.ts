import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor, BlocksFeature, CodeBlock } from '@payloadcms/richtext-lexical'
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
import { isLocalDatabaseUrl } from './lib/localDatabase'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const config = buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  admin: {
    user: 'users',
    dateFormat: 'yyyy-MM-dd HH:mm',
    meta: {
      titleSuffix: ' — Jack Deng Admin',
      // /icon.svg is the Next metadata route (src/app/icon.svg). There is no
      // /favicon.svg in public/ — the old value 404'd, leaving admin tabs blank.
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/icon.svg' }],
    },
    components: {
      actions: ['@/components/AdminHeaderSettings#AdminHeaderSettings'],
      // Login is via Payload's native email/password. next-auth used to sit
      // alongside this and was never bridged into Payload's session, so it
      // could not grant admin access; the Google button was removed from this
      // page first, and next-auth itself was dropped once the VisaMonitor
      // panel — its last consumer — moved onto the Payload session too.
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
    // Schema changes go through migrations only. Payload's default is to push
    // the collection schema straight into the database whenever it starts
    // outside production — and .env.local points at the production database,
    // so every `npm run dev` or tsx script was a live DDL run against prod.
    // That is how prod drifted from the migrations (enum columns the
    // migrations create as varchar, a dropped index, an extra NOT NULL).
    //
    // The one exception is CI's schema-drift check (scripts/schema-drift.ts),
    // which pushes the code's schema into a throwaway database to compare it
    // with what the migrations build. It has to ask for that explicitly, and
    // even then only a database on localhost qualifies — no setting of either
    // variable can make this push to a remote database again.
    push: process.env.PAYLOAD_SCHEMA_PUSH === '1' && isLocalDatabaseUrl(process.env.DATABASE_URI),
  }),
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({ blocks: [CodeBlock()] }),
    ],
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
      collections: {
        // disablePayloadAccessControl: true — 直接返回 Blob CDN URL，不走 Payload 的
        // /api/media/file/xxx 代理。
        //
        // 注意：media 的 read 已收紧为「需登录」（见 collections/Media.ts），但那只
        // 挡住匿名枚举整个媒体库，挡不住单个文件 —— Blob 存储本身是公开的，URL 泄露
        // 即可直取。要让文件也私有，得去掉这一行并接受 CDN 性能损失。
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

