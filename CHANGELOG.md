# Changelog — Jack Deng's Personal Hub (jackdeng.cc)

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.6.0] — 2026-04-06

### Added
- **Vercel 部署配置** (`vercel.json`) — 为自动化部署添加 `buildCommand`、`installCommand` 及 Cron Job 配置。
- **自动化部署支持** — 项目现已支持通过 GitHub 仓库直接接入 Vercel 进行持续集成与发布。

---

## [0.8.0] — 2026-04-07

### Added — i18n 双语支持 `/en` `/zh`（P2 任务）

#### 路由架构
- 所有前端页面迁移至 `src/app/[locale]/` 路由组（`(payload)/` admin 路由不受影响）
- `src/middleware.ts`：基于 `next-intl`，自动检测浏览器语言并重定向 `/` → `/en` 或 `/zh`
- `src/i18n/routing.ts`：locale 配置，支持 `en` / `zh`，默认 `en`，前缀模式 `always`
- `src/i18n/navigation.ts`：typed `<Link>`、`useRouter`、`usePathname`（locale-aware）
- `src/i18n/request.ts`：服务端 `getRequestConfig`，动态加载对应 locale 的 messages

#### 翻译文件
- `src/i18n/messages/en.json`：英文字符串（nav / home / blog / about / search / footer / notFound）
- `src/i18n/messages/zh.json`：中文字符串，全量翻译覆盖

#### 已本地化页面
- 首页（`/[locale]/page.tsx`）：Hero 文案、CTA、Latest Posts、Projects 区块全部接入 `t()`
- About 页（`/[locale]/about/page.tsx`）：Bio、Skills、Timeline（中英双版本描述）、Links、CTA
- Blog 列表（`/[locale]/blog/page.tsx`）：标题、副标题、空状态文案
- Blog 详情、Category、Tag、Archive 页：迁移至 `[locale]` 目录

#### Navbar 语言切换
- 右侧新增语言切换按钮：当前为英文时显示「中文」，当前为中文时显示「EN」
- 使用 `next-intl` 的 `useRouter().replace(pathname, { locale })` 实现原地切换，保留当前路径

#### Payload 字段级本地化
- `payload.config.ts`：新增 `localization` 配置（`en` / `zh`，defaultLocale `en`，fallback `true`）
- `Blogs` collection：`title`、`excerpt`、`content` 字段标记 `localized: true`
- 所有 Payload 查询传入 `locale` 参数，服务端按请求语言返回对应内容

#### 工程配置
- `next.config.mjs`：包裹 `withNextIntl()` 插件
- `src/app/layout.tsx`：精简为 root shell，前端布局移至 `[locale]/layout.tsx`
- `[locale]/layout.tsx`：`<NextIntlClientProvider>` + `<ThemeProvider>` + `<CommandPalette>`

#### 部署踩坑文档
- 新建 `DEPLOY_ISSUES.md`：记录从初始部署到当前所有已知问题及解决方案（共 6 条 issue）

### Fixed
- `vercel.json` buildCommand 移除 `npm run migrate`，防止构建超时（Issue #5）

---

## [0.7.0] — 2026-04-06

### Added — 评论系统（自建数据库 + 三层防 spam）（P2 任务）

#### Comments Collection（`src/collections/Comments.ts`）
- 字段：`authorName`、`authorEmail`（不公开）、`content`（最多 500 字）、`post`（relationship → blogs）、`status`（pending / approved / spam，默认 pending）、`ip`（自动注入）、`turnstileToken`、`honeypot`（存储但不展示）
- **访问控制**：公开可 POST 创建；`status: approved` 的评论公开可读；update / delete 仅 admin
- **三层防 spam**：
  1. **Honeypot**：`beforeChange` hook 检测隐藏字段，机器人填写即丢弃
  2. **IP 频率限制**：同 IP 每小时最多 5 条，超出抛出错误（`beforeChange` 查库实现，无需 Redis）
  3. **Cloudflare Turnstile**：前端集成 invisible captcha，`POST /api/verify-turnstile` 服务端验证；未配置 `TURNSTILE_SECRET_KEY` 时自动跳过（开发模式友好）
- **审核流程**：所有提交默认 `pending`，管理员在 Payload Admin 改为 `approved` 后才公开展示

#### Turnstile 验证 API（`src/app/api/verify-turnstile/route.ts`）
- `POST /api/verify-turnstile`，调用 Cloudflare siteverify 接口
- 未配置 secret 时返回 `{ success: true }`（开发/测试友好）

#### CommentForm（`src/components/CommentForm.tsx`）（新建，客户端组件）
- 字段：Name、Email、Comment（字数计数器）
- 动态加载 Turnstile widget（`onTurnstileLoad` 回调），`NEXT_PUBLIC_TURNSTILE_SITE_KEY` 未设置时跳过
- 提交流程：Turnstile 验证 → POST `/api/comments` → 成功显示确认提示 + 重置表单
- 错误状态展示、loading spinner、disabled 防重复提交

#### CommentList（`src/components/CommentList.tsx`）（新建，服务端组件）
- 直接通过 Payload Local API 查询当前文章 `approved` 评论
- Avatar 组件：从姓名生成首字母 + 确定性 HSL 颜色（无需图片）
- 评论数显示（"0 comments" / "1 comment" / "N comments"）

#### 博客详情页更新（`src/app/blog/[slug]/page.tsx`）
- 文章正文底部追加评论区：`<CommentList>` + 分割线 + `<CommentForm>`
- 审核提示文字："Comments are reviewed before appearing."

#### 配置更新
- `src/payload.config.ts`：注册 `Comments` collection
- `src/payload-types.ts`：新增 `Comment` interface、`CommentsSelect<T>`，注册到 `Config.collections` 和 `Config.collectionsSelect`

#### 新增环境变量（可选，不填则跳过 Turnstile）
- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile secret（服务端验证用）
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — Cloudflare Turnstile site key（前端 widget 用）

---

## [0.5.0] — 2026-04-06

### Added — About 页面 + 全局搜索 Command Palette（P1 任务）

#### About 页面（`src/app/about/page.tsx`）（新建，静态 SSG）
- `export const dynamic = 'force-static'` — 构建时完全静态化，零运行时开销
- **Bio 区**：头像占位符、姓名 + 职业标签、三段介绍（技术栈外链 Next.js / Payload / Supabase）
- **Skills 区**：2×2 响应式卡片网格，四组技能（Languages / Frontend / Backend / Infra）
- **Timeline 区**：竖线时间轴，三条经历条目（含角色、所在地、描述）
- **Links 区**：GitHub / LinkedIn / Email 外链按钮，外链带 svg 箭头图标
- **CTA 区**：圆角卡片，引导发邮件 + 跳转博客

#### 全局搜索 Command Palette（`src/components/CommandPalette.tsx`）（新建）
- **触发方式**：`Cmd+K`（Mac）/ `Ctrl+K`（Win/Linux）全局快捷键 + Navbar 搜索按钮
- **搜索范围**：已发布博客文章（标题 + 摘要）、分类、标签，并行三路 Payload REST API 查询
- **交互**：`↑↓` 键盘导航、`↵` 跳转、`Esc` 关闭；280ms debounce 防止过度请求
- **空状态**：未输入时显示 Home / Blog / About 快捷导航；无结果时显示提示文字
- **无障碍**：`role="dialog" aria-modal`、`role="listbox"`、`aria-selected`、`aria-label`
- **结果类型图标**：post（文件图标）/ category（网格图标）/ tag（标签图标）/ page（房子图标），各有独立色
- 全局状态使用 `useSyncExternalStore` 模式（无额外依赖）

#### 状态管理（`src/store/commandPaletteStore.ts`）（新建）
- 模块级单例，`subscribe / getSnapshot` 实现 `useSyncExternalStore` 接口
- SSR server snapshot 固定返回 `false`，避免 hydration 不匹配

#### 快捷键 Hook（`src/hooks/useCommandPalette.ts`）（新建）
- `window.addEventListener('keydown')` 监听 `Cmd/Ctrl+K` 和 `Esc`，组件 unmount 自动清理

#### Navbar 更新（`src/components/Navbar.tsx`）
- 桌面端：搜索输入样式触发按钮（显示 `⌘K` 提示）
- 移动端：仅显示搜索图标按钮
- 添加 `'use client'` 指令（按钮需要 onClick 事件）

#### Root Layout 更新（`src/app/layout.tsx`）
- 全局挂载 `<CommandPalette />`，使快捷键在所有页面生效

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

### 🟡 P1 — 完成 ✅
- [x] **关于我页面（`/about`）** — 静态 SSG，个人简介 / 技能栈 / 工作经历时间线 ✅ v0.5.0
- [x] **全局搜索 — Command Palette** — `Cmd/Ctrl + K`，覆盖博客 / 分类 / 标签 / 工具 ✅ v0.5.0

### 🟢 P2 — 中期规划（扩展能力）
- [ ] **i18n 双语（`/zh` / `/en`）** — 子路径路由 + `Accept-Language` 自动重定向
- [ ] **工具引擎 + RBAC** — 公开工具 vs 私有工具动态渲染，Supabase 审计日志
- [ ] **评论系统** — 推荐 [Giscus](https://giscus.app/)（GitHub Discussions，零成本）

### Verified — OpenClaw 2026-04-06 (v0.5.0)
- [x] `GET /about` -> 200, 包含 `<h1>Jack Deng</h1>` & Skills
- [x] Navbar 搜索按钮可见 + `⌘K` 提示
- [x] `GET /api/blogs` 搜索接口 -> 200 (Command Palette)
- [x] `npm run build` 无 TypeScript 错误
- [x] 迁移与依赖验证通过 (sharp installed)
