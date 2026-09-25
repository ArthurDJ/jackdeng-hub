import { ogCardUrl } from './ogCard'

// Who the site is about, in one place. The home page and About both read from
// here, so the contact address, the headline and the timeline cannot drift
// apart again (the About page used to offer two different email addresses,
// one of which had no mailbox behind it).

/**
 * Where "email me" goes. hello@jackdeng.cc would read better, but the domain
 * has no MX record, so mail to it bounces. Switch this once a forwarding
 * service (e.g. Cloudflare Email Routing) is set up and a test message arrives.
 */
export const CONTACT_EMAIL = 'dj3013158@gmail.com'

export const RESUME_URL = '/resume.pdf'

export const SITE_HOST = 'www.jackdeng.cc'

/**
 * A link as it should read on paper: no scheme, no trailing slash, and an
 * email address rather than a mailto: URL. Printed pages cannot be clicked,
 * so the contact line under the name spells every link out.
 */
export function printableUrl(href: string): string {
  if (href.startsWith('mailto:')) return href.slice('mailto:'.length)
  return href.replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

export const PROFILE_LINKS = [
  { label: 'GitHub',    href: 'https://github.com/ArthurDJ', icon: 'github' },
  { label: 'LinkedIn',  href: 'https://linkedin.com/in/jie-deng-linkdin', icon: 'linkedin' },
  { label: 'LeetCode',  href: 'https://leetcode.com/u/dj3013158/', icon: 'leetcode' },
  { label: 'Email',     href: `mailto:${CONTACT_EMAIL}`, icon: 'email' },
  { label: 'Resume',    href: RESUME_URL, icon: 'resume' },
] as const

// Grouped the way the résumé groups them, so a reader comparing the two sees
// the same stack.
export const SKILLS = [
  { group: { en: 'Backend', zh: '后端' }, items: ['Python', 'C#', 'SQL', 'TypeScript', 'Node.js', 'REST APIs'] },
  { group: { en: 'Data', zh: '数据' }, items: ['Databricks', 'dbt', 'SQL Server', 'PostgreSQL', 'MySQL', 'ETL'] },
  { group: { en: 'Web', zh: 'Web 前端' }, items: ['React', 'Next.js', 'Tailwind CSS', 'Payload CMS'] },
  { group: { en: 'Integration', zh: '系统集成' }, items: ['NetSuite', 'Boomi', 'EDI / SFTP', 'Webhooks'] },
  { group: { en: 'Tooling', zh: '工具链' }, items: ['Docker', 'Git', 'GitHub Actions', 'Vercel', 'AWS S3'] },
]

export const TIMELINE = [
  {
    year: { en: '01/2024 – present', zh: '01/2024 – 至今' },
    role: { en: 'Software Engineer (Backend & Data)', zh: '软件工程师 (后端与数据)' },
    place: 'Value Windows & Doors',
    bullets: {
      en: [
        'Built a 0-to-1 cloud data platform on Databricks + dbt with a medallion (Bronze→Silver→Gold→Mart) architecture, turning raw ERP data into analytics-ready models for manufacturing, inventory, sales, and workforce reporting.',
        'Engineered C# and Python data-migration and integration pipelines that improved ERP reliability and processed tens of thousands of records daily across departments.',
        'Delivered Power BI executive dashboards and React internal portals, giving teams self-serve access to real-time operational metrics.',
      ],
      zh: [
        '在 Databricks + dbt 上从 0 到 1 搭建云数据平台，采用 Medallion（Bronze→Silver→Gold→Mart）分层架构，将原始 ERP 数据转化为可直接分析的模型，支撑制造、库存、销售与人力效率报表。',
        '用 C# 与 Python 构建数据迁移与集成管道，提升 ERP 系统可靠性，每天跨部门处理数万条记录。',
        '交付 Power BI 高管看板与 React 内部门户，让各团队自助获取实时运营指标。',
      ],
    },
    tech: ['Databricks', 'dbt', 'Python', 'C#', 'React', 'Power BI'],
  },
  {
    year: { en: '07/2022 – 01/2024', zh: '07/2022 – 01/2024' },
    role: { en: 'Software Engineer Intern', zh: '软件开发实习生' },
    place: 'APEXUS-TECH',
    bullets: {
      en: [
        'Built a data-visualization tool that streamlined quantitative strategy analysis for the operations desk, improving decision-making speed.',
        'Developed Python + MySQL backend services that automatically ingested and persisted financial-market data, keeping analyses up to date.',
        'Designed ETL pipelines that lifted batch-processing efficiency by 40% and shipped internal monitoring dashboards with the product team.',
      ],
      zh: [
        '开发数据可视化工具，简化运营部门的量化策略分析，提升决策效率。',
        '用 Python + MySQL 构建后端服务，自动接入并持久化金融市场数据，保证分析实时更新。',
        '设计 ETL 管道，使批处理效率提升 40%，并与产品团队共同交付内部监控看板。',
      ],
    },
    tech: ['Python', 'MySQL', 'ETL', 'JavaScript', 'HTML/CSS'],
  },
  {
    year: { en: '03/2022 – 07/2023', zh: '03/2022 – 07/2023' },
    role: { en: 'M.S. Analytics', zh: '分析学硕士' },
    place: 'Northeastern University',
    bullets: {
      en: [
        'M.S. in Analytics, GPA 3.93/4.0 — coursework spanning data warehousing, predictive analytics, and enterprise data systems.',
        'Served as Data Warehousing & SQL Tutor (ALY6030), coaching graduate students on SQL performance tuning, indexing strategies, and execution-plan analysis.',
      ],
      zh: [
        '分析学硕士，GPA 3.93/4.0——课程涵盖数据仓库、预测分析与企业数据系统。',
        '担任数据仓库与 SQL 助教（ALY6030），指导研究生进行 SQL 性能调优、索引策略与执行计划分析。',
      ],
    },
    tech: ['SQL', 'Data Warehousing', 'Statistics', 'Python'],
  },
]

/**
 * schema.org Person for the home page and /about, so a search engine can tie
 * this site, GitHub and LinkedIn to one person. Built from the same data the
 * pages show — nothing here that a visitor cannot already read on the site.
 *
 * Two omissions on purpose: no `jobTitle` (the headline is the kind of work,
 * not a title held, so it goes in `description`), and no email (the page
 * already links it; structured data would only make it easier to harvest).
 */
export function personJsonLd(base: string, locale: 'en' | 'zh', headline: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${base}/#person`,
    name: 'Jack Deng',
    alternateName: 'Jie Deng',
    url: `${base}/${locale}`,
    description: headline,
    address: { '@type': 'PostalAddress', addressRegion: 'CA', addressCountry: 'US' },
    worksFor: { '@type': 'Organization', name: TIMELINE[0].place },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Northeastern University' },
    knowsAbout: SKILLS.flatMap((s) => s.items),
    sameAs: PROFILE_LINKS.filter((l) => l.href.startsWith('https://')).map((l) => l.href),
  }
}

/** The share-card image for pages about the person: name, then the headline. */
export function profileOgImage(base: string, headline: string) {
  return ogCardUrl(base, { title: 'Jack Deng', subtitle: headline })
}
