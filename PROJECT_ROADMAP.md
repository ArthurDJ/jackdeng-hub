# Jack Deng's Personal Hub - 需求与进度规划 (Roadmap)

## 🎯 项目愿景 (Vision)
打造一个极致优化、面向公众的个人数字名片，同时后端集成无头 CMS (Payload CMS) 作为私有管理看板与内部工具（Serverless / 脚本）的统一调度引擎。

## 💡 详细需求 (Requirements)

### 1. 核心系统架构
- **前端页面 (Public Site)**: 基于 Next.js (App Router) + Tailwind CSS 构建。必须实现全站秒开、SEO 友好，支持 Dark/Light 模式切换。
- **后台管理 (Admin Backend)**: 采用 Payload CMS 3.0，安全隐蔽（如 `/admin`），供博主进行内容管理、评论审核和工具启停。
- **数据库 (Database)**: Supabase PostgreSQL + Drizzle ORM，确保 100% 数据主权。
- **部署方案 (Deployment)**: Vercel 用于全站边缘网络托管，并配置自动化 CI/CD。

---

## 📈 开发进度与排期 (Progress & Roadmap)

### ✅ Phase 1 - 5 (Infrastructure, Backend, i18n)
*已完成基础搭建、Payload CMS 集成、防 Spam 机制、双语支持 (v0.8.0) 及全站 Geist 字体落地。详情请参考 `CHANGELOG.md`。*

### 🔄 Phase 6: 内容填充与生产验收 (In Progress)
- [x] **Vercel Speed Insights 接入** ✅
- [x] **生产环境 500 错误深度排查与修复** (t.rich XML 格式 & users.name 迁移) ✅
- [x] **测试数据填充 (Seed)** — 验证前端双语渲染连通性 ✅
- [x] **内容发布**: 在 `/admin` 发布第一篇正式双语博客，验证数据隔离。 ✅
- [x] **项目集**: 创建首批项目条目，验证首页 Projects 区块。 ✅
- [x] **评论验收**: 端对端评论提交测试（含 Turnstile 流程）。 ✅

### 🔄 Phase 7: v1.0 细节打磨冲刺 (Week 1-3)

> 基于 Claude 审计计划 `zany-floating-engelbart.md` 整合，作为当前最高优先级的执行文档。

**P0 — 视觉一致性与基础设施（Week 1 - 已完成）**
- [x] **CategoryBadge**: 消除 zinc 类，改用 CSS token ✅
- [x] **Blog 子页统一**: `archive/category/tag` 视觉对齐，补全 i18n footer ✅
- [x] **排版系统**: 实现 `.prose-ds` utility，通过 CSS 变量深度接管 Lexical 渲染样式 ✅
- [x] **自定义 404**: 完成 `[locale]/not-found.tsx` 全设计系统适配 ✅
- [x] **CommandPalette**: Token 迁移 + 搜索 Locale 感知 ✅

**P1 — 专业感与 SEO 功能（Week 2 - 完成）**
- [x] **SEO 核心**: `sitemap.ts` (动态查询, 24h revalidate) + `robots.ts` + `canonical/hreflang` 注入 ✅
- [x] **结构化数据**: 注入 JSON-LD `BlogPosting` 与 `BreadcrumbList` schema ✅
- [x] **阅读体验**: `readingTime.ts` 实现 + 博客卡片/详情页时长展示 ✅
- [x] **博客分页**: `Pagination.tsx` 组件封装 + Payload 翻页逻辑对接 ✅
- [x] **日期标准化**: 全站 `formatDate` locale 感知重构 ✅

**P2 — 品质提升与收尾（Week 3 - 进行中）**
- [x] **Footer 统一**: 封装全局 `Footer.tsx` 组件，替换首页/About/blog layout/blog detail 四处冗余代码 ✅
- [x] **布局抽象**: 封装 `.ds-container` / `.ds-section-padding` / `.ds-pagination-item` Utility 类 ✅
- [x] **Pagination 覆盖**: category/tag 页面同步接入分页，统一 12 条/页 ✅
- [x] **Hover 补全**: Pagination 等交互组件补全 hover 态（`.ds-pagination-item` CSS 伪类） ✅
- [x] **JSON-LD 补完**: BlogPosting 补充 `mainEntityOfPage` 声明 ✅
- [x] **相关文章**: 博客详情页下方展示 2-3 篇同分类推荐。 ✅
- [x] **环境清理**: 确认 `.gitignore` 生效，移除残留的未追踪日志与临时文件。 ✅
- [x] **Admin UI 优化**: 合并 Header 设置面板 (AdminHeaderSettings)，修复 /admin/account 路由未找到问题。 ✅

### 🔄 Phase 8: 动态工具引擎 (骨架完成，等待内容)
- [x] 设计 Tools Collection（toolType / accessControl / status / embedUrl / embedType 等字段）✅
- [x] 前端渲染公开可用的"在线工具"列表（`/tools` 目录 + `/tools/[slug]` 详情）✅
- [x] Tools 页面接入 next-intl（v1.6.3）✅
- [x] sitemap 覆盖 tools 路由，过滤条件与列表页一致（v1.6.3）✅
- [ ] **决定第一个真实工具做什么** — 当前 `/tools` 线上显示"暂无可用工具"，引擎跑空。
- [ ] ~~工具运行前的确认弹窗接入 `ConfirmDialog`~~ — **暂时无处可接**：现在的 automation 架构是工具往站里推（`POST /api/tools/[slug]/callback`，`x-cron-secret` 鉴权），站内没有"运行"触发入口，面板是纯只读的。要接确认弹窗得先设计出站方向的触发通道。
- [x] Automation 面板本地化 + 隐形登录按钮修复（v1.9.1）✅

### ✅ Phase 9: 骨架完善 (v1.6.2 – v1.8.1)
- [x] **生产故障修复 (v1.6.2)**：根级路由 307→404、`/tools` 事件处理器 500、标题重复后缀、站点图标缺失 ✅
- [x] **Tools i18n + 零散本地化 (v1.6.3)**：`tools` namespace、STATUS_BADGE 中英混排 bug、about 标题、首页 TECH STACK ✅
- [x] **弹窗与 toast 层 (v1.7.0)**：自建 `ConfirmDialog`（原生 `<dialog>`）+ sonner；CommentForm / ShareButtons 迁移 ✅
- [x] **韧性与可达性 (v1.8.0)**：`error.tsx` / `global-error.tsx` 错误边界、三个列表页 loading 骨架、跳转链接 ✅
- [x] **依赖安全升级 (v1.8.1)** — 本地验证后已合并：`npm ci` 干净（31 条 → 5 条 moderate，全为构建期工具链）、`next build` 通过、`/en` `/zh/tools` `/en/blog` `/admin` 与根级 SEO 路由均正常、前台无 console error ✅
- [x] **根布局嵌套修复 (v1.9.0)** — 删除 `src/app/layout.tsx`，消除全站双层 `<html>/<body>` 与 `/admin` 的 hydration error ✅
- [x] **博客 main landmark 补全 (v1.9.0)** — `blog/page.tsx` 与 `blog/[slug]/page.tsx` 补 `<main id="main">`，跳转链接不再跳空 ✅

---

## 📋 技术债清单 (Tech Debt)

| 项目 | 优先级 | 状态 | 说明 |
|------|--------|------|------|
| Git PAT 安全性 | 🔴 高 | ✅ 已修复 | 已从 Remote URL 移除明文 Token，改用 Keychain 管理。 |
| t.rich() XML 格式 | 🔴 高 | ✅ 已修复 | 解决首页/About 500 报错。 |
| users.name 迁移 | 🔴 高 | ✅ 已修复 | 解决 Admin 登录 500 报错。 |
| `.gitignore` 漏点 | 🟡 中 | ✅ 已修复 | 已排除 `.log`, `.claude/` 等干扰项。 |
| 搜索 Locale 硬编码 | 🟡 中 | ✅ 已修复 | 现在搜索结果能正确返回当前语言内容。 |
| 分页硬限制 | 🟡 中 | ✅ 已修复 | Pagination.tsx + Payload page 参数对接。 |
| 根级路由被 middleware 拦截 | 🔴 高 | ✅ 已修复 (v1.6.2) | `/robots.txt` `/sitemap.xml` `/feed.xml` `/og` 线上全是 307→404，SEO 与社交预览长期失效。proxy.ts matcher 修正。 |
| `/tools` Server Component 事件处理器 | 🔴 高 | ✅ 已修复 (v1.6.2) | 发布任意工具即 500，改用 `.ds-card-hover`。 |
| 标题重复品牌后缀 | 🟡 中 | ✅ 已修复 (v1.6.2) | 6 处页面手动拼接 + layout template 叠加。 |
| 站点图标缺失 | 🟡 中 | ✅ 已修复 (v1.6.2) | 新增 icon.svg / favicon.ico / apple-icon.png。 |
| 依赖安全（Next.js / Payload / sharp） | 🔴 高 | ✅ 已修复 (v1.8.1) | **之前这条的评估严重低估**：原文只盯 2026-08-25 August Security Release 的两个 Critical RCE，并据此判断可推迟。实际 `npm audit` 报 **31 条公告，2 条 critical、13 条 high**。与本站直接相关的包括多条 App Router 的 **Middleware / Proxy bypass**（CVSS 7.5–8.1，`src/proxy.ts` 正是 next-intl middleware）、**SSRF via WebSocket upgrades**（8.6），以及 Payload 的「已认证用户可重置他人账号锁定」越权。已升 next 16.3.5 / payload 3.89.0 / sharp 0.35.4 + dompurify override，降到 5 条（全为构建期工具链，无上游修复，不进生产运行时）。**注意：Payload 子包 peer-depend 精确版本，必须锁步且需删 lockfile 重新解析。** |
| 跳转链接交互未验证 | 🟡 中 | ⚠️ 待人工确认 | v1.8.0 的 `.ds-skip-link` 生产 CSS 已静态核对正确（基础规则在前、`:focus` 覆盖在后），但**浏览器面板的合成 Tab 不驱动真实焦点导航**，无法自动验证。需人工按一次 Tab。 |
| 根布局嵌套 `<html>/<body>` | 🔴 高 | ✅ 已修复 (v1.9.0) | `src/app/layout.tsx` 与 `[locale]/layout.tsx`、`(payload)/layout.tsx` 各自输出一套 `<html><body>`，线上每个响应都是非法 HTML，外层 `<html>` 无 `lang`，`/admin` 控制台 5 条 hydration error。删除根布局，改用 Next 的 multiple root layouts。 |
| 博客页缺 `<main>` landmark | 🟡 中 | ✅ 已修复 (v1.9.0) | v1.8.0 的跳转链接指向 `#main`，但 `blog/page.tsx` 与 `blog/[slug]/page.tsx` 两个最重要的页面没有这个元素，跳转跳空。 |
| 内容真空 | 🔴 高 | ⬜ 待处理 | 博客 0 篇、工具 0 个；侧边栏分类与标签计数全为 0。 |
| Tools 页面未接 i18n | 🟡 中 | ✅ 已修复 (v1.6.3) | `isZh ?` 硬编码三元、用 `next/link` 手拼 locale 前缀、无 `tools` i18n namespace。 |
| sitemap 漏 tools 路由 | 🟡 中 | ✅ 已修复 (v1.6.3) | `/tools` 与 `/tools/[slug]` 未进 sitemap。 |
| 首页 TECH STACK 英文硬编码 | 🟢 低 | ✅ 已修复 (v1.6.3) | `TECH_STACK` 的 description 未 localized，中文页显示英文。 |
| Automation 面板未接 i18n | 🟡 中 | ✅ 已修复 (v1.9.1) | `VisaMonitorDashboard` 整个硬编码中文（状态、metadata 标签、相对时间、`toLocaleString('zh-CN')`），英文访客看到一屏中文。新增 `tools.dashboard` namespace。 |
| `var(--accent)` 不存在 | 🟡 中 | ✅ 已修复 (v1.9.1) | Automation 面板未登录态的登录按钮用了未定义的 token，白字落在透明底上，按钮实际隐形。改 `var(--accent-primary)`。 |
| Payload admin 图标 404 | 🟢 低 | ✅ 已修复 (v1.9.1) | `admin.meta.icons` 指向不存在的 `/favicon.svg`，改指 `/icon.svg`。 |
| 工具面板两套登录混用 | 🟡 中 | ✅ 已修复 (#20) | 面板改读 `/api/users/me`，与它拉的 `/api/tool-runs` 用同一套 Payload session。**没有桥接两套鉴权，而是删掉一套** —— next-auth 全站只有这一个消费者，故连同路由、依赖（+14 个传递依赖）、3 个环境变量一并移除；`VisaMonitorPanel.tsx`（186 行死代码，无引用）同时删除。顺带修掉静默失败：原先 403 被 `data.docs ?? []` 加空 `catch {}` 吞光，渲染成空面板，与「从没跑过」无法区分。**注意受众变化**：原 next-auth 白名单只放行 1 个 Google 账号，现为任意 Payload 用户（当前 2 个）；但 `ToolRuns.access.read` 本就是 `Boolean(req.user)`，所以这是 UI 与既有 API 策略对齐，不是扩权。要真限制到 1 人，改 `ToolRuns.access.read`。**未验**：登录后的面板渲染 —— `visa-checker` 是 offline+private，页面 404，要可见须写生产库。 |
| 运维脚本 env 加载失效 | 🔴 高 | ✅ 已修复 (#16) | `scripts/` 下 3 个脚本把 `dotenvConfig()` 写成模块体语句，而 ESM 先求值所有静态 import，于是 `src/payload.config.ts` 早已读过空的 `DATABASE_URI`，adapter 回落 localhost:5432，裸跑必 `ECONNREFUSED`。改为顶部加载 env + 函数内动态 `await import` config。另：`reset-media-and-apply.ts` 其实没被 hoisting 坑到（`import 'dotenv/config'` 按书写顺序求值），真正缺的是 `.env.local`；`src/scripts/` 下 3 个纯 pg 脚本则是压根没有 dotenv，成因不同、症状相同。 |
| 写库脚本无生产防护 | 🔴 高 | ✅ 已修复 (#17) | #16 修好 env 加载的副作用是**拆掉了一个意外的保险丝** —— 此前这些脚本连不上 localhost 就死，等于误执行被动挡下。新增 `scripts/lib/env.ts`：`loadEnv()` 收敛十份重复前导块，`requireApply()` 在 `DATABASE_URI` 指向 Supabase 时拒绝执行，除非显式 `--apply`。是**拒绝执行而非 dry-run**，不改任何脚本内部逻辑。`purge-test-media.ts` 保留自己更严的 dry-run 门禁。 |
| 无 CI 闸门 | 🔴 高 | ✅ 已修复 (#18) | #16/#17 两个 PR 全程零自动检查，`tsc --noEmit` 全靠手动跑，`main` 也无分支保护。新增 `.github/workflows/ci.yml` 跑 `npm ci` + `npm run typecheck`，并开启分支保护（required check = `typecheck`，不强制 review，`enforce_admins: false` 保留直推）。**刻意不跑 `next build`**：Payload 在 config 求值时读 `DATABASE_URI`，CI 跑 build 就得把生产库凭据放进 repository secrets；Vercel preview 本就跑完整 build 且未关类型检查，它唯一不做的是拦合并。闸门已端到端实测（绿→红→绿）。**未做**：eslint，97 个既有文件从零加 lint 应是独立 PR。 |
| Media 读权限全开 | 🔴 高 | ✅ 已修复 (#19) | `Media.access.read` 是 `() => true`，匿名即可 `GET /api/media` 枚举整个媒体库（文件名、alt、mime、尺寸、CDN URL）。`purge-test-media.ts` 文件头早已点破，当时只清了图没堵口子。因 `media` 表为 0 条而潜伏，但填内容必然上传真实图片 —— 故排在内容之前修。改为 `Boolean(req.user)`。**边界要说清**：只堵匿名枚举清单，**不使文件私有** —— `disablePayloadAccessControl: true` 让图片走 Vercel Blob 公开 CDN，知道 URL 即可直取；要文件也私有须去掉该选项并牺牲 CDN。 |
| 遗留测试媒体 | 🟢 低 | ✅ 已修复 (v1.9.2) | 经确认后清空：10 条 `test-image-N.jpg` media 记录（`GET /api/media` 现返回 `totalDocs: 0`）、`public/test-images/` 12 个文件、`public/media/` 里 commit 94dff63 留下的 30 个孤儿文件。`public/media/` 目录保留并加进 `.gitignore`。工具见 `scripts/purge-test-media.ts`（默认 dry run，删前反查引用）。 |

---
*注：本文件为单一事实来源 (SSOT)。每次重大更新需同步更新本 Roadmap。*
*最后更新：2026-09-14 (#20 移除 next-auth，面板统一 Payload session；#19 Media 读权限收口；#18 CI 闸门与分支保护；#17 写库脚本生产守卫；#16 运维脚本 env 加载修复)*
