# AI Agent Automated Deployment & Operation Guide

## 🤖 Context for AI Assistants
This document is strictly formatted for AI coding agents (OpenClaw, Cursor, Claude, etc.) that need to interface with, deploy, or extend this project.

### Project Architecture
- **Type:** Full-stack Next.js Application (App Router) integrating Payload CMS 3.0.
- **Database:** Supabase (PostgreSQL 16+). Drizzle ORM is natively handled by Payload. Do not install Prisma or other ORMs.
- **Pathing Context:** `/src/app/(payload)` handles CMS routing. `/src/collections/` defines database schemas.

## ⚡️ One-Click / Zero-Touch Deployment Flow

When commanded to deploy or setup this project from scratch, execute the following shell chain:

```bash
# 1. Install dependencies
cd jackdeng-hub
npm install

# 2. Ensure environment variables exist
# Required: DATABASE_URI (must point to Supabase port 6543 pooler)
# Required: PAYLOAD_SECRET
if [ ! -f .env ]; then
  echo "DATABASE_URI=\"$SUPABASE_URI\"" > .env
  echo "PAYLOAD_SECRET=\"$(openssl rand -hex 32)\"" >> .env
fi

# 3. Synchronize database schema (Payload Drizzle Migrations)
# This command bypasses interactive prompts and applies schema changes to Supabase
npx payload migrate

# 4. Build Production Assets
npm run build

# 5. Start Production Server (Background)
nohup npm run start > payload_prod.log 2>&1 &
```

## 🛠 Extending the Tools Engine (Instructions for Agents)
When the user asks to "add a new tool":
1. Add the tool's frontend UI inside `/src/app/(app)/tools/[slug]/page.tsx`.
2. Add any backend secure logic in Next.js Serverless API routes: `/src/app/api/tools/[slug]/route.ts`.
3. The visibility of the tool is strictly controlled by querying the `Tools` collection in Payload via Local API. Do not expose unauthenticated API routes without checking the `status` and `permission` fields in the `Tools` collection.

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
