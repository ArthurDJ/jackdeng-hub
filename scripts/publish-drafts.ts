/**
 * Upload hero images and write blog posts, in both locales, as drafts.
 *
 * Content is authored as markdown in the drafts folder and converted to the
 * Lexical node shape Payload stores. Only headings, paragraphs and inline
 * bold/code are handled, which is all these two posts use.
 *
 * Posts are created with status 'draft' on purpose. Blogs.access.read hides
 * anything that is not 'published' from anonymous visitors, so nothing goes
 * public until someone flips the field in /admin.
 *
 *   npx tsx scripts/publish-drafts.ts --apply
 */
import { loadEnv, requireApply } from './lib/env'
import { getPayload } from 'payload'
import fs from 'fs'
import path from 'path'

loadEnv()

const DRAFTS = process.env.DRAFTS_DIR
if (!DRAFTS) {
  console.error('set DRAFTS_DIR to the folder holding the .md and hero .jpg files')
  process.exit(1)
}

// Checked after the env guards above, so a missing variable fails before this
// prints that it is about to write.
requireApply({ script: 'scripts/publish-drafts.ts', writes: ['media', 'blogs'] })

/**
 * Without this token vercelBlobStorage is disabled (see payload.config.ts) and
 * Payload writes uploads to the local public/media folder while still recording
 * a /api/media/file/... URL in the shared database. The row then points at a
 * file that exists on one laptop and nowhere else, so the cover is broken in
 * production. That happened once.
 *
 * Checked here rather than at startup, because the update path below touches no
 * files and has no reason to need the token.
 */
function assertBlobConfigured() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return
  console.error(`
  ⛔ BLOB_READ_WRITE_TOKEN is not set, and this run needs to upload an image

     The file would be written to ./public/media on this machine instead of
     Vercel Blob, and the media row would point at something production cannot
     serve.

     Either add the token to .env, or upload the image through /admin and
     attach it to the post by hand.
`)
  process.exit(1)
}

// ── Markdown -> Lexical ─────────────────────────────────────────────────────
const textNode = (text: string, format = 0) => ({
  detail: 0, format, mode: 'normal', style: '', text, type: 'text', version: 1,
})

/**
 * Inline markup: **bold**, `code`, and [text](url). Links become Lexical link
 * nodes — leaving them to the plain-text path stores the bracket syntax
 * verbatim, which is what happened to the first post written by this script.
 */
function inline(md: string) {
  const out: any[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  for (const m of md.matchAll(re)) {
    const i = m.index!
    if (i > last) out.push(textNode(md.slice(last, i)))
    const tok = m[0]
    if (tok.startsWith('**')) {
      out.push(textNode(tok.slice(2, -2), 1))
    } else if (tok.startsWith('`')) {
      out.push(textNode(tok.slice(1, -1), 16))
    } else {
      const link = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!
      out.push({
        type: 'link',
        fields: { linkType: 'custom', newTab: true, url: link[2] },
        format: '', indent: 0, version: 3, direction: 'ltr',
        children: [textNode(link[1])],
      })
    }
    last = i + tok.length
  }
  if (last < md.length) out.push(textNode(md.slice(last)))
  return out.length ? out : [textNode('')]
}

const paragraph = (text: string) => ({
  type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
  textFormat: 0, children: inline(text),
})

/**
 * Line-based rather than block-based. Splitting only on blank lines folded a
 * bullet list into one run-on paragraph, because every newline inside a block
 * was replaced with a space and the hyphens stayed in the text.
 */
function toLexical(md: string) {
  const children: any[] = []
  const lines = md.split('\n')
  let para: string[] = []
  let items: any[] = []

  const flushPara = () => {
    if (para.length) children.push(paragraph(para.join(' ')))
    para = []
  }
  const flushList = () => {
    if (items.length) {
      children.push({
        type: 'list', listType: 'bullet', tag: 'ul', start: 1,
        format: '', indent: 0, version: 1, direction: 'ltr', children: items,
      })
    }
    items = []
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (!line || line === '---') { flushPara(); flushList(); continue }
    if (line.startsWith('# ')) { flushPara(); flushList(); continue } // H1 is the title field

    const bullet = line.match(/^[-*]\s+(.*)$/)
    if (bullet) {
      flushPara()
      items.push({
        type: 'listitem', value: items.length + 1,
        format: '', indent: 0, version: 1, direction: 'ltr',
        children: inline(bullet[1]),
      })
      continue
    }
    flushList()

    const h = line.match(/^(#{2,3})\s+(.*)$/)
    if (h) {
      flushPara()
      children.push({
        type: 'heading', tag: h[1].length === 2 ? 'h2' : 'h3',
        format: '', indent: 0, version: 1, direction: 'ltr',
        children: inline(h[2]),
      })
      continue
    }
    para.push(line)
  }
  flushPara()
  flushList()

  return { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } }
}

// ── What to publish ─────────────────────────────────────────────────────────
const POSTS = [
  {
    md: '01-last-mile-en.md',
    mdZh: '01-last-mile-zh.md',
    titleZh: '最后一公里不是模型',
    excerptZh: '2026 年第一季度 80% 的企业应用已嵌入 agent，而把它规模化到可度量价值的不到 10%。我不认为这道落差是一个模型问题。',
    hero: 'hero-last-mile.jpg',
    heroAlt: 'Rows of rack-mounted servers in a data centre, lit by status LEDs',
    heroCredit: 'Wikimedia Foundation servers, photo by Victorgrigas, CC BY-SA 3.0',
    slug: 'the-last-mile-is-not-the-model',
    title: 'The last mile is not the model',
    excerpt:
      '80% of enterprise apps now embed an agent, and under 10% have scaled one to real value. I do not think that gap is a model problem.',
    category: 'backend',
    tags: ['netsuite', 'boomi', 'rest-api'],
  },
  {
    md: '02-sys5113-en.md',
    mdZh: '02-sys5113-zh.md',
    titleZh: '系统工程给我的三个想法',
    excerptZh: '念系统工程硕士之前，我以为拿到的会是一套词汇。结果有三个想法跟着我回到了工位，每一个都纠正了一项我带了多年却没有察觉的习惯。',
    hero: 'hero-sys5113.jpg',
    heroAlt: 'First and second floor plans from an early twentieth century technical drawing manual',
    heroCredit: 'Plate from "Blueprint reading" (1916), Internet Archive, no known restrictions',
    slug: 'three-ideas-from-systems-engineering',
    title: 'Three ideas from systems engineering that changed how I size a pipeline',
    excerpt:
      'I expected vocabulary from a systems engineering degree. Three ideas followed me back to my desk instead, and each corrected an old habit.',
    category: 'career-thoughts',
    tags: ['postgresql'],
  },
]

/**
 * Fills the zh slot. defaultLocale is zh with fallback on, so a post written
 * only into en leaves the Chinese page empty rather than falling back — the
 * fallback runs towards the default locale, not away from it.
 *
 * title and content are required, so a per-locale write has to carry them or
 * Payload rejects it.
 */
async function writeZh(payload: any, id: number | string, post: any) {
  const md = fs.readFileSync(path.join(DRAFTS, post.mdZh), 'utf-8')

  // Send title and excerpt only when the slot is still empty. Payload needs
  // them on the first write because both title and content are required, but
  // sending them every time would revert a Chinese title edited in /admin —
  // and the English branch above deliberately touches nothing but the body.
  const current = await payload.findByID({
    collection: 'blogs', id, locale: 'zh', depth: 0, fallbackLocale: false,
  })
  const firstWrite = !current?.title

  await payload.update({
    collection: 'blogs', id, locale: 'zh',
    data: {
      content: toLexical(md) as any,
      ...(firstWrite ? { title: post.titleZh, excerpt: post.excerptZh } : {}),
    } as any,
  })
  console.log(`       ${id}  zh ${firstWrite ? 'locale written' : 'body updated (title kept)'}`)
}

async function run() {
  const config = (await import('../src/payload.config')).default
  const payload = await getPayload({ config })

  // Resolve taxonomy by slug. Raw primary keys would silently file a post under
  // whatever row happens to hold that id in another copy of the database.
  const idBySlug = async (collection: 'categories' | 'tags', slug: string) => {
    const r = await payload.find({
      collection, where: { slug: { equals: slug } }, limit: 1, depth: 0,
    })
    if (!r.docs.length) throw new Error(`${collection}: no row with slug "${slug}"`)
    return r.docs[0].id
  }

  for (const post of POSTS) {
    const md = fs.readFileSync(path.join(DRAFTS, post.md), 'utf-8')
    const content = toLexical(md) as any

    const existing = await payload.find({
      collection: 'blogs', where: { slug: { equals: post.slug } }, limit: 1, depth: 0,
    })

    // Updating rather than skipping, so a parser fix can be applied to posts
    // this script already wrote. Only the body is touched; anything edited in
    // /admin since — status, cover, publish date — is left alone.
    if (existing.docs.length) {
      const id = existing.docs[0].id
      await payload.update({
        collection: 'blogs', id, locale: 'en',
        data: { content } as any,
      })
      console.log(`update blog ${id}  ${post.slug}  (content only)`)
      await writeZh(payload, id, post)
      continue
    }

    assertBlobConfigured()
    const found = await payload.find({
      collection: 'media', where: { filename: { equals: post.hero } }, limit: 1, depth: 0,
    })
    const media = found.docs.length
      ? found.docs[0]
      : await payload.create({
          collection: 'media',
          data: { alt: post.heroAlt, caption: post.heroCredit } as any,
          filePath: path.join(DRAFTS, post.hero),
        })
    console.log(`media  ${media.id}  ${post.hero}${found.docs.length ? ' (reused)' : ''}`)

    const doc = await payload.create({
      collection: 'blogs',
      locale: 'en',
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content,
        coverImage: media.id,
        category: await idBySlug('categories', post.category),
        tags: await Promise.all(post.tags.map((t) => idBySlug('tags', t))),
        status: 'draft',
        featured: false,
      } as any,
    })
    console.log(`create blog ${doc.id}  ${post.slug}  (draft, en)`)
    await writeZh(payload, doc.id, post)
  }

  console.log('\ndone. Posts are drafts — publish from /admin when you are happy with them.')
  console.log('Both locales are written. Covers still have to be attached in /admin.')
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
