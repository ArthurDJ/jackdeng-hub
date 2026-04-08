import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
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
    autoLogin: {
      email: 'dev@payloadcms.com',
      password: 'test',
      prefillOnly: true,
    },
  },
  collections: [
    {
      slug: 'users',
      auth: true,
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
        media: true,
      },
    }),
  ],
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'schema.graphql'),
  },
})

export default config

