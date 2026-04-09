import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  hooks: {
    // 上传时若 alt 为空，自动使用文件名（去掉扩展名）作为默认 alt
    beforeChange: [
      ({ data }) => {
        if (!data.alt && data.filename) {
          data.alt = (data.filename as string).replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        }
        return data
      },
    ],
  },
  upload: {
    staticDir: path.resolve(dirname, '../../public/media'),
    // Auto-generate WebP variants at 3 responsive sizes
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 225,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'card',
        width: 800,
        height: 450,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'hero',
        width: 1600,
        height: 900,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 85 } },
      },
    ],
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false,
      admin: {
        description: 'Descriptive text for accessibility and SEO. Highly recommended but optional.',
      },
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
}
