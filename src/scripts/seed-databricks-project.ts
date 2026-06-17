/**
 * Seed script: add the "Enterprise Manufacturing Analytics Platform" project.
 *
 * Content is intentionally sanitized — no company name, ERP/payroll product
 * names, internal catalog/schema/table names, product lines, or repo links.
 * Only architecture and tech-stack details are described.
 *
 * Run: npx tsx --env-file=.env src/scripts/seed-databricks-project.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import type { Project } from '../payload-types'

const SLUG = 'enterprise-manufacturing-analytics'

// Payload's generated type for the project rich-text field. Annotating the
// `doc()` helper with this lets the object literals be contextually typed, so
// `direction: 'ltr'` / `format: ''` satisfy their literal unions instead of
// widening to `string` (which previously broke `next build`'s type check).
type LexicalDoc = NonNullable<Project['longDescription']>

// ── Lexical helpers ──────────────────────────────────────────────────────────
const txt = (text: string, format = 0) => ({
  type: 'text', text, format, style: '', mode: 'normal', detail: 0, version: 1,
})
const p = (...children: any[]) => ({
  type: 'paragraph', children, format: '', indent: 0, direction: 'ltr', version: 1,
  textFormat: 0, textStyle: '',
})
const h = (tag: 'h2' | 'h3', text: string) => ({
  type: 'heading', tag, children: [txt(text)], format: '', indent: 0, direction: 'ltr', version: 1,
})
const ul = (...items: string[]) => ({
  type: 'list', listType: 'bullet', tag: 'ul', start: 1, format: '', indent: 0, direction: 'ltr', version: 1,
  children: items.map((item, i) => ({
    type: 'listitem', value: i + 1, children: [txt(item)], format: '', indent: 0, direction: 'ltr', version: 1,
  })),
})
const doc = (...children: any[]): LexicalDoc => ({
  root: { type: 'root', children, format: '' as const, indent: 0, direction: 'ltr' as const, version: 1 },
})

// ── Content (EN) ─────────────────────────────────────────────────────────────
const longEN = doc(
  h('h2', 'Overview'),
  p(txt('A dbt project running on Databricks that transforms raw ERP data into analytics-ready models. It implements a medallion (Bronze → Silver → Gold → Mart) architecture so cleaned, curated tables can power KPI dashboards, leaderboards, and operational views across multiple manufacturing lines, workforce productivity, pre-production planning, and sales reporting.')),
  h('h2', 'Architecture'),
  p(txt('Data flows through four progressively refined layers, each with a clear responsibility:')),
  ul(
    'Bronze — raw ingested ERP source tables, landed as-is.',
    'Silver — cleaned and standardized facts and dimensions (orders, units, sales, scans, employee hours).',
    'Gold — domain-curated, business-ready models with lead times, production metrics, and remake reasons.',
    'Mart — analytical views: KPIs, leaderboards, and aggregations consumed by dashboards.',
  ),
  h('h2', 'Highlights'),
  ul(
    'Layered modeling with reusable macros for schema naming and shared transformation logic.',
    'Data-quality tests and snapshots for slowly changing dimensions.',
    'Seed-driven reference lookups for reproducible, version-controlled metadata.',
    'Built on Unity Catalog with managed Iceberg tables for Silver/Gold layers.',
  ),
  h('h2', 'My Role'),
  ul(
    'Took part in the architecture design and deployment of the platform.',
    'Built a three-tier, AI-powered self-service query application on top of the data layer, letting production teams explore the data they need on their own — without going through the data team.',
    'Implemented access separation so each role and department can only reach the data it is authorized to see.',
  ),
)

// ── Content (ZH) ─────────────────────────────────────────────────────────────
const longZH = doc(
  h('h2', '项目概述'),
  p(txt('一个运行在 Databricks 上的 dbt 项目，将原始 ERP 数据转化为可直接用于分析的模型。采用 Medallion（Bronze → Silver → Gold → Mart）分层架构，使经过清洗与整理的数据表能够支撑 KPI 看板、排行榜以及跨多条制造产线、人力效率、预生产计划和销售报表的运营视图。')),
  h('h2', '架构设计'),
  p(txt('数据经过四个逐层精炼的层级，每一层职责清晰：')),
  ul(
    'Bronze——原始接入的 ERP 源表，按原样落地。',
    'Silver——清洗与标准化后的事实表和维度表（订单、单元、销售、扫描、工时）。',
    'Gold——面向业务领域整理的可用模型，包含交期、生产指标与返工原因等。',
    'Mart——分析视图：KPI、排行榜与聚合结果，供看板直接消费。',
  ),
  h('h2', '技术亮点'),
  ul(
    '分层建模，配合可复用的 macro 统一 schema 命名与共享转换逻辑。',
    '数据质量测试，并使用 snapshot 处理缓慢变化维度。',
    '以 seed 驱动参考数据查找，实现可复现、可版本化的元数据管理。',
    '基于 Unity Catalog 构建，Silver/Gold 层使用托管 Iceberg 表格式。',
  ),
  h('h2', '我的角色'),
  ul(
    '参与平台的架构设计与部署。',
    '在数据层之上构建了三层架构的 AI 自助查询应用，让生产部门无需经过数据团队即可自行查询所需数据。',
    '实现权限分离，确保不同角色与部门只能访问各自授权范围内的数据。',
  ),
)

const TECH = ['dbt', 'Databricks', 'Unity Catalog', 'Apache Iceberg', 'Python', 'SQL', 'Medallion Architecture']

async function run() {
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'projects',
    where: { slug: { equals: SLUG } },
    limit: 1,
  })

  const baseData = {
    name: 'Enterprise Manufacturing Analytics Platform',
    slug: SLUG,
    shortDescription:
      'A dbt + Databricks pipeline using a medallion (Bronze→Silver→Gold→Mart) architecture to turn raw ERP data into analytics-ready models for manufacturing, inventory, sales, and workforce reporting.',
    status: 'active' as const,
    isPinned: false,
    techStack: TECH.map((tech) => ({ tech })),
    longDescription: longEN,
  }

  const zhData = {
    name: '企业制造数据分析平台',
    shortDescription:
      '基于 dbt + Databricks 的数据管道，采用 Medallion（Bronze→Silver→Gold→Mart）分层架构，将原始 ERP 数据转化为可直接用于分析的模型，支撑制造运营、库存、销售与人力效率报表。',
    longDescription: longZH,
  }

  let id: string | number
  if (existing.docs.length > 0) {
    id = existing.docs[0].id
    await payload.update({ collection: 'projects', id, data: baseData, locale: 'en' })
    console.log(`Updated existing project (id=${id})`)
  } else {
    const created = await payload.create({ collection: 'projects', data: baseData, locale: 'en' })
    id = created.id
    console.log(`Created project (id=${id})`)
  }

  await payload.update({ collection: 'projects', id, data: zhData, locale: 'zh' })
  console.log('Wrote zh locale fields.')

  console.log('Done.')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
