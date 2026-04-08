# jackdeng-hub — 下一阶段开发计划

## Context
经过全面代码审计（v0.9.9），所有阻塞性 Bug 已修复，admin 登录正常。当前站点功能完整但存在几个明显的"未完工"特征：部分页面视觉不一致（仍用旧 zinc Tailwind 类）、无 sitemap/robots、无 404 页、分页缺失。目标是在 2-3 周内将站点推进到 v1.0 生产品质。

---

## P0 — 立即修复（视觉破损 / 用户首次看到就注意到）

### P0.1 Blog 子页设计系统修复【M】
**问题**：`blog/layout.tsx`、`archive/page.tsx`、`category/[slug]/page.tsx`、`tag/[slug]/page.tsx` 仍使用 `bg-white dark:bg-zinc-950`、`text-zinc-*`、`text-blue-600 dark:text-blue-400` 等旧 Tailwind 类，与其他页面视觉断层。

**修改文件**：
- `src/app/[locale]/blog/layout.tsx` — `bg-white dark:bg-zinc-950` → `style={{ backgroundColor: 'var(--bg-base)' }}`；footer 替换为 i18n 版本（`tCommon('copyright')` + `tFooter('builtWith')`）
- `src/app/[locale]/blog/archive/page.tsx`
- `src/app/[locale]/blog/category/[slug]/page.tsx`
- `src/app/[locale]/blog/tag/[slug]/page.tsx`

所有 zinc/blue 类替换为 `style={{ color: 'var(--text-primary)' }}` 等 token 内联样式，模式与 `[locale]/page.tsx` 保持一致。

---

### P0.2 LexicalRenderer Prose 使用 CSS Token【S】
**问题**：`prose prose-zinc dark:prose-invert` 绑定 Tailwind zinc 调色板，light mode 下与 `--text-secondary` 等 token 冲突；inline code 用 `bg-zinc-100 dark:bg-zinc-800` 硬编码。

**方案**：在 `globals.css` 新增 `.prose-ds` utility，覆盖 Tailwind Typography 的 `--tw-prose-*` 变量指向设计 token：

```css
.prose-ds {
  --tw-prose-body:        var(--text-secondary);
  --tw-prose-headings:    var(--text-primary);
  --tw-prose-links:       var(--accent-primary);
  --tw-prose-code:        var(--text-primary);
  --tw-prose-pre-bg:      var(--bg-elevated);
  --tw-prose-hr:          var(--border-default);
  --tw-prose-bullets:     var(--border-strong);
  /* invert 变量设为同值，token 已自适应主题 */
  --tw-prose-invert-body:     var(--text-secondary);
  --tw-prose-invert-headings: var(--text-primary);
  /* ...其余同理 */
}
```

**修改文件**：
- `src/app/globals.css` — 添加 `.prose-ds`
- `src/components/LexicalRenderer.tsx` — `prose prose-zinc dark:prose-invert` → `prose prose-ds max-w-none`

---

### P0.3 自定义 404 页面【S】
**问题**：i18n key `notFound.*` 已存在于 en/zh.json，但无对应页面；当前 404 是 Next.js 默认白页，完全脱离设计系统。

**修改文件（新建）**：
- `src/app/[locale]/not-found.tsx` — 使用 token inline style，含 Navbar + i18n 标题/描述 + "返回首页" 链接（`--accent-primary`）
- `src/app/not-found.tsx` — 无 i18n 的最简回退（根级别）

---

### P0.4 CategoryBadge 去掉 zinc 类【XS】
**问题**：`bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700`

**修改**：
- `src/components/CategoryBadge.tsx` — 改为 `style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--border-default)' }}`

---

## P1 — 高影响功能（专业感关键项）

### P1.1 SEO 基础设施：sitemap + robots + canonical【M】
**当前**：无 `sitemap.ts`、无 `robots.ts`，无 canonical/hreflang。

**新建文件**：
- `src/app/sitemap.ts` — 查询所有已发布 blogs/categories/tags，为 en + zh 各生成条目，含 `alternates.languages` hreflang，设 `revalidate = 86400`
- `src/app/robots.ts` — 允许全站爬取，Block `/admin/*` 和 `/api/*`，指向 sitemap URL

**修改文件**：
- `src/app/[locale]/blog/[slug]/page.tsx` — `generateMetadata` 添加 `alternates.canonical`
- `src/app/[locale]/page.tsx` — 同上

---

### P1.2 CommandPalette Token 迁移 + locale 感知【M】
**问题一**：20+ 处 `zinc-*` className 需替换为 CSS token 内联样式。
**问题二**：`fetchResults` 硬编码 `/api/blogs?...` 无 locale 参数，中文页面下返回英文结果。

**修改文件**：
- `src/components/CommandPalette.tsx`
  - 所有 `bg-white dark:bg-zinc-900` → `var(--bg-panel)`
  - `border-zinc-*` → `var(--border-default)`
  - active item `bg-zinc-100 dark:bg-zinc-800` → `var(--bg-elevated)`
  - `text-zinc-900 dark:text-zinc-100` → `var(--text-primary)`
  - fetch URL 追加 `&locale=${locale}`（用 `useLocale()`）
  - STATIC_PAGES 标签改用 `useTranslations('nav')`

---

### P1.3 阅读时长计算【S】
**新建文件**：
- `src/lib/readingTime.ts` — 递归遍历 Lexical JSON tree，统计 text 节点词数 ÷ 200 = 分钟数，返回 `number`

**修改文件**：
- `src/app/[locale]/blog/[slug]/page.tsx` — 在日期旁展示 `{n} min read`
- `src/components/BlogCard.tsx` — 在 meta row 展示
- `src/i18n/messages/en.json` + `zh.json` — 新增 `blog.minRead: "{count} min read"` / `"{count} 分钟阅读"`

---

### P1.4 博客列表分页【M】
**问题**：硬限制 12 篇，无翻页 UI。Payload 已返回 `totalDocs`/`totalPages`/`hasNextPage` 但被丢弃。

**新建文件**：
- `src/components/Pagination.tsx` — 纯 Server Component，接受 `{ page, totalPages, basePath }`，用 `Link`（`@/i18n/navigation`）渲染 prev/next + 页码，样式用 `ds-ghost-btn` / `--accent-primary`

**修改文件**：
- `src/app/[locale]/blog/page.tsx` — 接受 `searchParams.page`，传给 Payload `find({ page })`，渲染 `<Pagination />`
- `src/i18n/messages/en.json` + `zh.json` — 新增 `blog.pagination.*` keys

---

### P1.5 JSON-LD Article Schema【S】
**在博客详情页注入**：
- `BlogPosting` schema：`headline`、`description`、`datePublished`、`author`（Jack Deng）、`image`、`url`
- `BreadcrumbList` schema：与现有 breadcrumb UI 同步

**修改文件**：
- `src/app/[locale]/blog/[slug]/page.tsx` — 页面底部添加两个 `<script type="application/ld+json">` 块

---

## P2 — 锦上添花（品质提升）

### P2.1 Footer 组件统一【S】
**问题**：footer 代码散落在 4 处（`[locale]/page.tsx`、`about/page.tsx`、`blog/layout.tsx`、`blog/[slug]/page.tsx`），`blog/layout.tsx` 版本还缺 i18n 且无导航链接。

**新建**：`src/components/Footer.tsx` — 含 copyright（i18n）、builtWith（i18n）、快捷导航（Blog / About 链接）
**修改**：上述 4 处替换为 `<Footer />`

---

### P2.2 博客详情"相关文章"【M】
在文章正文与评论区之间，展示 2-3 篇相关文章（同分类优先，不足则补近期）。

**修改文件**：
- `src/app/[locale]/blog/[slug]/page.tsx` — 新增 related posts 查询 + 精简卡片渲染
- i18n key：`blog.relatedPosts`

---

### P2.3 locale 感知的日期格式【S】
**问题**：`formatDate` 在 6 个文件中硬编码 `'en-US'`，中文用户看到英文日期。

**新建**：`src/lib/formatDate.ts` — `formatDate(iso, locale)` 根据 locale 选 `'en-US'` / `'zh-CN'`
**修改**：`BlogCard.tsx`（加 locale prop）、`Sidebar.tsx`、`archive/page.tsx`、`blog/[slug]/page.tsx`、及所有调用方传入 locale

---

## 执行顺序（按周）

**Week 1 — 消除视觉断层**
1. P0.4 CategoryBadge（15 min）
2. P0.1 Blog 子页设计修复
3. P0.2 LexicalRenderer prose token
4. P0.3 not-found 页
5. P1.2 CommandPalette token + locale

**Week 2 — SEO + 博客功能**
6. P1.1 sitemap + robots + canonical
7. P1.5 JSON-LD schema
8. P1.3 阅读时长
9. P1.4 分页
10. P2.3 locale 日期格式

**Week 3 — 内容 + 收尾**
11. P2.1 Footer 统一
12. P2.2 相关文章
13. Phase 6：在 /admin 发布第一篇博客 + 创建 projects + Turnstile E2E 测试

---

## 关键文件路径

```
src/app/globals.css                              ← P0.2 prose-ds token
src/app/[locale]/blog/layout.tsx                 ← P0.1 bg-base + footer i18n
src/app/[locale]/blog/archive/page.tsx           ← P0.1 + P2.3
src/app/[locale]/blog/category/[slug]/page.tsx   ← P0.1
src/app/[locale]/blog/tag/[slug]/page.tsx        ← P0.1
src/app/[locale]/blog/[slug]/page.tsx            ← P1.3 + P1.5 + P2.2
src/app/[locale]/blog/page.tsx                   ← P1.4
src/components/LexicalRenderer.tsx               ← P0.2
src/components/CommandPalette.tsx                ← P1.2
src/components/CategoryBadge.tsx                 ← P0.4
src/components/BlogCard.tsx                      ← P1.3 + P2.3
src/components/Sidebar.tsx                       ← P2.3
src/i18n/messages/en.json + zh.json              ← P1.3 P1.4 P2.2 P2.3
src/app/sitemap.ts                               ← P1.1（新建）
src/app/robots.ts                                ← P1.1（新建）
src/app/[locale]/not-found.tsx                   ← P0.3（新建）
src/lib/readingTime.ts                           ← P1.3（新建）
src/lib/formatDate.ts                            ← P2.3（新建）
src/components/Pagination.tsx                    ← P1.4（新建）
src/components/Footer.tsx                        ← P2.1（新建）
```

## 验收方式
- 视觉：访问 `/en/blog`、`/en/blog/category/any`、`/en/blog/tag/any`、`/en/blog/archive`，确认背景色/文字色与首页一致，无白色闪烁
- SEO：`curl https://www.jackdeng.cc/sitemap.xml` 返回有效 XML；`/robots.txt` 包含 `Disallow: /admin`
- 阅读时长：博客卡片和详情页展示 "N min read"
- 分页：`/en/blog?page=2` 返回第二页数据，prev/next 链接正确
- JSON-LD：Chrome DevTools → Elements → 搜索 `application/ld+json`，确认 BlogPosting schema 存在
- 404：访问 `/en/nonexistent-path`，显示设计系统内的 404 页
