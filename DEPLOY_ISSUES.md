# Deployment Issues & Resolutions

所有在 Vercel 部署过程中遇到的问题及解决方案，按时间顺序记录。

---

## Issue 1 — Admin 500 / API 404 / Module not found
**时间**：初始部署阶段
**症状**：
- `/admin` 返回 500
- `/api/*` 返回 404 或 500
- 构建报错：`Module not found: Can't resolve '../../../../payload.config'`

**根本原因**：
1. `<RootPage>` 缺少 `importMap` prop，Payload 3.x 强制要求
2. `generateMetadata` 直接赋值为 `generatePageMetadata`，Next.js 调用时缺少 `config` 参数
3. `params` / `searchParams` 类型未声明为 `Promise<...>`（Next.js 16 要求）

**修复**：
```tsx
// src/app/(payload)/admin/[[...segments]]/page.tsx
import { importMap } from '../importMap.js'
export const generateMetadata = ({ params, searchParams }: Args) =>
  generatePageMetadata({ config, params, searchParams })
const Page = ({ params, searchParams }: Args) => (
  <RootPage config={config} importMap={importMap} params={params} searchParams={searchParams} />
)
```

---

## Issue 2 — POST /api/graphql → 404
**时间**：v0.4.0 部署验证
**症状**：`POST /api/graphql` 返回 404，GraphQL Playground 不可用

**根本原因**：`payload.config.ts` 未显式声明 `graphQL` 配置，Payload 3.x 不自动激活 GraphQL schema 注册

**修复**：
```ts
// src/payload.config.ts
graphQL: {
  schemaOutputFile: path.resolve(dirname, 'schema.graphql'),
},
```
**Commit**：`5c86b9b`

---

## Issue 3 — Vercel 部署被 Block（Hobby 私有仓库限制）
**时间**：v0.5.0 首次 Vercel 部署
**症状**：`The Deployment was blocked because GitHub could not associate the committer with a GitHub user`

**根本原因**：
- 沙箱环境提交的 git committer 邮箱不属于任何 GitHub 账号
- Vercel Hobby 计划：私有仓库不允许无法识别身份的协作者触发部署

**修复**：将仓库从 Private 改为 **Public**（GitHub → Settings → Danger Zone → Change visibility）

**注意**：About 页 GitHub 链接同步从 `JJackDeng` 改为 `ArthurDJ`（commit `d906c2a`）

---

## Issue 4 — .gitignore 未完整覆盖 .env 变体
**时间**：v0.5.0
**症状**：`.env.local` 未在 `.gitignore` 中，存在泄露风险

**修复**：
```gitignore
.env
.env.local
.env.*.local
.env.development
.env.production
```
**Commit**：`d906c2a`（与 Issue 3 同一 commit）

---

## Issue 5 — Vercel 构建超时（45 分钟限制）
**时间**：v0.6.0+ 部署
**症状**：构建耗尽 45 分钟后报错 `Your build exceeded the 45 minute limit`

**根本原因**：`vercel.json` 的 `buildCommand` 设置为 `npm run migrate && npm run build`，`npx payload migrate` 在构建服务器上尝试连接 Supabase 数据库时挂起或超时

**修复**：将 migrate 从构建命令中移除，改为手动单独执行：
```json
// vercel.json — 之前
{ "buildCommand": "npm run migrate && npm run build" }

// vercel.json — 之后
{ "buildCommand": "npm run build" }
```
**Commit**：`b1e6108`

**迁移执行方式**（在本地，确保 `.env.local` 有正确的 `DATABASE_URI`）：
```bash
npx payload migrate
```
每次新增 Collection 后手动执行一次即可，不需要每次部署都跑。

---

## Issue 6 — Vercel Cron Job 在 Hobby 计划下被拒绝
**时间**：v0.6.0 Vercel 项目创建时
**症状**：`Hobby accounts are limited to daily cron jobs. This cron expression (0 * * * *) would run more than once per day`

**根本原因**：OpenClaw 在 `vercel.json` 里添加了每小时触发一次的 cron job，Hobby 计划只支持每天最多一次

**修复**：删除 `vercel.json` 中的 `crons` 配置，该功能目前不需要
**Commit**：`4a655b0`

---

## 环境变量清单（Vercel → Settings → Environment Variables）

| 变量名 | 说明 | 是否必填 |
|--------|------|----------|
| `DATABASE_URI` | Supabase PostgreSQL Transaction Pooler 连接串（端口 6543） | ✅ 必填 |
| `PAYLOAD_SECRET` | Payload session 加密密钥，任意随机强字符串 | ✅ 必填 |
| `NEXT_PUBLIC_SERVER_URL` | 生产域名，如 `https://jackdeng.cc` | ✅ 必填 |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret（服务端验证） | 可选 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key（前端 widget） | 可选 |
| `CRON_SECRET` | 定时任务鉴权 key，待用 | 可选 |

> **DATABASE_URI 注意**：使用 **Transaction Pooler** 连接串（Supabase → Project Settings → Database → Connection string → Transaction），端口为 `6543`，非 Direct 连接（5432）。Vercel serverless 函数每次请求新建连接，必须用 pooler 防止耗尽连接数。

---

## 数据库迁移操作记录

| 时间 | 新增 Collection | Commit |
|------|----------------|--------|
| v0.2.0 | Categories, Tags | `d465057` |
| v0.7.0 | Comments | `267b581` |

每次新增 Collection 后在本地执行：
```bash
npx payload migrate
```

---

## i18n 规范与注意事项（v0.8.0+）

### 命名规范

| 规则 | 正确 | 错误 |
|------|------|------|
| key 使用 camelCase | `commentSubmit` | `comment_submit` / `CommentSubmit` |
| 按页面/功能分 namespace | `blog.noPostsFound` | 顶层平铺 `noPostsFound` |
| 通用 UI 文案放 common | `common.cancel` | `blog.cancel` / `home.cancel` |
| 不使用动态拼接 key | `t('blog.commentSubmitBtn')` | `t('blog.comment' + action)` |

### 文件结构

```
src/i18n/messages/
  en.json   ← 唯一真相来源，新增 key 先在这里加
  zh.json   ← 结构必须与 en.json 完全一致
```

**Namespaces：**
- `common` — 通用 UI 原语（按钮文字、状态标签、版权等）
- `nav` — 导航栏
- `home` — 首页
- `blog` — 博客相关（列表、详情、评论）
- `about` — About 页
- `search` — Command Palette 搜索
- `footer` — 页脚
- `notFound` — 404 页

### 工具

```bash
# 提交前运行，检查 key 缺失、多余、僵尸 key
npm run i18n:check
```

返回 ❌ Error = 存在缺失翻译，必须修复后才能提交。
返回 ⚠️ Warning = 可能的僵尸 key，人工确认是否删除。

### TypeScript 类型安全

`src/i18n/types.ts` 通过全局 `IntlMessages` 声明让 `t()` 调用在编译时类型检查。
写错 key（如 `t('nav.bolg')`）会在 `npm run build` 时报 TypeScript 错误，不需要等到运行时。

### 常见陷阱

1. **动态拼接 key** — `t('status.' + value)` 无法被静态分析，改用对象映射：
   ```ts
   const STATUS_LABELS = { active: t('home.projectStatus.active'), ... }
   ```

2. **`force-static` + `[locale]` 路由** — 静态页需改用 `generateStaticParams` 导出 locale 列表：
   ```ts
   export async function generateStaticParams() {
     return [{ locale: 'en' }, { locale: 'zh' }]
   }
   ```

3. **客户端组件用 `useTranslations`，服务端用 `getTranslations`** — 不要混用，否则会有 hydration 错误。

4. **`Link` 组件** — 项目内跳转一律用 `@/i18n/navigation` 的 `Link`，不要用 `next/link`，否则跳转会丢失 locale 前缀。

---

## Issue 7 — blogs_locales 表不存在（构建时数据库查询失败）
**时间**：v0.8.0 i18n 上线后
**症状**：Vercel 构建时 `generateStaticParams` 报错：
```
Failed query: ... from "blogs_locales" ...
```
**根本原因**：给 Blog 字段添加 `localized: true` 后，Payload 需要新建 `blogs_locales` 表，但未执行迁移

**修复**：在本地（`.env.local` 含生产 `DATABASE_URI`）执行：
```bash
npx payload migrate
```

---

## Issue 8 — Vercel 部署需要 Media Storage Adapter
**时间**：v0.8.0
**症状**：构建警告：
```
Collections with uploads enabled require a storage adapter when deploying to Vercel.
Collection(s) without storage adapters: media.
```
**根本原因**：Vercel serverless 环境文件系统不持久，本地上传的图片每次部署后丢失

**修复**：安装并配置 `@payloadcms/storage-vercel-blob`，在 `payload.config.ts` 注册插件：
```ts
plugins: [
  vercelBlobStorage({
    enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    token: process.env.BLOB_READ_WRITE_TOKEN || '',
    collections: { media: true },
  }),
]
```
**新增环境变量**：`BLOB_READ_WRITE_TOKEN`（Vercel 控制台 → Storage → Blob → Create Store → 获取 token）

## 3. Server Component Serialization Error with `next-intl` (HTTP 500)
**Issue:** `GET /en` and `GET /en/about` returning HTTP 500 in Vercel/production, logging `Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server"`.
**Root Cause:**
In `next-intl`, the `t.rich('key', { var: (c) => <span>{c}</span> })` method is used to interpolate React components into translation strings. If the translation key in the JSON file is defined with `{curly_braces}` instead of `<xml_tags>`, Next.js 14 Server Components will fail to serialize the function passed into `t.rich`, causing the entire page to crash with a 500 error.
**Fix:**
Ensure the translation JSON uses XML tags instead of curly braces for `t.rich` elements.
*Wrong (`en.json`):* `"bio": "I use {netsuite}"`
*Correct (`en.json`):* `"bio": "I use <netsuite>NetSuite</netsuite>"`
*Corresponding React code:* `{t.rich('bio', { netsuite: (c) => <span className="font-bold">{c}</span> })}`

## 4. Supabase RLS Warnings & Blank Blog Pages (Data Vacuum)
**Issue:**
1. Supabase database linter reported high-risk errors: `RLS Disabled in Public` for all Payload-managed tables.
2. Blog frontend pages returned HTTP 500, and recent post sidebars rendered blank titles/dates.
**Root Cause:**
- Payload CMS operates auth at the Node.js layer and bypasses RLS using the `postgres` superuser connection string. However, Supabase auto-exposes the `public` schema via PostgREST, leaving data vulnerable if RLS is off.
- The blank pages/500 errors were caused by migration lag. The new `blogs_locales` table for `next-intl` was missing or empty in production.
**Fix:**
1. **Sync Schema**: Ran `npm run migrate` (pointing to production `DATABASE_URI`) to push Payload schema changes (locales, rels) to Supabase.
2. **Secure Database (RLS)**: Executed a PostgreSQL script in Supabase to enable RLS on all `public` tables *without* adding policies (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). This acts as a "Deny All" for the Supabase REST API, closing the security loophole while allowing Payload's backend (which uses a privileged connection) to function normally.
3. **Data Hydration**: Opened existing posts in Payload Admin (`/admin`) and clicked "Save" to force data to be written into the newly created `_locales` tables, resolving the 500 null pointer exceptions.

## 5. UI Glitches & 404s on Localized Blog Pages (v0.9.5)
**Issue:**
1. Dual Navbars appeared on the blog listing and blog detail pages.
2. In dark mode, tags with very dark brand colors (like Next.js `#000000`) became illegible because the font color inherited the dark hex.
3. Accessing a specific blog post (e.g., `/en/blog/my-post`) resulted in a 404 Not Found error despite the post existing.
**Root Cause:**
- *Navbar*: `<Navbar />` was accidentally left in the page components after it had been moved to the shared `blog/layout.tsx`.
- *Contrast*: The `TagBadge` component strictly applied the hex color to text without checking the relative luminance against the user's active theme (dark mode).
- *Routing*: The Payload `find()` query inside `blog/[slug]/page.tsx` was missing the `locale` parameter. In Payload 3.0 with localization enabled, if `locale` is not passed, the API may default to 'all' or fail to match localized slugs correctly depending on the schema structure.
**Fix:**
1. Removed `<Navbar />` calls from `src/app/[locale]/blog/page.tsx` and `src/app/[locale]/blog/[slug]/page.tsx`.
2. Updated `TagBadge` to calculate RGB luminance. If the color is very dark (`r<50, g<50, b<50`), it now falls back to `text-zinc-800 dark:text-zinc-300` instead of forcing the hex.
3. Injected `locale: locale as any` into the Payload query parameters within `generateMetadata` and the main `BlogDetailPage` component.
