# Jack Deng's Personal Hub - 需求与进度规划 (Roadmap)

## 🎯 项目愿景 (Vision)
打造一个极致优化、面向公众的个人数字名片，同时后端集成无头 CMS (Payload CMS) 作为私有管理看板与内部工具（Serverless / 脚本）的统一调度引擎。

## 💡 详细需求 (Requirements)

### 1. 核心系统架构
- **前端页面 (Public Site)**: 基于 Next.js (App Router) + Tailwind CSS 构建。必须实现全站秒开、SEO 友好，支持 Dark/Light 模式切换。
- **后台管理 (Admin Backend)**: 采用 Payload CMS 3.0，安全隐蔽（如 `/admin`），供博主进行内容管理、评论审核和工具启停。
- **数据库 (Database)**: Supabase PostgreSQL + Drizzle ORM，确保 100% 数据主权。
- **部署方案 (Deployment)**: Vercel 用于全站边缘网络托管，并配置自动化 CI/CD。

### 2. 核心功能模块 (Features)
- **内容聚合 (Content Management)**
  - 博客模块 (Blogs)：支持 Markdown/Rich Text 编辑，分类标签，阅读量统计。
  - 项目展示 (Projects)：作品集陈列、外链与技术栈标签。
- **互动系统 (Interactions)**
  - 评论系统：自定义 Comments Collection。
  - 防 Spam 机制（三层防护）：Honeypot 隐藏字段拦截、同 IP 频率限制、Cloudflare Turnstile 验证。
  - 评论审核流程：提交后默认 Pending，管理员后台变更为 Approved 后前端展示。
- **动态工具沙盒 (Tools Engine)**
  - 后台统筹外部 API 或 Serverless 脚本，管理员可随时切换某工具的“公开/私有”状态与权限。

---

## 📈 开发进度与排期 (Progress & Roadmap)

### ✅ Phase 1: 基础设施搭建 (Done)
- [x] 初始化 Next.js 项目并集成 Payload CMS 3.0。
- [x] 配置 Supabase Postgres 数据库连接。
- [x] 确立本地开发环境与 `.env` 配置标准。

### ✅ Phase 2: 后端集合与业务逻辑 (Done)
- [x] 建立 Users 管理员体系。
- [x] 创建 Blogs 与 Projects 的 CMS Collection 结构。
- [x] 评论系统 (Comments) 数据库设计及 API 开发。
- [x] 评论系统三层防 Spam 机制研发与测试 (Turnstile, IP限流, Honeypot)。

### ✅ Phase 3: 自动化与部署配置 (Done)
- [x] 配置 `vercel.json` 及自动化构建指令。
- [x] 完成线上 Vercel 生产环境的基础集成测试。
- [x] 编写 `CHANGELOG.md` 及 `AI_DEPLOY.md`。

### ✅ Phase 4: 前端 UI/UX 深度开发 (Done — v0.7.0 ~ v0.9.1)
- [x] 首页 (Home) 完全重建：Hero（职位标题 + 状态 pill）、Tech Stack 网格、Latest Posts、Projects 空状态占位。
- [x] 博客列表页 UI 对接 Payload API，响应式 auto-fill 网格布局。
- [x] 博客详情页：Hero 图渐变、Breadcrumb、文章正文、评论区前端组件。
- [x] 评论区前端组件（CommentForm + CommentList）封装，Turnstile invisible captcha 对接。
- [x] 深色/浅色模式全局应用：`DESIGN.md` token 层，CSS 自定义属性，`.light` 类覆盖，全站无 `dark:` Tailwind 类依赖。
- [x] Geist 字体（`geist@1.7.0`）全站落地，`--font-geist-sans` / `--font-geist-mono` 变量注入。
- [x] About 页面完全重构：DB & Integration 专业技能栈，竖向时间线，pill 外链，accent CTA。
- [x] BlogCard / Sidebar 全面重写，消除 zinc 类，改用 CSS token 变量。

### ✅ Phase 5 (Partial): i18n 双语支持 (Done — v0.8.0)
- [x] `next-intl` v4.9.0 接入，`[locale]` 子路径路由（`/en` / `/zh`）。
- [x] Payload CMS 字段级本地化（`title`、`excerpt`、`content` 标记 `localized: true`）。
- [x] TypeScript 类型安全（`IntlMessages` 全局声明）。
- [x] Zombie key 检测脚本（`npm run i18n:check`）。
- [x] Navbar 语言切换按钮。

### 🔄 Phase 6: 内容填充与生产验收 (In Progress)
- [x] **Vercel Speed Insights 接入** — `@vercel/speed-insights@2.0.0`，`<SpeedInsights />` 注入 layout ✅ v0.9.2
- [x] **Turnstile keys 配置** — `.env.example` 新建，`.env.local` 写入 sitekey + secret，Vercel 需手动添加 ✅ v0.9.2
- [x] **生产环境 3 项 bug 修复** — proxy 重命名、locale 查询 try/catch、about generateStaticParams ✅ v0.9.2
- [x] **修复 RSC 序列化错误** — `next-intl` `t.rich()` 参数格式修复，解决首页与 About 页面的 HTTP 500 报错 ✅ v0.9.4
- [x] **生产数据库 Schema 同步** — 本地执行 `DATABASE_URI="..." npx payload migrate` 完成表结构同步。
- [x] **测试数据填充 (Seed)** — 编写并执行 `scripts/seed.ts`，创建 3 篇中英双语博客数据，验证前端数据渲染连通性。
- [x] **OpenClaw v0.9.2 验收指令已生成** — 待执行
- [x] **HTTP 500 修复（首页 + About）** — `t.rich()` 消息格式从 `{var}` 改为 `<tag>` XML 标签 ✅ v0.9.4
- [x] **重复 const 声明修复** — 远程热修 commit 引入的 duplicate `const tCommon` ✅ v0.9.4
- [x] **OpenClaw v0.9.4 验收全线通过** — 6/6 URL 返回 200，无 500 阻断 ✅
- [ ] **🔴 运行 `npx payload migrate`（本地 + 生产 DATABASE_URI）** — `blogs_locales` 表缺失，双语博客 / Latest Posts 锁死
- [ ] 在 Vercel 添加 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` 环境变量
- [ ] 在 `/admin` 发布第一篇双语博客，验证 `/en/blog` 与 `/zh/blog` 数据隔离
- [ ] 在 `/admin` 创建首批项目条目，验证首页 Projects 区块渲染
- [ ] 端对端评论提交测试（含 Turnstile 验证流程）

### ⏳ Phase 7: 细节打磨 (Pending)
- [ ] `TagBadge` / `CategoryBadge` 组件样式对齐设计 token（消除残留 zinc 类）。
- [ ] `LexicalRenderer` prose 排版对齐 Geist 字体 + 设计 token。
- [ ] `CommandPalette` 弹窗样式适配新设计系统。
- [ ] OpenClaw 对 v0.9.1 进行自动化验收。

### ⏳ Phase 8: 动态工具引擎 (Pending)
- [ ] 设计 Tools Collection（配置 API Endpoint、鉴权规则等）。
- [ ] 前端渲染公开可用的”在线工具”列表（Tools 目录）。
- [ ] 核心内部工具迁移至该引擎（如有）。

### ⏳ Phase 9: SEO 与性能优化 (Pending)
- [ ] 配置动态 Sitemap 与 Robots.txt。
- [ ] Metadata / OpenGraph 标签全局自动注入。
- [ ] 性能审计（Lighthouse 全绿目标）。

---

## 📋 技术债清单 (Tech Debt)

| 项目 | 优先级 | 说明 |
|------|--------|------|
| ~~`blogs_locales` DB 迁移~~ | ~~🔴 高~~ | ~~✅ 已修复 (2026-04-08)~~ |
| ~~Vercel 添加 Turnstile env vars~~ | ~~🔴 高~~ | ~~✅ 已配置~~ |
| ~~middleware → proxy 重命名~~ | ~~🔴 高~~ | ~~✅ 已修复 v0.9.2~~ |
| ~~locale 查询 500 崩溃~~ | ~~🔴 高~~ | ~~✅ 已修复 v0.9.2~~ |
| ~~t.rich() XML 格式问题~~ | ~~🔴 高~~ | ~~✅ 已修复 v0.9.4 — 首页/About 500 根本原因~~ |
| ~~TagBadge 样式深色对比度~~ | ~~🟡 中~~ | ~~✅ 已修复深色背景文字可读性~~ |
| LexicalRenderer prose | 🟡 中 | 文章正文排版未使用 Geist + token |
| CommandPalette 样式 | 🟡 中 | 搜索弹窗未适配新设计系统 |

---
*注：本文件将作为项目的唯一核心规划源（Single Source of Truth），随项目迭代持续更新状态。*
*最后更新：2026-04-08 (v0.9.4 验收通过)*