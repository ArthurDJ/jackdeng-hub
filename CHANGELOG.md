# Changelog — Jack Deng's Personal Hub (jackdeng.cc)

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.5] — 2026-04-13

### Changed — Admin header 语言切换重构

- 将界面语言切换从设置齿轮内移至 header 常驻胶囊按钮 `中 | EN`，当前语言高亮，与原生 `Locale` 下拉框并排，两个语言控件位置统一。
- 设置齿轮简化为仅含：主题切换、账户设置、访问前台。

---

## [1.2.4] — 2026-04-11

### Fixed — Admin 后台子页面全白 + 设置 UI 文案修正

- **数据库迁移 `20260411_000001_add_tool_runs_rels`**：`20260410_021800` 手动创建 `tool_runs` 表时漏加 `tool_runs_id` 到 `payload_locked_documents_rels`。Payload 打开任意 collection 详情页（`/admin/collections/X/:id`）时都会查这张关系表做文档锁定检查，缺列导致 SQL 报错，所有详情页白屏。新迁移添加该列、外键约束与索引，部署后自动执行。
- **`AdminHeaderSettings.tsx`**：
  - 移除冗余的"内容语言"按钮（Payload 原生 header 已有 `Locale` 下拉框）。
  - 修正所有标签三元运算符方向错误（`isZh ? 英文 : 中文` → `isZh ? 中文 : 英文`），中文 UI 下不再错误显示英文标签。
  - Language 按钮右侧改为显示目标语言 `EN →` / `中文 →`，语义更清晰。
  - 移除未使用的 `useLocale`、`useRouter`、`usePathname`、`useSearchParams` import。
- **`AdminLogo.tsx`**：将 "Jack Deng" 文字颜色从硬编码 `#ededed`（浅色主题下不可见）改为 `var(--theme-elevation-1000)`，自适应深色/浅色主题。

---

## [1.2.3] — 2026-04-10

### Added — Visa Monitor 前台 Dashboard + Admin detail 展开

- **`VisaMonitorDashboard`** 新组件：前台私有工具页，NextAuth 鉴权保护（未登录显示锁屏 + Google 登录按钮）。展示：状态 header（运行中脉冲动画）、最新 metadata 卡片、重要事件摘要、完整运行记录列表，点击任意行展开 `detail` 日志 + 结构化 metadata。每 30 秒自动刷新。
- **`tools/[slug]/page.tsx`** 更新：automation 工具不再 404，渲染 `VisaMonitorDashboard`；public interactive 工具保持 iframe/script/builtin 嵌入逻辑。
- **`VisaMonitorPanel`** 更新（Admin 版）：补充 `detail` 字段，列表行点击展开，显示 metadata 卡片 + detail 日志文本。

---

## [1.2.2] — 2026-04-10

### Fixed — 添加 next-intl middleware 修复 admin 登录跳转

- 新建 `src/middleware.ts`，配置 next-intl locale 路由拦截，matcher 排除 `/admin`、`/api` 和静态文件。
- 修复：未登录访问 `/admin/tools/create` 返回 404 → 现在正确跳转 `/admin/login`。

---

## [1.2.1] — 2026-04-10

### Added — Tools 前台页面（列表 + 详情）

- **`/[locale]/tools`**: 工具箱列表页，从 Payload 查询 `status=online, accessControl=public, toolType=interactive` 的工具，以卡片网格展示（icon emoji、名称、描述、状态徽章）。
- **`/[locale]/tools/[slug]`**: 工具详情页，支持三种嵌入方式：
  - `iframe`: 将 `embedUrl` 以全宽 iframe 渲染（700px 高），适合独立部署的外部工具。
  - `script`: Web Component / 脚本嵌入，注入 `<script>` 标签并挂载到容器。
  - `builtin` / 无 embedUrl: 显示"建设中"占位页面。
- 非公开工具（automation / private / offline）访问详情页时返回 404。
- 包含面包屑导航、SEO metadata、返回链接，与全站设计语言一致。

---

## [1.2.0] — 2026-04-10

### Added — Phase 8: Automation Tool 基础框架（Visa Monitor 接收侧）

**架构决策**: 小工具（public interactive）独立 repo + iframe/script 微服务嵌入；自动化工具（private automation）后台持久运行，通过 callback API 将状态写入 Payload。

- **ToolRuns 集合**: 新建运行记录表，存储每次工具执行的状态、摘要、详情和元数据（如找到的签证日期）。
- **Tools schema 重构**: 新增 `toolType`（interactive/automation）、`embedUrl`、`embedType`、`cronSchedule`、`config`、`lastRunAt`、`lastRunStatus`、`notifyWebhook`、`icon` 字段；删除无意义的 `apiRoute` 字段。
- **Callback API**: 新建 `POST /api/tools/[slug]/callback`，通过 `x-cron-secret` 鉴权，接收 Python 脚本推送的运行状态，写入 ToolRuns 并更新 Tool 最后运行状态，找到名额时自动转发到 `notifyWebhook`。
- **VisaMonitorPanel 组件**: Admin 后台签证监控面板，展示最新运行状态、元数据卡片、历史记录列表，每 30 秒自动刷新。
- **数据库迁移**: `20260410_021800` 创建 `tool_runs` 表并更新 `tools` 表字段。

---

## [1.1.14] — 2026-04-10

### Added — Taxonomy seed: full-stack engineer edition

- **6 categories**: Frontend / Backend / Database / Algorithms / DevOps & Tools / Career & Thoughts
- **20 tags**: 编程语言（JS/TS/Python/SQL/Go）+ 前端框架 + 后端/数据库 + 算法细分（Data Structures / Dynamic Programming / LeetCode）+ 工具链 + 集成
- 新增 `src/scripts/seed-taxonomy.ts` 与 `verify-taxonomy.ts` 脚本，支持清空重建与验证。

---

## [1.1.13] — 2026-04-10

### Added — Admin 自定义 Logo

- 新建 `AdminLogo.tsx`，包含两个组件：`AdminLogo`（侧边栏展开时显示 JD 徽标 + "Jack Deng" 文字）和 `AdminIcon`（折叠时显示 JD 方形徽标）。
- 通过 `admin.components.graphics.Logo/Icon` 注册，替换 Payload 默认 logo。
- 设计：蓝紫渐变（`#3b82f6 → #6366f1`）圆角方块 + 白色 JD 字样，与前台 accent 色系一致。

---

## [1.1.12] — 2026-04-10

### Removed — 清理无效 2FA 字段与 no-op email adapter

- **删除 MFA 字段**: 移除 `Users` 集合中 `mfaEnabled`、`mfaSecret`、`emailMfaEnabled` 三个无实际作用的字段及相关 `beforeLogin` hook 占位逻辑。
- **数据库迁移**: 生成 `20260410_004448.ts`，执行后 DROP `users` 表中对应三列。
- **No-op email adapter**: 添加最简 email adapter 函数满足 Payload 3.x 要求（CLI migrate 需要），不发送任何邮件。

---

## [1.1.11] — 2026-04-09

### Added — Admin 侧边栏 UI 语言切换器

- 新建 `AdminLangSwitcher.tsx`，通过 Payload `useTranslation` hook 读取当前界面语言并支持一键切换中文/英文，注入到侧边栏 `afterNavLinks`。
- 现在后台有两个独立切换器：侧边栏的"界面语言"（UI 文字）+ 右上角"Locale"（内容编辑语言），互不干扰。

---

## [1.1.10] — 2026-04-09

### Fixed — Admin UI 默认语言改为中文

- 将 `payload.config.ts` 的 `i18n.fallbackLanguage` 从 `en` 改为 `zh`，Admin 界面默认显示中文。
- 说明：右上角 "Locale" 下拉是内容语言（编辑哪个语言版本的内容），UI 界面语言通过 Account → Language 或此处 fallbackLanguage 控制，两者独立。

---

## [1.1.9] — 2026-04-09

### Added — 动态 OG 图（社交分享预览图）

- **OG 图生成路由**: 新建 `src/app/og/route.tsx`（Edge Runtime），接受 `?title=` 和 `?type=blog|default` 参数，使用 `next/og` `ImageResponse` 动态生成 1200×630 暗色风格预览图，包含标题、蓝色 accent 线、作者头像和域名。
- **博客详情页**: `generateMetadata` 新增 `openGraph.images` 和 `twitter.card` 字段。有手动上传 OG 图时使用上传图，否则自动指向 `/og?title=<标题>&type=blog`。
- **全站默认 OG**: `[locale]/layout.tsx` 的 `metadata` 新增默认 `openGraph.images` 和 `twitter` 配置，指向 `/og?title=Jack+Deng`。

---

## [1.1.8] — 2026-04-09

### Added — RSS Feed

- **RSS 路由**: 新建 `src/app/feed.xml/route.ts`，支持 `?locale=en|zh` 参数，查询最新 20 篇已发布博客，返回标准 RSS 2.0 XML，24h 缓存。
- **Footer RSS 链接**: Footer 导航栏新增 "RSS" 链接，自动跟随当前语言（`/feed.xml?locale=en` 或 `zh`）。
- **Autodiscovery**: 在 `[locale]/layout.tsx` 的 `<head>` 注入两个 `<link rel="alternate">` 标签，RSS 阅读器可自动发现订阅源。

---

## [1.1.7] — 2026-04-09

### Added — 前后台互通导航链接

- **前台 Footer → Admin**: 在 `Footer.tsx` 导航栏右侧新增低调的 "Admin" 链接（`--text-tertiary` 颜色），直接跳转 `/admin`。
- **后台 Admin → 前台**: 新建 `AdminViewSiteLink.tsx` 组件，通过 Payload `afterNavLinks` 注入侧边栏底部，显示带外链图标的 "View Site" 按钮，新窗口打开 `jackdeng.cc`。

---

## [1.1.6] — 2026-04-09

### Fixed — 登录页 UI 优化与安全加固

- **GoogleLoginButton 重设计**: 按钮适配 Payload Admin 暗色主题（`rgba` 半透明背景），修复 OR 分隔线使用 `var(--bg-base)` 在 Admin 环境中不生效的问题；新增 hover 态、loading 动画（旋转圈）与禁用态。
- **移除 autoLogin**: 删除 `payload.config.ts` 中的 `autoLogin`（`dev@payloadcms.com / test`），消除生产环境凭证预填安全隐患。
- **双语验证**: 确认全部 8 个 Collection（Blogs/Categories/Comments/Tags/Projects/Tools/Media/Users）均已配置 `en`/`zh` 双语 labels，Admin i18n 切换正常。

---

## [1.1.5] — 2026-04-09

### Fixed — 移除无效的邮箱验证配置，修复构建类型错误

- **构建错误修复**: 删除 `payload.config.ts` 中的 `email.transportOptions` 配置块。Payload CMS 3.0 的 `EmailAdapter` 类型不包含 `transportOptions` 属性，导致 TypeScript 编译失败。
- **邮箱验证移除**: 删除 `src/collections/Users.ts` 中的 `verify: true`。
  - **决策依据**: 站点仅通过 Google OAuth 登录（白名单限制为 `dj3013158@gmail.com`），Google 已在 OAuth 流程中完成邮箱归属验证，Payload 原生邮箱验证对此场景无意义且依赖未配置的 SMTP 服务。

---

## [1.1.4] — 2026-04-09

### Added — 身份验证升级：Google OAuth 集成与安全加固

- **Google 登录集成**: 
  - 引入了 `next-auth` 框架，在后台登录页面新增了 **"Sign in with Google"** 按钮。
  - 实现了基于 OAuth 2.0 的第三方身份验证流程，简化了管理员登录体验。
- **安全白名单 (Email Whitelisting)**:
  - 在 `signIn` 回调中实施了严格的准入控制：**仅允许** `dj3013158@gmail.com` 登录或自动注册后台。
  - 拦截并记录所有非白名单账号的登录尝试，防止未授权访问。
- **邮箱验证功能**:
  - 在 `Users` 集合中开启了 `verify: true` 选项，为原生账号登录增加了邮箱激活环节。
  - 在 `payload.config.ts` 中集成了标准 SMTP 配置接口，支持通过环境变量（`SMTP_HOST`, `SMTP_USER` 等）动态配置邮件服务。
- **移动端访问优化 (UI/UX)**:
  - **响应式导航**: 为移动端新增了带毛玻璃效果的汉堡菜单（Hamburger Menu）。
  - **Hero 区域调整**: 优化了手机端的间距，并将 CTA 按钮（Blog/About）调整为全宽触摸友好布局。
- **后台国际化完善**:
  - 开启了 `Projects`, `Categories`, `Tags`, `Tools` 等集合的字段级多语言支持（`localized: true`）。
  - 优化了管理后台的列表列展示，`Users` 列表现在优先显示姓名并展示 2FA 状态。

---

## [1.1.3] — 2026-04-09

### Fixed — 后台管理登录报错：修复缺失的 MFA 数据库列

- **数据库迁移 (Migration)**: 针对生产环境报错 `column users.mfa_enabled does not exist`，创建并执行了新的迁移文件 `20260409_204519_add_mfa_fields.ts`。
- **Schema 同步**: 在 `users` 表中补齐了以下缺失字段：
  - `mfa_enabled`: 存储 TOTP 开启状态。
  - `mfa_secret`: 存储 TOTP 密钥。
  - `email_mfa_enabled`: 存储邮件验证开启状态。
- **Git 同步**: 迁移文件及更新后的 `payload-types.ts` 已同步推送到远程仓库，触发生产环境自动部署修复。

---

## [1.1.2] — 2026-04-09

### Fixed — Payload CMS 3.0 类型错误修复与构建恢复

- **Collection 配置修复**: 修复了所有 Collection (Blogs, Categories, Comments, Tags, Projects, Tools, Media, Users) 中 `labels` 配置项位置错误的问题。在 Payload CMS 3.0 中，`labels` 必须位于根层级，而非 `admin` 内部。
- **字段验证修复**: 
  - 修复了 `Blogs` 和 `Tags` 集合中 `validate` 函数的返回类型。Payload 要求验证失败时返回字符串而非对象，已统一修改为返回英文错误信息字符串。
- **代码清理**: 
  - 删除了 `Users` 集合中未使用的 `otplib` 引用，解决了因 `otplib` 版本升级导致的导出成员不匹配问题。
- **构建成功**: 经过上述修复，项目已能成功通过 `npm run build` 和 `npx tsc --noEmit` 类型检查。

---

## [1.1.1] — 2026-04-09

### Fixed — 后台管理界面 (Admin UI) 国际化翻译修复

- **Collection 标签双语化**: 为所有核心集合（Blogs, Categories, Comments, Tags, Projects, Tools, Media, Users）添加了 `admin.labels` 配置，支持中英文双语显示。
- **字段标签双语化**:
  - 修复了所有 Collection 字段的 `label` 为对象格式，支持 `en` 和 `zh`（例如 `label: { en: 'Name', zh: '姓名' }`）。
  - 为 `Users` 集合中新加的 MFA 相关字段（Enable 2FA, Enable Email 2FA）添加了对应的中文翻译（启用 2FA (TOTP), 启用邮件 2FA）。
- **描述与验证消息双语化**:
  - 将所有字段的 `admin.description` 修改为双语支持。
  - 将 `Tags` 集合中的颜色校验错误消息修改为双语支持。
- **核心配置引用**: 确保了 Payload CMS 正确引用 `payload.config.ts` 中的 `i18n` 配置，使得后台侧边栏和列表页表头能根据语言切换正确显示。

---

## [1.1.0] — 2026-04-09

### Added — 安全加固：双重验证 (2FA/MFA) 集成

- **MFA 核心集成**: 在 `Users` 集合中启用了基于 TOTP (Time-based One-Time Password) 的双重验证，遵循 Payload CMS 3.0 最佳实践。
- **验证方式支持**:
  - **TOTP**: 支持 Google Authenticator / Microsoft Authenticator / Auth 等令牌应用。
  - **Email 2FA**: 为用户预留了 `emailMfaEnabled` 字段，支持后续扩展邮箱验证码逻辑。
- **兼容性保障**: 
  - **Cloudflare Turnstile**: 保持了与现有 Turnstile 验证逻辑的兼容性。Turnstile 作为 L1 (人机验证) 在登录前触发，MFA 作为 L2 (身份验证) 在登录凭证正确后触发。
  - **Admin UI**: 在用户个人资料页面的侧边栏新增了 "Enable 2FA (TOTP)" 和 "Enable Email 2FA" 控制开关。
- **技术实现**:
  - 安装并集成了 `otplib` 和 `qrcode` 用于 TOTP 密钥生成与验证。
  - 重构了 `src/collections/Users.ts`，将原本在 `payload.config.ts` 中的内联用户配置迁移至独立文件，提高了代码的可维护性。
  - 在 `src/payload.config.ts` 中通过 `mfa: true` 开启了 Payload 内置的 MFA 支持（需配合后续 UI 配置）。

---

## [1.0.0-rc] — 2026-04-09

### Added — Week 2–3 v1.0 冲刺功能（P0–P2 全线完成）

#### 设计系统对齐 (P0)
- **Blog 子页视觉统一**: `archive` / `category/[slug]` / `tag/[slug]` 页面全部迁移至 CSS token inline style，消除 `bg-zinc-*` / `text-zinc-*` / `text-blue-*` 等旧 Tailwind 类
- **CategoryBadge**: 替换 zinc hardcode → `var(--bg-elevated)` / `var(--text-tertiary)` / `var(--border-default)`
- **LexicalRenderer**: `prose prose-zinc dark:prose-invert` → `prose prose-ds max-w-none`；新增 `.prose-ds` utility 覆盖全部 `--tw-prose-*` 变量指向 design token
- **自定义 404**: 新建 `src/app/[locale]/not-found.tsx`（含 Navbar + i18n + accent CTA）与根级 `src/app/not-found.tsx` 兜底
- **CommandPalette**: 20+ 处 zinc className → CSS token inline style；`fetchResults` 追加 `&locale=${locale}`，修复中文模式下搜索结果错语言问题

#### SEO 基础设施 (P1)
- **Sitemap**: 新建 `src/app/sitemap.ts`，动态查询已发布博客 / 分类 / 标签，为 `en` + `zh` 各生成条目并附 `alternates.languages` hreflang，`revalidate = 86400`
- **Robots**: 新建 `src/app/robots.ts`，`Disallow: /admin /admin/ /api/`，指向 `/sitemap.xml`
- **Canonical / hreflang**: 首页、博客列表、博客详情、About 页 `generateMetadata` 全部注入 `alternates.canonical` + `alternates.languages`
- **JSON-LD 结构化数据**: 博客详情页注入 `BlogPosting`（含 `mainEntityOfPage`）+ `BreadcrumbList` 两个 `<script type="application/ld+json">` 块

#### 阅读体验 (P1)
- **Reading time**: 新建 `src/lib/readingTime.ts`，递归遍历 Lexical JSON tree 统计词数 ÷ 200 wpm；BlogCard + 博客详情页均展示 `{n} min read` / `{n} 分钟阅读`
- **Blog 列表分页**: 新建 `src/components/Pagination.tsx`（智能省略号算法，active/disabled/hover 完整状态）；`blog/page.tsx` / `category/[slug]` / `tag/[slug]` 全部接入，统一 12 条/页

#### 代码质量 (P2)
- **Footer 统一**: 新建 `src/components/Footer.tsx`（async Server Component，含双语 nav 链接 + copyright + builtWith），替换首页 / About / blog layout / blog detail 四处冗余内联代码
- **Layout 工具类**: `globals.css` 新增 `.ds-container` / `.ds-section-padding` / `.ds-pagination-item` / `.ds-page-btn`，减少重复 inline style
- **日期格式标准化**: 新建 `src/lib/formatDate.ts`，locale 参数驱动 `en-US` / `zh-CN`；BlogCard / Sidebar / archive / blog detail 等六处硬编码 `'en-US'` 全部替换

### Fixed
- **Vercel Blob private store 报错**: 旧 Blob store 类型为 private，`vercelBlobStorage` 插件默认 public access 导致上传失败；重建 public store 并更新 `BLOB_READ_WRITE_TOKEN`
- **Media URL 404**: 旧 deployment 未读取新 token，图片保存为 `/api/media/file/xxx` 路径（本地路径，Serverless 下 404）；重新部署后 URL 正确写入 Blob CDN

---

## [0.9.5] — 2026-04-08

### Added
- **Production Database Migration**: Ran `npx payload migrate` against the production Supabase PostgreSQL database to sync Schema changes and create `blogs_locales` tables.
- **Data Seeding**: Wrote and executed `scripts/seed.ts` to automatically populate 3 bilingual test blog posts (2 featured) into the production database to verify live UI rendering.
## [0.9.4] — 2026-04-08

### Fixed — `t.rich()` XML tag format → fixes HTTP 500 on homepage + about

**Root cause:** `en.json` / `zh.json` used `{variable}` placeholder syntax in messages that were called via `t.rich()`. `next-intl`'s `t.rich()` requires XML-style `<tag>text</tag>` syntax for component interpolation. When `t.rich()` received a React component factory as a `{variable}` value, it embedded the function into the rendered string, causing React to throw during RSC serialisation → HTTP 500 on every page calling `t.rich()`.

#### Changed in `en.json` and `zh.json`
- `home.bio`: `{netsuite}` / `{boomi}` → `<netsuite>NetSuite</netsuite>` / `<boomi>Boomi</boomi>`
- `about.bio2`: `{nextjs}` / `{payload}` / `{supabase}` → `<nextjs>Next.js</nextjs>` / `<payload>Payload CMS</payload>` / `<supabase>Supabase</supabase>`
- `about.ctaBlogNote`: `{link}` → `<link>writing lately →</link>` (zh: `<link>写什么 →</link>`)

#### Changed in `src/app/[locale]/about/page.tsx`
- `ctaBlogNote` link callback updated from `() => …` to `(chunks) => …` so message content renders correctly through the tag

#### Fixed in `src/app/[locale]/page.tsx`
- Removed duplicate `const tCommon` declaration introduced by a remote hotfix commit (caused TypeScript build error)

**Affected pages now resolved:** `/en`, `/zh`, `/en/about`, `/zh/about`

**OpenClaw v0.9.4 验收结果（全线通过）：**
- `GET /en` → ✅ 200
- `GET /zh` → ✅ 200
- `GET /en/about` → ✅ 200
- `GET /zh/about` → ✅ 200
- `GET /en/blog` → ✅ 200（未回退）
- `GET /zh/blog` → ✅ 200（未回退）

---

## [0.9.3] — 2026-04-08

### Fixed — Event handlers in Server Components → HTTP 500

- Removed all `onMouseEnter` / `onMouseLeave` event handler props from Server Component files (`page.tsx`, `BlogCard.tsx`, `Sidebar.tsx`, `blog/page.tsx`, `blog/[slug]/page.tsx`, `about/page.tsx`)
- RSC payload serialisation fails silently on event handler props even though SSR HTML renders — manifests as 500 on client navigation / full page hydration
- Replaced with CSS-only hover utilities (`.ds-card-hover`, `.ds-accent-btn`, `.ds-ghost-btn`, `.ds-link-pill`, `.ds-breadcrumb`) defined in `globals.css`

**Partially resolved:** `/en/blog`, `/zh/blog` → 200 ✅ (homepage/about remained 500 until v0.9.4)

---

## [0.9.2] — 2026-04-08

### Fixed — 3 项生产环境错误修复

#### 1. `middleware.ts` → `proxy.ts`（Next.js 16 Breaking Change）
- Next.js 16 废弃了 `middleware` 文件约定，要求改用 `proxy`
- 旧文件保留时中间件**静默失效**，`next-intl` 路由中间件不运行
- 结果：`/` 不再重定向至 `/en` / `/zh`，所有 locale 路由失效
- 修复：`src/middleware.ts` → `src/proxy.ts`（内容不变）

#### 2. 首页 + 博客列表：locale 查询 `.catch()` 保护
- `blogs_locales` 表在执行 `npx payload migrate` 之前不存在
- `payload.find({ locale })` 触发 SQL 查询该表 → 抛出未捕获异常 → 500 "A server error occurred"
- 修复：为所有带 `locale` 参数的 `payload.find()` 加 `.catch(() => ({ docs: [] }))`
- 效果：迁移执行前页面正常渲染（博客区块为空），不再崩溃

#### 3. About 页：`force-static` → `generateStaticParams()`
- `[locale]` 动态路由段下使用 `force-static` 但缺少 `generateStaticParams`
- Next.js 16 下产生构建/运行时冲突，导致 `/en/about` 和 `/zh/about` 报错
- 修复：替换为 `generateStaticParams()` 显式返回 `[{ locale: 'en' }, { locale: 'zh' }]`

### Added

#### Vercel Speed Insights（merge PR vercel-bot）
- 安装 `@vercel/speed-insights@2.0.0`
- `[locale]/layout.tsx` 注入 `<SpeedInsights />` 组件
- 部署后自动在 Vercel Dashboard → Speed Insights 收集 Core Web Vitals

#### Cloudflare Turnstile 配置
- `.env.example`：新建，记录所有环境变量（含 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` sitekey）
- `.env.local`（本地，不提交）：写入 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`
- Vercel 生产环境需手动添加两个变量后评论防护全部激活

---

## [0.9.1] — 2026-04-07

### Added — Geist 字体 + 全站页面设计系统对齐

#### 字体系统
- 安装 `geist@1.7.0`（Vercel 官方开源字体，与 DESIGN.md §2 完全对应）
- `[locale]/layout.tsx`：从 Inter Variable 切换至 `GeistSans` + `GeistMono`，CSS 变量 `--font-geist-sans` / `--font-geist-mono` 全局注入
- `globals.css`：`font-family` 使用 `var(--font-geist-sans)`，代码/数字/日期元素使用 `--font-geist-mono`

#### About 页面完全重构（`src/app/[locale]/about/page.tsx`）
- 个人介绍更新：职位改为 **Senior Database & Integration Administrator**，Bio 内容对齐实际专业方向
- Skills 栈重组为四组：Database（NetSuite、PostgreSQL、SQL Server、Supabase）/ Integration（Boomi、REST APIs、EDI/SFTP、Webhooks）/ Development / Tools
- Timeline：角色和描述更新为数据库与集成管理方向的职业路径
- Avatar：纯 CSS 字母 `JD`，accent 蓝色圆形，替代 emoji 占位
- 竖向时间线：accent 蓝色 dot + 细线连接
- 所有链接样式改为 pill 形，hover 通过 CSS 变量过渡
- i18n key 名全部修正（`ctaBtn`、`skillsHeading`、`experienceHeading`、`findMeHeading` 等与 en.json 对齐）

#### Blog 列表页（`src/app/[locale]/blog/page.tsx`）
- 注入 Navbar，移除对 blog/layout.tsx 的隐式依赖
- 页面 header 使用 CSS token 变量（`var(--bg-base)`、`var(--text-primary)` 等）
- 改用 `auto-fill minmax(280px, 1fr)` 响应式网格，消除固定列数限制

#### Blog 详情页（`src/app/[locale]/blog/[slug]/page.tsx`）
- Hero 图叠加渐变由 `rgba(0,0,0,x)` 改为 `var(--bg-base)` 色调，深/浅双模式自动适配
- Breadcrumb hover 改为 accent 蓝色过渡
- 文章正文字体颜色使用 `var(--text-secondary)`，`excerpt` 使用 `font-weight: 300`
- 返回链接从文字链接改为 SVG 箭头 + accent 色按钮
- 评论区、分割线全部改用 `var(--border-subtle)`

#### BlogCard 组件完全重写（`src/components/BlogCard.tsx`）
- 消除所有 `zinc-*` Tailwind 类，改用 CSS 变量 token
- 卡片边框 radius 12px，hover 通过 `onMouseEnter/Leave` 更新 `var(--border-strong)` + `var(--bg-elevated)`
- 日期使用 `font-family: var(--font-geist-mono, monospace)`
- 文章摘要用 `-webkit-line-clamp: 3` 截断

#### Sidebar 组件完全重写（`src/components/Sidebar.tsx`）
- 消除所有 `zinc-*` Tailwind 类，改用 CSS 变量 token
- 激活分类高亮：`var(--accent-subtle)` 背景 + `var(--accent-primary)` 文字
- 计数徽章使用 Geist Mono 字体
- 最新文章缩略图 border-radius 6px，无图时使用 `var(--bg-elevated)` 占位

#### i18n 更新
- `en.json` / `zh.json` `about` 命名空间：内容更新为 Senior DB & Integration 职位文案，修正所有 key 名

### Changed
- `globals.css` `font-family` 更新为优先使用 `--font-geist-sans`

---

## [0.9.0] — 2026-04-07

### Added — Linear/Vercel 设计系统全站落地

#### globals.css 设计 Token 层（完全重写）
- 基于 `DESIGN.md` 建立完整 CSS 自定义属性系统，Dark 默认、`.light` 覆盖：
  - **背景**：`--bg-base: #0a0a0a` → `--bg-panel: #121212` → `--bg-elevated: #171717`（Deep Tech Black 层级）
  - **文字**：`--text-primary: #ededed` / `--text-secondary: #a1a1aa` / `--text-tertiary: #71717a`
  - **边框**：`rgba(255,255,255,0.10)` 半透明白色叠层，替代实色 border
  - **Accent**：`--accent-primary: #3b82f6`（暗色）/ `#0a72ef`（亮色，Develop Blue）
  - **Motion**：`--duration-fast/base/slow`、`--ease-default`（spring-like）
  - **Light 覆盖**：`.light` 类完整覆盖所有 token，无需额外 Tailwind `dark:` 类
- 新增 utility 类：`.bg-base`、`.bg-panel`、`.card`（12px radius）、`.pill`（9999px）
- 新增字体比例 utility：`.text-display-xl` 到 `.text-body-sm`

#### 首页完全重建（`src/app/[locale]/page.tsx`）
- **Hero 区**：标题改为 `Senior Database & Integration Administrator`，weight-590，字号自适应 `clamp(36px, 5vw, 56px)`；emerald 状态 pill（animate-pulse）；bio 使用 `t.rich()` 高亮 NetSuite/Boomi 关键词；CTA 按钮改为 pill 形（`border-radius: 9999px`）+ scale hover
- **Tech Stack 网格**：NetSuite / Boomi / Supabase / Next.js，含内联 SVG 图标，2 列 → 4 列响应式；hover 提升边框至 `--border-strong`
- **Latest Posts**：保留数据层，全部样式改用 CSS 变量
- **Latest Projects**：新增空状态占位（accent icon + 文字提示），项目卡片改用 token 颜色
- **Footer**：使用 `--border-subtle` 分隔线，`--text-tertiary` 文字

#### Navbar 重写（`src/components/Navbar.tsx`）
- 52px 高度，`backdrop-blur(12px)` 毛玻璃，`rgba(8,9,10,0.80)` 暗色背景
- 亮色模式下自动切换为 `rgba(255,255,255,0.85)` + dark border
- 链接 weight-510，hover 通过 inline style + `onMouseEnter/Leave` 实现 token 过渡
- 搜索按钮改为细边框 ghost 样式

#### ThemeToggle 更新（`src/components/ThemeToggle.tsx`）
- hover 状态改用 CSS 变量（`rgba(255,255,255,0.05)`），消除 Tailwind zinc 依赖

#### i18n 新增（`en.json` / `zh.json`）
- `home` 命名空间新增：`subtitle`、`techStackHeading`、`latestProjects`、`noProjectsYet`、`noProjectsNote`
- `nav` 命名空间新增：`search`（修复 Navbar `t('search')` key 缺失 bug）

---

## [0.6.1] — 2026-04-07

### Added
- **Design System** (`DESIGN.md`) — Added Vercel/Linear inspired UI specs and Tailwind component structures for AI coding agents.
- **Project Roadmap** (`PROJECT_ROADMAP.md`) — Created single source of truth for tracking project phases and requirements.

### Changed
- Removed local Cloudflare Tunnel configurations and transitioned to Vercel global edge routing.

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

### 🟢 P2 — 完成 ✅
- [x] **i18n 双语（`/zh` / `/en`）** — next-intl，`[locale]` 子路径路由，TypeScript 类型安全，zombie key 检测 ✅ v0.8.0
- [x] **评论系统** — 自建数据库 + 三层防 spam（Turnstile / IP 限流 / Honeypot）✅ v0.7.0
- [x] **全站设计系统** — Linear/Vercel DESIGN.md token 层 + Geist 字体，全页面覆盖 ✅ v0.9.0–0.9.1

### 🟣 P3 — 待办（功能完善）
- [ ] **TagBadge / CategoryBadge 样式对齐** — 消除残留 zinc 类，改用 CSS token
- [ ] **LexicalRenderer prose 对齐** — 文章正文排版使用 Geist + 设计 token
- [ ] **CommandPalette 样式更新** — 搜索弹窗适配新设计系统
- [ ] **Turnstile 生产配置验收** — 配置 `CLOUDFLARE_TURNSTILE_SECRET`，端对端测试评论提交流程

### ⏳ P4 — 后续扩展（工具引擎 + SEO）
- [ ] **工具引擎 + RBAC** — 公开工具 vs 私有工具动态渲染，Supabase 审计日志
- [ ] **动态 Sitemap 与 Robots.txt**
- [ ] **Metadata / OpenGraph 标签全局自动注入**
- [ ] **Lighthouse 性能审计**（目标全绿）

### Verified — OpenClaw 2026-04-06 (v0.5.0)
- [x] `GET /about` -> 200, 包含 `<h1>Jack Deng</h1>` & Skills
- [x] Navbar 搜索按钮可见 + `⌘K` 提示
- [x] `GET /api/blogs` 搜索接口 -> 200 (Command Palette)
- [x] `npm run build` 无 TypeScript 错误
- [x] 迁移与依赖验证通过 (sharp installed)
