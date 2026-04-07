/**
 * i18n integrity checker
 * Run: npm run i18n:check
 *
 * Checks:
 * 1. zh.json has all keys from en.json (no missing translations)
 * 2. zh.json has no extra keys not in en.json (no orphan keys)
 * 3. Scans src/ for used t() keys and flags zombie keys in en.json
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const en = JSON.parse(readFileSync(join(root, 'src/i18n/messages/en.json'), 'utf8'))
const zh = JSON.parse(readFileSync(join(root, 'src/i18n/messages/zh.json'), 'utf8'))

let errors = 0
let warnings = 0

// ── 1. Flatten JSON keys ───────────────────────────────────────────────────────

function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.assign(acc, flatten(v, key))
    } else {
      acc[key] = v
    }
    return acc
  }, {})
}

const enFlat = flatten(en)
const zhFlat = flatten(zh)

const enKeys = new Set(Object.keys(enFlat).filter(k => !k.startsWith('_')))
const zhKeys = new Set(Object.keys(zhFlat).filter(k => !k.startsWith('_')))

// ── 2. Missing keys in zh ──────────────────────────────────────────────────────

const missingInZh = [...enKeys].filter(k => !zhKeys.has(k))
if (missingInZh.length) {
  console.error('\n❌ Missing keys in zh.json:')
  missingInZh.forEach(k => { console.error(`   ${k}`); errors++ })
}

// ── 3. Extra keys in zh (not in en) ───────────────────────────────────────────

const extraInZh = [...zhKeys].filter(k => !enKeys.has(k))
if (extraInZh.length) {
  console.warn('\n⚠️  Extra keys in zh.json (not in en.json):')
  extraInZh.forEach(k => { console.warn(`   ${k}`); warnings++ })
}

// ── 4. Zombie key detection (keys in en.json not found in src/) ───────────────

function getAllSourceFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === 'i18n') continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      results.push(...getAllSourceFiles(full))
    } else if (['.ts', '.tsx', '.js', '.jsx'].includes(extname(entry))) {
      results.push(full)
    }
  }
  return results
}

const srcFiles = getAllSourceFiles(join(root, 'src'))
const allSource = srcFiles.map(f => readFileSync(f, 'utf8')).join('\n')

const zombies = []
for (const key of enKeys) {
  // Get the leaf key (last segment) for t('leaf') style calls
  const leaf = key.split('.').pop()
  const namespace = key.split('.').slice(0, -1).join('.')

  // Check for both t('fullKey') and t('leafKey') usage patterns
  const fullPattern = key.replace(/\./g, '\\.')
  const usedAsFull = new RegExp(`['"\`]${fullPattern}['"\`]`).test(allSource)
  const usedAsLeaf = new RegExp(`['"\`]${leaf}['"\`]`).test(allSource)
  // Also check for namespace usage: useTranslations('namespace')
  const namespaceUsed = namespace && new RegExp(`['"\`]${namespace.split('.')[0]}['"\`]`).test(allSource)

  if (!usedAsFull && !usedAsLeaf && !namespaceUsed) {
    zombies.push(key)
  }
}

if (zombies.length) {
  console.warn('\n⚠️  Possible zombie keys (not found in src/):')
  zombies.forEach(k => { console.warn(`   ${k}`); warnings++ })
  console.warn('   (These may be false positives for dynamically composed keys)')
}

// ── 5. Summary ────────────────────────────────────────────────────────────────

console.log(`\n📊 i18n check summary:`)
console.log(`   en.json keys : ${enKeys.size}`)
console.log(`   zh.json keys : ${zhKeys.size}`)
console.log(`   ❌ Errors    : ${errors}`)
console.log(`   ⚠️  Warnings  : ${warnings}`)

if (errors > 0) {
  console.error('\n✗ i18n check FAILED — fix missing keys before committing.\n')
  process.exit(1)
} else {
  console.log('\n✓ i18n check passed.\n')
}
