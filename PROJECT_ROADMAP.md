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
- [x] **第一个真实工具：落沙（#31）** — 站内 builtin 组件，纯客户端元胞自动机。引擎不再跑空 ✅
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

### ✅ Phase 10: 内容上线 (2026-09-22)
- [x] **首批 4 篇双语文章发布** — 中英各一份正文，非 fallback。feed 4 条、8 个详情页全 200 ✅
- [x] **修复静态渲染读请求头** — 第一次发布触发全站文章页 500，回滚 → 定位 → 修复 → 重发（#26）✅
- [x] **分类名多语言** — `categories_locales` 零停机迁移，中文站不再显示英文分类名（#27）✅
- [x] **部署后冒烟检查** — 补上 CI 拦不住请求期错误的缺口（#27）✅
- [x] **旧列清理** — `20260922_000002` DROP 掉 `categories.name` / `.description`（#29）✅
- [x] **sitemap 收录文章** — 部署后已刷新，41 条 loc 含 4 篇文章 ✅

### ✅ Phase 11: 工具引擎跑通 (2026-09-22)
- [x] **builtin 分支补齐** — `embedType: 'builtin'` 此前是死选项，选它只渲染 🚧（#31）✅
- [x] **按 slug 注册表** — 取代 `isAutomation ? <VisaMonitorDashboard/>`，第二个自动化工具不再渲染出签证面板（#31）✅
- [x] **Tools 字段本地化** — `name` / `description` 加 `localized: true` + `tools_locales` 迁移（#31）✅
- [x] **落沙工具** — 沙/水/石/橡皮、笔刷、暂停、清空；尊重 `prefers-reduced-motion`（#31）✅
- [x] **旧列清理** — `20260922_000004` DROP 掉 `tools.name` / `.description`（#32）✅
- [x] **生命游戏作为第二个模式（#35）** — 与落沙共用画布，规则抽成 `src/lib/life.ts` 纯函数并单测 ✅
- [x] **visa-checker 删除（#33）** — 代码与数据一并清除，通用入站管道保留 ✅
- [ ] **出站触发通道** — 仍未设计。现在没有任何自动化工具在跑，优先级随之下降。

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
| 内容真空 | 🔴 高 | ✅ 已修复 (#22/#26) | 首批 4 篇已于 2026-09-22 发布上线，**中英双语各一份正文** —— 站上第一批真正双语的内容。发布分两次：第一次 4 篇全发，8 个详情页全部 500（见下一行），回滚后修掉再按「先发 1 篇验证 → 再发剩余 3 篇」的顺序重发。侧边栏计数、feed 已自动跟上；sitemap 因 `revalidate = 86400` 滞后，下次部署即刷新。工具仍为 0，`visa-checker` 是 offline + private，本轮未处理。 |
| 阅读时长恒为 1 分钟 | 🟡 中 | ✅ 已修复 (#23) | `readingTime` 从 Lexical 文档顶层开始遍历，而内容在 `root` 里，遍历返回 0，`Math.max(1, 0)` 让**每一篇**文章都显示「1 min read」。第二个 bug 只在有中文内容时显形：按 `/\s+/` 切词，1,454 字的中文被数成约 170 词，又是 1 分钟。现在 CJK 按 400 字/分单独计数，切词前先剥离，两个分数相加后再取整。**两个都先于本次工作存在**，一直没被发现是因为 `blogs = 0`；发现方式是起 dev server 用眼睛看。对照：同目录的 `extractHeadings.ts:35` 写的是 `content?.root?.children`，它处理对了。 |
| 零测试 | 🔴 高 | ✅ 已修复 (#24) | **原评估为 🟡 并判断「不如 CI 闸门紧急」，#23 推翻了这个判断** —— 闸门拦得住类型错误，拦不住「函数看着对但算出来是 0」。引入 vitest + `npm test`，接进现有 CI job（纯函数，不碰数据库和浏览器，无需 secrets，required check 名字不变）。30 个测试覆盖 `readingTime`、`extractHeadings`、`formatDate` 以及从 `publish-drafts.ts` 抽出的 `scripts/lib/markdown.ts`。**每条断言都靠「把被测代码改坏、确认变红」验证过**：还原 root 下钻 → 5 红，移除 CJK 分支 → 1 红，去掉链接 token → 2 红。刻意不做组件测试、e2e、覆盖率指标与 eslint。 |
| 发文流程无工具 | 🟢 低 | ✅ 已修复 (#22) | `scripts/publish-drafts.ts`：markdown 转 Lexical、上传题图、双语写入、幂等（已存在的文章只更新正文，保留 `/admin` 里改过的标题与封面）。两个曾进生产库的解析缺陷已有测试盯着：链接存成字面量括号语法、无序列表被压成一个跑马句段落。另有 `BLOB_READ_WRITE_TOKEN` 防护 —— 缺 token 时跳过上传而不是写出一条指向本机文件的 media 记录，那个错误犯过一次，事后删了两条坏记录。 |
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
| 软 404（不存在的 slug 返回 200） | 🔴 高 | ✅ 已修复 (#34) | 线上任何编造的文章/工具/分类/标签/项目 slug 都返回 **HTTP 200** 配 404 页面 —— 搜索引擎会把它们当有效页面收录。**根因不在 404 逻辑，在 `loading.tsx`**：v1.8.0 给 blog / tools / projects 三个列表页加骨架时，`loading.tsx` 的作用域是整个子树，于是 `[slug]`、`category/[slug]`、`tag/[slug]` 也被罩进 Suspense 边界；一旦流式输出，**HTTP 状态随首个数据块就提交为 200**，之后 `notFound()` 才执行，404 的 UI 照常送达但状态码已定死。定位靠逐步逼近：最小页面 404 正常 → 加动态段/ISR/Payload 查询/getTranslations/generateMetadata 逐个排除 → 真实页面的**逐字复制品**却是 404 → 差异只剩目录里那个 `loading.tsx` → 给复制品旁边放一个，立刻变 200。修法是把三个列表页连同各自的 `loading.tsx` 移进路由组 `(list)`（不改 URL），边界只罩列表页本身；`archive` 不调 `notFound()`，单独补一个 loading 保留它原有的骨架。**受影响的恰好是全部 5 个调用 `notFound()` 的页面**。 |
| `projects/[slug]` 全站唯一的 force-dynamic | 🟢 低 | ✅ 已修复 (#38) | v1.3.1 为修一个 `DYNAMIC_SERVER_USAGE` 500 把它改成 `force-dynamic` + `revalidate = 0`，当时的诊断是「项目在 build 之后才 seed，`generateStaticParams` 返回 0 条路径」。**那个诊断是错的**：真正的原因和 #26 是同一个 —— layout 里的 `getMessages()` 读请求头，静态路由上就炸。`force-dynamic` 只是让这一条路由绕开了它，#26 的 `setRequestLocale` 才是真修复。代价是每个请求打 3 次库（metadata、页面、相关项目各一次），而列表页早就是 `revalidate = 3600`。现对齐 blog 详情页：ISR 1h + `generateStaticParams`，metadata 与页面的查询用 React `cache()` 合并成一次。**三次本地 `next build && next start` 验证**：① 正常构建 10 条路径预渲染，真实 slug 全 200 `HIT`、编造 slug 404；② 让 `generateStaticParams` 返回空（复现 4 月的「build 后才有数据」）→ 真实 slug 首次 200 `MISS`、再次 `HIT`；③ 在 ② 基础上注释掉 layout 的 `setRequestLocale` → 立刻 500 `DYNAMIC_SERVER_USAGE`，4 月的现象原样重现。**取舍**：后台改项目最多 1h 后才上线，与博客一致；没有接按需 revalidate。 |
| 页面查询全是 `as any` | 🟡 中 | ✅ 已修复 (#40) | `src/` 里 83 处 `as any`，几乎都在页面查询上。**但类型本来就在**：`payload-types.ts` 里有 `declare module 'payload'`，`payload.find()` 返回的就是 `Blog` / `Project` / `Tool`，是页面自己把它扔掉的。去掉强转后只报了 18 个错误，归成四类：关系字段 `number \| Doc` 没收窄（新增 `populated()` / `populatedList()`，替掉 6 份复制的 `Array.isArray + typeof` 过滤）；`locale` 是 `string`（新增 `asLocale()`，用检查代替强转）；BlogCard / Sidebar 各自定义了一套 `id: string` 的 Tag/Category，而 Payload 的 id 是 `number`；CommentList / CommentForm 的 `postId: string` 实际一直收到的是数字（#36 的服务端也按数字校验）。**还有一种没写 `as any` 也在丢类型的写法**：`.catch(() => ({ docs: [] }))` —— `strict: false` 下字面量 `[]` 是 `any[]`，和真实结果取并集后每个文档都退化成 `any`，全站 10 处。收成泛型 `orEmpty()`，空数组在泛型里被推断成 `T[]`。编译器在 `strict: false` 下对「数组是 any 所以回调参数也是 any」一声不吭，所以另写了一个探针用 TypeScript API 逐个检查声明的类型，在 archive 页抓到最后一处。83 → 16，剩下的：`projects/[slug]` 10 处（等 #38 合并，那个 PR 重写了这个文件），其余是 Lexical 节点树、插件配置、scripts，性质不同。**零行为变化的证明**：main 与本分支各做一次生产构建，抓 14 个页面，提取可见文本、href/src/alt、meta 比对 —— 12 页一字不差，工具页内容集合相同但 metadata 流式输出的位置不同，archive 见下一行。**未做**：eslint（剩下的 16 处不值得为它上规则集）；`strict: true`。 |
| 英文归档页显示中文标题 | 🟡 中 | ✅ 已修复 (#40) | `blog/archive` 的查询**没传 `locale`**，Payload 回落到 `defaultLocale: zh`，英文站归档页 4 篇文章的标题全是中文（线上实测）。与 #27 分类名、#39 搜索同一类缺陷，第三次出现。是类型梳理时顺带发现的：给分组补上 `Blog[]` 类型时读到了那个查询。扫了全站所有 `payload.find()`，其余不带 locale 的只取 slug / `updatedAt` 或查不本地化的集合，不受影响。 |
| 文章页两处硬编码中英三元 | 🟢 低 | ✅ 已修复 (#40) | 相关文章标题 `locale === 'zh' ? '相关文章' : 'Related Posts'` 和目录的 `'目录' : 'On This Page'`（TableOfContents 靠一个 `locale` prop 自己判断）。改为 `blog.relatedPosts` / `blog.tableOfContents`，TableOfContents 改用 `useTranslations`，`locale` prop 随之删除。**`i18n:check` 拦不住这种写法** —— 它只核对两份 json 的键是否一致，不看组件里有没有绕开 json 的字符串。全站 grep `locale === 'zh' ?` 另有 3 处，都是把 locale 映射成 `toLocaleDateString` 的 BCP 47 代码，不是文案。 |
| 查询失败渲染成空列表 | 🔴 高 | ✅ 已修复 (#42) | 首页、博客列表、项目列表、sitemap 的查询都包着 `orEmpty()`（#40 之前是散落各处的 `.catch(() => ({ docs: [] }))`），数据库抖一下就渲染成「没有文章 / 没有项目」配 **HTTP 200**，冒烟检查只看状态码，照样全绿。**本地生产构建实测，影响面和预想的不一样**：构建表里只有 `blog/[slug]` 和 `sitemap.xml` 是 ISR，首页、`/blog`、`/projects` 都是 `ƒ` 动态路由（`cache-control: private, no-store`），空页面不会被缓存，只是每次请求都在静默出错。真正被缓存的是 sitemap：模拟 blogs / projects 查询失败，重验证生成的版本以 `HIT` 进缓存，URL 从 42 条掉到 33 条，文章和项目都是 0 条，线上会顶一整天（`revalidate = 86400`）。修法：首页、两个列表页、sitemap 去掉兜底，直接抛错；博客列表的 `buildSidebarData().catch(() => ({}))` 一并去掉（文章页本来就不兜底）。只有文章页的「相关文章」保留 `orEmpty()`，现在必须传上下文，失败时 `console.error`。**抛错后的实际效果**：sitemap 经过两轮失败的重验证仍是 42 条 `HIT`；首页返回 500 进 `error.tsx`；`/blog`、`/projects` 显示 `error.tsx`，**但状态码还是 200**，原因和 #34 相同：`(list)/loading.tsx` 的 Suspense 边界让状态码随骨架先提交。所以冒烟检查补了一条：body 里出现数字 `data-dgst` 就判失败（`BAILOUT_TO_CLIENT_SIDE_RENDERING` 这种非数字 digest 在正常页面上也有，要排除）。改过的冒烟脚本对本地服务跑过：正常时 14 条全过；模拟失败时首页、两个博客列表、项目列表全部判红，而改之前它们都是 200 空页面。首页那句「blogs_locales table may not exist yet」早已过时，已删。`projects/[slug]` 的「其他项目」原是内联 `.catch(() => ({ docs: [] }))`，等 #38 把页面改成 ISR 后，在 #43 换成了 `orEmpty()`（同样降级为空，失败时 `console.error`）。**未做（有意）**：相关文章、其他项目查询失败时，空区块会被缓存一个重验证周期，这是有意的取舍。 |
| 查询失败渲染成空列表 | 🔴 高 | ✅ 已修复 (#42) | 首页、博客列表、项目列表、sitemap 的查询都包着 `orEmpty()`（#40 之前是散落各处的 `.catch(() => ({ docs: [] }))`），数据库抖一下就渲染成「没有文章 / 没有项目」配 **HTTP 200**，冒烟检查只看状态码，照样全绿。**本地生产构建实测，影响面和预想的不一样**：构建表里只有 `blog/[slug]` 和 `sitemap.xml` 是 ISR，首页、`/blog`、`/projects` 都是 `ƒ` 动态路由（`cache-control: private, no-store`），空页面不会被缓存，只是每次请求都在静默出错。真正被缓存的是 sitemap：模拟 blogs / projects 查询失败，重验证生成的版本以 `HIT` 进缓存，URL 从 42 条掉到 33 条，文章和项目都是 0 条，线上会顶一整天（`revalidate = 86400`）。修法：首页、两个列表页、sitemap 去掉兜底，直接抛错；博客列表的 `buildSidebarData().catch(() => ({}))` 一并去掉（文章页本来就不兜底）。只有文章页的「相关文章」保留 `orEmpty()`，现在必须传上下文，失败时 `console.error`。**抛错后的实际效果**：sitemap 经过两轮失败的重验证仍是 42 条 `HIT`；首页返回 500 进 `error.tsx`；`/blog`、`/projects` 显示 `error.tsx`，**但状态码还是 200**，原因和 #34 相同：`(list)/loading.tsx` 的 Suspense 边界让状态码随骨架先提交。所以冒烟检查补了一条：body 里出现数字 `data-dgst` 就判失败（`BAILOUT_TO_CLIENT_SIDE_RENDERING` 这种非数字 digest 在正常页面上也有，要排除）。改过的冒烟脚本对本地服务跑过：正常时 14 条全过；模拟失败时首页、两个博客列表、项目列表全部判红，而改之前它们都是 200 空页面。首页那句「blogs_locales table may not exist yet」早已过时，已删。**未做**：`projects/[slug]` 的「其他项目」仍是内联 `.catch(() => ({ docs: [] }))`，#38 已把这个页面改成 ISR，另开 PR 换成 `orEmpty()`；相关文章失败时，空区块会被缓存一个重验证周期，这是有意的取舍。 |
| `projects/[slug]` 的 `as any` | 🟢 低 | ✅ 已修复 (#44) | #40 刻意留下的一块：当时 #38 正在重写这个文件。沿用 #40 的 `asLocale()` / `populated()`，`getProject()` 返回 `Project \| null`。9 → 4，剩下 4 处全在「其他项目」区块，它的内联 `.catch` 由另一项改动换成 `orEmpty()`（依赖 #42），换完即有类型，所以这里不碰，免得冲突。验证：本地构建对比线上 10 个项目页，除每次构建都会变的图标缓存哈希外完全一致。 |
| 搜索只查标题、从浏览器直打三个 REST 端点 | 🟡 中 | ✅ 已修复 (#39) | CommandPalette 每次输入（debounce 后）从客户端并发打 `/api/blogs`、`/api/categories`、`/api/tags`，只 `like` 标题和摘要：**正文搜不到，项目和工具根本不在搜索范围里**。动手时又发现分类和标签的查询**没传 `locale`**，Payload 回落到 `defaultLocale: zh`——英文站搜 `career` 找不到「Career & Thoughts」（线上实测 0 条，带 `locale=en` 则 1 条），命中的分类也显示中文名。现收成 `GET /api/search?q=&locale=`：整站公开内容按语言建成纯文本索引，`unstable_cache` 1h（与页面同一个窗口），**每次按键不碰数据库**；响应 `s-maxage=300` 让相同查询在 CDN 就被接住。过滤条件逐条对齐公开页面与 sitemap（local API 默认跳过访问控制，所以必须显式写）。匹配是纯函数 `src/lib/search.ts`：多词 AND、标题 > 摘要/标签 > 正文加权、只命中正文时显示命中处的片段；拉丁词按词首前缀匹配（`sand` 不再命中 thou**sand**s，`netsu` 仍能找到 NetSuite），CJK 按子串。19 个测试，**14 次改坏全部变红**（其中两次第一轮没红，是测试写得太巧，已改到会红）。**刻意没做**：限流（这条路径不查库，代价只是扫几百 KB 字符串）；关掉 `/api/blogs` 的匿名读（冒烟检查靠它取 slug）。**更正一处误判**：原以为结果链接不带 locale 会让中文站读者跳到 `/en`，线上实测不会——middleware 设了 `NEXT_LOCALE` cookie，307 跟着 cookie 走；实际代价是每次点击多一次 307，以及禁用 cookie 时按 Accept-Language 落地。仍改用 next-intl 的 router。 |
| `projects/[slug]` 最后两处 `any` | 🟢 低 | ✅ 已修复 (#45) | #43 把「其他项目」查询换成 `orEmpty()` 后区块有了类型，剩下查询里的 `locale as any` 和 `techStack` 回调的 `(t: any)`，一并收掉，文件清零。转译后的 JS 只差 `asLocale(locale)` 一处，layout 已挡掉非法 locale，行为不变。全站 `as any` 83 → 6，页面查询全部清零，剩下的是 Lexical 节点树、插件配置与一处注释。 |
| 开发模式直接改生产库表结构 | 🔴 高 | ✅ 已修复 (#46) | `.env.local` 指向**生产 Supabase**，而 Payload 的 Postgres 适配器在非 production 环境默认 `push: true` —— 启动时把集合定义直接同步成数据库结构。于是**每一次 `npm run dev`、每一个没设 `NODE_ENV=production` 的 tsx 脚本，都是对生产库的一次在线 DDL**，不经迁移、不经审查。发现过程：2026-09-23 用 tsx 读项目数据时输出了 `Pulling schema from database...`，`payload_migrations` 里 `batch = -1` 的 dev 记录随之更新（该记录 2026-04-04 就存在，说明此前已多次发生）。修法是显式 `push: false`；已验证：开发模式启动不再拉取 schema，dev 记录时间戳不再变化。**当天那次运行的影响**：按 OID 与 relfilenode 判断，没有新建任何表/索引/类型、没有重写任何表（全库最大 OID 25017 就是 09-22 迁移建的 `tools_locales`）；`SET NOT NULL` / 删默认值 / 删索引不留痕迹，无法百分之百排除，但所有可定时的偏差都落在 4–5 月同一批。 |
| 生产库结构与迁移文件不一致 | 🟡 中 | ⚠️ 未处理 | 上一行那个问题留下的历史偏差。起一次性 Postgres 只跑迁移，与生产库逐列比对：约束完全一致；**列有 7 处不同** —— `tools.tool_type` / `.embed_type` / `.last_run_status`、`tool_runs.status` 在生产是 Postgres 枚举、迁移建的是 `varchar`，`tool_runs.detail` 是 `varchar` vs `text`、`run_at` 生产没有 `now()` 默认值，`blogs.status` 生产多了 `NOT NULL`；**索引**生产多了 `projects.cover_image_id`、`tool_runs.created_at/updated_at`，少了 `tool_runs(run_at DESC)`；**枚举**生产多 4 个。按 OID 这些枚举与表重写都在 5 月 25 日迁移之前。影响：线上功能正常（生产结构就是代码期望的样子），但**用迁移新建的环境与生产不同**，以后 `payload migrate:create` 生成的迁移也会以错误的基线做差异。修法是写一条迁移把迁移链对齐到生产现状，需要在一次性库上彩排。 |
| 首页不能代替简历 | 🔴 高 | ✅ 已修复 (#47) | 站点目标之一是「访问时代替简历」，但从招聘方视角读下来首页做不到：首屏是「Building for the web」，没有名字、雇主、所在地；简历、邮箱、GitHub、LinkedIn 全在 /about 最底部；**「Get in touch」发往 `hello@jackdeng.cc`，而域名没有 MX 记录，邮件全部退信**（同页另一个 Email 链接又是 gmail）；Tech Stack 4 张卡里两张是「NS」「N」占位图标，当前工作的核心技术 Databricks/dbt/C#/React 一个都没有；头衔写 Senior，与简历不符。改版：首屏 名字 → 定位 → 两句现状 → Résumé/Email/GitHub/LinkedIn；区块顺序 经历 → 技能 → 精选项目 → 文章；联系方式、外链、技能、时间线收进 `src/lib/profile.ts` 供首页与 /about 共用。数据侧把 Databricks 平台置顶、Visa Monitor 取消置顶。**仍待本人处理**：经历上的正式职位名称（实际为 ERP Specialist）、Visa Monitor 在 /admin 删除、PG 工具集 GitHub 链接 404、简历 PDF 与站点内容对齐、`hello@` 的邮件转发。 |
| 首页每次请求都现场渲染 | 🟡 中 | ✅ 已修复 (#48) | 线上逐路由测 TTFB：文章/项目详情、About 走 ISR `HIT`（0.10–0.14s），**首页每次 `MISS`（0.5–1.0s）**，项目列表、工具列表、工具详情也每次 `MISS`——尽管都写了 `revalidate = 3600`。差别在 `generateStaticParams`：`[locale]/layout.tsx` 没声明 locale，没有自己参数的页面只能被标成 `ƒ`。layout 声明 `routing.locales`，工具详情只列公开工具。`next build && next start` 验证：11 个页面两次请求全 `HIT`，编造 slug 仍 404，日志无 `DYNAMIC_SERVER_USAGE`。**取舍**：首页从实时变为最多 1 小时的缓存窗口。博客列表/分类/标签/归档读 `searchParams`，仍动态，需改 URL 结构另做。 |
| 工具详情页不检查 `accessControl` | 🟡 中 | ✅ 已修复 (#50) | 查询只过滤 `status != offline`，注释称「权限在渲染层处理」，但渲染层并无检查；local API 默认跳过访问控制，所以 online 的**私有**工具凭 slug 人人可见。页面、`generateMetadata`、`generateStaticParams` 现在共用一个 `VISIBLE` 条件（非 offline 且 public）。**一次性 Postgres 实测**（公开上线 / 私有上线 / 公开维护 / 公开下线 四个工具）：修复前 `priv-online` 返回 **200**、标题就是私有工具名；修复后两种语言都 **404**、HTML 无其内容，其余三个行为不变且仍 `HIT`。**取舍**：私有工具对所有访客（含本人）一律 404，在 /admin 管理；要登录可见就得读会话，页面会退回动态渲染。 |
| 安全响应头几乎为零 | 🟡 中 | ✅ 已修复 (#49) | 生产唯一的安全头是 Vercel 自带的 HSTS，没有 `frame-ancestors` / `X-Frame-Options`，任何网站都能把 `/admin` 嵌进 iframe 做点击劫持。在 `next.config.mjs` 的 `headers()` 给所有响应加上 `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN`、`nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy`（关摄像头/麦克风/定位/topics）。验证：页面、admin、API、PDF、sitemap、静态 JS、404 全部 5/5；另一个源起测试页嵌入首页与 `/admin`，浏览器报 frame-ancestors 拦截；admin 登录页与落沙正常，控制台无 CSP 报错。**CSP 刻意只写 frame-ancestors**：完整策略要放行 Payload admin、Turnstile、Vercel 脚本，应先 report-only 观察。 |
| Tools 字段不支持多语言 | 🟡 中 | ✅ 已修复 (#31) | 与 Categories 同一个缺陷，**在隔壁集合里又犯了一次**，同样被空集合藏住 —— `Tools.name` / `.description` 是单列，用 `locale: 'zh'` 写第二个语言只是一次 UPDATE，直接把英文名覆盖掉。发现方式是把落沙工具建出来后，英文页标题显示成「落沙」。**还有另一半**：`/tools` 列表页、详情页、`generateMetadata` 三处查询压根没传 `locale`，所以即使字段本地化了也会回落到 defaultLocale（zh）—— Categories 当时没这问题，是因为那些页面本来就传了。两半都修掉。迁移沿用 categories 的加法两阶段，事务彩排后执行（batch 16）。 |
| builtin 工具无法渲染 | 🟡 中 | ✅ 已修复 (#31) | `embedType` 的选项里有「内置页面」，但详情页只处理 `iframe` / `script`，选 builtin 落到 🚧 占位。同时 `isAutomation ? <VisaMonitorDashboard/>` 让**任意**自动化工具都渲染签证面板 —— 组件名就是那个工具的名字。两者都是声明与实现不一致，都因为 `tools` 长期为空而没被发现。改为按 slug 的组件注册表，未注册的 slug 仍落到占位（那是诚实的结果：记录在但页面没写）。 |
| 静态渲染读请求头 | 🔴 高 | ✅ 已修复 (#26) | 发布首批文章后**每个详情页都 500**，`digest: DYNAMIC_SERVER_USAGE`。`[locale]/layout.tsx` 调 `getMessages()` 时不带 locale，next-intl 只能去读请求头 —— 而 `[locale]/blog/[slug]` 是全站唯一的静态路由（`revalidate = 3600`），其余页面都因读 `searchParams` 而是动态的，所以只有文章页中招。**潜伏原因是两层叠加**：线上 `blogs = 0` 让这条路由从没被渲染过；而 `next dev` 根本不做静态渲染 —— 同样 4 篇文章在 dev server 里 8 个页面全是 200，几分钟后在生产全是 500。与 #23 同一模式：空集合藏住了真实缺陷。修复是 `setRequestLocale(locale)`，**必须放在 layout 而非 page**（layout 先渲染，放 page 里来不及；先试过，无效）。验证方式是本地 `next build` + `next start`，dev server 做不到这件事。 |
| 部署后无冒烟检查 | 🟡 中 | ✅ 已修复 (#27) | #26 暴露的闸门缺口：把每篇文章变成 500 的那个提交，`typecheck` 绿、`npm test` 绿、Vercel build 也绿 —— **因为报错发生在请求期而不是构建期**，CI 里没有任何一步真正去取一个页面。新增 `.github/workflows/smoke.yml`，在生产部署成功后打 12 条关键 URL（含两个语言的文章详情页，slug 从 `/api/blogs` 动态取）。刻意不接 pull_request：它需要一个已部署的 URL 和其后的生产库。**触发条件返工过两次**：初版写 `environment == 'Production'`，而 Vercel 实际发的是 `Production – jackdeng-hub`，于是每次部署都静默跳过（#28 改为 startsWith + endsWith）；随后删除重复项目 `jackdeng-hub-83t7`，环境名又退回裸 `Production` —— **那个后缀只在多项目并存时存在**，endsWith 随即失效（#30 改为只认前缀）。教训：判据要挑不随环境数量变化的部分。 |
| 冒烟检查只断言 200 | 🟡 中 | ✅ 已修复 (#37) | #27 加的冒烟检查只问「这些页面在不在」，从没问过「不该在的页面是不是真的不在」——所以 #34 那个软 404（五条路由对编造的 slug 回 **200** 配 404 页面，搜索引擎会照单收录）在冒烟里是全绿的：该在的页面确实都在。补上反向断言，对五个调 `notFound()` 的路由各打一个不可能存在的 slug，要求必须 404。**断言验过会红**：把探针指向一篇真实文章，脚本报 FAIL 并 exit 1；指回编造的 slug，20 条全绿 exit 0（对生产实测，只发 GET）。 |
| i18n 校验不在 CI 里 | 🟡 中 | ✅ 已修复 (#37) | `scripts/i18n-check.mjs` 从 v0.8.0 就在，但只有人想起来才会手跑一次，而技术债表里 i18n 类回归出现了五次以上（硬编码三元、中文页显示英文分类名、面板整个写死中文……）。接进现有 `typecheck` job 而不是新开一个 job —— 分支保护要求的 check 名字是 `typecheck`，新 job 会跑但拦不住合并，那正是 #18 当初踩过的形状。不需要 secret，跑完不到一秒。**验过会红**：删掉 zh.json 里一个键，`npm run i18n:check` exit 1；补回来 exit 0。 |
| 评论的 Turnstile 形同虚设 | 🔴 高 | ✅ 已修复 (#36) | 表单先打 `/api/verify-turnstile` 验证，再把评论 POST 给 Payload 自己的 `/api/comments`，两个请求之间没有任何绑定，而 `Comments.access.create` 是 `() => true` —— 跳过第一个请求直接打第二个就能写库，人机验证是可选的。**实际状态比这更糟，是三个缺陷叠在一起**：(1) 生产从没配过 `TURNSTILE_SECRET_KEY`（`vercel env pull` 拿到的 production 快照里没有这个变量，文章页 HTML 里也搜不到 turnstile 组件），而旧路由在缺 secret 时直接返回 success —— 线上评论一直只有蜜罐和 IP 限流两道防线；(2) 旧路由把 siteverify 打到 `/turnstile/v1/siteverify`，Cloudflare 对这个地址返回**空的 404**，即使配了 secret 验证也 100% 失败（正确的是 v0）—— 这个是修复过程中 fail-closed 行为自己暴露出来的；(3) 限流读 `x-forwarded-for` 最左元素，那是提交者能自己写的 header。修法是把验证和写入合并成同一个请求：新增 `POST /api/comments/submit`（校验 → 验 Turnstile → local API 写入），`access.create` 收紧为 `Boolean(req.user)`，删掉 `/api/verify-turnstile`。IP 只从 `x-real-ip` / `x-vercel-forwarded-for` 取，`x-forwarded-for` 与 `cf-connecting-ip` 一概不读；取不到时返回 null 并与所有未知来源共用一个桶，而不是豁免。（本站 DNS 直连 Vercel、响应无 `cf-ray`，已核实没有 Cloudflare 代理在前面；真要加代理，这条限流会静默失效。）错误改为返回机器可读的 code 由浏览器翻译，服务端不再替访客选语言。**部署前提**：Vercel 生产必须配 `TURNSTILE_SECRET_KEY` 与 `NEXT_PUBLIC_TURNSTILE_SITE_KEY`，否则提交一律 503 —— 这是**故意 fail closed**：缺变量应该响亮地坏掉，而不是安静地放行。**验证方式**：docker 起一次性 Postgres → `payload migrate` → `next build && next start`，实测旧路径 403、蜜罐 400 且不写库、`status: 'approved'` 与 `ip` 注入被忽略（存进去仍是 pending + 服务端解析的 IP）、轮换 `x-forwarded-for`/`cf-connecting-ip` 五次仍落在同一个桶里并在第 6 条上 429、缺 secret 时 503 且不写库。**未做**：`comments.turnstile_token` 列保留不动（已停止写入，token 是一次性的，存下来也只是个用过的字符串），按 #29/#32 的两步法留给后续迁移 DROP。 |
| 分类名不支持多语言 | 🟡 中 | ✅ 已修复 (#27) | `Categories.ts` 的 `name` / `description` 没有 `localized: true` —— 不是数据没填，是字段压根不支持多语言，于是中文站的侧边栏、面包屑、CategoryBadge、分类页标题全是 `Career & Thoughts` / `DevOps & Tools`。另有两处硬编码英文：分类页与标签页的 `<title>`、meta description 和 eyebrow 标签（`${cat.name} — Blog`、`Posts in the ... category.`、`Category` / `Tag`）。迁移 `20260922_000001_localize_categories` **刻意做成纯增量**，不像 `add_projects_localization` 那样 DROP 旧列 —— 丢列会造成一个无论什么顺序都有破损的窗口（先迁移则线上旧代码查一个已消失的列，先部署则新代码查一张还不存在的表）；保留旧列（并去掉 `NOT NULL` 让新建分类仍能 INSERT）使迁移可以在部署前安全执行，**零停机**。已在生产库用事务彩排后回滚，再正式执行。另外英文值写入 `en` 槽、中文写入 `zh` 槽，**不沿用 projects 迁移那种「全部塞进默认 locale」的做法** —— 那正是本站长期用 fallback 拿英文充中文的成因。**未做**：Tags 的 `name` 保持不本地化（NetSuite / PostgreSQL / Docker 是专有名词）。旧列已由 `20260922_000002` 清理（#29）—— 彩排验证过 up → down → up 往返，`down()` 能从 `en` 槽完整还原两列（零空值），否则整条链反向回滚会在 `000001` 的 `down()` 上撞到一个已不存在的列。丢列后另跑过一次写路径检查：新建分类、双语分别写入、读回、删除均正常。 |

---
*注：本文件为单一事实来源 (SSOT)。每次重大更新需同步更新本 Roadmap。*
*最后更新：2026-09-23 (#50 工具详情页不再对外显示私有工具；#49 安全响应头；#48 首页与列表页走缓存；#47 首页改成能代替简历；#46 关掉开发模式自动改生产库表结构；#36 评论提交改走服务端 Turnstile 校验，关掉匿名直写 `/api/comments`；#45 projects 详情页最后两处 `any`；#39 搜索收成一个服务端路由；#44 projects 详情页的类型；#43 projects 详情页「其他项目」改用 `orEmpty()`，失败时记日志；#42 查询失败不再渲染成空列表、冒烟检查识别 200 下的报错；#40 页面查询去掉 `as any`、英文归档页标题、文章页两处硬编码文案；#38 projects 详情页从 force-dynamic 改回 ISR；#37 冒烟检查补反向 404 断言、i18n 校验进 CI；#35 生命游戏模式；#34 软 404 修复；#33 删除 visa-checker；#32 清理 tools 旧列；#31 落沙工具、builtin 注册表与 Tools 本地化；#30 冒烟触发条件改认前缀；#29 清理分类旧列；#28 修复冒烟检查从未触发；#27 分类名本地化与部署后冒烟检查；#26 静态渲染读请求头导致文章页全 500；首批 4 篇双语文章发布上线；#24 纯函数单元测试；#23 阅读时长两个 bug；#22 发文脚本与首批双语内容；#20 移除 next-auth；#19 Media 读权限收口；#18 CI 闸门与分支保护；#17 写库脚本生产守卫；#16 运维脚本 env 加载修复)*
