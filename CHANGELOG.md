# Changelog — Jack Deng's Personal Hub (jackdeng.cc)

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.1] — 2026-04-06

### Fixed
- Fixed Payload DB migration script and updated tables/schema in Supabase safely.
- Verified `/admin`, `/api/users/me`, `/blog`, and `/blog/archive` endpoints returning HTTP 200 properly.
- Prepared the groundwork for Milestone 3 (Front-end UI P0 items).

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

### 🔴 P0 — 立即规划（影响基本可用性）
1. **主页重构（`/`）**
   - 当前主页仅有占位文本。需实现：
     - **Hero 区**：一句话简介 + 当前状态（可先用静态数据）
     - **内容聚合**：最新 3 篇博客（调用 Payload Local API，SSG）
     - **置顶项目**：2 个 `featured: true` 的 Projects
   - *渲染策略*：`export const revalidate = 3600`（ISR）
2. **Dark / Light / System 主题切换**
   - 基于 Tailwind CSS `dark:` 变体，三态切换：`light / dark / system`
   - 状态持久化至 `localStorage`
   - *建议使用 `next-themes` 库封装，避免 hydration 闪烁*

### 🟡 P1 — 近期规划（完善内容体验）
3. **关于我页面（`/about`）**
   - 静态页面，SSG
   - 内容建议：个人简介、技能栈、工作经历时间线、联系方式
4. **全局搜索 — Command Palette**
   - 快捷键 `Cmd/Ctrl + K` 唤起
   - 搜索范围：博客标题 / 分类名 / 标签名 / 工具列表
   - *访问控制*：仅索引 `status: published` 的内容

### 🟢 P2 — 中期规划（扩展能力）
5. **i18n 双语（`/zh / /en`）**
   - 子路径模式：`/en/blog/...`、`/zh/blog/...`
   - `Accept-Language` 自动重定向
   - *注意*：需同步 Payload Collections 加 `locale` 字段
6. **工具引擎 + RBAC**
   - 公开工具（如 JSON 格式化）：匿名可访问
   - 私有工具（如 Webhook 测试器）：必须登录，`req.user` 校验
   - Supabase 独立 Schema 记录工具调用审计日志
7. **评论系统**
   - 推荐方案：[Giscus](https://giscus.app/)（基于 GitHub Discussions，零成本）
   - 备选：自建 Payload `Comments` Collection + 审核流程
