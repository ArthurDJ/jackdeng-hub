/**
 * Upload hero images and write blog posts, in both locales, as drafts.
 *
 * Content is authored as markdown in the drafts folder and converted to the
 * Lexical node shape Payload stores (scripts/lib/markdown.ts: headings,
 * paragraphs, lists, fenced code, tables, inline bold/code/links).
 *
 * Posts are created with status 'draft' on purpose. Blogs.access.read hides
 * anything that is not 'published' from anonymous visitors, so nothing goes
 * public until someone flips the field in /admin.
 *
 *   DRAFTS_DIR=… npx tsx scripts/publish-drafts.ts --only <slug>           # read-only: print the plan
 *   DRAFTS_DIR=… npx tsx scripts/publish-drafts.ts --only <slug> --apply   # write it
 *
 * Without --only every post below is processed, and for a slug that exists
 * its body is rewritten from the markdown, in both locales. That is how a
 * parser fix reaches old posts, and also how an edit made in /admin gets
 * overwritten, so name the post unless that is the point.
 */
import { loadEnv, requireApply, describeTarget } from './lib/env'
import { refreshLiveSite } from './lib/refreshSite'
import { toLexical } from './lib/markdown'
import { getPayload } from 'payload'
import fs from 'fs'
import path from 'path'

loadEnv()

const DRAFTS = process.env.DRAFTS_DIR
if (!DRAFTS) {
  console.error('set DRAFTS_DIR to the folder holding the .md and hero .jpg files')
  process.exit(1)
}

const apply = process.argv.includes('--apply')
const onlyAt = process.argv.indexOf('--only')
const only = onlyAt > -1 ? process.argv[onlyAt + 1] : undefined

// Checked after the env guards above, so a missing variable fails before this
// prints that it is about to write. A run without --apply writes nothing.
if (apply) requireApply({ script: 'scripts/publish-drafts.ts', writes: ['media', 'blogs', 'categories', 'tags'] })

/**
 * Taxonomy a post may need that does not exist yet. Created on --apply, only
 * when a post being written refers to it; posts otherwise fail on a missing
 * slug, so a typo cannot quietly invent a tag.
 */
const NEW_CATEGORIES = [
  { slug: 'data', name: { en: 'Data', zh: '数据' } },
  { slug: 'full-stack', name: { en: 'Full-Stack', zh: '全栈' } },
]
const NEW_TAGS = [
  { slug: 'dbt', name: 'dbt' },
  { slug: 'databricks', name: 'Databricks' },
  { slug: 'sql-server', name: 'SQL Server' },
  { slug: 'payload-cms', name: 'Payload CMS' },
]

/**
 * Without this token vercelBlobStorage is disabled (see payload.config.ts) and
 * Payload writes uploads to the local public/media folder while still recording
 * a /api/media/file/... URL in the shared database. The row then points at a
 * file that exists on one laptop and nowhere else, so the cover is broken in
 * production. That happened once, and two media rows had to be deleted.
 *
 * Without the token the run is not stopped — the post text still goes in and
 * the cover is left for /admin, which is the useful outcome when the token
 * lives in Vercel rather than on the machine running this.
 */
function blobConfigured() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true
  console.warn(`  ! BLOB_READ_WRITE_TOKEN is not set — skipping the image upload.
    Uploading now would write the file to ./public/media on this machine while
    recording a /api/media/file/... URL in the shared database, so the row would
    point at something production cannot serve. The post still goes in; attach
    the cover from /admin.`)
  return false
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
    tags: ['ai', 'rest-api'],
  },
  {
    md: '02-sys5113-en.md',
    mdZh: '02-sys5113-zh.md',
    titleZh: '系统工程给我的三个想法',
    excerptZh: '上系统工程课之前，我以为拿到的会是一套词汇。结果有三个想法跟着我回到了工位，每一个都纠正了一项我带了多年却没有察觉的习惯。',
    hero: 'hero-sys5113.jpg',
    heroAlt: 'First and second floor plans from an early twentieth century technical drawing manual',
    heroCredit: 'Plate from "Blueprint reading" (1916), Internet Archive, no known restrictions',
    slug: 'three-ideas-from-systems-engineering',
    title: 'Three ideas from systems engineering that changed how I size a pipeline',
    excerpt:
      'I expected vocabulary from a systems engineering course. Three ideas followed me back to my desk instead, and each corrected an old habit.',
    category: 'career-thoughts',
    tags: ['systems-engineering', 'data-engineering'],
  },
  {
    md: '03-dates-en.md',
    mdZh: '03-dates-zh.md',
    titleZh: '2026 年里值得自己去核对的三个日期',
    excerptZh: '一家聚合站把 NVIDIA 的 CES 发布说成了九月，差了 8 个月。下面是三件我能对着一手信源核实的事，各自附上它实际带的日期。',
    hero: 'hero-dates.jpg',
    heroAlt: 'An empty archive search room with rows of bare library shelves, photographed in 1936',
    heroCredit: 'West Search Room, U.S. National Archives, 1936, no known restrictions',
    slug: 'three-dates-worth-checking',
    title: 'Three dates from 2026 that are worth checking yourself',
    excerpt:
      'An aggregator told me NVIDIA shipped robotics models in September. NVIDIA dates it to 5 January. Three things I checked, and the dates they carry.',
    category: 'career-thoughts',
    tags: ['ai'],
  },
  {
    md: '04-before-the-key-en.md',
    mdZh: '04-before-the-key-zh.md',
    titleZh: '在把钥匙交给 agent 之前',
    excerptZh: '影子 AI 出现在 43% 的 AI 相关泄漏事件中，而只有 38% 的机构持有覆盖全公司的政策。一个 agent 泄漏的是能力，不是文档。',
    hero: 'hero-before-the-key.jpg',
    heroAlt: 'An ornate gilt-bronze French door lock made around 1745, seen from the front',
    heroCredit: 'Lock (France), ca. 1745, Cooper Hewitt collection, public domain',
    slug: 'before-you-give-an-agent-a-key',
    title: 'Before you give an agent a key',
    excerpt:
      'Shadow AI featured in 43% of AI-related breaches, and 38% of organisations hold a company-wide policy. An agent leaks a capability, not a document.',
    category: 'backend',
    tags: ['ai', 'security'],
  },
  {
    md: 'sqlserver-to-databricks.en.md',
    mdZh: 'sqlserver-to-databricks.zh.md',
    titleZh: '迁移笔记里写着“最多差 1”，实际差了 2 天',
    excerptZh: '把报表 SQL 从 SQL Server 搬到 Databricks 时，迁移笔记说周数最多差 1。落到工作日上，这是 2 天。另外几处看起来一样、其实不一样的地方也在这里。',
    hero: 'hero-time-clock.jpg',
    heroAlt: 'Thomas Edison, seen from behind, punching a time clock beside a wall rack of time cards in 1921',
    heroCredit: 'Thomas Edison punching a time clock on his 74th birthday, 1921, Library of Congress, no known restrictions',
    slug: 'from-sql-server-to-databricks',
    title: 'The migration notes said "off by at most one." It was two days.',
    excerpt:
      'Moving reporting SQL from SQL Server to Databricks, a note said weeks were off by at most one. In business days, that is two.',
    category: 'data',
    tags: ['data-engineering', 'dbt', 'databricks', 'sql-server'],
  },
  {
    md: '05-one-app-en.md',
    mdZh: '05-one-app-zh.md',
    titleZh: '一个应用、一次部署：把 CMS 放进 Next.js 里',
    excerptZh: '这个站把 Payload 3 放进了 Next.js 应用里，一份代码，一次部署。这样做的好处，以及它坑过我的四次。',
    hero: 'hero-one-app.jpg',
    heroAlt: 'A technical-drawing style floor plan: one building with three rooms labelled site, admin and api, standing on a single Postgres foundation',
    heroCredit: 'Illustration drawn for this post',
    slug: 'one-app-one-deploy',
    title: 'One app, one deploy: running a CMS inside Next.js',
    excerpt:
      "Payload 3 runs inside this site's Next.js app: one codebase, one deploy. What that buys, and the four times it bit me.",
    category: 'full-stack',
    tags: ['nextjs', 'payload-cms', 'postgresql', 'typescript'],
  },
]

// Blogs.excerpt is capped at 150 characters. Payload reports the overflow as a
// localized "摘要 is invalid", which says nothing about which post or by how much,
// so check here first.
const LIMIT = 150
const SELECTED = only ? POSTS.filter((p) => p.slug === only) : POSTS
if (only && !SELECTED.length) {
  console.error(`  ⛔ --only ${only}: no post with that slug. Slugs: ${POSTS.map((p) => p.slug).join(', ')}`)
  process.exit(1)
}
for (const post of SELECTED) {
  for (const [field, value] of [['excerpt', post.excerpt], ['excerptZh', post.excerptZh]] as const) {
    if (value.length > LIMIT) {
      console.error(`  ⛔ ${post.slug}: ${field} is ${value.length} characters, limit is ${LIMIT}`)
      process.exit(1)
    }
  }
}

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

/**
 * Uploads the hero and returns its id, or null when there is no token to upload
 * with. Shared by both paths so a post that missed its cover on one run can
 * still get it on the next.
 */
async function uploadHero(payload: any, post: any) {
  if (!blobConfigured()) {
    console.log(`       cover to attach by hand: ${post.hero}`)
    return null
  }
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
  return media.id
}

/** What --apply would do, read-only: files, conversion, taxonomy, create or update. */
async function plan(payload: any) {
  console.log(`DRY RUN (read-only) against ${describeTarget().host}\n`)
  const exists = async (collection: string, slug: string) =>
    (await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0 })).docs[0]
  for (const post of SELECTED) {
    console.log(post.slug)
    for (const file of [post.md, post.mdZh]) {
      const doc: any = toLexical(fs.readFileSync(path.join(DRAFTS!, file), 'utf-8'))
      const counts: Record<string, number> = {}
      for (const n of doc.root.children) counts[n.type] = (counts[n.type] ?? 0) + 1
      console.log(`  ${file}: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}`)
    }
    const hero = path.join(DRAFTS!, post.hero)
    console.log(`  cover: ${post.hero} ${fs.existsSync(hero) ? `(${Math.round(fs.statSync(hero).size / 1024)} KB)` : 'MISSING'}${blobConfigured() ? '' : ' — would not upload, no BLOB_READ_WRITE_TOKEN'}`)
    const cat = await exists('categories', post.category)
    const catNew = NEW_CATEGORIES.find((c) => c.slug === post.category)
    console.log(`  category: ${post.category} ${cat ? '(exists)' : catNew ? `(would create: ${catNew.name.en} / ${catNew.name.zh})` : '(MISSING, would fail)'}`)
    for (const t of post.tags) {
      const tag = await exists('tags', t)
      const tagNew = NEW_TAGS.find((x) => x.slug === t)
      console.log(`  tag: ${t} ${tag ? '(exists)' : tagNew ? `(would create: ${tagNew.name})` : '(MISSING, would fail)'}`)
    }
    const existing = await exists('blogs', post.slug)
    console.log(existing
      ? `  post: exists (id ${existing.id}, ${existing.status}): would REWRITE its body in both locales`
      : `  post: would create as draft ("${post.title}" / "${post.titleZh}")`)
  }
  console.log('\nNothing written. Re-run with --apply to write.')
}

/** Create the taxonomy in NEW_CATEGORIES / NEW_TAGS that the selected posts use and the database lacks. */
async function ensureTaxonomy(payload: any) {
  for (const cat of NEW_CATEGORIES) {
    if (!SELECTED.some((p) => p.category === cat.slug)) continue
    const found = await payload.find({ collection: 'categories', where: { slug: { equals: cat.slug } }, limit: 1, depth: 0 })
    if (found.docs.length) continue
    const doc = await payload.create({ collection: 'categories', locale: 'en', data: { name: cat.name.en, slug: cat.slug } })
    await payload.update({ collection: 'categories', id: doc.id, locale: 'zh', data: { name: cat.name.zh } })
    console.log(`category ${doc.id}  ${cat.slug}  created`)
  }
  for (const tag of NEW_TAGS) {
    if (!SELECTED.some((p) => p.tags.includes(tag.slug))) continue
    const found = await payload.find({ collection: 'tags', where: { slug: { equals: tag.slug } }, limit: 1, depth: 0 })
    if (found.docs.length) continue
    const doc = await payload.create({ collection: 'tags', data: { name: tag.name, slug: tag.slug } })
    console.log(`tag ${doc.id}  ${tag.slug}  created`)
  }
}

async function run() {
  const config = (await import('../src/payload.config')).default
  const payload = await getPayload({ config })

  if (!apply) {
    await plan(payload)
    return
  }
  await ensureTaxonomy(payload)

  // Resolve taxonomy by slug. Raw primary keys would silently file a post under
  // whatever row happens to hold that id in another copy of the database.
  const idBySlug = async (collection: 'categories' | 'tags', slug: string) => {
    const r = await payload.find({
      collection, where: { slug: { equals: slug } }, limit: 1, depth: 0,
    })
    if (!r.docs.length) throw new Error(`${collection}: no row with slug "${slug}"`)
    return r.docs[0].id
  }

  for (const post of SELECTED) {
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

      // A post created while the token was missing has no cover, and the upload
      // block below is unreachable once the slug exists. So offer the cover
      // here too, and only when the post is still without one — re-attaching it
      // every run would undo a different cover chosen in /admin.
      const cover = (existing.docs[0] as any).coverImage
        ? null
        : await uploadHero(payload, post)

      await payload.update({
        collection: 'blogs', id, locale: 'en',
        data: { content, ...(cover ? { coverImage: cover } : {}) } as any,
      })
      console.log(`update blog ${id}  ${post.slug}  (content${cover ? ' + cover' : ' only'})`)
      await writeZh(payload, id, post)
      continue
    }

    const coverId = await uploadHero(payload, post)

    const doc = await payload.create({
      collection: 'blogs',
      locale: 'en',
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content,
        coverImage: coverId,
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
  console.log('Both locales are written. Any cover the log did not name is already attached.')
  // New posts are drafts, but an update rewrites a published post's body.
  await refreshLiveSite({ isProduction: describeTarget().isProduction })
}

// Payload's ValidationError prints as `errors: [ [Object], … ]`, which hides
// which field failed and why; spell them out.
run().then(() => process.exit(0)).catch((e) => {
  console.error(e)
  const fieldErrors = e?.data?.errors
  if (Array.isArray(fieldErrors)) {
    for (const f of fieldErrors) console.error(`  field ${f.path ?? f.field}: ${f.message}`)
  }
  process.exit(1)
})
