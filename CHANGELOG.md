# Changelog — Jack Deng's Personal Hub (jackdeng.cc)

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> 1.10.0 – 1.13.1 是 2026-09-26 按合并日期回填的。从 #16 改走 PR 起，每次改动都没有同步
> 这份文件；这几个版本号是事后补编的，没有对应的 git tag。小节标题里的 #N 是 PR 号，
> 细节以 PR 描述为准。

---

## [1.14.1] — 2026-09-26

### Removed — 用不到的依赖、文件和一次性脚本（#77）

- **依赖**：`otplib`、`qrcode`、`@types/qrcode` 在 4 月去掉 MFA 后就没人用了；`lucide-react`、
  `cross-env` 从没被 import 过。`@payloadcms/translations` 是反过来：`payload.config.ts` 在用，却只靠
  传递依赖装上。现在按 Payload 锁步规则写成 `3.90.2` 精确版本，Dependabot 的 payload 分组会带着它一起升。
- **Docker**：`Dockerfile` 用的 Node 20 低于 `engines` 要求的 24，还会复制一个不存在的根目录
  `payload.config.ts`。部署走 Vercel，没有任何地方引用这三份 Docker 文件。
- **文档**：`v1_SPRINT_SPEC.md`，v1 冲刺早已结束，也没有文件链接到它。
- **一次性脚本**：测试图片那组（`upload-test-images`、`purge-test-media`、`reset-media-and-apply`），
  测试图片在 1.9.2 已经清空；`apply-projects-localization`，迁移早已跑完；`cleanup-blogs`，内容上线前
  用来清空文章和评论。`src/scripts/seed-taxonomy.ts` 带着 `--apply` 会先删光所有分类和标签，再按一套
  写死的列表重建，现有文章的分类和标签关联会全部断掉；`verify-taxonomy` 是和它配套的。

### Fixed — 几处违反 CLAUDE.md 约定的写法（#77）

- **RSS 标题和描述**写的是 `locale === 'zh' ? … : …`，改为从新的 `feed` 命名空间读取。未知的
  `?locale=` 以前会原样传给 `payload.find`，现在按英文处理。`footer.builtWith` 没人读，删掉，
  `i18n:check` 的警告归零。
- **项目页**的链接用的是 `next/link`，并手写 `/${locale}/` 前缀，改用 `@/i18n/navigation` 的 `Link`。
- **日期格式**统一走 `src/lib/formatDate.ts`：新增 `formatMonth` 和 `formatMonthName`，删掉
  `CommentList`、归档页、侧栏各自的副本。侧栏归档原来显示「2026年九月」，现在是「2026年9月」。
- **页脚**去掉了每页都有的 Admin 链接。后台地址不变，访客不需要看到它。
- **`vitest.config.ts`** 排除 `.claude/**`。本地跑测试时，Claude Code worktree 里的测试副本会被重复计入。

## [1.14.0] — 2026-09-26

### Added — 访问统计：Vercel Web Analytics（#76）

之前只装了 Speed Insights，它只测性能。有没有人来、从哪来、看了哪些页，一概不知道。

- 在 `[locale]` 布局里挂上 `@vercel/analytics` 的 `<Analytics />`，后台 `(payload)` 不统计。
- 脚本和上报都走同域 `/_vercel/insights/*`，现有 CSP（`script-src` / `connect-src 'self'`）不用改，
  `src/proxy.ts` 的 matcher 本来就排除了 `_vercel`。它不写 cookie，不需要同意弹窗。
- 部署后要在 Vercel 项目的 Analytics 页面打开 Web Analytics，否则脚本会 404、不记录任何数据。

## [1.13.5] — 2026-09-26

### Fixed — 侧栏、sitemap 和索引不再指向没有文章的分类和标签（#75）

分类和标签是一次性预先建好的：6 个分类、20 个标签，而已发布的 4 篇文章只用到其中 2 个分类、
4 个标签。于是博客侧栏列出 4 个计数为 0 的分类，「热门标签」按数据库顺序排出 20 个标签，其中
16 个点进去是「暂无文章」；sitemap 也把这些空页面全部报给了搜索引擎，42 条 URL 里有 20 条是空页。

- 新增 `src/lib/taxonomyCounts.ts`（带测试）：统计每个分类、标签下的已发布文章数，筛掉 0 篇的，
  并按篇数从多到少排序。侧栏和 sitemap 共用这一份。
- 侧栏只显示有文章的分类和标签。标签按篇数排序，「热门标签」这个名字现在名副其实。
- 没有文章的分类页和标签页输出 `noindex, follow`，sitemap 也不再列出。页面本身照旧返回 200：
  等文章用上这个分类或标签，页面自然会恢复收录。

## [1.13.4] — 2026-09-26

### Security — 收紧 Payload 自动生成的 REST 接口（#74）

Payload 给每个集合都生成 `/api/<slug>`，不管有没有页面用到，挡在访客和数据表之间的只有
`access`。公开页面都走 Local API，所以下面两条规则放得比网站需要的宽，却从没在页面上表现出来：

- **`comments` 的 `read`** 对匿名调用者返回所有已批准的评论。REST 返回整条文档，包括评论者的
  `authorEmail` 和 `ip`。2026-09-26 只读查询生产：已批准的评论 0 条，还没有泄露过。`read`
  改为只限登录；`authorEmail`、`ip` 另加字段级 `access.read`，以后就算重新对匿名开放已批准
  评论，这两个字段也不会出去。文章页的 `CommentList` 用 `overrideAccess` 加自己的 `status`
  过滤，不受影响；限流查询 `ip` 也带 `overrideAccess`，字段权限同样跳过。
- **`tool-runs` 的 `create`** 是 `() => true`，本意是给自动化工具回调用。但回调走的是
  `POST /api/tools/[slug]/callback`（先验 `x-cron-secret`，再用 Local API 写），这条规则顺带
  放开了什么都不验的 `POST /api/tool-runs`，任何人都能伪造运行记录。改为只限登录。回调里的
  `create` / `update` 显式写上 `overrideAccess: true`：这本来就是 Local API 的默认值，写出来
  是为了让这次写入不再悄悄依赖默认值。

### Security — 缺 `PAYLOAD_SECRET` 时拒绝启动（#74）

原来是 `secret: process.env.PAYLOAD_SECRET || 'YOUR_SECRET_HERE'`，缺变量就回落到仓库里公开的
字符串。Payload 用它签发后台 session token，哪个部署缺了这个变量，任何人都能自己签一个管理员
token。生产和 Preview 都配了这个变量：生产的依据是 `vercel env pull` 拉下的 production 快照，
Preview 的依据是本 PR 的 preview 构建通过了（缺这个变量，构建在加载配置时就会失败）。所以此前
没有哪个部署真的在用那个公开字符串。现在 `payload.config.ts` 读不到变量就直接抛错：缺变量的部署
会构建失败，不会悄悄用公开的密钥。

CI 的 schema-drift 前两步（`payload migrate`、`schema-drift.ts push`）要加载配置，`ci.yml`
里给这两步写了一个一次性的值。它不是 repository secret，所以 Dependabot 的 PR 也拿得到。

**以后**：新建任何 Vercel 环境都要配 `PAYLOAD_SECRET`，否则构建失败。

### Removed — GraphQL（#74）

没有任何代码调用 GraphQL：页面走 Local API，后台走 REST。开着它，每个集合就多一个公开查询
入口（生产上 `POST /api/graphql` 能匿名查询，还带 introspection），却没有页面或测试覆盖它。
改为 `graphQL: { disable: true }`，删除 `src/app/(payload)/api/graphql/route.ts`，
`/api/graphql` 现在返回 404。`graphql` 依赖保留，它是 `payload` 的 peer dependency。
`DEPLOY_ISSUES.md` 的 Issue 2 当年修的正是「`/api/graphql` 返回 404」，加注说明现在的 404
是预期行为，不要按旧修法恢复。

### Added — 集合访问规则的单元测试（#74）

`src/collections/access.test.ts` 以 `req.user = null` 调用每个集合的 `create` / `read` /
`update` / `delete`，以及集合额外定义的访问键（比如 `readVersions`），断言结果：

- 允许匿名做的事列在一张表里（blogs 读已发布、categories 和 tags 读、tools 读在线且公开），
  表里没有的操作一律必须拒绝。集合没写的操作按 Payload 的默认规则（登录才行）计算。
- `comments.authorEmail` / `.ip` 匿名读不到，登录后读得到。
- `src/collections` 下每个集合文件都要登记在测试里，新集合忘了登记会变红。

变异验证：把 `ToolRuns.create` 改回 `() => true`、`Comments.read` 改回已批准过滤、去掉 `ip`
的字段权限、给 Blogs 加 `readVersions: () => true`、给 Tags 加 `update: () => true`、新建一个
没登记的集合文件，六种情况各有一条测试变红。

### 验证

`typecheck`、`npm test`（162 个，新增 39 个）、`i18n:check` 通过。在一次性 Postgres 16
（Docker）上 `payload migrate` → `next build && next start`，环境变量全部显式指向本地库：

- 匿名 `GET /api/comments`、`/api/comments/1`、按 `ip` 过滤都是 403；登录后 200，含
  `authorEmail` 和 `ip`。
- 匿名 `POST /api/tool-runs` 403，登录后 201。callback 不带 secret 或 secret 错误 401，
  secret 正确 200，写入运行记录并更新工具的 `lastRunStatus`。
- `GET` / `POST /api/graphql` 404。
- 文章页照常渲染已批准的评论（作者名和内容），HTML 里没有邮箱和 IP。
- 匿名 `/api/blogs`、`/api/tools` 的结果不变，`/admin` 200。
- `PAYLOAD_SECRET` 为空时，`payload migrate` 和 schema-drift push 都报错退出；带上 CI 里的值，
  schema-drift 比对通过。

---

## [1.13.3] — 2026-09-26

### Changed — 重写 `AI_DEPLOY.md` 的部署和工具引擎两节（#73）

这两节是 4 月写的，之后项目换了部署方式和工具架构，照着做会出错：

- **部署一节**让 agent 在本机 `npm run build` 再 `nohup npm run start`，还说迁移「部署时
  自动执行」。实际是 Vercel 的 Git 集成，push 到 `main` 即部署；构建只是 `next build`，
  不跑迁移（也没有配 `prodMigrations`），迁移要手动对生产执行。
- **工具一节**让人把工具写进 `src/app/(app)/tools/[slug]/page.tsx`，这个路径不存在。

新的「Deployment」一节写明：

- production、preview 和部署后冒烟检查各是怎么触发的。preview 连的也是生产库。
- 回滚的前提：只要之后的迁移都只做加法，旧代码就还能跑在当前 schema 上。
- 环境变量逐项说明。`.env.example` 原来缺 `CRON_SECRET`（automation 工具 callback 的共享密钥），
  一并补上。
- 迁移的执行顺序和彩排方式，以及为什么不用 `payload migrate:create`。
- 本地开发要注意 `.env.local` 连的是生产库。

新的「Extending the Tools Engine」一节写明：

- 工具的可见性规则，以及详情页按什么顺序选渲染方式。
- 加一个内置工具的五步。
- 嵌入外部工具时要把来源加进 CSP 的 `frame-src` / `script-src`。
- 自动化工具 callback 的请求格式和状态取值。
- 目前没有运行记录面板，也没有出站触发。

`CLAUDE.md` 里「这两节已过时」的提示改为指向新内容。

---

## [1.13.2] — 2026-09-26

### Added — `CLAUDE.md`（#72）

CHANGELOG 从 #16 起停更了 55 个 PR（见本文件顶部的说明）。原因是记 CHANGELOG 的规定只写在
`AI_DEPLOY.md` 里，仓库没有 `CLAUDE.md`，接手的 agent 不会自动读到它。新增 `CLAUDE.md`，
写明：

- 每个 PR 同步 CHANGELOG 和 roadmap，提交前跑 `typecheck`、`npm test`、`i18n:check`。
- `.env.local` 指向生产库；schema 推送和写库脚本各有守卫；写生产库之前先问。
- 迁移要手动对生产执行、手写、删列分两步。
- CI 只有 `typecheck` 一个 required check，新检查要加进这个 job。
- 反复踩过的坑：`payload.find()` 不传 `locale`、用 `next/link`、硬编码中英三元、吞掉
  查询错误、`loading.tsx` 的作用域、Payload 包不锁步。

另外注明 `AI_DEPLOY.md` 有两节已经过时：一键部署一节写着 `nohup npm run start`，还说迁移
「部署时自动执行」；「Extending the Tools Engine」一节指向不存在的
`src/app/(app)/tools/[slug]/page.tsx`。

### Removed — 仓库根目录的一次性脚本 `.tmp-online.ts`（#72）

#31 上线落沙后，用来把它的记录改成 `online` 的一次性脚本，随 #32 误提交进了仓库根目录。
它早已执行完（落沙现在是 `online`），删除。

### Docs

- #72：回填 1.10.0–1.13.1，roadmap 补记 #69–#71。

---

## [1.13.1] — 2026-09-26

### Changed — `/og` 分享卡改用 Node.js 运行时（#69）

`next build` 对 `src/app/og/route.tsx` 报两条警告：

```
⚠ The Edge Runtime is deprecated. You can use the "nodejs" runtime instead.
⚠ Using edge runtime on a page currently disables static generation for that page
```

删掉 `export const runtime = 'edge'`，路由改用默认的 Node.js 运行时，别的都不用改：
这个路由不按 URL 加载任何字体或资源；next/og 的 Node 版本内置同一款默认字体
（Geist Regular），CJK 字形也和 Edge 版一样，在渲染时从 Google Fonts 拉取。

验证：`npm test` 16 个文件、115 个测试通过（没有测试覆盖 `/og`，所以测试没改）；
`npm run typecheck` 无报错；对一次性本地 Postgres（按 CI 的方式迁移）跑
`npm run build` 成功，两条 Edge 警告都不再出现，`/og` 仍构建为 `ƒ`（动态），因为它
读 query string，这是预期的。dev server 上用从 `/en`、`/zh` 取出的 `og:image` URL，
加上中英文各一个 `type=blog` 标题，四张图都返回 `200 image/png`、1200×630，中文图里
的汉字渲染正确，没有缺字方块。

部署后线上核对：`/en` 与 `/zh` 的 `og:image` 都返回 `200 image/png`，中文副标题
没有缺字。

**安全：** #64 判断 `/og` 不受 GHSA-vcvr-r3jv-pc5j（`next/og` `ImageResponse` 远程
代码执行）影响，依据是它跑在 Edge 上。改到 Node.js 之后这条依据不再成立，但当前锁定
的 `next` 是 16.3.6，已含修复，不受影响。以后如果回退 `next` 版本，要记得这一点。

---

## [1.13.0] — 2026-09-24

### Fixed — 迁移链补齐到代码定义的 schema（#53）

#46 之前，Payload 的开发模式推送一直直接改生产库，生产库跟着集合配置在变，
迁移文件却落在后面：从零跑迁移建出来的库和生产库有 **26 处**不同。新环境
（本地、CI、灾备恢复）按迁移建库就和生产不一样，以后写新迁移也会以错误的
状态为基线。

生产库的结构来自 4、5 月的代码，不能直接当成标准，所以先建了三个库两两比对：
只跑迁移的库 vs 把当前代码 schema 推进空库的库，差 26 处；当前代码 vs 生产，
列、约束、索引（连名字）、枚举**完全一致**。结论是生产库没问题，落后的只是迁移链：

- 4 个 select 字段（`tools.tool_type` / `.embed_type` / `.last_run_status`、
  `tool_runs.status`）迁移里是 `varchar`，代码里是 Postgres 枚举，另有 4 个
  枚举类型迁移里没有；`tool_runs.detail` 迁移是 `text`、代码是 `varchar`；
  `tool_runs.run_at` 迁移多了 `now()` 默认值；`blogs.status` 迁移可空、代码 `NOT NULL`。
- 索引：`categories_locales` 唯一索引的列顺序和名字不同；`tool_runs_tool_id_idx`
  应改名为 `tool_runs_tool_idx`；缺 `created_at`、`updated_at`、`cover_image`
  三个索引；多一个 `run_at DESC` 索引。

新增迁移 `20260924_000001_align_schema_with_code`，每一步先检查再动手：还是
varchar 才转枚举，枚举类型已存在就跳过，索引用 `IF [NOT] EXISTS`，改名前检查
新旧两个名字。所以它在生产上什么都不改，在从零建的库上补齐全部 26 处。`down()`
还原到这条迁移之前的状态，注释写明不要在生产上单独回滚它。没有用
`payload migrate:create`：Payload 自动生成的 schema 快照（`.json`）只到 04-10，
之后 9 条迁移都是手写的，它会拿 4 月的快照当基线算差异。

验证全在一次性 Postgres 上彩排：迁移链库先写入覆盖各种取值的测试数据（含 NULL
和长文本），up 后与代码 schema 完全一致、数据原样保留；down 后与迁移前快照完全
一致；再 up 仍一致、行数不变；在与生产同构的库上连跑两次 `up()`，零变化。
`typecheck`、`npm test`、`i18n:check` 通过。

Vercel 构建不跑迁移（`build` 只是 `next build`），合并后手动对生产执行了一次
`payload migrate`（2026-09-24，`payload_migrations` 第 18 批）：结构不变，只登记
这一条。

### Added — CI 检查迁移建出的库是否等于代码定义的 schema（#54）

#53 那 26 处偏差持续了 5 个月，因为从来没有东西比较「迁移建出来的库」和「集合
定义的 schema」：改了集合忘了写迁移，或者迁移和配置不一致，CI 照样是绿的。

`.github/workflows/ci.yml` 的 `typecheck` job 加一个 Postgres service 和三个
步骤：`payload migrate` 建 `migrated` 库 → 把代码 schema 推进空的 `pushed` 库
→ 用 `scripts/schema-drift.ts` 逐项比对列、约束、索引和枚举，有任何差异就失败
并逐条列出。放在 `typecheck` 里而不新开 job，理由和 i18n 检查一样：分支保护
要求的检查名是 `typecheck`，新 job 会跑但拦不住合并。全程只用这个一次性
Postgres，不需要 secret，不碰生产库。

第 2 步要推 schema，所以 `payload.config.ts` 的 `push` 从恒为 `false` 改成
`PAYLOAD_SCHEMA_PUSH=1` **且** `DATABASE_URI` 是 localhost。判断抽成
`isLocalDatabaseUrl()`（`src/lib/localDatabase.ts`），单测专门覆盖看起来像本地、
实际是远程的地址：`localhost.evil.com`、`?host=localhost`、userinfo 里塞
`@localhost`、路径里放 `localhost`。脚本本身不读 `.env.local`（它指向生产库），
两个库地址不是 localhost 就拒绝执行。变异验证：改成子串匹配、去掉端口和路径的
锚定，测试都会变红；把 userinfo 放宽到允许 `@` 的变异存活了，但它是等价变异，
两种写法放行的地址完全相同。

验证（本地一次性 Postgres 上原样跑这三步）：当前代码通过，177 列 / 48 约束 /
93 索引 / 10 枚举全部一致；把 #53 的对齐迁移移出目录，报 26 处差异；给
Projects 加一个字段不写迁移，报 `code only: projects | ci_drift_probe | varchar`；
库地址设成远程或 `localhost.evil.com`，脚本拒绝。只删 `src/migrations/index.ts`
里的登记不会报红，因为 `payload migrate` 直接读 `src/migrations` 目录。
`npm test` 95 个（新增 4 个）。GitHub runner 上的 Postgres service 由这个 PR
自己的 CI 首次跑通。

另外在生产库上做了一处清理（已完成）：`payload_migrations` 表里有一条 04-04
留下的 `batch = -1` 开发推送记录，它让每次 `payload migrate` 都弹出「dev mode
… data loss」确认。在事务里删掉这一行，要求受影响行数正好是 1；之后
`payload migrate` 直接输出 `Done.`。

### Added — Person 结构化数据与带定位语的分享卡片（#55）

这个站要能代替简历，除了访客直接打开的页面，还有两个间接入口：有人搜名字时的
搜索引擎，和链接发到 LinkedIn、微信、Slack 时的分享预览。之前首页和 About 没有
任何 JSON-LD，搜索引擎没法把本站、GitHub、LinkedIn 认成同一个人；分享卡片上
只有一行「Jack Deng」，看不出是做什么的。

- **结构化数据**：首页加 schema.org `Person`，About 加 `ProfilePage`，它的
  `mainEntity` 就是这个 Person。数据来自 `src/lib/profile.ts`，只用站上已经公开
  的信息：名字（`alternateName` 是 Jie Deng，与简历、LinkedIn 一致）、所在州、
  当前公司、Northeastern、技能，以及 GitHub、LinkedIn、LeetCode。刻意不写
  `jobTitle`：定位语讲的是方向，不是在任职位，放进了 `description`。也不写
  email：页面上已有邮箱链接，放进结构化数据只会更容易被爬虫抓走。
- **`toJsonLd()`**（`src/lib/jsonLd.ts`）把 `<` 转义，字段值里出现 `</script>`
  也不会提前闭合脚本标签。
- **分享卡片**：`/og` 加可选的 `subtitle` 参数，首页和 About 传当前语言的定位语；
  全站默认卡片也带上定位语，博客列表、工具页这些没单独设卡片的页面一并受益。
  title 和 subtitle 截断到 120 字符：这个接口会把查询参数原样画进本站域名下的
  图片，不该允许任意长度的文字。

验证（本地生产构建）：`/en`、`/zh`、`/en/about`、`/zh/about` 的 JSON-LD 都能
解析，类型、当前语言的描述、公司、3 个 `sameAs`、25 项 `knowsAbout` 齐全，
没有 `jobTitle` 和 `email`；四页缓存仍是 `HIT`；中英卡片实际渲染正确，不传
subtitle 的旧用法不变，title / subtitle 各 5000 字符截断后正常出图；站内链接
检查 42 页 46 个链接通过；`</script>` 注入有单测。`npm test` 99 个（新增 4 个）。
合并后可以用 Google 富媒体结果测试和 LinkedIn Post Inspector 检查线上首页；
LinkedIn 缓存的旧卡片要在 Post Inspector 里重新抓取一次才会更新。

### Fixed — 浅色模式可读，全站文字对比度达到 WCAG AA（#56）

系统是浅色模式的访客默认看到浅色主题，而它从设计系统落地起就是坏的：白天用 Mac
的招聘方打开首页，先看到一条深色顶栏，上面的名字是近黑色。修改前在生产上测
（浅色、`/en`）有 **11 组**颜色不达标。最差的是顶栏名字 1.6:1：浅色覆盖规则选的
是 `header[data-navbar]`，属性却加在 `<nav>` 上，从没匹配过。其余几处：直接拿
品牌色当字色的 JavaScript / React 标签（1.3 / 1.5:1），用 `--text-disabled`
（#ccc）的阅读时长（1.5:1），只为深色调过、复制在六个文件里的「Active」徽章
（2.2:1），用 `--text-tertiary` #999 的日期、地点、页脚、技能分组（2.6–2.9:1）。
深色模式好一些：tertiary 3.7–4.1:1，`#3b82f6` 上的白字（简历按钮、跳转链接）3.7:1。

- **顶栏和手机菜单**改用主题变量（`--nav-bg`、`--nav-menu-bg`、`--bg-hover`、
  `--bg-subtle`），删掉那段不生效的 `<style>` 覆盖，菜单按钮补 `aria-expanded`。
- **按主题重调 token**：浅色 tertiary `#6b6b6b`、secondary `#525252`、accent
  `#005cc5`，状态色加深；深色 tertiary `#8b8b94`、accent `#4d8ff8`。
- **白字统一放在 `--accent-solid` / `--danger-solid` 上。** 深色模式下，同一个
  蓝没法既在黑底上看得清、又托得住白字。涉及简历和 About 的 CTA、404 与错误页
  按钮、项目的 live demo 按钮、评论提交、分页、跳转链接和确认弹窗；弹窗里 danger
  按钮 hover 时不再变蓝。
- **`src/lib/statusColors.ts`** 取代项目和工具状态色的六份拷贝，底色用
  `color-mix()` 生成；原来 `color + '18'` 拼十六进制透明度的写法接不了 CSS 变量。
- **标签字色**是品牌色 35% 混进 `--text-primary`，色相保留，在用的每个标签色
  两套主题下都超过 5:1；圆点仍用纯品牌色。
- 阅读时长改用 `--text-tertiary`，面包屑的 `/` 分隔符加 `aria-hidden`；修掉
  「View project → →」「View details → →」的双箭头（文案和图标各画了一个）。

验证：13 个页面在 375px 宽、两套主题下逐个可见文字节点算对比度，全部 ≥ 4.5:1
（大字 ≥ 3:1）；截图核对浅/深色首屏、浅色下展开的手机菜单和项目卡片；84 个
中英页面与生产的可见文字 diff（含 text、href、meta、aria-label）只有去掉的箭头，
另有一页标签顺序变了、内容没变。`typecheck`、99 个测试、`i18n:check`、
`next build` 通过。locale 下未知路径落到根 `not-found.tsx` 的问题属于路由，
见 #57。

### Fixed — 扫描器探测路径答 404 而不是 500，locale 下未知路径走站点的 404 页（#57）

生产上未知 URL 有两种出错方式，外加一个小问题：

- **带点的路径答 500。** `/wp-login.php`、`/.env`、`/foo.txt`、`/nope.png`
  都是 500。middleware 的 matcher 跳过所有带点的路径（这样 `robots.txt` 之类
  不会被重定向到 locale），于是 `[locale]` 把 `/foo.txt` 认成 locale
  `"foo.txt"`。layout 在 `setRequestLocale()` 之前就调了 `notFound()`，404 页的
  `getTranslations` 只好退回去读请求头，静态渲染的路由不允许这样做：
  `DYNAMIC_SERVER_USAGE`，500。每个扫描器探测拿到的都是服务端错误。现在
  `[locale]/layout.tsx` 遇到非法 locale 先 `setRequestLocale(routing.defaultLocale)`
  再 `notFound()`。
- **locale 下的未知路径是一张光秃秃的页面。** `/en/nope`、`/zh/a/b` 虽然回 404，
  但 `[locale]` 下没有路由匹配时，Next 把 404 交给根 `not-found.tsx`；它故意放在
  locale layout 之外，拿不到主题、翻译和导航。新增 `[locale]/[...rest]/page.tsx`
  调 `notFound()`，让 `[locale]/not-found.tsx` 在 locale layout 里渲染，标题
  本地化并带 `noindex`。
- **locale 下的 404 有两个页脚**（如 `/en/blog/<不存在的 slug>`）：
  `[locale]/not-found.tsx` 不再自己画页脚，layout 已经渲染了一个。

`smoke.yml` 加两条反向探针：`/en/<nope>/deeper` 和 `/<nope>.php`。

验证（`next build && next start`）：21 条路径的状态码逐一核对，带点的探测和
locale 下的未知路径 `404`，`/xx` 仍是 `307`，`/robots.txt`、`/sitemap.xml`、
`/feed.xml`、`/og`、`/icon.svg`、`/favicon.ico`、`/resume.pdf` 和真实页面 `200`；
浏览器里 `/en/nope`、`/zh/a/b` 渲染带主题、翻译和导航的 404，只有一个页脚，标题
「Page not found — Jack Deng」，带 `noindex`；84 个中英页面与生产的可见文字
diff 无差异。`typecheck`、99 个测试、`next build` 通过。

### Security — 完整 CSP 以 Report-Only 试运行（#58）

#49 的 CSP 只有 `frame-ancestors 'self'`，只防点击劫持：脚本和图片从哪个域名来、
表单往哪提交、能不能嵌第三方 iframe，一概不管。凭猜测直接写一份严格策略大概率
会弄坏东西，最可能是 `/admin` 或 Turnstile 周边。所以完整策略以
`Content-Security-Policy-Report-Only` 头发出：**浏览器一条都不拦，只上报违规。**
原来强制执行的 `frame-ancestors 'self'` 不变。**CSP 目前仍是 Report-Only 试运行，
没有切到强制**；等日志安静下来，再另开 PR 改成强制执行。

策略写在 `next.config.mjs`：

```
default-src 'self'
script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob: https://*.public.blob.vercel-storage.com
font-src 'self' data:
connect-src 'self' https://challenges.cloudflare.com
frame-src 'self' https://challenges.cloudflare.com
worker-src 'self' blob:
object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'
report-uri /api/csp-report
```

`script-src` 保留 `'unsafe-inline'`：Next 把页面以内联 `<script>` 分块流式输出，
改用 nonce 会让每个 ISR 页面都变成按请求渲染。即便如此，这份策略仍能挡住其他
域名的脚本、插件、`<base>` 劫持、表单外发和第三方 iframe。

上报接口 `POST /api/csp-report`（解析在 `src/lib/cspReport.ts`）同时接受
`application/csp-report` 和 Reporting API 的 `application/reports+json` 数组，
每条违规往 Vercel 函数日志写一行 `[csp] {directive, blocked, page, source?, line?}`。
浏览器自己发报告，所以接口不鉴权，也什么都不信：超过 16 KB 的 body 不读直接回
`413`，每个请求最多记 20 条，URL 一律截到 origin + path（丢掉查询串和 fragment），
`data:` / `blob:` URL 只留 scheme。

顺带：博客和项目详情页的 JSON-LD 改用 #55 的 `toJsonLd()`（转义 `<`），首页和
About 之前已经是了。

验证：解析器 11 个测试，8 处故意改坏各自让测试变红；`next build && next start`
上浏览首页、`/zh/about`、博客、文章、项目、工具、404 和 `/admin/login`，没有
产生 `[csp]` 日志；端到端执行
`new Image().src = 'https://example.com/csp-probe.png?secret=1'`
触发 `securitypolicyviolation`，服务端日志里是 `https://example.com/csp-probe.png`，
查询串已去掉；接口对合法报告回 `204`、坏 JSON 回 `400`、20 KB 回 `413`、GET 回
`405`；5 个页面的 JSON-LD 与生产逐字节一致。110 个测试、`typecheck`、
`next build` 通过。

**未验证：**

- **Turnstile**：本地没有配置 site key，评论组件在这套策略下没有测过，PR 里说
  合并后在生产上检查。
- **登录后的 `/admin`**：需要登录会话，本地只测到登录页。如果有违规会进日志，
  这正是 report-only 的用途。

### Fixed — 归档、分类、标签页补 canonical 与 hreflang（#59）

对 sitemap 里全部 84 个中英页面做了一次元数据审计（title、description、
canonical、hreflang、`og:image`、`<h1>` 数量、alt 文本），发现三类问题：

- **归档、6 个分类、21 个标签页没有 canonical 也没有 hreflang**，中英合计 44 页。
  博客首页、文章、项目、工具都有，只有这几类列表页漏了，搜索引擎无从知道 `/en`
  和 `/zh` 是同一页的两种语言。新增 `src/lib/alternates.ts` 的
  `localeAlternates(locale, path)`，返回 canonical 加每个 locale 一条 hreflang，
  用在归档、分类及其 `/page/N`、标签及其 `/page/N` 上；分页页面各自是 canonical，
  与 `/blog` 同一规则。
- **21 对页面的中英 description 相同**：标签没有本地化，归档页的描述写死了英文。
  归档描述改从翻译取（`blog.archiveDescription`）；标签页中文用翻译模板
  （`带有 NetSuite 标签的文章。`），英文用模板加标签自身的描述
  （`Posts tagged with NetSuite. Oracle NetSuite ERP.`）。
- **工具详情页没有分享卡片**（2 页）：它自己的 `openGraph` 把 layout 的整个替换
  掉，图片也没了。现在补一张带工具名和描述的 `/og` 卡片。

验证（`next build && next start`）：重跑审计，44 页都有指向自身的 canonical 和
en/zh hreflang，重复 description 从 21 组降到 0；`/og?title=Falling Sand&subtitle=…`
返回 `200` `image/png`；84 页与生产的可见文字 diff 正文无变化，差异都在
`<head>`；文章不够多的标签和分类的 `/page/2` 仍是 `404`，归档仍是 `200`；
`localeAlternates` 新增 2 个测试，故意改坏会变红。112 个测试、`typecheck`、
`i18n:check`、`next build` 通过。两篇文章标题超过 65 字符、一个项目描述 195
字符，属于内容问题，没有改。

### Changed — toast 库和搜索面板按需加载，Geist Mono 不再预加载（#60）

线上首页测得 **207 KB JS**（gzip，15 个文件）和两个预加载字体（各约 70 KB）。
大头是 Next.js / React 运行时和 next-intl，这些留着；有三样没必要每页都带：

- **`sonner`（toast，约 13 KB gz）** 每页都下载，用到它的只有文章页评论提交失败。
  `<Toaster />` 从 `[locale]/layout.tsx` 挪到文章页的 `<CommentForm />` 旁边。
- **搜索面板（约 4 KB gz）** 每页都下载，只在按 ⌘K 或点搜索时才用。layout 现在
  挂的是 `CommandPaletteHost`，只含 ⌘K / Ctrl+K 快捷键和 store 订阅，面板第一次
  打开时再用 `next/dynamic` 加载 `CommandPalette`，之后保持挂载，再开不用等。
  快捷键从 `CommandPalette` 里移了出来，两处都注册会一次按键切换两次。
- **Geist Mono 的 preload** 每次加载一开始就抓 71 KB，只为日期和小标签。
  `src/lib/fonts.ts` 自行声明这个字体，`preload: false`，其余配置（variable、
  weight、fallback 字体栈、`adjustFontFallback: false`）与 `geist` 包自己的声明
  一致。字体照样在排到等宽文字时加载，只是不再挤占关键路径。

结果（`next build && next start`，gzip）：`/en` 219.2 → 209.7 KB，`/en/about`
与 `/en/projects` 212.8 → 203.4 KB，`/en/blog` 218.4 → 209.0 KB，
`/en/tools/falling-sand` 216.1 → 205.8 KB，文章页 226.4 → 226.2 KB（它需要
sonner）；每页预加载的字体 2 → 1。

验证（浏览器里真实按键）：⌘K 打开面板并加载一个新 chunk，再按关闭、第三次
重开，每次只切换一次；Esc 关闭，搜索按钮能打开；输入「sand」出 Falling Sand。
toast 容器文章页有、`/en` 和 `/zh/about` 没有；stub 掉 `fetch` 让评论提交失败
（没有真的发出请求），错误 toast 正常弹出。日期仍用 Geist Mono 渲染
（`document.fonts` 显示已加载）。84 个中英页面与生产的可见文字 diff 只有少掉的
那条字体 `<link rel="preload">`。112 个测试、`typecheck`、`next build` 通过。

### Fixed — 按 ⌘K 后立刻打字，字会丢（#61）

在线上验证 #60 时发现：按 ⌘K 紧接着输入 `sand`，搜索框是空的。根因早于 #60：
面板打开 **50 ms 后**才用 `setTimeout` 聚焦输入框，而「打开时清空」的 effect
（`setQuery('')`）在首次渲染**之后**才执行，这段空窗里敲的字要么没进输入框，
要么被清掉。#60 改成首次打开才挂载面板，把空窗拉长到一次 chunk 加载；#60 的
本地测试没发现，是因为按键和输入之间隔了 800 ms。

- 输入框用 `autoFocus`，挂载时即获得焦点，不再用定时器。
- 查询、结果和选中项改在**关闭时**重置：下次打开照样是空的，打开后输入的字
  不会被清掉。
- `CommandPaletteHost` 在页面加载后第一次浏览器空闲时以关闭状态挂载面板
  （`requestIdleCallback`，最多等 3 s；不支持时用 `setTimeout`）。面板仍不在
  页面等待的脚本里，但在有人按 ⌘K 之前就已就绪；比这更早打开则立即挂载。

验证（`next build && next start`，真实按键）：⌘K 后立即输入 `sand`，四个字
全部保留并列出 Falling Sand，换成 `post` 同样正常；用 ⌘K 和搜索按钮关闭再打开，
输入框为空且已聚焦；↓ + Enter 跳到选中结果（`/en/blog`）并关闭面板。首屏 JS 与
#60 持平（`/en` 209.8 KB、`/en/about` 203.5 KB gzip），没有首屏脚本包含面板。
`typecheck` 与 `next build` 通过。

### Fixed — 中文页的读屏标签是英文，搜索框焦点外泄（#62）

对 15 个中英文页面做了可访问性审计：控件的可访问名称、图片 alt、标题层级与
`<h1>` 数量、重复 id 与 landmark、表单 label、`target=_blank` 缺 `rel`，全部
合格。不合格的只有两处：

- **中文页对读屏软件说英文。** 每个中文页有 3 个英文标签，中文文章页有 6 个。
  语言切换、菜单、主题切换（标签与 tooltip）、分享按钮、toast 区域
  （`containerAriaLabel`）和搜索框的标签全部改走翻译。按 WCAG 2.5.3
  （label-in-name），标签包含按钮上的可见文字：`切换语言：EN`、`分享到 Twitter`、
  `Switch language: 中文`。
- **搜索框是模态的，焦点却会漏出去。** Tab 会走进背后的页面，关闭后焦点落回
  `<body>`，键盘用户得从页面顶部重来。输入框是对话框里唯一可聚焦的元素（结果
  用方向键选），所以在输入框里按 Tab 不做任何事；`commandPaletteStore` 打开时
  记下 `document.activeElement`，关闭时还回去，Escape、⌘K、点背景、选中结果
  都走这条路径（`toggle()` 改为经过 `open()` / `close()`）；输入框补上 combobox
  语义：`role="combobox"`、`aria-controls`、`aria-autocomplete="list"`，
  `aria-activedescendant` 指向高亮的选项，选项补上 id。
- `ThemeToggle` 删掉 `sr-only` 的 span：`aria-label` 会覆盖元素内容，那段文字
  从来不会被读到。

Roadmap 上记为「未验证」的跳转链接这次用真实按键验证通过，没改代码：第一次 Tab
落在它上面，`:focus-visible` 生效，关掉过渡后 transform 为 `translateY(0)`。
之前读到的 −82px 是面板隐藏（`document.hidden`）时过渡停在第 0 帧。

验证（`next build && next start`，真实按键）：`/zh` 顶栏标签为 `搜索 (⌘K)`、
`切换语言：EN`、`切换到深色主题`、`菜单`；搜索框里输入 `post` 后按 3 次 Tab，
焦点仍在输入框，Escape 和第二次 ⌘K 都把焦点还给 `搜索 (⌘K)`；结果加载后
`aria-activedescendant=command-palette-option-0`，与 `aria-selected="true"`
的选项一致；中文文章页的英文 `aria-label` 从 6 个降到 0；与生产的 84 页 diff
只有 `aria-label` 值变化。112 个测试、`typecheck`、`i18n:check`、`next build`
通过。

### Added — 首页与 `/about` 可以直接打印成简历（#63）

首页和 `/about` 代替简历，而简历会被打印或存成 PDF，站点却没有打印样式。用
headless Chrome 打印线上页面：导航栏和「Skip to content」印在每一页上；卡片被
分页切成两半，`/about` 的 EXPERIENCE 标题孤零零落在第 1 页底部；Email、GitHub、
LinkedIn 印出来只是按钮形状，没有地址；博客封面图和项目渐变横幅各占一整页；
深色模式的访客会打出接近白色的字。

- **`globals.css` 加 `@media print`**：一律用浅色配色（`:root`、`:root.light`、
  `:root.dark` 都覆盖），白底、`@page` 边距，隐藏跳转链接与 toast，标题
  `break-after: avoid`，并设 orphans / widows。
- **逐页用 `print:hidden!` 隐藏**（多数元素带内联 `display`，所以要 `!`）：导航栏
  和页脚；首页的 hero 按钮行、浮动预览卡片、「→」区块链接、文章区、项目卡片的
  横幅与 CTA；`/about` 的链接胶囊与 CTA 卡片。
- 时间线条目、经历与项目卡片、技能分组加 `print:break-inside-avoid`。
- **新增 `<PrintContact />`**：只在打印时出现在名字下方的一行
  `email · github.com/… · linkedin.com/in/… · leetcode.com/u/… · www.jackdeng.cc`，
  由 `PROFILE_LINKS` 和 `printableUrl()` 拼出（3 个测试）。

结果（`next build && next start` 后用 headless Chrome 打印）：`/en/about` 从 3 页
变 2 页，带联系方式、不再印导航；`/en` 从 4 页变 3 页；`/zh/about` 2 页，版式
相同。屏幕上不变：联系方式行计算为 `display: none`，84 个中英文页面与生产的文本
diff 只多出这行隐藏文字（4 个页面）。115 个测试、`typecheck`、`next build` 通过。

### Security — Next.js 16.3.6 与 Payload 3.90.2 安全版本（#64）

**合并顺序：先在生产执行 `payload migrate`，再合并。** 3.90 每次查询 `users` 和
`media` 都会读两个新列。迁移只加列，当时线上的 3.89 构建会忽略它们；迁移执行前，
Vercel preview 构建会在预渲染时失败，因为它读的是生产库，而生产的 `media` 表还
没有 `_objectkey` 列。生产迁移已于 2026-09-24 执行（`payload_migrations` 第 19 批）。

- **`next` 16.3.5 → 16.3.6**：修复 GHSA-vcvr-r3jv-pc5j（critical），`next/og` 的
  `ImageResponse` 远程代码执行。本站 `/og` 当时跑在 Edge 运行时上，公告列为不受
  影响，但它是服务全站页面的框架的补丁版本，照升。#69 之后 `/og` 改跑 Node.js，
  正是公告里受影响的运行时，所以这次升级从「顺手」变成了必需。`next-intl` 4.14.4 → 4.14.7。
- **Payload 9 个包锁步升到 3.90.2。** 3.90.0 标注为一组 critical 安全修复、请尽快
  升级，细节不公开。用先卸载再安装的方式，不重新生成 lockfile，只有 Payload 自己的
  依赖树变动：40 处版本变化，主要是 `@lexical/*` 0.41 → 0.50。站点自己渲染存下来的
  Lexical JSON，没有直接依赖 `lexical`，所以 Lexical 升级只影响 admin 编辑器。对照
  升级说明检查过，适用于本项目的只有新的 auth 字段。
- **迁移 `20260924_000002_payload_3_90`**（幂等，带 `down`）：
  `users.reset_password_requested_at timestamptz`，供 forgot-password 限流；
  `media._objectkey varchar`，存储插件按每次上传划分的目录段。已有文件为 null，
  插件按只有前缀处理，路径不变，已有图片 URL 不变（在 `buildPrefixWithObjectKey`
  里核对过）。`payload-types.ts` 重新生成，多 2 个字段。
- **`scripts/schema-drift.ts` 推送时补一个占位的 `BLOB_READ_WRITE_TOKEN`。** 存储插件
  只在这个变量存在时启用，所以 CI 一直在比对一个没有插件字段的 schema：这次缺了
  `media._objectkey` 它也放行了，是 `next build` 撞上的。

验证在一次性 Docker Postgres 上进行，`.env.local` 事先移开：迁移加推送得到一致的
schema（179 列）；删掉 `_objectkey` 那行后检查准确报出这一列；`migrate:down` 再
`migrate` 往返正常；3.90 构建连临时本地用户，`POST /api/users/login` 返回 200 和
token、错误密码返回 401，`forgot-password` 返回 200 并写入
`reset_password_requested_at`，`/admin/login` 正常渲染。115 个测试、`typecheck`、
`i18n:check` 通过。

**未记录：** PR 计划在生产迁移后对生产库跑 `next build`、与线上 diff 84 页再合并，
这一步的结果 PR 描述里没有写。

### Added — Dependabot 每周检查依赖更新，Payload 的包成组升级（#65）

#64 的两个安全版本（Next.js 16.3.6 的 `next/og` critical RCE、Payload 3.90 的
critical 安全修复）是手动跑 `npm outdated` 发现的，之前没有任何东西在盯。新增
`.github/dependabot.yml`：

- **npm**：每周一 09:00 PT，最多 5 个未关闭的 PR。分四组：`payload` +
  `@payloadcms/*`；`next` / `next-intl` / `@next/*`；`react` 及其类型包；其余依赖
  的 minor 与 patch。
- **github-actions**：每月一次，全部合成一组。
- **Payload 必须锁步。** 每个 `@payloadcms/*` 包都精确锁定 `payload` 的版本，单独
  升一个会 ERESOLVE，#64 就遇到过。
- **忽略大版本**（TypeScript 7、GraphQL 17 等要等 Payload 和 Next 支持），安全修复
  会落在当前支持的大版本里。

CI 不需要 secrets，Dependabot 的 PR 照常跑。加了新列的 Payload 版本会被 schema-drift
检查（`code only: <table> | <column>`）和 Vercel preview 拦下，处理流程写在文件头
注释和 roadmap 里：在 PR 分支上写迁移，先在生产执行（只加列的迁移可以先于部署），
重跑 preview，再合并。

验证：用 ajv 按 SchemaStore 的 `dependabot-2.0.json` 校验通过；把 `interval` 改成
`fortnightly`、`update-types` 填非法值的副本，两处都被拒。

**需要手动操作：** 在 GitHub → Settings → Code security 打开 Dependabot alerts 和
Dependabot security updates。仓库目前关着漏洞告警（`GET /vulnerability-alerts`
返回 404），这是安全设置，PR 没有代改。打开后，已知 CVE 的修复会立刻开 PR，不必
等到周一。合并后还需确认 GitHub 已读到这份配置。

### Changed — CI 的 actions/checkout 与 actions/setup-node 从 v5 升到 v7（#66）

Dependabot 第一次 actions 分组更新，只改 `.github/workflows/ci.yml` 两行：
`actions/checkout` 与 `actions/setup-node` 都从 `@v5` 升到 `@v7`。两者都是大版本，
但 #65 的忽略大版本规则只管 npm，所以照常开了 PR。上游值得注意的破坏性变化：
checkout v7 不再允许在 `pull_request_target` / `workflow_run` 下检出 fork 的 PR，
setup-node v7 去掉了占位的 `NODE_AUTH_TOKEN` 导出；本仓库 CI 只由 `pull_request`
和 `push` 触发，也没用到 `NODE_AUTH_TOKEN`，两条都碰不到。这个 PR 自己的 CI 在
新版本上跑通。

### Changed — TypeScript 6.0.3、vitest 5.0.1、lucide-react 1.47、@libsql/client 0.18（#67）

Dependabot 第一次 other 分组更新，只动 `package.json` 与 lockfile：`typescript`
6.0.2 → 6.0.3、`vitest` 5.0.0 → 5.0.1、`lucide-react` 1.45.0 → 1.47.0、
`@libsql/client` 0.17.4 → 0.18.0。前两个是补丁版本，lucide-react 这两个 minor 是
新增图标和少量图标调整，上游说明里都没有破坏性变化。合并 main（带上 #66 的
checkout v7）后重跑 CI：typecheck、测试、i18n、schema drift 和 Vercel 构建都通过。

### Removed — 删掉用不到的 `@libsql/client`（#68）

站点跑在 `@payloadcms/db-postgres` 上，`src/`、`scripts/`、`next.config.mjs` 都没有
引用 libsql，它却在 `dependencies` 里，#67 刚让 Dependabot 把它升到 0.18，以后每次
libsql 发版都会再来一个 PR。查过谁还要它：`drizzle-orm` 只把它列为可选 peer，只有
Postgres adapter 不加载的 `drizzle-orm/libsql` 入口用得到；`withPayload` 把
`'libsql'` 写进 externals，包不存在时这条不起作用。lockfile 只删不增（−219 行、
18 个条目，全在 libsql 这一支，含它钉住的 `detect-libc@2.0.2`；sharp 等包各自嵌套的
2.1.2 不受影响）。验证：`npm ls @libsql/client libsql` 为空，typecheck、115 个测试、
`i18n:check` 通过，对生产库跑 `next build`（构建只读）编译成功，96/96 页，无警告。

### Fixed — 代码审查的前三条问题（#70）

对当天合并的 #53–#68 做了一轮代码审查，共 9 条问题，#70 修前三条，#71 修其余六条。

1. **本地推送守卫可以被绕过。** `isLocalDatabaseUrl` 接受带 query string 的 URL，
   而 `pg` 允许 `?host=` 替换 URL 里的主机：
   `postgresql://u:p@localhost:5432/db?host=<remote>` 能通过检查，实际连到
   `<remote>`。配合 `PAYLOAD_SCHEMA_PUSH=1`，就是往远程库推 schema，而
   `payload.config.ts` 写明任何设置都不能导致这种情况。现在带 query string 或
   fragment 的 URL 一律拒绝（`src/lib/localDatabase.ts`，新增 3 个测试）。
2. **`/api/csp-report` 会把不限大小的请求体整个读进内存。** 16 KB 上限只在请求带了
   `Content-Length` 时才提前生效；不带的话，`req.text()` 先读完整个 body 才检查，
   而且数的是 UTF-16 code unit，不是字节。新增 `readCapped`，自己读流，超过 16 KB
   就取消（`src/lib/cspReport.ts`，新增 4 个测试）。
3. **schema-drift 检查漏比外键规则，补上后查出真实漂移。** 约束快照原来只记表、约束
   类型和本表的列，现在比对 `pg_get_constraintdef`，外键指向、`ON DELETE` /
   `ON UPDATE` 规则和 `CHECK` 约束都在内。放宽后立刻查出：迁移建的 `tool_runs` 外键
   是 `ON DELETE CASCADE`，代码生成的是 `ON DELETE SET NULL`（Payload 给所有单值
   关系的默认规则）。`tool_id` 是 `NOT NULL`，`SET NULL` 只可能失败：删除一个有运行
   记录的工具会报错。**以 CASCADE 为准：** `payload.config.ts` 加 `beforeSchemaInit`
   hook，给 `tool_runs.tool` 设 `onDelete: 'cascade'`；新迁移
   `20260924_000003_tool_runs_cascade` 不管 `tool_id` 现有外键叫什么名字都先删掉，
   再加 CASCADE 的那条，幂等。

新迁移需要在生产手动执行，合并前后都可以，没有正在运行的代码依赖这条删除规则。
已于 2026-09-25 执行（第 20 批），2026-09-26 只读核对生产外键为 `ON DELETE CASCADE`。

验证：`npm test` 278 个通过，`typecheck` 无报错；本地 Postgres 16 上完整跑一遍
schema-drift（migrate → push → compare），列、约束、索引、枚举全部一致；对同时带着
两条 SET NULL 外键（`tool_runs_tool_id_fkey` 与 `tool_runs_tool_id_tools_id_fk`）的
`tool_runs` 连续执行两次新迁移，最后只剩一条 `ON DELETE CASCADE`。

### Fixed — 代码审查的其余六条问题（#71）

4. **迁移 `20260924_000001_align_schema_with_code` 补上对旧数据的处理。** `status`
   改成 NOT NULL 之前，先把 status 为 NULL 的博客文章设为 `draft`；某个 status 列里
   有新枚举没有的值时，迁移停下并指出是哪个值，而不是只报一个类型转换错误。生产
   已经跑过这个迁移，这次修改只影响新建的数据库（比如 CI 的 schema-drift 库），
   生产上不需要执行任何东西。
5. **打印配色补上 `--status-*` 和 `--accent-solid`**（`src/app/globals.css`）。之前从
   深色模式打印时，`#10b981` 会印在白底上，对比度约 2.5:1。
6. **选中搜索结果时不再把焦点还给即将离开的页面。** #62 让选中结果也归还焦点；现在
   `commandPaletteStore` 新增 `closeForNavigation()`，选中结果时用它关闭，Escape
   和点背景仍然归还焦点。
7. **标签页的英文 meta description 不再以 `..` 结尾**
   （`src/app/[locale]/blog/tag/[slug]/view.tsx`）：标签自己的描述已经是完整句子时，
   原来会再补一个句号。
8. **兜底分享卡的标题跟随页面语言**（`src/app/[locale]/layout.tsx`）。原来所有没有
   自己分享卡的 `/zh` 页面，分享出去的都是英文卡片。
9. **`ogCardUrl()` 统一拼 `/og` 的 URL**（`src/lib/ogCard.ts`）。博客、项目、工具和
   个人资料的分享卡都改用它，生成的 URL 与之前逐字节相同。

验证：`npm test` 281 个通过（新增 3 个 `ogCardUrl` 测试），`typecheck`、`i18n:check`
无报错；本地 Postgres 16 上 schema drift 全部一致。迁移守卫：回滚 `000001`，造一条
status 为 NULL 的博客和一条 `tool_runs.status = 'bogus'` 再重跑，有坏值时停在
`tool_runs.status holds values the enum enum_tool_runs_status does not have: bogus`，
删掉那行后跑通并把 NULL 改成 `draft`，再跑一次没有变化。浏览器（dev server）里：
`/zh/blog` 分享卡的副标题为「全栈工程师 · 专注后端与数据」，`/en/blog` 为英文；
`/wp-login.php` 和 `/en/nope/deeper` 仍返回 404；在页面中部选中搜索结果后直接跳转，
不会回焦旧链接；Escape 把焦点还回原处。

---

## [1.12.0] — 2026-09-23

### Security — 评论提交在同一个请求里验 Turnstile 并写库（#36）

评论表单先调 `/api/verify-turnstile` 验证，再把评论 POST 给 Payload 自带的
`/api/comments`，两个请求之间没有任何绑定，而 `Comments.access.create` 是
`() => true`：跳过第一步直接打第二步就能写库。线上确认过（未写入数据）：匿名
`POST /api/comments` 带空 body，返回 `400` 字段校验错误而不是 `403`。
修的过程中又挖出两个恰好互相抵消的问题，所以这套东西看起来一直正常：

- **生产从没配过 Turnstile。** `vercel env pull` 的 production 快照里没有
  `TURNSTILE_SECRET_KEY` 和 `NEXT_PUBLIC_TURNSTILE_SITE_KEY`，而旧路由缺 secret
  时直接返回成功，线上评论实际只有蜜罐和 IP 限流两道防线。
- **siteverify 地址是错的。** 旧路由打 `/turnstile/v1/siteverify`，Cloudflare
  对它返回空的 `404`（正确的是 v0），即使配了 secret 也会 100% 失败。这是新代码
  fail closed 之后，用 Cloudflare 的测试密钥跑 happy path 失败才追出来的。

改法是把验证和写入合成一个拆不开的请求：

- 新增 `POST /api/comments/submit`（校验 → 验 Turnstile → local API 写入），
  `Comments.access.create` 收紧为 `Boolean(req.user)`，删掉 `/api/verify-turnstile`。
- siteverify 改用 v0 并 fail closed：Cloudflare 不可达、非 200、body 不是 JSON，
  一律算失败。
- 限流 IP 只取 `x-real-ip` / `x-vercel-forwarded-for`，不读 `x-forwarded-for`、
  `cf-connecting-ip` 这类提交者能自己写的 header；取不到时与所有未知来源共用一个桶。
  已核实本站 DNS 直连 Vercel、前面没有 Cloudflare 代理；以后加了代理，这条限流会
  静默失效，代码里写了注释。
- 错误返回机器可读的 code，由浏览器翻译（en/zh 各加 6 个键）。反垃圾逻辑仍留在
  collection hook 里，以后新增的写入路径也覆盖得到。

**部署前提：** Vercel 生产必须配上面两个变量，否则提交一律 `503`。这是有意
fail closed，README 已补说明；当时评论数为 0，没有用户受影响。生产现已配置
（2026-09-26 核对：生产 JS 里编进了正式的 site key）。

验证在一次性 Postgres 上做（先用 `/api/blogs` 确认连的不是生产库）：旧路径
`POST /api/comments` 返回 `403`；测试密钥正常提交 `201`，落库为 `pending`；蜜罐
`400 bot_detected`；塞进去的 `status:"approved"` 和 `ip` 被忽略；轮换
`x-forwarded-for` / `cf-connecting-ip` 连发，全落同一个桶，第 6 条 `429`；不配
secret 时 `503` 且不写库。单测 37 → 61，新测试做过变异验证。

**未做：** `comments.turnstile_token` 列已停止写入但保留，按 #29/#32 的两步法
留给后续迁移 DROP。

### Added — 冒烟检查断言 404，i18n 校验进 CI（#37）

两个装了却拦不住的闸门。#27 的冒烟检查只问该在的页面在不在，所以 #34 那种软 404
（编造的 slug 返回 `200` 配 404 页面）在冒烟里一直是绿的；现在 `smoke.yml` 对五个
调 `notFound()` 的路由各打一个不存在的 slug，要求必须 `404`。
`scripts/i18n-check.mjs` 从 v0.8.0 起只靠人手跑，现在作为一个 step 放进已有的
`typecheck` job：分支保护要求的 check 名就是 `typecheck`，新开 job 会跑但拦不住
合并，#18 踩过这个坑。

验证：反向探针指向一篇真实文章时脚本报 FAIL、exit 1；指回编造的 slug，对生产
（只发 GET）14 条 `200`、6 条 `404`，exit 0。删掉 `zh.json` 一个键，i18n 校验
exit 1，补回后 exit 0。

### Changed — 项目详情页从 force-dynamic 改回 ISR（#38）

`projects/[slug]` 是全站唯一的 `force-dynamic` + `revalidate = 0`，每个请求打三次库
（`generateMetadata`、页面、相关项目各一次），而它的列表页早就是
`revalidate = 3600`。它是 v1.3.1（cd607e2）为修一个 `DYNAMIC_SERVER_USAGE` 500
改成这样的，当时的诊断是项目在 build 之后才 seed、`generateStaticParams` 返回 0 条
路径。**那个诊断是错的**：根因和 #26 相同，是 `[locale]/layout.tsx` 里的
`getMessages()` 读请求头，真正修好它的是 #26 的 `setRequestLocale`。

现在对齐 `blog/[slug]`：`revalidate = 3600` + `generateStaticParams`（每个 slug
两个语言），项目查询包进 React `cache()`，`generateMetadata` 和页面共用一次查询。

验证做了三次本地 `next build && next start`：本 PR 构建时 10 条路径预渲染，全部
`200 HIT`，编造的 slug `404`；让 `generateStaticParams` 临时返回 `[]`，真实 slug
首次 `200 MISS`、再次 `HIT`；在此基础上再注释掉 layout 的 `setRequestLocale`，
立刻 `500` `DYNAMIC_SERVER_USAGE`，4 月的现象原样重现。临时改动都已还原。

取舍：后台改项目最多 1 小时后才上线，和博客一致。按需 revalidate（Payload
`afterChange` → `revalidatePath`）适用于所有内容集合，留给单独的 PR。

### Added — 命令面板改由一个带缓存的服务端搜索路由应答（#39）

CommandPalette 每次输入（debounce 后）从浏览器并发打 `/api/blogs`、
`/api/categories`、`/api/tags` 三个 REST 端点，只 `like` 标题和摘要：正文搜不到，
项目和工具不在范围里。分类、标签的查询还没传 `locale`，Payload 回落到
`defaultLocale: zh`，线上英文站搜 `career` 得到 0 条（带 `locale=en` 是 1 条）。

- **`GET /api/search?q=&locale=`**：整站公开内容按语言建成纯文本索引
  （`src/lib/searchIndex.ts`），`unstable_cache` 1 小时，与页面同一个 revalidate
  窗口；按键时只在内存里扫索引、不查库，响应带 `s-maxage=300`。local API 默认跳过
  访问控制，所以过滤条件逐条对齐公开页面和 `sitemap.ts`。`locale` 缺失或不合法
  返回 `400`，查询截断到 100 字符、最多 8 个词。
- **匹配**（`src/lib/search.ts`，纯函数）：多词 AND；权重标题 10、摘要和关键词 4、
  正文 1；只命中正文时描述行换成命中处的片段。拉丁词按词首前缀匹配（`sand` 找得到
  Falling Sand，不会命中 thousands），CJK 按子串，匹配前先做 NFKC。
- **CommandPalette**：只调一次 `/api/search`，新请求会中止还在路上的旧请求；新增
  「项目」「工具」两种结果；改用 next-intl 的 `useRouter`，结果链接自带 locale，
  不再多绕一次 middleware 的 `307`；硬编码的 `Home` 等文案走 i18n（en/zh 各 9 个键）。

验证：新增 19 个单测（共 56 个），把代码改坏 14 次，每次都变红。本地生产构建下用
`career`/en、`职业`/zh、`sand`/en、`retry`/en（只在正文出现）等探针核对结果，
`locale=fr` 和缺 locale 返回 `400`。浏览器里在 `/zh` 搜 `postgresql`，只发出一个
请求，回车落到 `/zh/projects/pg-performance-toolkit`。`searchIndex.ts` 在 #40 之后
补了一个提交，改用 Payload 生成的类型，去掉 11 处 `as any`，转译出的 JS 前后相同。

刻意没做：限流（这条路径不查库）；关掉 `/api/blogs` 的匿名读（冒烟检查靠它取
slug）；Postgres 全文检索（Vercel data cache 单条上限 2 MB，够放几百篇文章）。

### Changed — 页面查询去掉 `as any`（#40）

`src/` 里有 83 处 `as any`，几乎都在页面查询上。但 `payload-types.ts` 里有
`declare module 'payload'`，`payload.find()` 本来就返回 `Blog` / `Project` /
`Tool`，是页面自己用强转丢掉了类型。去掉强转后报了 18 个错误，分四类处理：

- 关系字段是 `number | Doc`：新增 `populated()` / `populatedList()`
  （`src/lib/relations.ts`，带单测），替掉 6 份复制粘贴的过滤代码。
- 路由参数 `locale` 是 `string`：新增 `asLocale()`，用检查代替强转。
- BlogCard / Sidebar 自己定义的 Tag/Category 用 `id: string`，而 Payload 的 id 是
  `number`：改为从 `payload-types` `Pick`。
- CommentList / CommentForm 的 `postId: string` 实际一直收到数字：改为 `number`。

还有一种不写 `as any` 也会丢类型的写法：`.catch(() => ({ docs: [] }))`。
`strict: false` 下字面量 `[]` 是 `any[]`，和真实结果取并集后每个文档都退化成
`any`。全站 10 处收成泛型 `orEmpty()`（`src/lib/payload.ts`）。`strict: false` 下
回调参数悄悄变成 `any` 时编译器不报错，所以另写了一个探针，用 TypeScript API 逐个
检查声明的推断类型，范围内 14 个文件为零。83 → 16，剩下的是 `projects/[slug]`
（等 #38 合并）以及 Lexical 节点树、`payload.config.ts` 插件类型、scripts 等。

验证零行为变化：main 和本分支各做一次生产构建，抓 14 个页面比对可见文本、
href/src/alt、meta。12 页一字不差；`/en/blog/archive` 的差别就是下一节的修复；
`/en/tools/falling-sand` 内容相同，只是流式输出的 metadata 位置不同。测试 37 → 43。

**顺带发现，未在此改：** `.catch()` 吞掉数据库错误，首页、列表页、sitemap 查询
失败时渲染空列表并返回 `200`（见 #42）。

### Fixed — 英文归档页显示中文标题；文章页两处硬编码文案（#40）

- **英文归档页的标题全是中文。** `blog/archive` 的查询没传 `locale`，Payload 回落到
  `defaultLocale: zh`，线上 `/en/blog/archive` 4 篇文章都显示中文标题。这是这类缺陷
  第三次出现（#27 分类名、#39 搜索）。扫过全站的 `payload.find()`，其余不带 locale
  的查询只取 slug / `updatedAt`，或者查的是不分语言的集合，不受影响。
- **文章页的「相关文章」和目录标题是硬编码三元。** 改为 `t('relatedPosts')` 和
  `useTranslations('blog')`，TableOfContents 原来靠 `locale` prop 判断语言，这个
  prop 删掉了。`i18n:check` 只核对两份 json 的键是否一致，查不出这种绕开 json 的
  写法。验证：本地生产构建下 `/en`、`/zh` 的文章页各自只显示本语言的文案，
  hydration 之后仍然正确。

### Fixed — 查询失败不再渲染成空列表（#42）

首页、博客列表、项目列表、sitemap 的查询都包着 `orEmpty()`，数据库一出错就渲染成
「没有文章 / 没有项目」并返回 `200`，冒烟检查只看状态码，照样通过。本地生产构建
实测：首页、`/blog`、`/projects` 是 `ƒ` 动态路由，空页面不会被缓存，只是每次请求都
静默出错；真正被缓存的是 sitemap，模拟 blogs / projects 查询失败后，重验证的版本以
`HIT` 进缓存，URL 从 42 条掉到 33 条，线上会维持一整天（`revalidate = 86400`）。

- `sitemap.ts` 的 5 个查询、首页（文章和置顶项目）、`/blog`（连同
  `buildSidebarData().catch(() => ({}))`）、`/projects` 去掉兜底，直接抛错。
- 文章页「相关文章」保留降级为空，但 `orEmpty()` 现在必须传上下文，失败时
  `console.error`。
- `smoke.yml`：`/blog`、`/projects` 在 `(list)/loading.tsx` 的 Suspense 边界里，
  状态码随骨架先提交（同 #34），抛错后访客看到 `error.tsx`，状态码却仍是 `200`。
  所以 body 里出现数字 `data-dgst` 也判失败；正常页面上也有
  `BAILOUT_TO_CLIENT_SIDE_RENDERING` 这类非数字 digest，正则只匹配数字。

验证：临时让 `getPayload()` 返回一个按 flag 文件抛错的代理（已还原，未进提交）。
修复后 sitemap 两轮失败重验证仍是 42 条 `HIT`；首页 `500`；`/blog`、`/projects`
显示 `error.tsx` 并带数字 digest；只有相关文章失败时文章照常渲染，日志里有一条
`[orEmpty]`。改过的冒烟脚本对本地服务跑：正常时 14 条全过，模拟失败时首页和列表页
共 5 条判红，改之前这 5 条都会过。

**需要知道的：**

- 构建时连不上数据库，现在会让 build 失败，而不是产出一份缺内容的 sitemap。
- 首页置顶项目查询单独失败，也会让整个首页进 `error.tsx`。
- 相关文章失败时，空区块会被缓存一个重验证周期，这是有意的取舍。

### Fixed — 项目详情页「其他项目」查询失败时记日志（#43）

#42 让 `orEmpty(query, context)` 失败时先 `console.error` 再降级，当时
`projects/[slug]` 正被 #38 重写，没有改。现在「其他项目」的查询从内联
`.catch(() => ({ docs: [] }))` 换成 `orEmpty()`，出错时日志里有一条带页面和语言的
`[orEmpty]`。区块仍降级为空，页面照常渲染；ISR 下空区块最多缓存 1 小时，与文章页
「相关文章」一致。返回值带上 `Project[]` 类型，两处 `(otherProjects as any[])` 删除。

### Changed — 项目详情页自身查询的类型（#44）

接着 #40 做：`projects/[slug]` 当时正被 #38 重写，#40 跳过了它。沿用 `asLocale()` /
`populated()`，`getProject()` 返回 `Project | null`，文件里的 `as any` 从 9 处降到
4 处，剩下的都在「其他项目」区块，等 #43 换成 `orEmpty()`。本地构建与线上 10 个
项目页比对，除每次构建都会变的图标缓存哈希外完全一致。

### Changed — 项目详情页最后两处 `any`（#45）

接着 #40、#44：#43 让「其他项目」区块有了类型，剩下的 `locale: locale as any` 换成
`asLocale(locale)`，`techStack` 回调的 `(t: any)` 去掉注解，这个文件清零。转译后的
JS 只差这一行，layout 已挡掉非法 locale，行为不变。`src/` 里的 `as any` 从 #40 之前的
83 处降到 6 处，页面查询全部清零。

### Fixed — 开发模式启动时不再把 schema 推进生产库（#46）

`.env.local` 指向生产 Supabase，而 Payload 的 Postgres 适配器在非 production 环境下
默认 `push: true`，启动时直接把集合定义同步成数据库结构。于是每次 `npm run dev`、
每个没设 `NODE_ENV=production` 的 tsx 脚本，都在对生产库做一次不经迁移、不经审查的
在线 DDL。发现经过：一次只读的 tsx 查询输出了 `Pulling schema from database...`，
`payload_migrations` 里 `batch = -1` 的 dev 记录时间随之更新；这条记录 2026-04-04
就存在，说明以前已经发生过很多次。

改为 `postgresAdapter({ push: false })`（`src/payload.config.ts`）。仓库一直用迁移
管理表结构，不影响正常流程。验证：不设 `NODE_ENV`、以开发模式启动 Payload 读数据，
不再出现 `Pulling schema`，dev 记录的时间戳前后不变。

影响评估：按 OID 和 relfilenode 判断，当天那次运行没有新建表、索引或类型，也没有
重写表；`SET NOT NULL`、删默认值、删索引不留痕迹，无法百分之百排除。另与只跑迁移的
一次性库逐列比对，生产库有 24 处差异（几个列在生产上是枚举而迁移里是 `varchar`、
`blogs.status` 多了 `NOT NULL`、若干索引不同），按 OID 都早于 5 月 25 日。这些记进了
roadmap 技术债，**本 PR 不处理**，需要一条先在一次性库上彩排过的对齐迁移。

### Changed — 首页改成能代替简历（#47）

站点目标之一是在访问时代替简历，但从招聘方第一次打开的角度看，首页做不到：首屏是
「Building for the web」，没有名字、雇主、所在地，简历和联系方式都在 About 页最底部；
Tech Stack 只有 4 张卡，两张图标是占位的「NS」「N」，当前工作的 Databricks、dbt、
C#、React 都没列；经历不在首页；头衔写 Senior，和简历对不上。另外 About 页的
「Get in touch」链接到 `hello@jackdeng.cc`，而 `jackdeng.cc` 没有 MX 记录，
**邮件会被退回**；同一页的「Email」又是另一个 gmail 地址。

- **首屏**依次是所在地、名字、定位「Full-Stack Engineer · Backend & Data」、两句
  现状、Résumé (PDF) 主按钮和 Email / GitHub / LinkedIn。区块顺序改为经历 → 技能 →
  精选项目 → 最新文章。
- **`src/lib/profile.ts`** 集中联系方式、外链、技能、时间线，首页和 /about 都从这里
  读，不会再出现两个邮箱。`CONTACT_EMAIL` 暂用 gmail，`hello@` 配好转发后改这一行。
- **技能**按简历补上 Databricks、dbt、C#、React、SQL Server、MySQL、AWS S3；首页
  标题、About 标题、全站 meta description 去掉 Senior。
- 中文页上三处显示英文的地方改走 i18n：项目卡状态、技能分组名、日期里的「present」。
- 数据侧直接改了生产库：Databricks 平台置顶，Visa Monitor 取消置顶（都是可以改回的
  字段更新）。

验证：本地生产构建下两种语言的首页、About、项目、博客均 `200`；mailto 都指向
gmail，`hello@`、「Senior」「高级软件」出现 0 次；`/resume.pdf` 返回 `200`
`application/pdf`；375 宽度下没有横向滚动。

**待本人处理：**

- 经历条目上的职位名称：站点写 Software Engineer (Backend & Data)，正式职位是
  ERP Specialist，背调核实的是正式职位。
- Visa Monitor 仍出现在 /projects、sitemap 和搜索里，需要在 /admin 删除。
- PG 工具集的 GitHub 链接是 404。
- 4 月版的简历 PDF 与站点在细节上还有出入。
- 要用 `hello@jackdeng.cc`，需要在 Cloudflare Email Routing 配一条转发。

### Changed — 首页与 `[locale]` 下的列表页走 ISR 缓存（#48）

逐路由测了线上 TTFB 和 `x-vercel-cache`：文章详情、项目详情、About 是 `HIT`
（0.10–0.14s），首页 `/en`、`/zh` 每次 `MISS`（0.5–1.0s），项目列表、工具列表、工具
详情也每次 `MISS`，尽管它们都写了 `revalidate = 3600`。区别在
`generateStaticParams`：能走缓存的页面都有自己的，没走缓存的都没有，而
`[locale]/layout.tsx` 也没有声明 `[locale]` 的取值，Next 只能把这些页面标成 `ƒ`，
每次请求都渲染。

`[locale]/layout.tsx` 加 `generateStaticParams` 返回 `routing.locales`（next-intl
推荐的做法）；`tools/[slug]` 加 `generateStaticParams`，只列公开工具，没列出的 slug
仍按需渲染。构建输出里首页、项目列表、工具列表、工具详情从 `ƒ` 变成 `●`。

验证（`next build && next start`）：11 个页面连打两次全部 `200 HIT`；编造的 slug
仍 `404`；服务端日志没有 `DYNAMIC_SERVER_USAGE`；在缓存的中文首页上用命令面板搜
「落沙」能正常跳到工具页。

取舍：首页从每次实时查询变为最多 1 小时的缓存窗口。博客列表、分类、标签、归档读
`searchParams`，要改 URL 结构，另做（见 #51）。顺带发现的工具详情页不检查
`accessControl`，由 #50 修复。

### Security — 所有响应加基本安全响应头（#49）

线上唯一的安全响应头是 Vercel 自带的 HSTS，没有 `frame-ancestors` 或
`X-Frame-Options`，`/admin` 也一样，任何网站都能把后台嵌进 iframe 做点击劫持。
`next.config.mjs` 的 `headers()` 现在给所有响应加上：

- `Content-Security-Policy: frame-ancestors 'self'`
- `X-Frame-Options: SAMEORIGIN`（给不支持 `frame-ancestors` 的老浏览器）
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`

CSP 刻意只写 `frame-ancestors` 一条：完整策略要放行 Payload 后台、Turnstile 和
Vercel 的脚本，应先用 report-only 观察，而不是靠猜。站内没有依赖被 iframe 嵌入的
功能（文章预览在新标签页打开）；工具页的 `<iframe>` 是本站嵌别人，方向相反。

验证（本地生产构建）：页面、`/admin`、`/api/search`、`/resume.pdf`、`/sitemap.xml`、
`/robots.txt`、`/_next/static` 下的 JS、404 页都带上 5 个头；从另一个源用 iframe
嵌入首页和 `/admin`，浏览器报 `frame-ancestors 'self'` 拦截；`/admin` 登录页和落沙
正常，控制台没有 CSP、Permissions-Policy 或 MIME 相关的报错。

**未验证：** Turnstile 只配在 Production，本地和 Preview 都不会加载，只能合并后在
线上文章页确认。原理上 `frame-ancestors` 不限制本站嵌入的子 iframe，不受影响。

### Security — 工具详情页不再对外显示私有工具（#50）

工具详情页的查询只过滤 `status != offline`，注释说权限在渲染层处理，但渲染层并没有
任何检查；local API 默认跳过集合上的访问控制，所以一个上线状态的私有工具，任何拿到
slug 的人都能看到名称、描述和嵌入地址。线上当时只有一个公开工具（落沙），还没有
真正暴露。

页面、`generateMetadata`、`generateStaticParams` 现在共用同一个 `VISIBLE` 条件：
不是 offline，而且是 public。维护中的工具照旧可见并显示维护标记；私有工具对所有
访客（包括本人）都返回 `404`，在 /admin 里管理。要做到登录后可见，页面就得读会话，
#48 的缓存会退回动态渲染，所以没这么做。

验证：不往生产库写测试数据，另起一次性 Postgres 跑完 17 条迁移，建公开上线、私有
上线、公开维护、公开下线四个工具，再 `next build && next start`。修复前私有上线工具
返回 `200`，标题就是它的名字；修复后两种语言都是 `404`，HTML 里没有它的内容；其余
三个行为不变。测试中还发现页面调 `notFound()` 时 Next 会丢弃 `generateMetadata` 的
结果，metadata 这条路径原本没有泄露，但同样加了过滤，不依赖这一点。

### Changed — 博客列表、分类、标签、归档页走缓存，分页改为路径形式（#51）

#48 之后，`[locale]` 下只剩这四类页面每次请求现场渲染：前三个读 `?page=N`，归档读
`?year=&month=`，读 `searchParams` 会强制动态渲染，`revalidate` 不起作用。

- **分页改成路径段。** `/blog?page=2` → `/blog/page/2`，分类、标签同理。第 1 页留在
  不带页码的地址，`/page/1` `308` 回去；页码严格校验（`src/lib/pagination.ts`），
  `0`、`02`、`abc`、过大的数字都 `404`。新路由放在所有 `loading.tsx` 之外，否则
  Suspense 边界会让越界页码先提交 `200`（#34）。三个列表页各抽出一个 `view.tsx`，
  第 1 页和 `/page/N` 共用。
- **旧链接不失效。** `next.config` 的 `redirects()` 把 `?page=N`（N ≥ 2）永久重定向
  到新地址；`?page=1` 和不合法的值直接显示第 1 页。
- **归档页始终显示全部文章**，侧边栏的月份链接改为页内锚点（`#2026-9`）。顺带修了
  中文页上显示英文的两处：月份名来自写死的英文数组（现在用 `Intl` 按语言格式化），
  以及筛选提示里的「Showing:」「✕ Clear」。
- 第 2 页起标题带页码，canonical 指向页面自身。

验证：站上只有 4 篇文章，临时把每页篇数改成 1 构建：博客第 2–4 页、分类和标签第 2 页
首次 `MISS`、再次 `HIT`，标题带页码；越界和不合法的页码 `404`；`/page/1` 和
`?page=2` 都是 `308`。改回 12 后重新构建，六类页面全部 `HIT`，服务端日志无错误。
新增 5 个测试（共 91 个）。顺带发现博客链接不带语言前缀，由 #52 修复。

### Fixed — 博客链接保留语言前缀，首页项目卡片不再 404（#52）

两个问题同一个根源：`next/link` 和 next-intl 的 `Link` 混着用。

- **首页「精选项目」4 张卡片全部 404，持续了约 5 个月。** `HomeProjectCard` 用的是
  next-intl 的 `Link`，会自动加语言前缀，href 里却又手写了 `/${locale}/`，生成
  `/en/en/projects/…`，中英文都一样，从 2026-04-16 的 fb40d3f 起就是这样。href
  去掉前缀，组件多余的 `locale` 属性一并删掉。
- **博客链接不带语言前缀。** BlogCard、TagBadge、CategoryBadge、Sidebar、文章页面包屑
  用 `next/link` 写成 `/blog/xxx`，每次点击都经过 middleware 多一次 `307`，禁用
  cookie 时会按浏览器语言跳到另一种语言。改用 next-intl 的 `Link`；文章页「用另一种
  语言阅读」原来手写 `/zh/…`，改为用 `locale` 属性指定目标语言。

冒烟检查一直没发现，是因为它只用 `curl -L` 抓一份固定的 URL 清单，从不点页面上的
链接，`-L` 又会自动跟随重定向。新增冒烟步骤
「Every internal link resolves without a redirect」：抓 sitemap 里所有页面，不跟随
重定向，逐个检查站内链接，出现双重前缀、没有前缀或目标不是 `200` 就失败。

验证：同一个脚本对修复前的线上生产跑出 36 处失败、exit 1（4 个 `/en/en/projects/…`，
其余是不带前缀的 `/blog/…`）；对修复后的本地生产构建，42 个页面、46 个不同的站内
链接全部通过，exit 0。这个步骤从 YAML 里原样取出用 bash 执行过，确认 heredoc 缩进
正确。

---

## [1.11.0] — 2026-09-22

### Fixed — 首批文章发布后，所有文章详情页 500（#26）

首批 4 篇文章发布后，**每个文章 URL 都返回 500**：4 篇 × 2 个语言共 8 个页面，
`digest: DYNAMIC_SERVER_USAGE`。文章随即撤回为草稿，线上回到发布前的状态。

`[locale]/layout.tsx` 调 `getMessages()` 时不带 locale，next-intl 只能靠**读请求头**
确定语言，而这是一个 dynamic API。构建路由表里 `[locale]/blog/[slug]` 是唯一的静态
路由（`revalidate = 3600`），其余页面都读 `searchParams`，本来就是动态的。静态渲染里
调 dynamic API 会直接抛错，所以只有文章页中招。

一直没暴露，是两件事叠在一起：线上 `blogs = 0`，这条路由在生产上**从没被渲染过**；
`next dev` 又从不做静态渲染 —— 同样 4 篇文章，几分钟前在 dev server 里还是 200。
和 #23 的 `readingTime` 问题同一个模式：空集合藏住了真实缺陷。

修法是在 layout 里加一行 `setRequestLocale(locale)`。**必须放在 layout，不能放在
page**：layout 先渲染，放进 `[slug]/page.tsx` 就晚了（先这样试过，无效）。中途还一度
误判是 `Sidebar` / `CommentList` 里的 `getLocale()`，把两个组件都删掉重新构建，照样 500。

验证用的是本地**生产构建**（`next build` + `next start`），正是 dev 看不到的那一层：
8/8 文章 URL 返回 200，`DYNAMIC_SERVER_USAGE` 出现 0 次；两个语言的 `<html lang>`、
`<title>`、`min read` / `分钟阅读` 都正确；`/en`、`/zh/about`、`/en/tools`、
`/en/projects`、`/zh/blog/category/backend` 和两个博客列表页无回归；
`npm run typecheck` 干净，`npm test` 30/30。

**已知缺口：** CI 拦不住这类问题。#18 有意不跑 `next build`，Vercel preview 构建也照样
会过 —— **错误在请求期抛出，不在构建期**。本 PR 未处理，部署后冒烟检查见 #27。

### Fixed — 中文站的分类名和分类/标签页文案是英文（#27）

`Categories` 的 `name` / `description` 没有 `localized: true`。不是数据没填，是字段本身
就不支持两种语言，于是 `/zh` 的侧边栏、面包屑、`CategoryBadge` 和分类页标题显示的都是
`Career & Thoughts`、`DevOps & Tools`。所有查询本来就传了 `locale`，读路径上把字段改成
localized 就够了。

迁移 `20260922_000001_localize_categories` **有意只做加法**，不像
`20260525_000001_add_projects_localization` 那样删掉旧列。删列在两种部署顺序下都会留下
破损窗口：先迁移，线上旧构建 `SELECT` 一个已经没了的列；先部署，新构建 `SELECT` 一张
还不存在的表。保留旧列并去掉 `NOT NULL`（让 Payload 仍能 `INSERT` 新分类），迁移就能在
部署**之前**跑，不停机。先在生产库的事务里彩排并回滚，再正式执行（batch 14），之后在
旧构建上复查 `/en/blog`、`/zh/blog`、一个文章详情页、`/zh/blog/category/backend` 和
`/en`，仍然全是 200。英文值写进 `en` 槽、中文写进 `zh` 槽，**不沿用** projects 迁移那种
先全塞进默认 locale、以后再回填的做法 —— 本站用 fallback 拿英文充中文就是这么来的。

分类页和标签页各有三处硬编码英文：`<title>`、meta description 和 eyebrow 标签
（`${cat.name} — Blog`、`Posts in the ... category.`、`Category` / `Tag`），现在都走
next-intl，en/zh 各 172 个 key。

验证（本地生产构建）：`/zh` 的分类名和描述是中文、`/en` 是英文；分类页与标签页的
`<title>` / meta description / eyebrow 跟随语言；首页、about、tools、projects、两个博客
列表、两个文章详情页和 `/en/blog/archive` 全部 200，无服务端报错；`typecheck` 干净，
`npm test` 30/30，`i18n:check` 0 错误 0 警告。

**有意没做：** Tags 不本地化（NetSuite、PostgreSQL、Docker 是专有名词）；分类 slug 也
不本地化，一个分类一个 URL，hreflang 配对和已有链接保持不变。废弃的 `categories.name` /
`.description` 等这个构建上线后另起迁移删除（#29）。

**已知的短暂现象：** 侧边栏包在 `unstable_cache` 里（`revalidate: 3600`）。缓存 key
**包含** locale（清掉 `.next/cache` 后先请求 `/zh` 再请求 `/en` 验证过），但改动前写入的
条目还在，`/zh` 可能要等它们过期才显示中文分类名。

### Added — 部署后冒烟检查（#27）

#26 那个把每篇文章都变成 500 的提交，`typecheck` 过了、单元测试过了、Vercel 构建也是
绿的 —— 错误在请求期抛出，CI 里没有任何一步真正去取一个页面。

新增 `.github/workflows/smoke.yml`：生产部署成功后请求 12 个 URL，其中包括**两个语言**的
文章详情页，slug 从 `/api/blogs` 读取。它挂在 `deployment_status` 上而不是
`pull_request`，因为它需要一个已部署的 URL 和背后的生产库。脚本对生产 dry-run：12/12。
触发条件写错了，合并后并没有真正跑起来，见下一节。

### Fixed — 冒烟检查从未触发（#28、#30）

#27 加的冒烟检查**每次部署都被跳过**，包括 `main` 上的生产部署。运行记录照样出现在列表
里、看起来一切正常，这比没有这个检查更糟。

- **#28：Vercel 发的环境名不是裸 `Production`。** 查 deployments API，实际是
  `Production – <project>`（en dash），`== 'Production'` 永远不匹配。改成 `startsWith` +
  `endsWith`，`endsWith` 顺带挡住同一仓库上的第二个 Vercel 项目 `jackdeng-hub-83t7`，
  免得它对同一个 URL 再跑一遍。此后作业跑过一次并通过（run `35789039910`，12/12）。
- **#30：删掉重复项目后又开始跳过。** Vercel 只在一个仓库挂了多个项目时才在环境名后面
  追加项目名来区分。删掉 `jackdeng-hub-83t7` 后环境名退回裸 `Production`（deployments API
  里 `cba2c9e` 发的是 `Production – jackdeng-hub`，`354de46` 发的是 `Production`），
  `endsWith` 随即失效，紧接着的那次部署就跳过了。改为只匹配前缀：后缀只在多项目并存时
  存在，前缀才不会变。`environment_url` 也用不上，它是每次部署自己的 `vercel.app`
  域名，挡在 deployment protection 后面，不是正式域名。

**接受的代价：** 以后再挂第二个项目，作业会对同一个 URL 跑两次。吵，但看得见，好过悄悄
不跑。两次修正的验证方式相同：合并即部署生产，触发 `deployment_status`，作业跑不跑就是
全部的测试。

### Removed — 删除 `categories` 的旧列（#29）

#27 两阶段迁移的第二步：`20260922_000002_drop_legacy_category_columns` 删掉已无人读取的
`categories.name` / `.description`（`categories_name_idx` 随之删除，按语言的唯一性由
`categories_locales_name_idx` 保证）。`20260922_000001` 的 `down()` 会先更新这两列，所以
本迁移的 `down()` 要把两列加回并从 `en` 槽回填。生产库事务里彩排 up → down → up 后回滚
（6/6 行还原、0 空值），再正式执行（batch 15）；之后十个生产路由全部 200，写路径（新建
分类、写两个语言、读回、删除）正常。

### Fixed — builtin 工具无法渲染，Tools 字段不支持多语言（#31）

`/tools` 从集合上线起就显示 "No tools available yet"。放第一个工具进去之前有两件事必须
先成立，而它们都被空表藏住了。

- **`embedType: 'builtin'` 是个死选项。** 后台提供 "Built-in page"，但详情页只处理
  `iframe` 和 `script`，选它只会落到占位页。另外 `isAutomation ? <VisaMonitorDashboard />`
  让**所有**自动化工具都渲染签证监控面板，而这个组件是以某个具体工具命名的。两处都换成
  按 slug 的注册表（`src/components/tools/registry.tsx`）；没注册的 slug 仍落到占位页，
  这是诚实的结果：记录在，页面还没写。
- **`Tools` 没有本地化字段，和 #27 的 Categories 同一个缺陷。** `name` / `description`
  是单列，用 `locale: 'zh'` 写中文名只是一次 `UPDATE`，把英文名覆盖了，表现是英文页标题
  变成「落沙」。另一半：列表、详情、`generateMetadata` 三处查询**都没传 `locale`**，字段
  即使本地化也会回落到默认 locale（`zh`）；Categories 没有这一半，因为那些页面本来就传了。
  迁移 `20260922_000003` 和 #27/#29 一样只做加法、先彩排，已在生产执行（batch 16），
  还顺带把 `visa-checker` 的英文名和中文描述拆回各自的语言。

验证：每个语言显示自己的名称和描述，`<title>` 在 `/en` 是 `Falling Sand`、在 `/zh` 是
`落沙`。废弃的 `tools.name` / `.description` 留给后续迁移删除（#32）。

### Added — 落沙工具（#31）

`/tools` 的第一个工具（`src/components/tools/FallingSand.tsx`）。200×120 网格上的元胞
自动机：沙会堆积，水会铺开并找平，沙能沉过水，石头不动。绘制时把一张网格大小的
`ImageData` 关掉平滑后放大，而不是调几千次 `fillRect`。画布本身透明，背景取
`var(--bg-panel)`，两种主题下都对，不用读 computed style，也不用在切主题时重绘。设了
`prefers-reduced-motion` 时启动即**暂停**；初始预置一堆沙，第一帧就是沙在落，而不是一个
空矩形。

冒烟检查加上工具详情页，两个语言各一条，slug 从 `/api/tools` 读取：匿名调用只返回
online + public 的工具，跟着实际上架的内容走，不会因为改名而悄悄失效。dry-run 确认工具
还在预备状态时会正确走跳过分支。

验证（本地生产构建，两个语言、两种主题、桌面与 375px）：物理正常（沙堆成沙丘，水倒上去
填平低处）；绘制、切换材料、笔刷、暂停、清空都可用；移动端控件换行，
`scrollWidth <= innerWidth`，无横向溢出；`typecheck` 干净，`npm test` 30/30，
`i18n:check` 0 错误。

合并时记录是 `maintenance`，详情页能渲染，但 `/tools` 和 sitemap 都只列 `online`，
所以在画它的构建上线前不会对外展示。部署后已改成 `online`，
`/en/tools/falling-sand` 返回 200。

### Removed — 删除 `tools` 的旧列（#32）

#31 两阶段迁移的第二步，做法同 #29：`20260922_000004_drop_legacy_tool_columns` 删掉
`tools.name` / `.description`，`down()` 同样要把两列加回并从 `en` 槽回填。生产库事务里
彩排 up → down → up 后回滚（2/2 行还原、0 空值），再正式执行（batch 17）。之后九个生产
路由 200，`<title>` 仍分别是 `Falling Sand` / `落沙`；插入路径（不带 name / description
的基础行加每个语言一条 `tools_locales`，事后回滚）正常。至此 `categories` 和 `tools`
都已完全本地化，不再有废弃列。

### Removed — 删除 visa-checker 面板及其文案（#33）

这个工具上线以来一直是 `offline` + `private`，`tool_runs` 停在 **2026-04-16**，背后的
自动化已经五个多月没推送过数据。与其为一个没在跑的东西设计出站触发通道，不如删掉。

- **代码：** 删掉 `VisaMonitorDashboard.tsx`（473 行，只有一个使用方）和它在注册表里的
  条目，注册表只剩落沙一项；整组 `tools.dashboard.*` 文案一并删除。理由和 #20 删
  next-auth 一样：只有一个使用方，就删掉而不是泛化。
- **数据：** `tools` 记录及其 `tools_locales` 行、21 条 `tool_runs`，在这次部署之后
  删除（现在 `tools` 只剩落沙一条，`tool_runs` 为 0）。**先代码后数据**：部署前
  删记录，线上构建的注册表会指向一个不存在的工具。`tool_runs` 必须跟着删，因为外键
  `tool_runs_tool_id_tools_id_fk` 当时是 `SET NULL` 而不是 `CASCADE`（#70 起改为
  `CASCADE`），只删工具会留下 21 条 `tool_id` 为 NULL 的行，和 v1.9.2 清掉的孤儿
  媒体文件是一回事。

**有意保留：** `ToolRuns`、`POST /api/tools/[slug]/callback` 以及 `Tools` 上的 cron /
webhook 字段。它们都与签证无关，是以后的自动化工具接入用的通用**入站**管道，留着没有成本。

验证（本地生产构建）：`/tools` 和两个语言的落沙页 200，无服务端报错，`typecheck` 干净，
`i18n:check` 通过，每个语言 156 个 key。验证时顺带发现的软 404 由 #34 修复。

### Fixed — 不存在的 slug 返回 200 而不是 404（#34）

站内任何编造的 slug 都返回 **HTTP 200** 配 404 页面正文，`blog/[slug]`、
`blog/category/[slug]`、`blog/tag/[slug]`、`tools/[slug]`、`projects/[slug]` 都是如此，
只有完全匹配不到路由的 URL（如 `/en/totally-bogus-page`）才是真 404。搜索引擎会把软 404
当成有效页面。与 v1.6.2 修过的根路由 `307→404` 同一类。

原因不在 404 处理，在 `loading.tsx`。v1.8.0 给三个列表页加了骨架，而 **`loading.tsx`
作用于整个子树**，上面五个详情路由都落进了 Suspense 边界。响应一旦开始流式输出，**状态码
随第一个数据块就提交了**，远早于页面走到 `notFound()`；404 的 UI 照常流下去，但 200 已经
发出。受影响的恰好是调用 `notFound()` 的这五个页面。

定位过程：从只调 `notFound()` 的最小页面起，逐个加上动态 `[slug]` 段、
`generateStaticParams` + `revalidate`、`notFound()` 之前的 Payload 查询、
`getTranslations`、`generateMetadata`，都是正确的 404；删掉 `[locale]/not-found.tsx`、
把路由移出 next-intl matcher，真实路由仍是 200。最后把博客详情页**逐字复制**到另一个目录，
复制品返回 404。唯一的差别是原页面旁边的 `loading.tsx`，给复制品旁边也放一个，立刻变 200。

修法：三个列表页连同各自的 `loading.tsx` 移进路由组 `(list)`（如
`src/app/[locale]/blog/(list)/`）。路由组不影响 URL，`/blog`、`/tools`、`/projects`
不变，边界也不再罩住同级的详情路由。`blog/archive` 原本也在旧边界里，它是列表页、不调
`notFound()`，流式输出对它没有代价，所以单独补了一个 `loading.tsx` 保留骨架。

验证（本地生产构建）：8 个编造路径（覆盖两个语言）返回 404；9 个真实页面 200，含两个
列表页、归档、一篇文章、一个工具、一个分类页和一个标签页；4 个列表页仍有骨架；404 正文
语言正确（`Page not found` / `找不到`）；服务端日志干净，`typecheck`、`npm test` 30/30、
`i18n:check` 全部通过。

### Added — 生命游戏模式（#35）

和落沙共用一块画布。落沙是 200×120、每帧推进；生命游戏用 100×60 的粗网格（200 宽的板子
上一个 glider 只是个小点），按自己的 80ms 时钟推进，速度不随显示器刷新率变化。两者都是
5:3，切换模式时画布尺寸不变，布局不跳。控件随模式切换：Water 和 Stone 换成 **Draw**、
**Eraser** 和一个 **Step**（暂停时单步推进），Randomize 重新填充当前模式。

规则（B3/S23，环面）抽成纯函数 `src/lib/life.ts`，测试在 `src/lib/life.test.ts`。邻居数
算错的自动机照样闪得像模像样，画布自己证明不了对错，所以用行为已知的图案校验：block 在
1 代和 10 代后不动；blinker 翻转，且奇数步后落在正确相位；glider 每四代沿对角线走恰好
一格，仍是五个细胞；跨边界的 blinker 经过环绕后存活；出生与死亡边界（三个邻居出生、两个
不出生、四个致死）。按 #24 定下的做法，每条断言都故意改坏规则确认会红：存活 `2` → `4`
红 3 条，裁剪边界代替环绕红 2 条，出生条件 `3` → `2` 红 5 条。规则复原后 37 个测试全过。

验证（生产构建）：画布变为 100×60，控件切换正确；随机初始的细胞密度两秒内从 4.8% 降到
3.87%，朝生命游戏已知的约 3% 残余密度收敛；细胞分布在上下两半（上 167 / 下 65），没有
像沙一样堆到底部；两个语言都有模式名、控件、提示和画布 `aria-label`；375px 下
`scrollWidth === innerWidth`，无横向溢出；`typecheck`、`i18n:check` 干净。

---

## [1.10.0] — 2026-09-14

### Fixed — 运维脚本不预先 export 就连不上数据库（#16）

`npx tsx scripts/<name>.ts` 一律以 `connect ECONNREFUSED 127.0.0.1:5432` 挂掉，
除非 shell 里恰好已经 export 了 `DATABASE_URI`。十个脚本症状相同，成因分两批：

- **`scripts/` 下是 ESM import hoisting。** `cleanup-blogs.ts`、`seed.ts`、
  `upload-test-images.ts` 把 `dotenvConfig()` 写在静态 import 之间，但 ESM
  先求值所有静态 import，`src/payload.config.ts` 读 `DATABASE_URI` 时 `.env`
  还没加载，postgres adapter 回落 localhost:5432。沿用 `purge-test-media.ts`
  的修法：dotenv 留在顶部，config 改在 async 函数里动态 `await import`。
- **`src/scripts/` 下根本没有 dotenv。** `seed-taxonomy.ts`、`verify-taxonomy.ts`、
  `seed-databricks-project.ts` 改成同样的形态。

`reset-media-and-apply.ts` 其实没被 hoisting 坑到（`import 'dotenv/config'` 按
书写顺序求值），缺的只是 `.env.local`；`apply-projects-localization.ts`、
`snapshot-projects.ts`、`verify-migration.ts` 是纯 `pg` 脚本，只补了 dotenv 调用。

**副作用：** `.env` 的 `DATABASE_URI` 指向生产 Supabase。此前写库脚本连不上
localhost 就死，等于一根意外的保险丝；修好之后它们起手即写生产库，没有预演也
没有确认。替代的守卫见 #17。

验证：`tsc --noEmit` 零报错；只读的 `verify-migration.ts`、`verify-taxonomy.ts`
连通生产库、输出正常；payload init 那一半用临时脚本验证后删掉。写库脚本一个没跑。

### Added — 写库脚本对生产库默认拒绝执行（#17）

#16 拆掉保险丝之后，`npx tsx scripts/seed.ts` 会直接写生产 Supabase。新增
`scripts/lib/env.ts` 作为有意的替代：

- `loadEnv()`：先 `.env` 再 `.env.local`，收掉十份各自复制的 dotenv 前导块。
- `requireApply()`：`DATABASE_URI` 的 hostname 匹配 `/\.supabase\.(co|com)$/`
  时，没有 `--apply` 就 exit 1，而且在建立数据库连接之前退出。只打印
  hostname，完整 URI 里带密码。

这是拒绝执行，不是 dry-run：脚本内部逻辑一行没改，加上 `--apply` 后行为和以前
一样。真正的 dry-run 要把每处写入调用都包一层，不该作为这次修复的副产品塞进来。
七个写库脚本（`seed` `cleanup-blogs` `upload-test-images` `reset-media-and-apply`
`apply-projects-localization` `seed-taxonomy` `seed-databricks-project`）两个都加；
`verify-migration` `snapshot-projects` `verify-taxonomy` 只加 `loadEnv()`；
`purge-test-media` 保留自己更严的 `--apply` 门禁，不叠加。

验证：七个写库脚本不带 `--apply` 全部拒绝、exit 1；`verify-migration.ts`、
`verify-taxonomy.ts` 和 `purge-test-media.ts` 的 dry run 经 `loadEnv()` 照常运行；
`tsc --noEmit` 零报错。全程没有任何脚本带 `--apply` 跑过。

### Added — CI typecheck job（#18）

#16、#17 合并时没有任何自动检查，`tsc --noEmit` 是手动跑的，`main` 也没有
分支保护。新增 `.github/workflows/ci.yml`，每个 PR 和 push to main 跑 `npm ci` +
`npm run typecheck`；`package.json` 补上 `typecheck` 脚本和声明 Node 大版本的
`engines` 字段。`tsconfig.json` 的 include 是 `**/*.ts`，`scripts/` 与
`src/scripts/` 也在检查范围内。

刻意不跑 `next build`：Payload 在 config 求值时读 `DATABASE_URI`，CI 跑 build
就得把数据库凭据放进 repository secrets，而项目只有生产库一个库。Vercel preview
本来就跑完整 build（`next.config.mjs` 没设 `typescript.ignoreBuildErrors`），
它唯一不做的是拦住合并。eslint 也没加：给 97 个既有文件从零加 lint 应该单独开 PR。

光有这个 job 只会跑、不会拦，还得在仓库设置里给 `main` 开分支保护，那一步不在
代码里。合并时一并开启：required check 为 `typecheck`，不强制 review，管理员
可以绕过。合并前在分支上故意推了一个类型错误，CI 变红，下一个提交还原后变绿。
本地 `npm run typecheck` exit 0。

### Security — 匿名访客不能再枚举媒体库（#19）

`src/collections/Media.ts` 的 `access.read` 是 `() => true`，不登录就能
`GET /api/media` 拿到整个媒体库清单：文件名、alt 文本、mime 类型、尺寸、CDN
URL。`purge-test-media.ts` 的文件头早就点出过这一点，当时清掉了图，没堵口子。
`media` 表现在是 0 条，洞是潜伏的；但填内容必然要上传真实图片，所以排在内容
之前修。改为 `Boolean(req.user)`。

**只堵匿名枚举，不让文件私有。** `src/payload.config.ts` 配了
`disablePayloadAccessControl: true`，图片 URL 是 Vercel Blob 的公开 CDN 地址，
会随 `coverImage.sizes.*.url` 发到前端，知道 URL 就能直取。要文件也私有得去掉
这个选项、让每张图走 Payload 代理，代价是丢掉 CDN，这次不做。`payload.config.ts`
里说 media 全公开的那条注释同步改掉。前台不受影响：公开页面走服务端 Local API，
默认 `overrideAccess: true`。

验证（本地 dev server）：匿名 `GET /api/media` 改前 200、改后 403；
`purge-test-media.ts` dry run 走 Local API 照常读到 media；`/en`、`/en/blog`
渲染正常、无新增 console error，网络日志显示页面自身从不请求 `/api/media`。

### Removed — 删掉 next-auth，工具面板改认 Payload 登录态（#20）

1.9.1 记下的「两套登录混用」：`VisaMonitorDashboard` 用 next-auth 的 Google
session 决定渲染，它拉的 `/api/tool-runs` 却由 Payload 的 `req.user` 把关。
Google 登录后每次 fetch 都 403，`data.docs ?? []` 加空的 `catch {}` 把错误吞掉，
显示成一个空面板，和「这个工具从没跑过」分不出来。

next-auth 全站只有这一个消费者，所以没做 session 桥接：面板改读
`/api/users/me`，第二套鉴权整个删掉 —— `src/app/api/auth/[...nextauth]/route.ts`、
`next-auth` 依赖（连带 14 个传递依赖）、`.env.example` 里的 `NEXTAUTH_URL` /
`NEXTAUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`，以及无引用的
`src/components/VisaMonitorPanel.tsx`（186 行）。非 2xx 响应现在显示成横幅；
未登录态不再链到 `/admin/login`（工具页可能是公开页），只留提示文案。

**受众变化（有意保留）：** 原 next-auth 白名单只放行一个 Google 账号，现在任何
Payload 用户都能看到面板（`users` 表目前 2 行）。但 `ToolRuns.access.read` 一直是
`Boolean(req.user)`，这些记录本来就能直接调 API 读到，这次只是让 UI 与之一致。
要真限制到一个人，该改的是 `ToolRuns.access.read`。

验证：匿名 `GET /api/users/me` 200、`user: null`；匿名 `GET /api/tool-runs` 403；
`GET /admin` 200（本地缺 `NEXTAUTH_*` 变量时 admin 500 的老问题随之消失）；
`tsc --noEmit`、`scripts/i18n-check.mjs` 通过。

**未验证：** 登录后的面板渲染。`/tools/visa-checker` 是 `offline` + `private`，
目前 404，要让它可见得写生产库，没做。Vercel 上的 `NEXTAUTH_*` /
`GOOGLE_CLIENT_*` 环境变量已成残留，可以清掉。

### Added — 从 markdown 写入博客文章的脚本（#22）

新增 `scripts/publish-drafts.ts`：把 markdown 转成 Payload 存储的 Lexical 节点，
上传题图，写进数据库。文章一律建为 draft，在 `/admin` 点发布之前不公开。
提交前自查出 4 条问题，修了 3 条，前两条已经写进了生产库：

- **markdown 链接存成字面量。** 第一篇里是原样的 `via [kore.ai](https://...)`；
  行内解析器现在产出 Lexical `link` 节点。
- **无序列表被压成一段。** 按空行切块后又把块内换行换成空格，四条 Sources
  成了一段带连字符的文字；改为逐行解析，产出 `list` / `listitem` 节点。
- **分类和标签用裸主键引用。** 改为按 slug 查找，换库时直接报错而不是归错类。

第 4 条有意保留：media 复用检查按源文件名查，Payload 入库时若改了文件名就查
不到，代价是多传一份文件，不会写错文章。已入库的两篇靠把「slug 已存在就跳过」
改成「更新正文」修好，只动 `content`，不碰 `/admin` 里改过的状态、封面和发布时间。

**`BLOB_READ_WRITE_TOKEN` 防护：** 没有这个 token 时 `vercelBlobStorage` 不启用，
Payload 把文件写进 `./public/media`，却在共享数据库里记下 `/api/media/file/...`
的 URL，指向只存在于某台笔记本上的文件。脚本第一次运行就是这样，事后删了两条
坏 media 记录。现在上传前会拒绝；更新路径不碰文件，不要求这个 token。

验证：`npm run typecheck` 通过；不带 `--apply` 时被生产库守卫拦住；重跑后回读
21 号文章，节点为 `{paragraph:14, heading:4, list:1}`，list 有 4 个 item，首项含
指向正确 URL 的 `link` 节点，原始 markdown 语法为零。之后直接推到 main 的
`975c1ef` 修了收尾提示：原先每次都说封面还要去 `/admin` 手动挂，连刚挂好四张
封面的那次也是，现改为说明日志里没点名的封面都已挂上。

### Fixed — 阅读时长恒为 1 分钟，中文按空格分词（#23）

两个 bug 都早于这次工作存在，只是站上一直 0 篇文章、0 条中文内容，本地渲染
第一批真实文章时才看见。都在 `src/lib/readingTime.ts`：

- **每篇都显示「1 min read」。** `countWords` 收到的 Lexical 文档是
  `{ root: { children: [...] } }`，顶层既没有 `text` 也没有 `children`，遍历返回
  0，`Math.max(1, 0)` 得 1。改为从 `root` 开始数。933 词的文章修复前 0 词、
  1 分钟，修复后 5 分钟。
- **中文按 `/\s+/` 切词。** 1,454 个汉字被数成约 170 个「词」，又是 1 分钟。
  现在 CJK 字符单独按 400 字/分钟计，空格分隔的文本仍按 200 词/分钟；切词前先
  剥掉 CJK，混排文本不会数两遍；两个分数相加后再取整，夹着英文术语的中文文章
  不会被向上取整两次。

验证：对 id 21–24 四篇文章的 8 个语言槽实算，英文 4–5 分钟、中文均为 5 分钟；
浏览器里中文页显示「5 分钟阅读」，英文页「5 min read」。

### Added — 纯函数单元测试（#24）

#23 的两个 bug 都是纯函数 bug，五行的单元测试当场就能抓到。同目录的
`src/lib/extractHeadings.ts:35` 写的是 `if (!content?.root?.children) return []`，
同一个数据结构它处理对了，仓库里却没有任何东西能分辨两者。CI 闸门拦得住类型
错误，拦不住「看着对但算出来是 0」。

引入 `vitest` 和 `npm test`，在现有 CI job 里加一步。30 个测试覆盖四个纯函数
模块，不碰数据库和浏览器，不需要 secrets，required check 名字 `typecheck` 不变：

- `readingTime`：从 root 下钻、英文 200 词/分、中文 400 字/分、混排不重复计数
  也不二次取整、junk 输入返回 1。
- `extractHeadings`：层级与文档顺序、跨子节点的标题文本拼接、重复 id 去重、
  CJK slug。
- `formatDate`：en / zh 输出，未知 locale 退回英文。
- `toLexical` / `inline`：从 `scripts/publish-drafts.ts` 抽到
  `scripts/lib/markdown.ts` 以便 import；#22 里进过生产库的两个缺陷（链接存成
  字面量、列表压成一段）各有测试盯着。

每条断言都靠把被测代码改回坏的版本确认过：root 下钻改回原样 5 个红，去掉
CJK 分支 1 个红，去掉 inline 正则里的链接 token 2 个红，还原后 30 个全绿。

自查还发现 `formatDate` 按本地时区渲染，测试里固定的 9 月 14 日在 UTC+12 读出来
是 9 月 15 日；CI 跑在 UTC 上永远绿，只有新西兰、澳东的贡献者会踩到。
`vitest.config.ts` 把 `TZ` 钉为 UTC，移走配置在 `Pacific/Auckland` 下重跑确认
那两条报错，放回后变绿。刻意不做：组件测试、e2e、覆盖率指标、eslint。

### Docs

- #21：`PROJECT_ROADMAP.md` 技术债表补记 #16–#19 四行，「工具面板两套登录混用」
  结案到 #20。
- #25：技术债表补记 #22–#24；「内容真空」改为进行中（四篇中英双语 draft 已入库）；
  「零测试」的优先级由中改判为高，依据是 #23。

---

## [1.9.2] — 2026-09-12

### Removed — 清空遗留的测试媒体（经确认）

media 库里 10 条 `test-image-N.jpg` 是库里**仅有**的内容，而 `Media.access.read`
是 `() => true`，所以任何人 `GET /api/media` 就能把它们全列出来。

- 新增 `scripts/purge-test-media.ts`：默认 dry run，`--apply` 才真删；
  只碰匹配 `/^test-image-\d+\.jpg$/i` 的文件名，并且在删之前反查
  blogs 的 coverImage 和 projects 的图片字段，只要还有引用就拒绝执行。
  实测 10/10 匹配、0 引用，删除后 `GET /api/media` 返回 `totalDocs: 0`。
- 一并删掉 `public/test-images/`（12 个文件）与 `public/media/` 里
  commit 94dff63 那轮种子数据留下的 30 个孤儿文件（`img_1..img_15` 及其
  webp 变体）—— media 表清空后它们不再被任何记录指向，却仍然公开可取。
- `public/media/` 本身保留（`Media.upload.staticDir` 指着它），加了 `.gitkeep`
  并把目录内容加进 `.gitignore`：生产的上传走 Vercel Blob
  （`BLOB_READ_WRITE_TOKEN` 存在时 `vercelBlobStorage` 自动启用），
  落到这个目录里的只可能是本地 dev 的产物，不该再进仓库。

### Fixed — 脚本的 dotenv 永远晚于 payload.config 执行

`scripts/` 下既有脚本都是先 `dotenvConfig()` 再 `import '../src/payload.config'`，
但 ESM 会把所有静态 import 提升到语句之前，于是 config 在 dotenv 跑之前就读了
`process.env.DATABASE_URI`，拿到 undefined，postgres adapter 回落到
`localhost:5432` 并报 `ECONNREFUSED`。新脚本改成 dotenv 之后再动态
`await import('../src/payload.config')`。既有脚本没动，但同样的坑还在。

---

## [1.9.1] — 2026-09-12

### Fixed — Automation 工具面板的三个残留问题

`VisaMonitorDashboard` 是 automation 类工具详情页唯一的渲染出口，但它被
v1.6.3 的本地化清扫整个漏掉了。

- **未登录状态下的登录按钮是隐形的。** 按钮写的是 `background: 'var(--accent)'`，
  而设计系统里根本没有 `--accent` 这个 token（只有 `--accent-primary` /
  `--accent-hover` / `--accent-subtle`）。未定义的自定义属性等于没写，于是
  白字落在透明底上。改用 `var(--accent-primary)`，并补上 `.ds-accent-btn`
  让它有 hover 态 —— 站内其他主按钮都有。
- **整个面板硬编码中文**，英文访客在 `/en/tools/<slug>` 上看到的是一屏中文：
  状态标签、metadata 字段名、"运行详情"、"暂无运行记录"、相对时间（"3m 前"），
  连 `toLocaleString('zh-CN')` 都是写死的。新增 `tools.dashboard` namespace
  （en/zh 各 32 键），时间格式改走 `useLocale()`。
  状态与 metadata 的标签沿用 `tools/[slug]/page.tsx` 已有的静态 map 写法 ——
  next-intl 的 key 必须可静态分析，不能 `t('runStatus.' + x)`。
  metadata 的 key 保持 snake_case，因为它们直接来自 Python 工具推送的 JSON。

### Fixed — Payload admin 的 tab 图标 404

`payload.config.ts` 的 `admin.meta.icons` 指向 `/favicon.svg`，但 `public/`
下没有这个文件 —— v1.6.2 补站点图标时加的是 Next metadata route
`src/app/icon.svg`（服务于 `/icon.svg`），admin 这处没跟上。改指 `/icon.svg`，
实测 200。

### Known gaps（记录，未动）

- **`/tools` 仍然是空的**，"第一个真实工具做什么"还没定，引擎跑空。
- **Roadmap 上"工具运行前接 ConfirmDialog"目前无处可接**：现在的 automation
  架构是**工具往站里推**（Python 脚本 → `POST /api/tools/[slug]/callback`，
  `x-cron-secret` 鉴权），站里没有任何"运行"触发入口，面板是纯只读的。
  要接确认弹窗，得先设计出站方向的触发通道。
- **两套登录混用**：面板用 NextAuth Google session 决定显不显示，
  但它拉的 `/api/tool-runs` 由 Payload 的 `access.read: Boolean(req.user)`
  把关 —— 那是 Payload admin session，不是同一套。Google 登录成功的人
  会看到面板骨架但拉不到数据。有真实 automation 工具之前不好验，先记在这里。

---

## [1.9.0] — 2026-09-12

### Fixed — 每个页面都在渲染两层 `<html>` / `<body>`

`src/app/layout.tsx` 是一个自己带 `<html><body>` 的根布局，而 `[locale]/layout.tsx`
和 `(payload)/layout.tsx`（Payload 的 `RootLayout`）各自也带一套。结果线上每个响应的
HTML 都长这样：

```html
<html>            <!-- src/app/layout.tsx，没有 lang -->
<body>
<html lang="en">  <!-- 真正的那层 -->
<body>
```

- **`/admin` 的 hydration 直接报错**：`In HTML, <body> cannot be a child of <html>` +
  `Hydration failed` + 两条 "mounting a new <html>/<body> while a previous one has not
  unmounted"。浏览器控制台 5 条 error。
- 输出的是**非法 HTML**。浏览器的解析器会把第二个 `<html>` 的属性合并到 documentElement
  上，所以 `lang` / Geist className 侥幸没丢；但不做这层合并的爬虫、阅读器、校验器
  看到的是一个**没有 `lang` 属性的文档**。

**修法：删掉 `src/app/layout.tsx`。** Next.js 的 multiple root layouts 本来就是这么用的 ——
`[locale]/layout.tsx` 给前台当根布局，`(payload)/layout.tsx` 给 admin 当根布局，
route handlers（`robots.ts` / `sitemap.ts` / `og` / `feed.xml` / `api`）不需要布局，
`not-found.tsx` 和 `global-error.tsx` 本来就各自带 `<html><body>`（它们当初就是照
无根布局的写法写的 —— 那个根布局是后加的，nesting 由此而来）。

验证：`/en` `/zh/tools` `/zh/about` `/en/blog` `/admin` 现在每页只有一个 `<html>`，
`lang` 正确；`/admin` 的 hydration error 全部消失；构建产物的路由表与修复前完全一致。

### Fixed — 博客列表页和详情页没有 `<main>` landmark

v1.8.0 加的 `.ds-skip-link` 指向 `#main`。`archive` / `category` / `tag` / `projects` /
`tools` / `about` / 首页都有 `<main id="main">`，**唯独站点最重要的两个页面
`blog/page.tsx` 和 `blog/[slug]/page.tsx` 没有** —— 跳转链接在这两个页面上跳空，
辅助技术也找不到主内容区。

- `blog/page.tsx`：最外层那个 `<div>` 其实是在重复 `blog/layout.tsx` 已经画好的页面外壳，
  直接换成 `<main id="main">`，与 `archive/page.tsx` 的写法对齐。
- `blog/[slug]/page.tsx`：`<main id="main">` 落在封面图**之后**的内容容器上，
  键盘用户跳过导航后直接落到正文，而不是落到一张装饰性大图上。

### Notes

- 开发时如果发现 `/blog` `/tools` `/projects` 一直停在骨架屏不动、DOM 里有两个
  `main#main`（一个 `aria-busy` 可见、一个内容藏在 `div#S:0[hidden]` 里）——
  这是**浏览器标签页不可见**导致的，不是站点 bug。React 的 `$RC` 揭示逻辑走
  `requestAnimationFrame`，标签页 hidden 时 rAF 不触发。前台打开即正常。

---

## [1.8.1] — 2026-09-12

### Security — 依赖安全升级（31 条公告 → 5 条，critical 2 → 0，high 13 → 0）

此前 `npm audit` 报 31 条，其中 2 条 critical、13 条 high。之前的 roadmap 把它记成
"Next.js 小版本升级"，严重低估了。

- **`next` 16.2.2 → 16.3.5**（critical）。受影响范围 `9.3.4-canary.0 - 16.3.2`。与本站直接相关的：
  多条 **Middleware / Proxy bypass in App Router**（CVSS 7.5–8.1，本站 `src/proxy.ts` 就是
  next-intl middleware）、**SSRF via WebSocket upgrades**（CVSS 8.6）、**Image Optimization API
  的 RCE（AVIF）与 DoS**（站点用 next/image + Vercel Blob）。Windows 主机的未认证 RCE（CVSS 9）
  对 Vercel/Linux 不适用。
- **`payload` 与全部 `@payloadcms/*` 3.81.0 → 3.89.0**（high）。含「已认证用户可重置**其他**账号
  锁定状态」的越权公告。**注意：Payload 子包 peer-depend 精确版本**（`peer payload@"3.89.0"`），
  整个家族必须锁步，因此 package.json 里这几项改为精确版本号而非 caret——用 caret 会导致
  npm ERESOLVE 解析失败。升级需删除 node_modules + package-lock.json 重新解析。
- **`sharp` 0.34.5 → 0.35.4**（high）。libvips / libheif 的 CVE-2026-33327 / 33328 / 35590 / 35591
  及 libheif 两条公告。
- **新增 `overrides: { "dompurify": "^3.4.15" }`**。Payload 传递依赖锁在 3.4.8，而 18 条 XSS 公告
  影响 `<=3.4.12`。这些 XSS 都在 admin 侧（富文本编辑器 + monaco），但**评论是用户提交内容且会
  在后台被管理员打开**，所以路径并非纯理论。等 Payload 自己升上去后可移除此 override。

### 剩余 5 条（均为构建期工具链，无上游修复）

`esbuild` / `@esbuild-kit/*` / `drizzle-kit` / `@payloadcms/db-postgres`(via drizzle-kit)。
esbuild 那条是众所周知的 dev-server CORS 问题，只影响 `esbuild serve` 开发模式；drizzle-kit
仅在跑 migration 时执行，不进生产运行时。

### 验证状态

`npx tsc --noEmit` 零报错；`i18n-check` 通过；`next build` 在无数据库环境下**编译全过**，
一路跑到 `generateStaticParams` 才因 ECONNREFUSED 停止——说明编译层面无 API 破坏。
**完整验证需要 Vercel preview 部署**（真实 DB）。preview 上务必检查：
1. `/admin` 能正常登录（Payload 跨 8 个 minor）
2. 富文本编辑器能正常打开与保存（dompurify override）
3. 媒体上传 / 缩略图生成（sharp 大版本 0.34 → 0.35）
4. 站点各页面正常渲染

## [1.8.0] — 2026-09-11

### Added — 错误边界、加载骨架与跳转链接

- **`src/app/[locale]/error.tsx`**（新建，160 行）：locale 级错误边界。此前任何 Server Component
  抛错都落到 Next.js 默认的白底报错页，完全脱离设计系统，且生产环境只显示一句 "Application error"。
  现在渲染 token 化的错误页，含 `reset()` 重试按钮和 `error.digest` 引用码（Vercel 日志里可直接搜到
  这串 digest 定位具体报错）。
- **`src/app/global-error.tsx`**（新建，78 行）：root layout 自身崩溃时的兜底。它必须自带
  `<html>`/`<body>`，且不能依赖 next-intl（provider 可能就是崩的那个），所以文案是硬编码英文——
  这是 Next.js 的约束，不是遗漏。
- **`src/app/[locale]/blog/loading.tsx` / `projects/loading.tsx` / `tools/loading.tsx`**（新建）：
  三个列表页都是 DB 查询驱动的，冷启动时此前是整页空白。现在走 `<PageSkeleton />`。
- **`src/components/PageSkeleton.tsx`**（新建，61 行）：卡片骨架屏，用 `.ds-skeleton` 的
  token 化微光动画，`prefers-reduced-motion` 下降级为静态。

### Added — 键盘可达性：跳到主内容

- **`src/app/[locale]/layout.tsx`**：body 内第一个可聚焦元素改为 `<a href="#main" class="ds-skip-link">`，
  平时 `translateY(-200%)` 移出视口，`:focus` 时滑下。键盘用户不必每页 Tab 穿过整条导航。
- **全部 8 个页面的 `<main>` 补 `id="main"`**：about / home / blog 各子页 / projects / tools。
- **`src/i18n/messages/*`**：新增 `common.skipToContent` 与 `error.*`（title / message / retry / reference）。

### 已知未验证项

跳转链接的**交互行为未能在本会话验证**——浏览器面板的合成 Tab 按键不驱动真实的顺序焦点导航
（activeElement 不动，页面自行恢复滚动位置），截图也返回全黑。生产环境 CSS 已静态核对：基础规则
在前、`:focus` 覆盖在后且优先级更高、`prefers-reduced-motion` 块只改 `transition` 不影响 transform。
**需要人工按一次 Tab 确认。**

---

## [1.7.0] — 2026-09-11

### Added — 弹窗与 toast 层（自建确认框 + sonner）

选型依据：实测 sweetalert2 打包后 20.6 KB gzip、sonner 14.7 KB，体积差距不足以成为理由；
真正的问题是 sweetalert2 自带 30 KB CSS 与一整套视觉语言（大阴影、居中大号彩色圆形图标、弹跳动画），
与 DESIGN.md 第一条"用亮度层叠做纵深，永不用 box-shadow"直接冲突，且它是命令式 DOM 注入而非
React 组件。Lazyweb 检索的 12 个暗色确认弹窗参考（Flora / Basedash / Okta / Calendly / Medium /
Bonsai 等）无一使用图标前置样式。结论：确认框自建，toast 买 sonner。

- **`src/components/ConfirmDialog.tsx`**（新建，228 行）：基于原生 `<dialog>` + `showModal()`，
  焦点陷阱、Esc 关闭、`::backdrop`、top-layer 层级全部由浏览器提供，永远不会和 sticky Navbar 或
  CommandPalette 打 z-index 官司。支持 `variant="danger"`（confirm 按钮用 `--status-error`）与
  `confirmPhrase`（需手打指定字符串才能确认，即 Basedash / Okta / Calendly / Medium 对不可逆操作
  的通用模式）。附 `useConfirm()` Promise 包装，调用处可写成 `if (await confirm({...}))`。
- **`src/components/Toaster.tsx`**（新建）：sonner `<Toaster />` 的 token 化封装，挂在 locale layout。
- **`src/app/globals.css`**：新增 `.ds-dialog` / `.ds-dialog-panel` / `.ds-dialog-confirm` / `.ds-input`
  与 `[data-sonner-toaster]` / `[data-sonner-toast]` 覆盖，两个 `@keyframes`（`ds-dialog-in` /
  `ds-backdrop-in`）遵循 DESIGN.md「不单独动画颜色，必须配合 transform 或 opacity」。

### Changed — CommentForm 迁移到设计系统；ShareButtons 改用 toast

- **`src/components/CommentForm.tsx`**：提交反馈此前是内联文本，改为 sonner toast。
- **`src/components/ShareButtons.tsx`**：复制链接的 2 秒内联状态改为 toast；`locale === 'zh' ? …` 硬编码
  三元换成 `blog.share` / `blog.copyLink` / `blog.copied` 三个 i18n key。
- **`src/i18n/messages/*`**：新增 `common.typeToConfirm`、`blog.share` / `copyLink` / `copied`。

### Fixed — Footer 重复渲染

v1.6.3 给两个 tools 页面补 `<Footer />` 时没注意到 `[locale]/layout.tsx` 已经全局渲染了一次，
导致 `/en/tools` 出现两个页脚。移除 tools 两页和 blog 详情页里的冗余 `<Footer />`（生产验证：
各页面 copyright 字符串均为 3 处，与其他页面一致）。

---

## [1.6.3] — 2026-09-11

### Changed — Tools 页面接入 i18n（此前是全站唯一没走 next-intl 的公开页面）

- **`src/i18n/messages/en.json` / `zh.json`**：新增 `tools` namespace（`title` / `subtitle` / `noTools` /
  `backToTools` / `comingSoon` / `automation` / `enableJs` / `status.{online,maintenance,offline}`）。
  键数 115 → 119，双语对齐。
- **`src/app/[locale]/tools/page.tsx`**：12 处 `isZh ? '中文' : 'English'` 硬编码三元全部清除；
  `STATUS_BADGE` 里混着中英文标签（`label: '维护中'` 在英文页也显示中文）拆成纯颜色的 `STATUS_COLOR`
  + 渲染时查 i18n 的 `STATUS_LABEL` 静态映射（遵守 i18n 规范"不动态拼接 key"）；`next/link` +
  手拼 `/${locale}/tools/...` 换成 `@/i18n/navigation` 的 `Link`（规范第 4 条）。
- **`src/app/[locale]/tools/[slug]/page.tsx`**：同上；两处 `<a href={\`/${locale}/tools\`}>`（面包屑 +
  返回链接）换成 i18n `Link`；`ScriptEmbed` 的 `<noscript>` 文案此前恒为英文，改为传入 `noScriptText`。
- 两个 tools 页面此前**都没有 `<Footer />`**（全站唯一），补上。

### Fixed — 首页技术栈描述与 About 标题未本地化

- **`src/app/[locale]/page.tsx`**：`TECH_STACK` 四项的 `description` 是硬编码英文，中文访客看到的是
  "ERP & financial data governance"。改为 `descriptionKey` + `home.techStack` namespace 静态映射。
- **`src/app/[locale]/about/page.tsx`**：`generateMetadata` 的 `title: 'About'` 写死，`/zh/about` 的
  浏览器标题也是英文。改用 `nav.about`。

### Added — sitemap 补齐 tools 路由

- **`src/app/sitemap.ts`**：静态条目加 `/tools`；新增 tool 详情页条目，查询条件与
  `[locale]/tools/page.tsx` 的列表过滤完全一致（`online` + `public` + `interactive`），
  避免 sitemap 里出现会 404 的地址。

### 验证方式

`npx tsc --noEmit` 零报错；`node scripts/i18n-check.mjs` 通过（119/119，0 僵尸 key）。
tools 页面的实际渲染需线上验证——本地无 DB 连接，该页依赖 payload 查询。

## [1.6.2] — 2026-09-11

### Fixed — 生产环境根级路由被 next-intl middleware 吞掉（SEO / RSS / OG 全线失效）

- **`src/proxy.ts`**：matcher 从 `'/((?!api|_next/static|_next/image|favicon.ico|admin).*)'` 改为
  `'/((?!api|admin|_next|_vercel|og|.*\\..*).*)'`。

  旧 matcher 只排除了 `_next/static` / `_next/image` / `favicon.ico`，于是所有根级路由都被 next-intl
  当成需要加语言前缀的页面路径，307 重定向到 `/en/<path>`——而那里没有任何路由，最终 404。线上实测：

  | 路径 | 修复前 | 修复后 |
  |------|--------|--------|
  | `/robots.txt`  | 307 → `/en/robots.txt` → 404  | 200（正确输出 Disallow 规则） |
  | `/sitemap.xml` | 307 → 404 | 200 |
  | `/feed.xml`    | 307 → 404（`<head>` 里的 RSS 链接全废） | 200 |
  | `/og?title=…`  | 307 → 404（所有社交分享缩略图全废） | 200，1200×630 PNG |

  也就是说 Google 从来没拿到过 sitemap、没读到过 robots 规则，发到微信 / Twitter / LinkedIn 的链接
  一直没有预览图——`sitemap.ts` / `robots.ts` / `feed.xml` / `og` 这些代码本身早就写好了，只是被
  middleware 拦在门外。v1.1.x 那次"把 resume.pdf 复制进 locale 目录来绕过 307 拦截"撞的是同一个
  根因，当时绕过去了没根治，现在 `public/en/` `public/zh/` 下的副本可以在确认无外链后清理。

  `.*\..*`（任何含点的路径）一并覆盖了 `/public` 下的静态资源，这是 next-intl 官方推荐写法；`og`
  单列是因为它没有扩展名。已验证 `/` → 307 `/en` 的语言重定向行为不受影响。

### Fixed — `/tools` 一发布工具就 500（Server Component 传事件处理器）

- **`src/app/[locale]/tools/page.tsx`**：工具卡片的 `<div>` 上挂了 `onMouseEnter` / `onMouseLeave` 来做
  hover 换色，但这是个 Server Component——React 无法序列化事件处理器，渲染即报
  "Event handlers cannot be passed to Client Component props"。目前页面能打开纯粹因为工具列表是空的、
  `tools.map()` 从未执行；**在 `/admin` 发布第一个工具的那一刻 `/tools` 就会 500**。
  改用 `globals.css` 里既有的 `.ds-card-hover`（注释写着 "safe in Server Components"，
  `HomeProjectCard` 已在用），hover 效果与过渡时长完全一致。顺手删掉未使用的 `getTranslations` import。

### Fixed — 页面标题重复品牌后缀

- `[locale]/layout.tsx` 的 `title.template` 是 `%s — Jack Deng`，但 6 个页面又手动拼了一遍，线上实测
  `/en/projects` → `Projects — Jack Deng — Jack Deng`、`/en/tools` 和 `/en/blog/archive` 同样。
  涉及 `projects/page.tsx`、`projects/[slug]/page.tsx`、`tools/page.tsx`、`tools/[slug]/page.tsx`、
  `blog/archive/page.tsx`、`blog/[slug]/page.tsx`、`blog/category/[slug]/page.tsx`、
  `blog/tag/[slug]/page.tsx`——页面 `title` 交给 template，`openGraph.title` 保留完整品牌（Next.js 不会
  把 template 套到 openGraph 上）。
- **`src/app/[locale]/page.tsx`**：反过来的问题——`title.template` **不作用于定义它的同一路由段**，
  所以首页标题一直是裸的 `Senior Software Engineer | Backend & Data Systems`，SERP 里不带人名。
  改为显式 `Jack Deng — {t('title')}`。

### Added — 站点图标（此前完全缺失，`/favicon.ico` 404）

- **`src/app/icon.svg`**：JD 字母组合标，配色取设计 token 的 `--accent-primary` → `--accent-hover`
  (`#5e6ad2` → `#7170ff`) 渐变。字形用 path 绘制而非 `<text>`，避免依赖光栅化器 / 浏览器的可用字体。
- **`src/app/favicon.ico`**（32×32）+ **`src/app/apple-icon.png`**（180×180）：由同一 SVG 用 sharp 光栅化。
  `.ico` 走 Vista PNG-in-ICO 容器，`file(1)` 校验通过；保留 `favicon.ico` 是为了那些硬编码该路径的
  爬虫与 RSS 阅读器。三个文件让 Next.js 自动注入 `icon` / `apple-touch-icon` link 标签（已验证）。

### Security — Projects slug 规范化

- **`src/collections/Projects.ts`**：`slug` 是自由文本且**完全没有**清洗 hook（Blogs / Categories / Tags /
  Tools 都有）。新增 `beforeValidate` 把输入规范化到 `[a-z0-9-]`。手打一个带点的 slug（如
  `next.js-hub`）会让该 URL 落进上面 matcher 的 `.*\..*` 排除区间，导致不带语言前缀的
  `/projects/next.js-hub` 404 而不是 307 跳转。现有 5 个项目的 slug 均无点号，无数据影响。

### Removed — 入库的垃圾文件

- `git rm --cached` 掉 `.DS_Store`、`public/.DS_Store`、`tsconfig.tsbuildinfo`（657 KB 的 TS 增量编译缓存），
  并在 `.gitignore` 补上 `.DS_Store` / `**/.DS_Store` / `*.tsbuildinfo`。

### 验证方式

`npx tsc --noEmit` 零报错；`node scripts/i18n-check.mjs` 通过（115/115 键对齐）；本地 `next dev` 实测
`/robots.txt` `/favicon.ico` `/icon.svg` `/apple-icon.png` `/og?title=…` `/resume.pdf` 均 200，
`/` 仍 307 → `/en`，`/sitemap.xml` `/feed.xml` 已进入自己的 handler（本地无 DB 故 500，不再是 307）。
`/tools` 的修复由类型检查 + "Server Component 内已无事件处理器" 全量扫描确认，**未**用真实工具数据渲染验证。

## [1.6.1] — 2026-05-25

### Changed — Payload Admin UX P1：dateFormat + 状态 emoji + Tag 调色板提示

- **`src/payload.config.ts`**：`admin.dateFormat` 设为 `yyyy-MM-dd HH:mm`（之前是英文 locale 默认），`admin.meta.titleSuffix` 设 ` — Jack Deng Admin` 让浏览器 tab 一眼可辨。
- **`src/collections/Blogs.ts`**：`status` option labels 加 emoji（📝 草稿 / ✅ 已发布），列表视图一眼区分。
- **`src/collections/Projects.ts`**：同上，🟢 进行中 / 🔵 已完成 / 🟠 挂起。
- **`src/collections/Tags.ts`**：`color` 字段描述补充推荐 7 色色板（蓝/绿/黄/红/紫/粉/青），不需要每次去查 hex 值。

### 说明 — 评论批量审核

Payload 3.x 列表视图已**原生支持 bulk-edit**：勾选多行 → 顶部出现 "Edit" 按钮 → 同时批量改 `status` 字段。计划里的自定义 BulkCommentActions 组件因此不必要，跳过。

---

## [1.6.0] — 2026-05-25

### Changed — Payload Admin UX P0：分组 + 列表搜索 + SEO 侧栏 + 双语提示

- **`src/collections/*.ts`**（全部 9 个 collection）：加 `admin.group`，侧边栏从平铺 9 项变成 4 个分组——内容（Blogs / Categories / Tags / Comments）/ 作品（Projects / Media）/ 工具（Tools / ToolRuns）/ 系统（Users）。
- **`src/collections/Blogs.ts`**：
  - 加 `listSearchableFields: ['title', 'excerpt', 'slug']`——列表搜索框可即时过滤标题/摘要/路径
  - SEO group 加 `admin.position: 'sidebar'`——以前埋在长表单底部，现在右侧 sticky 视野内
  - localized 字段（title / excerpt / content）加 `🌐 多语言字段` 描述，提醒切换顶部 Language 后分别填写
- **`src/collections/Categories.ts` / `Tags.ts` / `Comments.ts` / `Tools.ts` / `ToolRuns.ts` / `Media.ts`**：加 `listSearchableFields` 提升搜索体验
- **`src/collections/Media.ts`**：补充 `admin.useAsTitle`、`defaultColumns`、上传转 WebP 的耗时与尺寸说明
- **`src/collections/Projects.ts`**：加 `defaultColumns` 和 `listSearchableFields`

---

## [1.5.0] — 2026-05-25

### Added — Projects 集合双语化

- **`src/collections/Projects.ts`**：`name` / `shortDescription` / `longDescription` 三个字段加 `localized: true`，同时加 `🌐 多语言字段` 提示，编辑者切换顶部 Language 后可分别填写各语言版本。
- **`src/migrations/20260525_000001_add_projects_localization.ts`**：新建 migration，创建 `projects_locales` 表，把现有 5 个项目的英文内容拷贝到 `_locale='zh'` 槽（defaultLocale 是 zh），最后从 `projects` 主表移除原 3 列。FK + unique index 与 `blogs_locales` 同模式。
- **`src/migrations/index.ts`**：注册新迁移。
- **`scripts/snapshot-projects.ts`** / **`scripts/apply-projects-localization.ts`** / **`scripts/verify-migration.ts`**：辅助脚本。snapshot 用原生 pg 直连导出 projects 表（Payload init 在 Supabase pooler 上总卡住，原生 pg ~2s）；apply 也走 pg 跑原始 SQL + 写入 `payload_migrations` 表（Payload CLI 在本地环境一样卡）。verify 检查表结构 + locale 分布。
- **`.gitignore`**：新增 `backups/` 排除规则。

### Operations log（已执行）

1. ✓ Supabase 编程式 snapshot：`backups/projects_2026-05-26T03-21-48-524Z.json`（5 行数据 + 富文本完整）
2. ✓ Migration 应用：`20260525_000001_add_projects_localization` 已 commit 到生产
3. ✓ 校验：`projects` 表 -3 列；`projects_locales` 表 +5 行（zh 槽）；`payload_migrations` 含新条目
4. ⚠️ **遗留**：5 个项目的英文内容当前在 zh 槽，需登陆 https://www.jackdeng.cc/admin/collections/projects 把每个项目的 zh 字段替换为中文版本，并在 en 槽补充英文版本

---

## [1.4.3] — 2026-05-25

### Added — 导航栏新增 Projects 入口；首页 hero 项目卡片可点击跳转

- **`src/components/Navbar.tsx`**：`NAV_LINKS` 数组顶部新增 `/projects`（放第一位，portfolio 站项目入口比博客优先级更高）。桌面端 + 移动端抽屉菜单都自动渲染。
- **`src/i18n/messages/en.json` / `zh.json`**：`nav` namespace 新增 `projects` 键（"Projects" / "项目"）。i18n-check 通过，键数对齐 109/109。
- **`src/app/[locale]/page.tsx`**：右上角两张倾斜的 hero 浮动项目卡片由 `<div>` 改为 `<Link>`；href 优先 `/projects/${slug}`，无 slug 时回退到 `/projects` 列表页。复用 `ds-card-hover` class 获得 hover 效果。

---

## [1.4.2] — 2026-05-25

### Fixed — Sidebar 跨语言缓存串数据

- **`src/lib/sidebarData.ts`**：`unstable_cache` 包装的 `getCachedSidebarBase` 之前无 locale 入参，en / zh 用户在 1 小时缓存窗口内共用同一份数据；近期文章 `title` 是 localized 字段，导致语言不匹配。改为 `(locale: 'en' | 'zh') => ...`，locale 作为函数参数自动并入缓存键；同时给所有 `payload.find` 加 `locale` 参数。
- **`src/app/[locale]/blog/page.tsx` / `archive/page.tsx` / `category/[slug]/page.tsx` / `[slug]/page.tsx` / `tag/[slug]/page.tsx`**：5 个调用点全部改为 `buildSidebarData({ locale: locale as any, ... })`。

### Changed — sitemap 性能小调整

- **`src/app/sitemap.ts`**：blog 查询 `limit: 1000 → 200`。个人站规模远小于 1000，降低每日 sitemap 重新生成的 DB 负载与函数内存。`select` 投影已存在不变。

### Added — 数据库测试博客清理脚本

- **`scripts/cleanup-blogs.ts`**：新增一次性清理工具，通过 Payload Local API **先删 comments 再删 blogs**（comments.post_id 是 NOT NULL，FK ON DELETE SET NULL 会冲突，必须先删子表）。运行方式：`npx tsx --env-file=.env scripts/cleanup-blogs.ts`（`--env-file` 是必须的——ESM import 提升导致 dotenv 在 payload.config import 后才执行）。`scripts/seed.ts` 保留不动，供未来空环境复现。

---

## [1.4.1] — 2026-04-14

### Added — 博客文章社交分享按钮

- **`src/components/ShareButtons.tsx`**：新增 Twitter/X、LinkedIn、复制链接三个分享按钮，渲染在文章正文结束后、返回列表链接之前。复制成功后显示 2 秒 "已复制！/ Copied!" 状态反馈，支持 zh/en 双语 label。
- **`src/app/[locale]/blog/[slug]/page.tsx`**：引入 `ShareButtons` 并传入文章 `url`、`title`、`locale`。

---

## [1.4.0] — 2026-04-14

### Added — 博客阅读体验增强（TOC + 阅读进度条）

- **`src/lib/extractHeadings.ts`**：新增服务端工具函数，解析 Payload Lexical JSON 提取标题列表（含去重 slug 化 `id`，支持 CJK 字符）。
- **`src/components/TableOfContents.tsx`**：新增客户端目录组件，使用 `IntersectionObserver` 高亮当前可见标题；`sticky` 定位跟随滚动；标题少于 2 个时自动隐藏。
- **`src/components/ReadingProgress.tsx`**：新增客户端阅读进度条，固定在视口顶部，随用户滚动从 0% 填充至 100%，颜色跟随 `--accent-primary` CSS 变量。

### Changed

- **`src/components/LexicalRenderer.tsx`**：新增 `withHeadingIds` prop；启用时使用自定义 `JSXConvertersFunction` 在每个标题节点注入 slug 化的 `id` 属性，与 TOC 锚链接对应。
- **`src/app/[locale]/blog/[slug]/page.tsx`**：集成 `ReadingProgress`（页面顶部进度条）、`extractHeadings`（服务端提取标题）、`TableOfContents`（右侧边栏首位，sticky 定位）；`LexicalRenderer` 启用 `withHeadingIds`。

---

## [1.3.1] — 2026-04-14

### Fixed — Projects 详情页 500 错误（DYNAMIC_SERVER_USAGE）

- **`src/app/[locale]/projects/[slug]/page.tsx`**：移除 `generateStaticParams()` 及 `revalidate = 3600`，改为 `export const dynamic = 'force-dynamic'` + `revalidate = 0`。根因：项目详情页在 Vercel build 时 `generateStaticParams()` 返回 0 条路径（种子数据在 build 之后写入），页面被构建为纯静态（`●`），当实际 slug 请求到来时 Next.js 尝试动态 fallback 渲染，触发 `DYNAMIC_SERVER_USAGE` digest 错误返回 500。改为全动态渲染后所有 `/projects/[slug]` 路径正常响应。

---

## [1.3.0] — 2026-04-13

### Added — Projects 详情页系统

- **`src/collections/Projects.ts`**：新增 `slug`（唯一路径标识）、`techStack`（数组）、`githubLink`、`coverImage` 四个字段，支持项目详情页展示。
- **`src/migrations/20260413_000001_add_projects_slug.ts`**：DB Migration，为 `projects` 表添加 `slug`、`github_link`、`cover_image_id` 列及唯一索引；创建 `projects_tech_stack` 关联表。
- **`src/app/[locale]/projects/page.tsx`**：新增 `/projects` 列表页，网格布局展示所有项目，含状态徽章、技术栈标签、详情页链接。
- **`src/app/[locale]/projects/[slug]/page.tsx`**：新增 `/projects/[slug]` 详情页，含封面图、Logo、技术栈、富文本描述、Live Demo / GitHub 按钮、相关项目推荐、JSON-LD schema、SEO metadata。
- **`src/i18n/messages/en.json` / `zh.json`**：新增 `projects` namespace（8 个翻译 key）。

### Changed

- **`src/app/[locale]/page.tsx`**：首页 `ProjectCard` 升级——卡片整体可点击并链接至 `/projects/[slug]`；显示技术栈标签；新增"Projects →"查看全部链接。
- **`src/app/sitemap.ts`**：sitemap 加入 `/projects` 列表页及各项目详情页路由。

---

## [1.2.7] — 2026-04-13

### Fixed — Admin 后台崩溃（hydration error #418）

- **`AdminHeaderSettings`**：将 `(i18n as any).changeLanguage()` 改为 Payload 原生的 `switchLanguage()`。Payload 的 `i18n` 对象不是 i18next 实例，不含 `changeLanguage` 方法，调用时抛出 `TypeError: c.changeLanguage is not a function`，导致 React hydration error #418，后台白屏 / 无法打开。使用 `useTranslation()` 返回的 `switchLanguage` 函数（设置 cookie + `router.refresh()`）替代。

---

## [1.2.6] — 2026-04-13

### Changed — Admin 语言控件统一为单一入口

- **`AdminHeaderSettings`**：删除自定义 `中|EN` 胶囊按钮；改为监听 Payload 原生 locale 变化（`useLocale()`），自动同步 admin UI 语言（`i18n.changeLanguage()`），切一次等于两者同步。设置齿轮只剩主题 / 账户 / 访问前台。
- **`payload.config.ts`**：覆盖 `general.locale` 翻译，header 显示"语言 ∨"（zh）/ "Language ∨"（en），替代原本不直观的"Locale / 语言环境"。`defaultLocale` 由 `en` 改为 `zh`，与中文作者习惯一致。

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
