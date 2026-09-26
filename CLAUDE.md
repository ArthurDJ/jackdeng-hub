# jackdeng-hub

个人站 jackdeng.cc：Next.js App Router + Payload CMS 3（Postgres，托管在 Supabase），部署在 Vercel。
中英双语走 next-intl（`/en`、`/zh`），Payload 的 `defaultLocale` 是 `zh`。

## 每个 PR 都要做的事

- **CHANGELOG**：在同一个 PR 里给 `CHANGELOG.md` 加条目。格式照 `AI_DEPLOY.md` 末尾的
  Changelog Protocol（定版本号，按 Added / Changed / Fixed / Removed / Security 分组），
  小节标题带 PR 号，写法照最近的条目。这一步在 #16–#71 断了 55 个 PR，是 #72 事后补上的。
- **Roadmap**：`PROJECT_ROADMAP.md` 是单一事实来源。修掉的问题在「技术债清单」加一行，
  并更新文件末尾的「最后更新」。
- 提交前本地跑 `npm run typecheck && npm test && npm run i18n:check`。
- 提交信息和 PR 标题用英文 conventional commits（`fix(scope): …`），squash 合并。

## `.env.local` 指向生产库

- `.env.local` 里的 `DATABASE_URI` 是**生产 Supabase**。凡是连库的命令（`npm run dev`、
  `tsx` 脚本、`npm run migrate`）打的都是生产。
- Payload 的 schema 推送默认关闭：`src/payload.config.ts` 的 `push` 只在
  `PAYLOAD_SCHEMA_PUSH=1` 且库在 localhost 时打开，供 CI 的 schema-drift 检查用（#46、#54）。
- `scripts/` 下写库的脚本由 `requireApply()`（`scripts/lib/env.ts`）守着：库在 Supabase 上
  时不带 `--apply` 就退出。新脚本照这个写法。
- 写生产库之前先问：跑迁移、改数据、带 `--apply` 都算。只读查询可以直接做。

## 迁移

- Vercel 构建不跑迁移（`build` 就是 `next build`）。新迁移合并后要手动对生产执行
  `npm run migrate`，这一步要人确认。只加列的迁移可以先于部署执行。
- 迁移手写，不用 `payload migrate:create`：它的 schema 快照停在 2026-04-10，会拿旧快照算差异。
- 删列分两步：先加新结构、保留旧列上线，确认后再用单独一条迁移 DROP（#27/#29、#31/#32），
  这样两种部署顺序都不会出现破损窗口。

## CI 与部署

- 分支保护只要求一个 check：`typecheck`。这个 job 里依次跑 typecheck、`npm test`、
  `i18n:check`，再用一次性 Postgres 比对「迁移建出的库」和「代码定义的 schema」
  （`scripts/schema-drift.ts`）。新的检查加进这个 job，另开 job 会跑但拦不住合并。
- `.github/workflows/smoke.yml` 在生产部署成功后请求线上页面，包括应该返回 404 的路径和
  所有站内链接。
- `next dev` 不做静态渲染，请求期的错误在 dev 里看不到（#26）。改了渲染路径，用
  `next build && next start` 验证。

## 反复踩过的坑

- **`payload.find()` 要传 `locale`**。不传就回落到 `zh`，英文页显示中文（#27、#39、#40 各踩
  一次）。Local API 默认跳过访问控制，公开页面的查询要自己过滤 `status` / `accessControl`（#50）。
- **站内链接用 `@/i18n/navigation` 的 `Link` / `useRouter`**，不用 `next/link`，也不手写
  `/${locale}/` 前缀（#52）。
- **文案写进 `src/i18n/messages/{en,zh}.json`**，不写 `locale === 'zh' ? … : …`。
  `i18n:check` 只核对两份 json 的键，查不出这种写法。
- **查询失败要抛出**，不要 `.catch(() => ({ docs: [] }))`。只有能降级的次要区块用
  `orEmpty(query, context)`（`src/lib/payload.ts`），它会记日志（#42）。
- **`loading.tsx` 会罩住整个子树**，让子路由里的 `notFound()` 先提交 200。列表页的 loading
  放在 `(list)` 路由组里（#34）。
- **Payload 的包必须锁步**：`payload` 和所有 `@payloadcms/*` 用同一个精确版本，一起升级。

## 工具与发文

- `/tools` 的内置工具按 slug 注册在 `src/components/tools/registry.tsx`，详情页是
  `src/app/[locale]/tools/[slug]/page.tsx`，是否对外可见由 `Tools` 集合的 `status` 和
  `accessControl` 决定。`AI_DEPLOY.md` 的「One-Click Deployment」和「Extending the Tools
  Engine」两节已经过时，以这里为准。
- `scripts/publish-drafts.ts` 把 markdown 转成 Lexical 写进数据库（中英双语，建为 draft）。
  上传题图需要 `BLOB_READ_WRITE_TOKEN`，没有时脚本会拒绝上传。
