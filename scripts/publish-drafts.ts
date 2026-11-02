/**
 * Upload hero images and write blog posts, in both locales, as drafts.
 *
 * Content is authored as markdown in the drafts folder and converted to the
 * Lexical node shape Payload stores (scripts/lib/markdown.ts: headings,
 * paragraphs, lists, fenced code, tables, images, inline bold/code/links).
 *
 * An image is a line of its own, `![alt](file.png "optional caption")`, with
 * the file in DRAFTS_DIR. It is uploaded to media like the hero (or the
 * existing media row with that file name is reused, if it holds the same file:
 * same size, or for GIF/TIFF/WebP, which Payload re-encodes, same pixel
 * dimensions; otherwise the image is left out and the run says to rename it),
 * and the en and zh bodies each keep their own alt text and caption on the node.
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
 *
 * Title and excerpt of a post that exists are left alone, so a title edited
 * in /admin survives a body rewrite. Add --meta to also write them, in both
 * locales, from the entry below; only the fields that differ are written, and
 * the dry run prints each one old → new:
 *
 *   DRAFTS_DIR=… npx tsx scripts/publish-drafts.ts --only <slug> --meta           # read-only
 *   DRAFTS_DIR=… npx tsx scripts/publish-drafts.ts --only <slug> --meta --apply   # write body + title/excerpt
 */
import { loadEnv, requireApply, describeTarget } from './lib/env'
import { refreshLiveSite } from './lib/refreshSite'
import { toLexical, collectImages, resolveImages } from './lib/markdown'
import { decideMedia, describeConflict, type LocalFile } from './lib/mediaReuse'
import { metaChanges, metaData, describeMetaChange, type MetaChange, type MetaField } from './lib/postMeta'
import { getPayload } from 'payload'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

loadEnv()

const DRAFTS = process.env.DRAFTS_DIR
if (!DRAFTS) {
  console.error('set DRAFTS_DIR to the folder holding the .md and hero .jpg files')
  process.exit(1)
}

const apply = process.argv.includes('--apply')
// Also write title and excerpt of posts that exist (see the header).
const meta = process.argv.includes('--meta')
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
  { slug: 'astrbot', name: 'AstrBot' },
  { slug: 'deepseek', name: 'DeepSeek' },
  { slug: 'wechat', name: 'WeChat' },
  { slug: 'performance', name: 'Performance' },
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
let tokenWarned = false
function blobConfigured() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true
  if (tokenWarned) return false
  tokenWarned = true
  console.warn(`  ! BLOB_READ_WRITE_TOKEN is not set — skipping image uploads.
    Uploading now would write the file to ./public/media on this machine while
    recording a /api/media/file/... URL in the shared database, so the row would
    point at something production cannot serve. The post still goes in; attach
    the cover from /admin, and re-run with the token for images in the body.`)
  return false
}

// ── What to publish ─────────────────────────────────────────────────────────
const POSTS = [
  {
    md: '01-last-mile-en.md',
    mdZh: '01-last-mile-zh.md',
    titleZh: '最后一公里不是模型',
    excerptZh: '2026 年第一季度，80% 的企业应用已经嵌了 agent，真正做到规模化、拿得出可度量价值的却不到 10%。我觉得这道落差出在集成上，跟模型关系不大。',
    hero: 'hero-last-mile.jpg',
    heroAlt: 'Rows of rack-mounted servers in a data centre, lit by status LEDs',
    heroCredit: 'Wikimedia Foundation servers, photo by Victorgrigas, CC BY-SA 3.0',
    slug: 'the-last-mile-is-not-the-model',
    title: 'The last mile is not the model',
    excerpt:
      '80% of enterprise apps embed an agent, yet under 10% of companies have scaled one to measurable value. I think the gap is integration, not the model.',
    category: 'backend',
    tags: ['ai', 'rest-api'],
  },
  {
    md: '02-sys5113-en.md',
    mdZh: '02-sys5113-zh.md',
    titleZh: '一门系统工程课带回来的三个想法',
    excerptZh: '上系统工程课之前，我以为能学到的就是一套词汇。结果有三个想法跟着我回了工位，每一个都纠正了我一个带了好多年、自己没察觉的习惯。',
    hero: 'hero-sys5113.jpg',
    heroAlt: 'First and second floor plans from an early twentieth century technical drawing manual',
    heroCredit: 'Plate from "Blueprint reading" (1916), Internet Archive, no known restrictions',
    slug: 'three-ideas-from-systems-engineering',
    title: 'Three ideas I brought back from a systems engineering course',
    excerpt:
      "I took a systems engineering course expecting vocabulary. Three ideas followed me back to my desk, and each corrected a habit I'd carried for years.",
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
    excerptZh: '把报表 SQL 从 SQL Server 搬到 Databricks，迁移笔记说周数最多差 1。式子里要乘以 2，换成工作日就差了 2 天。另外几处能跑通、看着也对、其实不一样的写法也记在这里。',
    hero: 'hero-time-clock.jpg',
    heroAlt: 'Thomas Edison, seen from behind, punching a time clock beside a wall rack of time cards in 1921',
    heroCredit: 'Thomas Edison punching a time clock on his 74th birthday, 1921, Library of Congress, no known restrictions',
    slug: 'from-sql-server-to-databricks',
    title: 'Migration notes said "off by at most one." It was two days.',
    excerpt:
      "Moving reporting SQL from SQL Server to Databricks, a note said week counts were off by at most one. Doubled for weekends, that's two business days.",
    category: 'data',
    tags: ['data-engineering', 'dbt', 'databricks', 'sql-server'],
  },
  {
    md: '05-one-app-en.md',
    mdZh: '05-one-app-zh.md',
    titleZh: '一个应用、一次部署：把 CMS 放进 Next.js 里',
    excerptZh: '这个站的 CMS 用的是 Payload 3，跑在 Next.js 应用里面，代码一份，部署一次。写写这样做方便在哪，以及它坑过我的四次。',
    hero: 'hero-one-app.jpg',
    heroAlt: 'A technical-drawing style floor plan: one building with three rooms labelled site, admin and api, standing on a single Postgres foundation',
    heroCredit: 'Illustration drawn for this post',
    slug: 'one-app-one-deploy',
    title: 'One app, one deploy: running a CMS inside Next.js',
    excerpt:
      'This site runs Payload 3 inside its Next.js app, so there is one codebase and one deploy. What that saves, and the four times it bit me.',
    category: 'full-stack',
    tags: ['nextjs', 'payload-cms', 'postgresql', 'typescript'],
  },
  {
    md: '06-flight-skill-en.md',
    mdZh: '06-flight-skill-zh.md',
    titleZh: '搜出来最便宜的机票，常常不是该订的那张',
    excerptZh: '机票搜索能告诉你哪张最便宜，我常要回答的却是该订哪一张。为这个问题，我写了一个 Claude skill。',
    // No cover chosen yet, so no hero fields: the post goes in without one and
    // the cover is attached from /admin, or added here and picked up on a later
    // run (uploadHero offers it to a post that still has none).
    slug: 'when-the-cheapest-flight-is-wrong',
    title: "The cheapest flight isn't always the one to book",
    excerpt:
      'Flight search tells you which fare is cheapest. I wrote a Claude skill for the question I actually kept asking: which one should we book?',
    category: 'backend',
    tags: ['ai'],
  },
  {
    md: '07-astrbot-deepseek-en.md',
    mdZh: '07-astrbot-deepseek-zh.md',
    titleZh: '我也养了一条“大肥鱼”，可它只回我一个人',
    excerptZh: '大肥鱼在 B 站刷屏以后，我用 AstrBot 加 DeepSeek 接上了微信。能用，只是微信那头走的是官方 ClawBot 插件，只能跟我一个人私聊，拉不进群。',
    hero: 'hero-astrbot-fish.jpg',
    heroAlt: 'Two maid whale-girls with blue hair and whale tails in a sunlit ballroom, either side of a chat box',
    heroCredit:
      'Maid whale-girl by ZipZipPipe after 上善无形\'s original; skin by Small-tailqwq (dsh-deep-whale), cropped. CC BY-NC-SA 4.0',
    slug: 'astrbot-deepseek-wechat',
    title: 'My DeepSeek "fat fish" bot only talks to me',
    excerpt:
      'After the "fat fish" bots took over Bilibili, I hooked AstrBot and DeepSeek up to WeChat. It works, but via the ClawBot plugin it only talks to me.',
    category: 'backend',
    tags: ['ai', 'astrbot', 'deepseek', 'wechat'],
  },
  {
    md: '08-flight-skill-v3-en.md',
    mdZh: '08-flight-skill-v3-zh.md',
    titleZh: '机票 skill 出了 3.0，第二版连自己的算例都算错了',
    excerptZh: 'flight-trip-planning 3.0 改正了 v2 算错的退票盈亏平衡（31% 应为 23.7%），Quick 模式也真的短了，规则对着官方来源重查过，评测里分不出高下的地方也照实写了。',
    // No cover, like the post it follows (when-the-cheapest-flight-is-wrong).
    slug: 'flight-skill-v3',
    title: 'Flight skill 3.0 fixes the example version 2 got wrong',
    excerpt:
      'Version 2 put the refund break-even at 31% when it should be 23.7%. flight-trip-planning 3.0 fixes that, trims Quick mode and rechecks the rules.',
    category: 'backend',
    tags: ['ai'],
  },
  {
    md: '09-mobile-lcp-en.md',
    mdZh: '09-mobile-lcp-zh.md',
    titleZh: '一个被我解释掉的 307：手机上的 LCP 从 3.8 秒降到 2.2 秒',
    excerptZh: 'Lighthouse 显示每个页面前都有一次 307，9 月我认定它无害。11 月才发现，Chrome 其实把每个页面都请求了两次。',
    hero: 'hero-switchboard.jpg',
    heroAlt: 'A long telephone switchboard under arched windows, with a row of operators seated at it putting calls through',
    heroCredit: 'Operating room, from "American Telephone Practice" by Kempster B. Miller (1905), Internet Archive, no known copyright restrictions',
    slug: 'the-redirect-i-explained-away',
    title: 'The redirect I explained away: mobile LCP 3.8 s → 2.2 s',
    excerpt:
      'Lighthouse showed a 307 before every page. In September I called it harmless; in November it turned out Chrome was fetching every page twice.',
    category: 'full-stack',
    tags: ['nextjs', 'payload-cms', 'performance'],
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
async function writeZh(payload: any, id: number | string, post: any, content: any, metaZh: Partial<Record<MetaField, string>> = {}) {
  // Send title and excerpt only when the slot is still empty. Payload needs
  // them on the first write because both title and content are required, but
  // sending them every time would revert a Chinese title edited in /admin —
  // and the English branch above deliberately touches nothing but the body.
  // `metaZh` is the --meta exception: the zh fields that differ from POSTS.
  const current = await payload.findByID({
    collection: 'blogs', id, locale: 'zh', depth: 0, fallbackLocale: false,
  })
  const firstWrite = !current?.title
  const metaFields = Object.keys(metaZh)

  await payload.update({
    collection: 'blogs', id, locale: 'zh',
    data: {
      content,
      ...(firstWrite ? { title: post.titleZh, excerpt: post.excerptZh } : metaZh),
    } as any,
  })
  console.log(`       ${id}  zh ${firstWrite
    ? 'locale written'
    : metaFields.length ? `body + ${metaFields.join(' + ')} updated` : 'body updated (title kept)'}`)
}

/** Title and excerpt this script holds for a post, per locale. */
function wantedMeta(post: any) {
  return {
    en: { title: post.title, excerpt: post.excerpt },
    zh: { title: post.titleZh, excerpt: post.excerptZh },
  }
}

/**
 * The fields of an existing post whose title or excerpt differs from POSTS,
 * per locale (scripts/lib/postMeta.ts). Read-only. fallbackLocale is off so an
 * empty locale reads as empty, not as the other language.
 */
async function metaDiff(payload: any, id: number | string, post: any): Promise<MetaChange[]> {
  const read = (locale: 'en' | 'zh') =>
    payload.findByID({ collection: 'blogs', id, locale, depth: 0, fallbackLocale: false })
  const [en, zh] = await Promise.all([read('en'), read('zh')])
  return metaChanges({ en, zh }, wantedMeta(post))
}

/**
 * Uploads the hero and returns its id, or null when there is nothing to attach:
 * no cover chosen for the post yet, no token to upload with, or the file is not
 * in DRAFTS_DIR. Each of those leaves the post without a cover, to attach from
 * /admin, rather than stopping the run — a batch would otherwise stop halfway,
 * after rewriting the posts before it. Shared by both paths so a post that
 * missed its cover on one run can still get it on the next.
 */
async function uploadHero(payload: any, post: any) {
  if (!post.hero) {
    console.log('       no cover chosen yet — attach one from /admin')
    return null
  }
  if (!blobConfigured()) {
    console.log(`       cover to attach by hand: ${post.hero}`)
    return null
  }
  return mediaFor(payload, post.hero, { alt: post.heroAlt, caption: post.heroCredit },
    'post written without a cover; attach it from /admin')
}

/** The media row already holding this file name, if any. Read-only. */
async function findMedia(payload: any, filename: string) {
  const found = await payload.find({
    collection: 'media', where: { filename: { equals: filename } }, limit: 1, depth: 0,
  })
  return found.docs[0] ?? null
}

/** Size of the file in DRAFTS_DIR, or null when it is not there. */
function localSize(filename: string) {
  const file = path.join(DRAFTS!, filename)
  return fs.existsSync(file) ? fs.statSync(file).size : null
}

const SHARP_MIME: Record<string, string> = {
  gif: 'image/gif', tiff: 'image/tiff', webp: 'image/webp', jpeg: 'image/jpeg', png: 'image/png',
}

/**
 * The file in DRAFTS_DIR as decideMedia needs it: size, plus the pixel size
 * Payload would record and the type sharp reads, or null when it is not there.
 * Payload auto-rotates by EXIF before recording width and height, and divides
 * an animated image's height by its frame count, so the same is done here.
 * Dimensions are left null when sharp cannot read the file.
 */
async function localFile(filename: string): Promise<LocalFile | null> {
  const size = localSize(filename)
  if (size == null) return null
  try {
    const m = await sharp(path.join(DRAFTS!, filename)).metadata()
    const pages = m.pages ?? 1
    return {
      size,
      width: m.autoOrient?.width ?? m.width ?? null,
      height: pages > 1 ? (m.pageHeight ?? null) : (m.autoOrient?.height ?? m.height ?? null),
      mimeType: (m.format && SHARP_MIME[m.format]) ?? null,
    }
  } catch {
    return { size, width: null, height: null, mimeType: null }
  }
}

/** Reuse, upload, or neither, for a file in DRAFTS_DIR (scripts/lib/mediaReuse.ts). Read-only. */
async function mediaDecision(payload: any, filename: string) {
  return decideMedia(await findMedia(payload, filename), await localFile(filename))
}

/**
 * The media id for a file in DRAFTS_DIR: the existing row with that file name,
 * else a new upload. Null, with a warning, when there is nothing to attach: the
 * file is missing, a row with that name holds a different file, or a new
 * upload has no token. `leftOut` says what that means for the post.
 */
async function mediaFor(payload: any, filename: string, data: { alt?: string; caption?: string }, leftOut: string) {
  const decision = await mediaDecision(payload, filename)
  switch (decision.kind) {
    case 'reuse':
      console.log(`media  ${decision.id}  ${filename} (reused${decision.note ? `; ${decision.note}` : ''})`)
      return decision.id
    case 'conflict':
      console.warn(`  ! ${describeConflict(filename, decision)} — ${leftOut}`)
      return null
    case 'missing':
      console.warn(`  ! ${filename} is not in DRAFTS_DIR — ${leftOut}`)
      return null
    case 'upload': {
      if (!blobConfigured()) {
        console.warn(`  ! ${filename}: not uploaded (no BLOB_READ_WRITE_TOKEN) — ${leftOut}`)
        return null
      }
      const media = await payload.create({ collection: 'media', data: data as any, filePath: path.join(DRAFTS!, filename) })
      console.log(`media  ${media.id}  ${filename}`)
      return media.id as number | string
    }
  }
}

/** The dry run's line for one file: its size and what --apply would do with it. */
async function planMedia(payload: any, filename: string, leftOut: string) {
  const size = localSize(filename)
  const decision = await mediaDecision(payload, filename)
  const action = decision.kind === 'reuse'
    ? `would reuse media ${decision.id}${decision.note ? ` (${decision.note})` : ''}`
    : decision.kind === 'conflict'
      ? `${describeConflict(filename, decision)} — ${leftOut}`
      : decision.kind === 'missing'
        ? `MISSING — ${leftOut}`
        : blobConfigured()
          ? 'would upload'
          : `would NOT upload, no BLOB_READ_WRITE_TOKEN — ${leftOut}`
  return `${filename} ${size == null ? '(not in DRAFTS_DIR)' : `(${Math.round(size / 1024)} KB)`} — ${action}`
}

/** Both bodies of a post, image placeholders still in them (see resolveBodies). */
function readBodies(post: any) {
  const read = (file: string) => toLexical(fs.readFileSync(path.join(DRAFTS!, file), 'utf-8'), { images: true })
  return { en: read(post.md), zh: read(post.mdZh) }
}

/**
 * The images both bodies use, once per file name, each with the first alt text
 * found (en before zh). That alt goes on a new media row only as its fallback;
 * each body keeps its own on the node.
 */
function imagesOf(bodies: ReturnType<typeof readBodies>) {
  const bySrc = new Map<string, { alt: string }>()
  for (const img of [...collectImages(bodies.en), ...collectImages(bodies.zh)]) {
    if (!bySrc.has(img.src)) bySrc.set(img.src, { alt: img.alt })
  }
  return bySrc
}

/**
 * Upload or reuse every image the post uses, then swap the placeholders for
 * upload nodes; the same file in both bodies is one media row. An image that
 * cannot be resolved (file missing, or no token to upload it with) is left out
 * of the body with a warning, as a missing hero is: re-running once it is
 * fixed puts it in.
 */
async function resolveBodies(payload: any, bodies: ReturnType<typeof readBodies>) {
  const ids = new Map<string, number | string | null>()
  for (const [src, { alt }] of imagesOf(bodies)) {
    ids.set(src, await mediaFor(payload, src, { alt }, 'image left out of the body'))
  }
  return { en: resolveImages(bodies.en, ids), zh: resolveImages(bodies.zh, ids) }
}

/** What --apply would do, read-only: files, conversion, taxonomy, create or update. */
async function plan(payload: any) {
  console.log(`DRY RUN (read-only) against ${describeTarget().host}\n`)
  const exists = async (collection: string, slug: string) =>
    (await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0 })).docs[0]
  for (const post of SELECTED) {
    console.log(post.slug)
    const bodies = readBodies(post)
    for (const [file, doc] of [[post.md, bodies.en], [post.mdZh, bodies.zh]] as const) {
      const counts: Record<string, number> = {}
      for (const n of doc.root.children) {
        const type = n.type === 'draft-image' ? 'image' : n.type
        counts[type] = (counts[type] ?? 0) + 1
      }
      console.log(`  ${file}: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}`)
    }
    for (const [src] of imagesOf(bodies)) {
      console.log(`  image: ${await planMedia(payload, src, 'would be left out of the body')}`)
    }
    if (post.hero) {
      // As uploadHero: without the token the cover is not attached at all, not even a reused row.
      console.log(blobConfigured()
        ? `  cover: ${await planMedia(payload, post.hero, 'post would go in without a cover')}`
        : `  cover: ${post.hero} — would not attach, no BLOB_READ_WRITE_TOKEN; attach from /admin`)
    } else {
      console.log('  cover: none chosen yet — attach from /admin')
    }
    const cat = await exists('categories', post.category)
    const catNew = NEW_CATEGORIES.find((c) => c.slug === post.category)
    console.log(`  category: ${post.category} ${cat ? '(exists)' : catNew ? `(would create: ${catNew.name.en} / ${catNew.name.zh})` : '(MISSING, would fail)'}`)
    for (const t of post.tags) {
      const tag = await exists('tags', t)
      const tagNew = NEW_TAGS.find((x) => x.slug === t)
      console.log(`  tag: ${t} ${tag ? '(exists)' : tagNew ? `(would create: ${tagNew.name})` : '(MISSING, would fail)'}`)
    }
    const existing = await exists('blogs', post.slug)
    if (!existing) {
      console.log(`  post: would create as draft ("${post.title}" / "${post.titleZh}")`)
      continue
    }
    const changes = await metaDiff(payload, existing.id, post)
    const metaNote = meta && changes.length ? ' and UPDATE title/excerpt' : ''
    console.log(`  post: exists (id ${existing.id}, ${existing.status}): would REWRITE its body in both locales${metaNote}`)
    if (!changes.length) {
      console.log('  meta: title and excerpt already match in both locales')
    } else if (meta) {
      for (const c of changes) console.log(`  meta: ${describeMetaChange(c)}`)
      // The page prefers these over title and excerpt (blog/[slug]/page.tsx), so a new title would not reach the <title>.
      if (existing.seo?.metaTitle) console.log(`  ! seo.metaTitle is set ("${existing.seo.metaTitle}") and overrides the title in page metadata`)
      if (existing.seo?.metaDescription) console.log('  ! seo.metaDescription is set and overrides the excerpt in page metadata')
    } else {
      console.log(`  meta: ${changes.length} title/excerpt field(s) differ from this script; kept (add --meta to write them)`)
    }
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
    const bodies = await resolveBodies(payload, readBodies(post))
    const content = bodies.en as any

    const existing = await payload.find({
      collection: 'blogs', where: { slug: { equals: post.slug } }, limit: 1, depth: 0,
    })

    // Updating rather than skipping, so a parser fix can be applied to posts
    // this script already wrote. Only the body is touched (plus title and
    // excerpt with --meta); anything edited in /admin since — status, cover,
    // publish date — is left alone.
    if (existing.docs.length) {
      const id = existing.docs[0].id

      // A post created while the token was missing has no cover, and the upload
      // block below is unreachable once the slug exists. So offer the cover
      // here too, and only when the post is still without one — re-attaching it
      // every run would undo a different cover chosen in /admin.
      const cover = (existing.docs[0] as any).coverImage
        ? null
        : await uploadHero(payload, post)

      // Title and excerpt only with --meta, and only the fields that differ.
      const changes = meta ? await metaDiff(payload, id, post) : []
      const metaEn = metaData(changes, 'en')
      const metaEnFields = Object.keys(metaEn)

      await payload.update({
        collection: 'blogs', id, locale: 'en',
        data: { content, ...metaEn, ...(cover ? { coverImage: cover } : {}) } as any,
      })
      const what = ['content', ...metaEnFields, ...(cover ? ['cover'] : [])]
      console.log(`update blog ${id}  ${post.slug}  (${what.length > 1 ? what.join(' + ') : 'content only'})`)
      for (const c of changes) console.log(`       ${describeMetaChange(c)}`)
      await writeZh(payload, id, post, bodies.zh, metaData(changes, 'zh'))
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
    await writeZh(payload, doc.id, post, bodies.zh)
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
