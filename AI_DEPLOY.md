# AI Agent Automated Deployment & Operation Guide

## 🤖 Context for AI Assistants
This document is strictly formatted for AI coding agents (OpenClaw, Cursor, Claude, etc.) that need to interface with, deploy, or extend this project.

### Project Architecture
- **Type:** Full-stack Next.js Application (App Router) integrating Payload CMS 3.0.
- **Database:** Supabase (PostgreSQL 16+). Drizzle ORM is natively handled by Payload. Do not install Prisma or other ORMs.
- **Pathing Context:** `/src/app/(payload)` handles CMS routing. `/src/collections/` defines database schemas.

## ⚡️ Deployment

Production runs on Vercel's Git integration. Nothing is deployed by hand and there is no server to start.

- **Production:** every push to `main` builds and deploys www.jackdeng.cc (region `sfo1`, see `vercel.json`). Changes normally reach `main` as squash-merged PRs, and the one required check is `typecheck`. Admins can bypass it.
- **Previews:** every PR gets a preview deployment. Previews use the **production database**: the build prerenders against it, and `/admin` on a preview writes to it.
- **Build:** `npm run build` is just `next build`. It does **not** run migrations. If the new code reads a column production does not have yet, the preview and production builds fail at prerender.
- **After each production deploy:** `.github/workflows/smoke.yml` runs on the `deployment_status` event. It requests key pages in both languages, checks that made-up slugs return 404, and follows every internal link.
- **Rollback:** Vercel's Instant Rollback promotes an earlier deployment. That only works if the older code still runs against the current schema, which holds while the migrations since then have only added things. This is one reason columns are dropped in a separate, later migration.

### Environment variables

Set these in the Vercel project settings. `.env.example` lists the same set.

| Variable | What it does |
|---|---|
| `DATABASE_URI` | Postgres connection string. Use the Supabase pooler (port 6543, `?pgbouncer=true`). Production and Preview point at the same production database. |
| `PAYLOAD_SECRET` | Payload's encryption and session secret. |
| `NEXT_PUBLIC_SERVER_URL` | The site origin, used for absolute URLs: canonical links, the sitemap, `robots.txt`, the feed. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob. Without it the storage plugin is off, and uploads land in `public/media` on whichever machine ran them. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Comment spam protection. Without the secret, `POST /api/comments/submit` answers 503 in production and writes nothing. As of #49 only Production had them, so previews and local dev do not load the widget. |
| `CRON_SECRET` | The shared secret automation tools send as `x-cron-secret` to `POST /api/tools/[slug]/callback`. |

### Migrations

Schema changes ship as hand-written migrations in `src/migrations/`, registered in `src/migrations/index.ts`. They are applied to production **by hand**:

```bash
npm run migrate   # payload migrate, against DATABASE_URI from .env.local, which is production
```

- **Ask before running it:** it writes to production.
- **Run order:** a migration that only adds tables or columns can run before the deploy, because the running build ignores what it does not read. If the new code reads the new columns, the migration **has to** run first, or the prerender fails. Drop old columns in a second migration once no live code reads them (#27 → #29, #31 → #32).
- **Rehearse first:** try each migration on a throwaway Postgres 16 in Docker before production: up, down, then up again.
- **Don't use `payload migrate:create`:** its schema snapshot stops at 2026-04-10, so the diff it generates is wrong.
- **CI catches forgotten migrations:** CI builds a database from the migrations and compares it with the schema the code defines (`scripts/schema-drift.ts`). Changing a collection without a migration fails `typecheck`.

### Local development

```bash
npm ci
cp .env.example .env.local   # then fill in the values
npm run dev
```

- **The maintainer's `.env.local` points at the production database.** `npm run dev` does not change the schema (schema push is off), but anything written through the local `/admin` or a script lands in production.
- **Write scripts refuse production:** scripts in `scripts/` that write exit when `DATABASE_URI` is a Supabase host, unless run with `--apply` (`scripts/lib/env.ts`).
- **A local database:** start Postgres 16 in Docker, point `DATABASE_URI` at it, and run `npm run migrate`.
- **Request-time errors only appear on a production build:** use `next build && next start`. `next dev` never renders statically, which is how #26 reached production.

## 🛠 Extending the Tools Engine (Instructions for Agents)

A tool is a record in the `Tools` collection. A built-in tool also has a component in the repo.

**Visibility.** A tool is listed on `/tools`, in the sitemap and in search only when it is `status: online` and `accessControl: public`. Its detail page, `/[locale]/tools/[slug]`, also renders `maintenance` tools, with a badge. A `private` or `offline` tool returns 404 to everyone, the signed-in owner included; manage those in `/admin`. Pages query through Payload's Local API, which skips collection access control, so every public query filters on these two fields itself (#50).

**What the detail page renders** (`src/app/[locale]/tools/[slug]/page.tsx`), first match wins:
1. The component registered for the slug.
2. An iframe, when `embedType: iframe` and `embedUrl` is set.
3. A script embed, when `embedType: script` and `embedUrl` is set.
4. A "coming soon" placeholder.

### Adding a built-in tool (the usual case)

1. **Write the component** in `src/components/tools/`.
   - Put pure logic in `src/lib/` with vitest tests. `src/lib/life.ts` is the example.
   - Respect `prefers-reduced-motion`, and check the layout at 375px.
2. **Register the slug** in `BUILTIN_TOOLS` in `src/components/tools/registry.tsx`, loading the component with `next/dynamic`.
3. **Add the UI strings** under a `tools.<name>` namespace in both `src/i18n/messages/en.json` and `zh.json`. `FallingSand` uses `tools.sand`.
4. **Create the record** in `/admin`.
   - Fill in the name and description in both languages; both fields are localized.
   - Set `toolType: interactive` and `embedType: builtin`.
   - Leave it at `status: maintenance` until the deploy that contains the component is live, then switch it to `online`. Otherwise `/tools` links to a placeholder.
5. **The caches follow on their own.** Saving the record in `/admin` expires every cached page, the sitemap and search (`src/lib/revalidate.ts`), so it appears on `/tools` at once. A record written by a tsx script is the exception: scripts run outside Next.js, so it shows up with the hourly revalidation.

The smoke check picks its tool from `/api/tools`, which only returns online, public tools, so the workflow needs no change.

### Embedding an external tool

Set `embedType` to `iframe` or `script`, and set `embedUrl`.

- **Allow the origin in the CSP.** The policy in `next.config.mjs` allows frames and scripts only from `'self'` and Cloudflare Turnstile. Add the tool's origin to `frame-src` (iframe) or `script-src` (script), or the embed will be blocked once the policy is enforced. The policy is in report-only mode for now (#58).
- **A script embed runs third-party code on this site's origin.** Prefer an iframe. A script embed mounts into the element marked `data-container="tool-embed-root"`.

### Automation tools

Automation tools run somewhere else and push their results in. The site never starts them.

- **The callback:** `POST /api/tools/[slug]/callback`.
  - Send the header `x-cron-secret: $CRON_SECRET`.
  - The body is `{ status, summary, detail?, metadata? }`, and `status` must be one of `running`, `found`, `booked`, `heartbeat`, `error`, `exited`.
- **What each call does:**
  - It writes a `ToolRuns` row and updates the tool's `lastRunAt` / `lastRunStatus`.
  - `found`, `booked` and `error` are also forwarded to the tool's `notifyWebhook`, if one is set.
- **Access and deletion:** any signed-in Payload user can read `ToolRuns`. Deleting a tool deletes its runs (`ON DELETE CASCADE`, #70).
- **There is no runs dashboard.** The visa-checker panel was deleted along with its tool (#33). A new automation tool registers its own component in `registry.tsx`.
- **There is no way to trigger a tool from the site,** no "run now" button. That outbound channel is still an open roadmap item.

## 🚨 Troubleshooting Guidelines
- **500 Errors on `/admin` during Local Dev (Cloudflare Tunnel):** Check `next.config.mjs`. Payload strictly enforces CORS and origin checks. Ensure `allowedDevOrigins` includes the active Cloudflare Tunnel hostname.
- **Database Connection Failures:** Ensure `DATABASE_URI` uses IPv4 pooling (`aws-1...pooler.supabase.com:6543`) with `?pgbouncer=true`. Native IPv6 (`db.xxx.supabase.co:5432`) will silently fail on local machines without IPv6 ISP support.
- **Admin collection detail pages all blank (白屏)**：根因是 `payload_locked_documents_rels` 缺少某个 collection 对应的 `_id` 列。手动创建新 collection 表时必须同步向该表添加 FK 列（参考 `20260411_000001_add_tool_runs_rels.ts` 的写法）。症状：Vercel 日志中 INFO 级别出现 `column xxx_id does not exist`，页面返回 200 但内容空白。

## 📋 Operation Log

### 2026-04-11 — Claude (v1.2.4)

**问题排查**：用户反馈所有 admin 子页面（`/admin/collections/X/:id`）空白，无法访问。

**根因定位**（通过 Vercel REST API 获取完整日志）：
- `payload_locked_documents_rels` 表缺少 `tool_runs_id` 列
- 错误信息：`column d20fa3bd_...tool_runs_id does not exist`
- 原因：`20260410_021800.ts` 手动创建 `tool_runs` 表时未同步更新 Payload 内部关系表

**变更列表**（2 次 commit，均已 push）：
1. `src/migrations/20260411_000001_add_tool_runs_rels.ts` — 新增迁移，部署时自动执行
2. `src/migrations/index.ts` — 注册新迁移
3. `src/components/AdminHeaderSettings.tsx` — 移除冗余 Locale 按钮；修正所有标签 i18n 三元方向错误
4. `src/components/AdminLogo.tsx` — 修复 "Jack Deng" 文字浅色模式不可见（`#ededed` → CSS 变量）

### 2026-04-13 — Claude (v1.2.5 → v1.2.6)

**问题**：用户反馈 admin header 语言控件混乱——"Locale" 标签不清晰，界面语言和内容语言两个独立控件令人困惑。

**变更列表**（3 次 commit）：

v1.2.5（语言切换重构第一版）：
- `AdminHeaderSettings.tsx` — 将界面语言从设置齿轮移至 header 常驻胶囊按钮 `中|EN`

v1.2.6（最终方案，合并为单一控件）：
- `AdminHeaderSettings.tsx` — 删除自定义胶囊按钮；改用 `useLocale()` + `useEffect` 监听 Payload 原生 locale 变化并自动同步 `i18n.changeLanguage()`，一个控件同时切换 UI 语言和内容语言
- `payload.config.ts` — 覆盖翻译 `general.locale`：`'语言环境/Locale'` → `'语言/Language'`；`defaultLocale` 由 `'en'` 改为 `'zh'`

**结果**：Header 只有一个"语言: 中文 ∨"按钮，切换后 UI 语言自动跟随，无多余控件。

**已执行 DB 迁移**：
```bash
echo "y" | npx payload migrate
# Migrated: 20260411_000001_add_tool_runs_rels (236ms)
```

### 2026-04-13 — Claude (v1.3.0)

**功能**：新增 Projects 详情页系统（求职 case study 入口）。

**变更列表**（1 次 commit，已 push）：
1. `src/collections/Projects.ts` — 新增 slug / techStack / githubLink / coverImage 字段
2. `src/migrations/20260413_000001_add_projects_slug.ts` — DB migration（已执行）
3. `src/migrations/index.ts` — 注册新 migration
4. `src/app/[locale]/projects/page.tsx` — 新建列表页
5. `src/app/[locale]/projects/[slug]/page.tsx` — 新建详情页
6. `src/app/[locale]/page.tsx` — 首页 ProjectCard 升级，链接到详情页 + 技术栈标签
7. `src/app/sitemap.ts` — 加入 /projects 路由
8. `src/i18n/messages/en.json` / `zh.json` — 新增 projects namespace

**已执行 DB 迁移**：
```bash
echo "y" | npx payload migrate
# Migrated: 20260413_000001_add_projects_slug (308ms)
```

### 2026-04-14 — Claude (v1.4.1)

**功能**：博客文章社交分享按钮。

**变更列表**（1 次 commit，已 push）：
1. `src/components/ShareButtons.tsx` — 新增，Twitter/X + LinkedIn + 复制链接，双语 label，复制成功反馈
2. `src/app/[locale]/blog/[slug]/page.tsx` — 集成 ShareButtons，位于正文结束后
3. `CHANGELOG.md` — 新增 v1.4.1 条目

---

### 2026-04-14 — Claude (v1.4.0)

**功能**：博客阅读体验增强——目录（TOC）+ 阅读进度条。

**变更列表**（1 次 commit，已 push）：
1. `src/lib/extractHeadings.ts` — 新增，服务端解析 Lexical JSON 提取标题列表，支持去重 + CJK slug
2. `src/components/TableOfContents.tsx` — 新增，客户端 TOC 组件，IntersectionObserver 高亮当前标题，sticky 定位
3. `src/components/ReadingProgress.tsx` — 新增，客户端阅读进度条，position:fixed top:0
4. `src/components/LexicalRenderer.tsx` — 新增 `withHeadingIds` prop，自定义 JSXConvertersFunction 注入 id 属性
5. `src/app/[locale]/blog/[slug]/page.tsx` — 集成以上三个新组件
6. `CHANGELOG.md` — 新增 v1.4.0 条目

---

### 2026-04-14 — Claude (v1.3.1)

**问题**：Projects 详情页（`/en/projects/*`）全部返回 500，Vercel 日志 digest 为 `DYNAMIC_SERVER_USAGE`。

**根因定位**：
- 详情页原有 `generateStaticParams()` 在 Vercel build 时查询 DB，但项目数据在 build 之后通过 seed 脚本写入，导致返回 0 条路径
- 页面被构建为纯静态（`●`），实际请求到来时 Next.js 尝试动态 fallback，static context 禁止动态 API 调用 → 500

**变更列表**（1 次 commit，已 push）：
1. `src/app/[locale]/projects/[slug]/page.tsx` — 移除 `generateStaticParams()`，替换为 `export const dynamic = 'force-dynamic'` + `export const revalidate = 0`
2. `CHANGELOG.md` — 新增 v1.3.1 条目

---

### 2026-04-13 — Claude (v1.2.7)

**问题**：用户反馈 `https://www.jackdeng.cc/admin` 无法打开，白屏 / "This page couldn't load"。

**根因定位**（用户提供浏览器 console 错误）：
- `TypeError: c.changeLanguage is not a function`
- `Uncaught Error: Minified React error #418` (hydration mismatch)
- v1.2.6 的 `AdminHeaderSettings.tsx` 调用了 `(i18n as any).changeLanguage()`
- Payload 的 `i18n` 对象不是 i18next 实例，不含 `changeLanguage` 方法
- 该错误在 `useEffect`（hydration 阶段）抛出 → React 崩溃 → 页面无法加载

**变更列表**（1 次 commit，已 push）：
1. `src/components/AdminHeaderSettings.tsx` — 将 `(i18n as any).changeLanguage(target)` 替换为 `switchLanguage(target)`（Payload 内置方法，通过 `useTranslation()` 获取）

---

## 📝 Changelog Protocol (Mandatory for AI Agents)

After **every** code change that is committed and pushed, you MUST update `CHANGELOG.md`:

1. Determine the new version (patch / minor / major based on change scope).
2. Add a new `## [x.y.z] — YYYY-MM-DD` section at the top of the changelog body.
3. Group entries under: `Added`, `Changed`, `Fixed`, `Removed`, `Security`.
4. Commit the changelog update in the **same commit** as the code change, or as an immediate follow-up commit with message `docs: update CHANGELOG for vX.Y.Z`.
5. Never skip this step — the changelog is the primary audit trail for OpenClaw and other agents inheriting this project.
