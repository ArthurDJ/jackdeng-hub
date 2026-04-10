/**
 * Seed script: populate Categories and Tags (full-stack engineer edition)
 * Run: npx tsx src/scripts/seed-taxonomy.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const CATEGORIES = [
  {
    name: 'Frontend',
    slug: 'frontend',
    description: 'React, Next.js, CSS, UI engineering, and web performance.',
  },
  {
    name: 'Backend',
    slug: 'backend',
    description: 'Node.js, REST & GraphQL APIs, server-side architecture.',
  },
  {
    name: 'Database',
    slug: 'database',
    description: 'PostgreSQL, SQL optimization, data modeling, Supabase.',
  },
  {
    name: 'Algorithms',
    slug: 'algorithms',
    description: 'Data structures, algorithm design, LeetCode, CS fundamentals.',
  },
  {
    name: 'DevOps & Tools',
    slug: 'devops-tools',
    description: 'CI/CD, Docker, Vercel, Git workflows, developer productivity.',
  },
  {
    name: 'Career & Thoughts',
    slug: 'career-thoughts',
    description: 'Career growth, industry observations, personal reflections.',
  },
]

const TAGS = [
  // Programming Languages
  { name: 'JavaScript', slug: 'javascript',  color: '#F7DF1E', description: 'JavaScript language' },
  { name: 'TypeScript', slug: 'typescript',  color: '#3178C6', description: 'TypeScript language' },
  { name: 'Python',     slug: 'python',      color: '#3776AB', description: 'Python language' },
  { name: 'SQL',        slug: 'sql',         color: '#E97316', description: 'SQL queries & optimization' },
  { name: 'Go',         slug: 'go',          color: '#00ADD8', description: 'Go language' },

  // Frontend
  { name: 'React',      slug: 'react',       color: '#61DAFB', description: 'React UI library' },
  { name: 'Next.js',    slug: 'nextjs',      color: '#AAAAAA', description: 'Next.js React framework' },
  { name: 'Tailwind',   slug: 'tailwind',    color: '#38BDF8', description: 'Tailwind CSS framework' },

  // Backend & Database
  { name: 'Node.js',    slug: 'nodejs',      color: '#5FA04E', description: 'Node.js runtime' },
  { name: 'PostgreSQL', slug: 'postgresql',  color: '#336791', description: 'PostgreSQL database' },
  { name: 'Supabase',   slug: 'supabase',    color: '#3ECF8E', description: 'Supabase BaaS' },
  { name: 'REST API',   slug: 'rest-api',    color: '#10B981', description: 'REST API design' },

  // Algorithms
  { name: 'Data Structures', slug: 'data-structures', color: '#8B5CF6', description: 'Arrays, trees, graphs, etc.' },
  { name: 'Dynamic Programming', slug: 'dynamic-programming', color: '#6366F1', description: 'DP patterns & problems' },
  { name: 'LeetCode',   slug: 'leetcode',    color: '#FFA116', description: 'LeetCode problem walkthroughs' },

  // DevOps & Tools
  { name: 'Docker',     slug: 'docker',      color: '#2496ED', description: 'Docker containerization' },
  { name: 'Git',        slug: 'git',         color: '#F05032', description: 'Git version control' },
  { name: 'Vercel',     slug: 'vercel',      color: '#888888', description: 'Vercel deployment platform' },

  // Integration
  { name: 'Boomi',      slug: 'boomi',       color: '#009FDA', description: 'Dell Boomi iPaaS' },
  { name: 'NetSuite',   slug: 'netsuite',    color: '#1776BF', description: 'Oracle NetSuite ERP' },
]

async function seed() {
  const payload = await getPayload({ config })

  // ── Clean up old test data ──────────────────────────────────────────
  console.log('Cleaning up old data...')
  const oldCats = await payload.find({ collection: 'categories', limit: 100 })
  for (const doc of oldCats.docs) {
    await payload.delete({ collection: 'categories', id: doc.id })
    console.log(`  removed category: ${doc.name}`)
  }
  const oldTags = await payload.find({ collection: 'tags', limit: 100 })
  for (const doc of oldTags.docs) {
    await payload.delete({ collection: 'tags', id: doc.id })
    console.log(`  removed tag: ${doc.name}`)
  }

  // ── Seed categories ─────────────────────────────────────────────────
  console.log('\nSeeding categories...')
  for (const cat of CATEGORIES) {
    await payload.create({ collection: 'categories', data: cat })
    console.log(`  ✓ ${cat.name}`)
  }

  // ── Seed tags ───────────────────────────────────────────────────────
  console.log('\nSeeding tags...')
  for (const tag of TAGS) {
    await payload.create({ collection: 'tags', data: tag })
    console.log(`  ✓ ${tag.name}`)
  }

  console.log('\nDone.')
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
