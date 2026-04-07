import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
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
      fields: [],
    },
    Categories,
    Comments,
    Tags,
    Blogs,
    Projects,
    Tools,
    Media,
  ],
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
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'schema.graphql'),
  },
})

export default config

