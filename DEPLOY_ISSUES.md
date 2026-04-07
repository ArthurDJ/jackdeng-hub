# Deployment Issues & Resolutions

所有在 Vercel 部署过程中遇到的问题及解决方案，按时间顺序记录。

---

## Issue 1 — Admin 500 / API 404 / Module not found
**时间**：初始部署阶段
**症状**：
- `/admin` 返回 500
- `/api/*` 返回 404 或 500
- 构建报错：`Module not found: Can't resolve '../../../../payload.config'`

**根本原因**：
1. `<RootPage>` 缺少 `importMap` prop，Payload 3.x 强制要求
2. `generateMetadata` 直接赋值为 `generatePageMetadata`，Next.js 调用时缺少 `config` 参数
3. `params` / `searchParams` 类型未声明为 `Promise<...>`（Next.js 16 要求）

**修复**：
```tsx
// src/app/(payload)/admin/[[...segments]]/page.tsx
import { importMap } from '../importMap.js'
export const generateMetadata = ({ params, searchParams }: Args) =>
  generatePageMetadata({ config, params, searchParams })
const Page = ({ params, searchParams }: Args) => (
  <RootPage config={config} importMap={importMap} params={params} searchParams={searchParams} />
)
```

---

## Issue 2 — POST /api/graphql → 404
**时间**：v0.4.0 部署验证
**症状**：`POST /api/graphql` 返回 404，GraphQL Playground 不可用

**根本原因**：`payload.config.ts` 未显式声明 `graphQL` 配置，Payload 3.x 不自动激活 GraphQL schema 注册

**修复**：
```ts
// src/payload.config.ts
graphQL: {
  schemaOutputFile: path.resolve(dirname, 'schema.graphql'),
},
```
**Commit**：`5c86b9b`

---

## Issue 3 — Vercel 部署被 Block（Hobby 私有仓库限制）
**时间**：v0.5.0 首次 Vercel 部署
**症状**：`The Deployment was blocked because GitHub could not associate the committer with a GitHub user`

**根本原因**：
- 沙箱环境提交的 git committer 邮箱不属于任何 GitHub 账号
- Vercel Hobby 计划：私有仓库不允许无法识别身份的协作者触发部署

**修复**：将仓库从 Private 改为 **Public**（GitHub → Settings → Danger Zone → Change visibility）

**注意**：About 页 GitHub 链接同步从 `JJackDeng` 改为 `ArthurDJ`（commit `d906c2a`）

---

## Issue 4 — .gitignore 未完整覆盖 .env 变体
**时间**：v0.5.0
**症状**：`.env.local` 未在 `.gitignore` 中，存在泄露风险

**修复**：
```gitignore
.env
.env.local
.env.*.local
.env.development
.env.production
```
**Commit**：`d906c2a`（与 Issue 3 同一 commit）

---

## Issue 5 — Vercel 构建超时（45 分钟限制）
**时间**：v0.6.0+ 部署
**症状**：构建耗尽 45 分钟后报错 `Your build exceeded the 45 minute limit`

**根本原因**：`vercel.json` 的 `buildCommand` 设置为 `npm run migrate && npm run build`，`npx payload migrate` 在构建服务器上尝试连接 Supabase 数据库时挂起或超时

**修复**：将 migrate 从构建命令中移除，改为手动单独执行：
```json
// vercel.json — 之前
{ "buildCommand": "npm run migrate && npm run build" }

// vercel.json — 之后
{ "buildCommand": "npm run build" }
```
**Commit**：`b1e6108`

**迁移执行方式**（在本地，确保 `.env.local` 有正确的 `DATABASE_URI`）：
```bash
npx payload migrate
```
每次新增 Collection 后手动执行一次即可，不需要每次部署都跑。

---

## Issue 6 — Vercel Cron Job 在 Hobby 计划下被拒绝
**时间**：v0.6.0 Vercel 项目创建时
**症状**：`Hobby accounts are limited to daily cron jobs. This cron expression (0 * * * *) would run more than once per day`

**根本原因**：OpenClaw 在 `vercel.json` 里添加了每小时触发一次的 cron job，Hobby 计划只支持每天最多一次

**修复**：删除 `vercel.json` 中的 `crons` 配置，该功能目前不需要
**Commit**：`4a655b0`

---

## 环境变量清单（Vercel → Settings → Environment Variables）

| 变量名 | 说明 | 是否必填 |
|--------|------|----------|
| `DATABASE_URI` | Supabase PostgreSQL Transaction Pooler 连接串（端口 6543） | ✅ 必填 |
| `PAYLOAD_SECRET` | Payload session 加密密钥，任意随机强字符串 | ✅ 必填 |
| `NEXT_PUBLIC_SERVER_URL` | 生产域名，如 `https://jackdeng.cc` | ✅ 必填 |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret（服务端验证） | 可选 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key（前端 widget） | 可选 |
| `CRON_SECRET` | 定时任务鉴权 key，待用 | 可选 |

> **DATABASE_URI 注意**：使用 **Transaction Pooler** 连接串（Supabase → Project Settings → Database → Connection string → Transaction），端口为 `6543`，非 Direct 连接（5432）。Vercel serverless 函数每次请求新建连接，必须用 pooler 防止耗尽连接数。

---

## 数据库迁移操作记录

| 时间 | 新增 Collection | Commit |
|------|----------------|--------|
| v0.2.0 | Categories, Tags | `d465057` |
| v0.7.0 | Comments | `267b581` |

每次新增 Collection 后在本地执行：
```bash
npx payload migrate
```
