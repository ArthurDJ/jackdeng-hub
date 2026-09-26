/**
 * Sample content for an empty database: three bilingual posts, one category
 * and one tag on the first of them, a project and the falling-sand tool.
 *
 * CI runs this against its throwaway Postgres before `next build`, so the
 * build and the smoke check see one of every page type: a post, a category
 * and a tag page with a post on them, a project and a tool. It is also what a
 * fresh local database needs to look like the site.
 */
import { loadEnv, requireApply } from './lib/env'
import { getPayload } from 'payload'

loadEnv()
requireApply({ script: 'scripts/seed.ts', writes: ['blogs', 'categories', 'tags', 'projects', 'tools'] })

const createParagraph = (text: string): any => ({
  root: {
    type: 'root',
    format: '',
    direction: 'ltr' as const,
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text,
            type: 'text',
            version: 1,
          },
        ],
      },
    ],
  },
})

async function run() {
  console.log('Initializing payload...')
  const configPromise = (await import('../src/payload.config')).default
  const payload = await getPayload({ config: configPromise })

  console.log('Creating post 1...')
  const post1 = await payload.create({
    collection: 'blogs',
    locale: 'en',
    data: {
      title: 'Architecting Resilient Integrations with Boomi',
      slug: 'architecting-resilient-integrations-boomi',
      excerpt: 'How to build robust, fault-tolerant integration pipelines that scale without waking you up at 3 AM.',
      content: createParagraph('Integrations are the nervous system of modern enterprise architecture. In this post, we explore the patterns and practices for building high-availability data pipelines using Boomi. We will cover error handling frameworks, retry mechanisms, and state management.'),
      status: 'published',
      featured: true,
      publishedAt: new Date().toISOString(),
    },
  })

  await payload.update({
    collection: 'blogs',
    id: post1.id,
    locale: 'zh',
    data: {
      title: '使用 Boomi 构建高可用企业集成架构',
      excerpt: '如何构建稳健、容错且可扩展的集成数据管道，告别凌晨3点的报警电话。',
      content: createParagraph('系统集成是现代企业架构的神经系统。在这篇文章中，我们将探讨使用 Boomi 构建高可用数据管道的模式和最佳实践。主要涵盖异常处理框架、重试机制和状态管理。'),
    },
  })

  console.log('Creating post 2...')
  const post2 = await payload.create({
    collection: 'blogs',
    locale: 'en',
    data: {
      title: 'Why I chose Next.js and Payload CMS for my new site',
      slug: 'nextjs-payload-cms-portfolio',
      excerpt: 'A deep dive into the tech stack choices behind jackdeng.cc, balancing developer experience with performance.',
      content: createParagraph('After evaluating several stacks including Astro, Remix, and plain React, I landed on Next.js 14 App Router combined with Payload CMS. Payload provides an incredibly flexible headless CMS that pairs beautifully with Next.js Server Components. The database is hosted on Supabase.'),
      status: 'published',
      featured: true,
      publishedAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
    },
  })

  await payload.update({
    collection: 'blogs',
    id: post2.id,
    locale: 'zh',
    data: {
      title: '为什么我选择 Next.js 和 Payload CMS 重构个人网站',
      excerpt: '深入探讨 jackdeng.cc 背后的技术栈选择，以及如何在开发体验和性能之间取得平衡。',
      content: createParagraph('在评估了 Astro、Remix 等多个框架后，我最终选择了 Next.js 14 App Router 搭配 Payload CMS。Payload 提供了一个极其灵活的 Headless CMS 体验，与 Next.js Server Components 的结合堪称完美。底层数据库则托管在 Supabase 上。'),
    },
  })

  console.log('Creating post 3...')
  const post3 = await payload.create({
    collection: 'blogs',
    locale: 'en',
    data: {
      title: 'Data Governance in the Age of LLMs',
      slug: 'data-governance-llms',
      excerpt: 'As organizations rush to deploy AI, foundational data quality and governance have never been more critical.',
      content: createParagraph('You cannot build robust AI systems on top of messy data. Before deploying Large Language Models against enterprise knowledge bases, organizations must fix their data silos, implement strict access controls, and ensure semantic consistency across systems like NetSuite and Salesforce.'),
      status: 'published',
      featured: false,
      publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    },
  })

  await payload.update({
    collection: 'blogs',
    id: post3.id,
    locale: 'zh',
    data: {
      title: '大模型时代的数据治理',
      excerpt: '当企业争相部署 AI 应用时，基础的数据质量和治理体系显得比以往任何时候都更加重要。',
      content: createParagraph('你无法在混乱的数据之上构建可靠的 AI 系统。在将大语言模型应用于企业知识库之前，组织必须打破数据孤岛，实施严格的访问控制，并确保 NetSuite、Salesforce 等核心系统之间的语义一致性。'),
    },
  })

  console.log('Creating a category and a tag on post 1...')
  const category = await payload.create({
    collection: 'categories',
    locale: 'en',
    data: { name: 'Backend', slug: 'backend' },
  })
  await payload.update({ collection: 'categories', id: category.id, locale: 'zh', data: { name: '后端' } })
  const tag = await payload.create({
    collection: 'tags',
    data: { name: 'Boomi', slug: 'boomi', color: '#3B82F6' },
  })
  await payload.update({ collection: 'blogs', id: post1.id, data: { category: category.id, tags: [tag.id] } })

  console.log('Creating a project...')
  const project = await payload.create({
    collection: 'projects',
    locale: 'en',
    data: {
      name: 'Sample Integration Project',
      slug: 'sample-integration-project',
      shortDescription: 'A sample project so the project pages have something to render.',
      longDescription: createParagraph('The detail page renders this rich text.'),
      status: 'completed',
      isPinned: true,
      techStack: [{ tech: 'Boomi' }, { tech: 'NetSuite' }],
    },
  })
  await payload.update({
    collection: 'projects',
    id: project.id,
    locale: 'zh',
    data: {
      name: '示例集成项目',
      shortDescription: '一个示例项目，让项目页面有内容可渲染。',
      longDescription: createParagraph('详情页会渲染这段富文本。'),
    },
  })

  console.log('Creating the falling-sand tool...')
  const tool = await payload.create({
    collection: 'tools',
    locale: 'en',
    data: {
      name: 'Falling Sand',
      slug: 'falling-sand',
      description: 'A cellular automaton that runs in the browser.',
      accessControl: 'public',
      status: 'online',
      embedType: 'builtin',
    },
  })
  await payload.update({
    collection: 'tools',
    id: tool.id,
    locale: 'zh',
    data: { name: '落沙', description: '在浏览器里运行的元胞自动机。' },
  })

  console.log('Seed complete!')
  process.exit(0)
}

// Exit on failure too: the open database pool would otherwise keep the
// process alive, and CI would hang on a failed seed instead of failing.
run().catch((err) => {
  console.error(err)
  process.exit(1)
})
