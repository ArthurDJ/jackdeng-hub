/**
 * reset-media-and-apply.ts
 *
 * 步骤：
 * 1. 删除数据库中所有 media 记录（Blob 文件保留，Payload 不自动删除 Blob 对象，忽略即可）
 * 2. 上传 public/test-images/batch-1/ 下的 10 张图片到新的 media 记录
 * 3. 查询所有已发布博客，按顺序循环分配封面图
 * 4. 打印验证结果
 *
 * 运行：npx tsx scripts/reset-media-and-apply.ts
 */

import 'dotenv/config'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = path.resolve(__dirname, '../public/test-images/batch-1')

async function main() {
  const payload = await getPayload({ config })

  // ── Step 1: 删除所有现有 media 记录 ──────────────────────────────
  console.log('\n[1/3] Deleting all existing media records...')
  const existing = await payload.find({
    collection: 'media',
    limit: 200,
    depth: 0,
  })
  console.log(`    Found ${existing.docs.length} media records to delete`)

  for (const doc of existing.docs as any[]) {
    await payload.delete({ collection: 'media', id: doc.id })
    process.stdout.write(`    Deleted media id=${doc.id} (${doc.filename})\n`)
  }

  // ── Step 2: 上传 10 张测试图 ────────────────────────────────────
  console.log('\n[2/3] Uploading test images...')
  const files = fs.readdirSync(IMAGES_DIR)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .sort()
    .slice(0, 10)

  const mediaIds: number[] = []

  for (const filename of files) {
    const filePath = path.join(IMAGES_DIR, filename)
    const buffer = fs.readFileSync(filePath)
    const stat = fs.statSync(filePath)

    const result = await payload.create({
      collection: 'media',
      // alt 留空，触发 beforeChange hook 自动填文件名
      data: { alt: '' },
      file: {
        data: buffer,
        mimetype: 'image/jpeg',
        name: filename,
        size: stat.size,
      },
    })

    mediaIds.push((result as any).id)
    console.log(`    Uploaded: ${filename} → id=${(result as any).id}  url=${(result as any).url}`)
  }

  // ── Step 3: 查询所有博客，循环分配封面图 ────────────────────────
  console.log('\n[3/3] Applying cover images to published blogs...')
  const { docs: blogs } = await payload.find({
    collection: 'blogs',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    depth: 0,
    limit: 100,
  })

  console.log(`    Found ${blogs.length} published blog(s)`)

  for (let i = 0; i < blogs.length; i++) {
    const blog = blogs[i] as any
    const mediaId = mediaIds[i % mediaIds.length]

    await payload.update({
      collection: 'blogs',
      id: blog.id,
      data: { coverImage: mediaId },
    })

    console.log(`    Blog "${blog.title}" (id=${blog.id}) → coverImage id=${mediaId}`)
  }

  // ── 验证 ────────────────────────────────────────────────────────
  console.log('\n── Verification ──')
  const { docs: verifyBlogs } = await payload.find({
    collection: 'blogs',
    where: { status: { equals: 'published' } },
    depth: 1,
    limit: 5,
  })

  for (const blog of verifyBlogs as any[]) {
    const imgUrl = (blog.coverImage as any)?.sizes?.card?.url
      ?? (blog.coverImage as any)?.url
      ?? '(no image)'
    console.log(`  ${blog.slug}`)
    console.log(`    coverImage url: ${imgUrl}`)
  }

  console.log('\n✅ Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
