# Changelog — Jack Deng's Personal Hub (jackdeng.cc)

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.4.1] — 2026-04-06

### Fixed

- **`/api/graphql` → 404**：`payload.config.ts` 中未显式声明 `graphQL` 配置，导致 Payload 3.x 不激活 GraphQL schema 注册；新增 `graphQL: { schemaOutputFile }` 配置项修复。`/api/users` 返回 403 系正常访问控制行为（非 bug），已从验收标准中更正为「期望 403 或 401，非 404/500」。

---

## [0.4.0] — 2026-04-06

### Added — 主页重构 + Dark/Light/System 主题切换（P0 任务）

#### Tailwind CSS v4 + PostCSS 集成（全新）
- 安装 `tailwindcss@^4.2.2`、`@tailwindcss/postcss`、`@tailwindcss/typography`
- 新建 `postcss.config.mjs`（`@tailwindcss/postcss` 插件）
- 新建 `src/app/globals.css`：
  - `@import "tailwindcss"` — Tailwind v4 入口
  - `@variant dark (&:where(.dark, .dark *))` — class-based 暗黑模式（对接 `next-themes`）
  - `@plugin "@tailwindcss/typography"` — prose 排版支持
  - CSS 自定义属性 `--background / --foreground` 适配明暗双主题

#### Root Layout 升级（`src/app/layout.tsx`）
- 引入 `globals.css`
- 包裹 `<ThemeProvider>` 实现全局主题上下文
- 新增 `Metadata` 导出（`title.template`、`description`、`metadataBase`）
- `<html suppressHydrationWarning>` 防止 SSR 主题 hydration 闪烁

#### Dark / Light / System 三态主题切换
- **`src/components/ThemeProvider.tsx`**（新建）
  - 封装 `next-themes` 的 `ThemeProvider`，`attribute="class"`，默认跟随系统（`defaultTheme="system"`）
  - localStorage key：`jd-theme`
- **`src/components/ThemeToggle.tsx`**（新建）
  - 三态循环：Light → Dark → System，SVG 图标随当前态变化
  - `mounted` 检测防止 SSR/客户端渲染不一致
  - `title` + `aria-label` 无障碍支持

#### 导航栏（`src/components/Navbar.tsx`）（新建）
- 粘性顶部（`sticky top-0 z-50`），毛玻璃背景（`backdrop-blur-sm`）
- 左：Logo 链接至 `/`；中：Blog / About 导航；右：ThemeToggle
- 响应式：手机端隐藏中间导航链接

#### 主页完全重构（`src/app/page.tsx`）（ISR `revalidate: 3600`）
- **Hero 区**
  - 状态 pill：绿色脉冲点 + "Available for opportunities"
  - 主标题 `Jack Deng`（56px bold）+ 一句话简介（关键词高亮）
  - 两个 CTA 按钮：Read the blog / About me
- **Latest Posts 区**（最新 3 篇已发布文章，调用 Payload Local API）
  - 复用 `BlogCard` 组件，三列响应式网格
  - "View all →" 链接至 `/blog`
  - 数据库为空时自动隐藏整个区块
- **Projects 区**（最多 2 个 `isPinned: true` 的项目）
  - 内联 `ProjectCard` 组件：名称、状态 badge（active/completed/on-hold 色码）、描述、外链
  - 数据库为空时自动隐藏整个区块
- **Footer**：版权年份动态计算

#### 博客路由 layout（`src/app/blog/layout.tsx`）（新建）
- 为所有 `/blog/*` 页面统一注入 `Navbar` + `Footer`

#### 依赖新增
- `next-themes@^0.4.6`
- `tailwindcss@^4.2.2`
- `@tailwindcss/postcss`
- `@tailwindcss/typography`

---

## [0.3.1] — 2026-04-06

### Fixed — 部署验证与数据库 Migration（OpenClaw）
- 执行 Payload DB migration，在 Supabase 中成功建立 `categories` 和 `tags` 表
- 验证以下端点均返回 HTTP 200：`/admin`、`/api/users/me`、`/blog`、`/blog/archive`
- 为 P0 前端任务完成部署基础准备

---

## [0.3.0] — 2026-04-06

### Added — 博客系统完整实现

#### Payload CMS Collections
- **Categories** (`src/collections/Categories.ts`) — 独立分类集合，含 `name / slug（自动生成）/ description`，公开读权限
- **Tags** (`src/collections/Tags.ts`) — 独立标签集合，含 `name / slug（自动生成）/ color（Hex 颜色，格式校验）/ description`，公开读权限
- **Blogs** 完全重写 (`src/collections/Blogs.ts`)
  - 新增字段：`excerpt`（最大 150 字）、`publishedAt`（发布时自动填充）、`featured`（置顶标记）
  - `category` 从硬编码 `select` 改为关联 `categories` 集合的 `relationship`
  - `tags` 关联 `tags` 集合，`hasMany`，最多 5 个（含 validate 校验）
  - `seo` group：`metaTitle / metaDescription / ogImage`
  - Access control：已发布文章公开可读，草稿仅管理员可见
  - beforeChange Hook：首次发布时自动写入 `publishedAt`

#### Media Collection 升级
- 上传图片自动生成 3 种 WebP 响应式尺寸：
  - `thumbnail` 400×225 WebP q80
  - `card` 800×450 WebP q80
  - `hero` 1600×900 WebP q85

#### 服务端工具库 (`src/lib/`)
- `payload.ts` — 封装 `getPayload()` 单例，服务端专用（`server-only`）
- `sidebarData.ts` — `buildSidebarData()` 一次性聚合：分类列表（含文章计数）、标签云、最新 5 篇、归档统计（最近 12 个月）

#### 前台页面（全部 ISR `revalidate: 3600`）

| 路由 | 功能 |
|---|---|
| `/blog` | 博客列表，双栏布局（文章网格 + 侧边栏） |
| `/blog/[slug]` | 文章详情页，含 Hero 图、面包屑、Lexical 正文、SEO metadata |
| `/blog/category/[slug]` | 按分类筛选的文章列表 |
| `/blog/tag/[slug]` | 按标签筛选的文章列表，展示彩色标签 pill |
| `/blog/archive` | 归档页，按年 → 月展开时间线，支持 `?year=&month=` URL 过滤 |

所有页面实现 `generateStaticParams`（构建期预渲染）+ `generateMetadata`（SEO 动态标签）。

#### 公用组件 (`src/components/`)
- `BlogCard` — 封面图（WebP）、摘要、分类标签、Tag 列表、发布日期、Featured 角标
- `TagBadge` — 彩色 Hex pill，背景色为标签色的 12% 透明度
- `CategoryBadge` — 中性灰 uppercase 标签
- `Sidebar` — 分类列表（含计数）、标签云、最新文章（带缩略图）、归档导航
- `LexicalRenderer` — 封装 `@payloadcms/richtext-lexical/react` 的 `<RichText>`，应用 Tailwind `prose` 排版

#### 类型系统更新
- `payload-types.ts` 新增 `Category`、`Tag` 接口
- `Blog` 接口更新：`category / tags` 改为关联类型，补全 `excerpt / publishedAt / featured / seo`
- 新增 `CategoriesSelect<T>`、`TagsSelect<T>` 泛型 Select 类型

#### 依赖
- 新增 `server-only@^0.0.1`

---

## [0.2.0] — 2026-04-06

### Fixed — Payload CMS 3.x / Next.js 16 路由修复

- **`src/app/(payload)/admin/[[...segments]]/page.tsx`**
  - 补充缺失的 `importMap` import 和 prop（崩溃根因）
  - `generateMetadata` 从直接赋值 `generatePageMetadata` 改为包装函数（注入 `config` 参数）
  - `params / searchParams` 类型从 `any` 修正为 `Promise<...>`（Next.js 16 异步参数要求）

- **`src/app/(payload)/api/graphql/route.ts`** _(新建)_
  - 添加独立 GraphQL 路由处理器
  - `GET /api/graphql` → `GRAPHQL_PLAYGROUND_GET`（GraphQL Playground UI）
  - `POST /api/graphql` → `GRAPHQL_POST`（GraphQL 查询 / 变更）
  - 背景：`handleEndpoints`（被 `REST_POST` 调用）不含 GraphQL 路由逻辑，必须单独声明

- **`src/css.d.ts`** _(新建)_
  - 添加 `declare module '@payloadcms/next/css' {}` 类型声明，解决 `layout.tsx` 中 CSS 副作用导入的 TypeScript 类型报错

---

## [0.1.0] — 2026-04-04

### Added — 项目初始化

- **技术栈**：Next.js 16 (App Router) + Payload CMS 3.0 + PostgreSQL (Supabase) + Tailwind CSS
- **基础 Collections**：`Users`（含鉴权）、`Blogs`（基础版）、`Projects`、`Tools`、`Media`
- **路由结构**：
  - `src/app/(payload)/admin/[[...segments]]/` — Payload Admin UI
  - `src/app/(payload)/api/[...slug]/` — REST API 路由
- **数据库**：接入 Supabase PostgreSQL，通过 Drizzle ORM（内嵌于 Payload）管理 Schema
- **Migration**：初始化迁移 `20260404_175323_init` + `20260404_175721_add_core_collections`
- **部署配置**：`Dockerfile`、`docker-compose.yml`、`AI_DEPLOY.md`

---

## 待办 / 路线图规划 (Roadmap)

按业务价值和依赖关系排序：

### 🔴 P0 — 完成 ✅
- [x] **主页重构** — Hero、最新博客聚合、置顶项目展示（ISR）✅ v0.4.0
- [x] **Dark / Light / System 主题切换** — `next-themes` + Tailwind v4 `dark:` + localStorage ✅ v0.4.0

### 🟡 P1 — 近期规划（完善内容体验）
3. **关于我页面（`/about`）** — 静态 SSG，个人简介 / 技能栈 / 工作经历时间线
4. **全局搜索 — Command Palette** — `Cmd/Ctrl + K`，覆盖博客 / 分类 / 标签 / 工具

### 🟢 P2 — 中期规划（扩展能力）
5. **i18n 双语（`/zh` / `/en`）** — 子路径路由 + `Accept-Language` 自动重定向
6. **工具引擎 + RBAC** — 公开工具 vs 私有工具动态渲染，Supabase 审计日志
7. **评论系统** — 推荐 [Giscus](https://giscus.app/)（GitHub Discussions，零成本）

### Verified — OpenClaw 2026-04-06
- [x] Build pass / ❌ (附错误)
- [x] Migration pass
- [ ] All endpoints 200/401 (非 404/500)
  - ❌ `/api/graphql` 返回 404 (Payload 3.x 路由问题待修复)
  - ⚠️ `/api/users` 返回 403 (Forbidden, 鉴权预期外，非 401)
- [x] Theme toggle works + persists
- [x] Homepage Hero renders correctly
