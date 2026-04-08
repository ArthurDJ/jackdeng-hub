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

### 🔄 Phase 4: 前端 UI/UX 深度开发 (In Progress)
- [ ] 首页 (Home) 个人品牌展示模块重构与动画打磨。
- [ ] 博客列表页与文章详情页 UI 渲染（对接 Payload API）。
- [ ] 评论区前端组件封装与 Turnstile 验证码前端对接。
- [ ] 深色/浅色模式 (Dark/Light Mode) 全局应用。

### ⏳ Phase 5: 动态工具引擎 (Pending)
- [ ] 设计 Tools Collection（配置 API Endpoint、鉴权规则等）。
- [ ] 前端渲染公开可用的“在线工具”列表（Tools 目录）。
- [ ] 核心内部工具迁移至该引擎（如有）。

### ⏳ Phase 6: SEO 与性能优化 (Pending)
- [ ] 配置动态 Sitemap 与 Robots.txt。
- [ ] Metadata / OpenGraph 标签全局自动注入。
- [ ] 性能审计（Lighthouse 全绿目标）。

---
*注：本文件将作为项目的唯一核心规划源（Single Source of Truth），随项目迭代持续更新状态。*