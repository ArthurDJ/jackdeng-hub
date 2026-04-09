import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: { en: 'Media', zh: '媒体' },
    plural: { en: 'Media', zh: '媒体' },
  },
  admin: {},
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
      label: { en: 'Alt Text', zh: '替代文本' },
      required: false,
      admin: {
        description: {
          en: 'Descriptive text for accessibility and SEO. Highly recommended but optional.',
          zh: '用于辅助功能和 SEO 的描述性文本。强烈建议但可选。',
        },
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: { en: 'Caption', zh: '标题' },
    },
  ],
}
