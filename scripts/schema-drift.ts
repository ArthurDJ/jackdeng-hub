/**
 * Does the migration chain build the schema the code defines?
 *
 * For five months it did not: Payload's dev-mode push kept production in step
 * with the collection configs while the migrations fell 26 differences behind
 * (#46, #53). Nothing compared the two, so nothing noticed.
 *
 * CI runs this against two empty databases on a local Postgres:
 *
 *   1. `payload migrate` into MIGRATED_URI
 *   2. `schema-drift.ts push` — the code's schema pushed into PUSHED_URI
 *   3. `schema-drift.ts compare` — columns, constraints, indexes and enums
 *
 * and fails on any difference. A collection change without a migration, or a
 * migration that does not do what the config says, shows up here instead of
 * as drift discovered months later.
 *
 * Deliberately does not load .env.local, which points at production. Both
 * URLs must be on localhost.
 */
import pg from 'pg'
import { isLocalDatabaseUrl } from '../src/lib/localDatabase'

function local(name: string): string {
  const url = process.env[name] ?? ''
  if (!isLocalDatabaseUrl(url)) throw new Error(`${name} must be a localhost database URL`)
  return url
}

async function push() {
  const url = local('PUSHED_URI')
  // The database may not exist yet; create it from the maintenance DB.
  const admin = new pg.Client({ connectionString: url.replace(/\/[^/?]+(\?|$)/, '/postgres$1') })
  await admin.connect()
  const name = new URL(url).pathname.slice(1)
  const exists = await admin.query('select 1 from pg_database where datname = $1', [name])
  if (!exists.rowCount) await admin.query(`create database "${name}"`)
  await admin.end()

  // payload.config.ts enables push only for PAYLOAD_SCHEMA_PUSH=1 on a
  // localhost DATABASE_URI, and Payload pushes only outside production.
  process.env.DATABASE_URI = url
  process.env.PAYLOAD_SCHEMA_PUSH = '1'
  // The Vercel Blob storage plugin is enabled only when this token is set
  // (payload.config.ts), and production always has it. Without it the
  // plugin's fields vanish from the pushed schema, so the check compared a
  // schema production does not have: it passed the Payload 3.90 upgrade while
  // media._objectkey was missing, and the build caught it instead. The value
  // is never used to talk to Blob; nothing here uploads.
  process.env.BLOB_READ_WRITE_TOKEN ??= 'vercel_blob_rw_schemadrift_placeholder'
  if (process.env.NODE_ENV === 'production') throw new Error('push runs only outside NODE_ENV=production')
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  await getPayload({ config })
  console.log('pushed the code schema into', name)
}

async function snapshot(url: string) {
  const c = new pg.Client({ connectionString: url })
  await c.connect()
  const q = async (sql: string) => (await c.query(sql)).rows.map((r) => Object.values(r).join(' | '))
  const out = {
    columns: await q(`
      select table_name, column_name, udt_name, is_nullable, coalesce(column_default, '')
      from information_schema.columns
      where table_schema = 'public' and table_name <> 'payload_migrations'
      order by 1, 2`),
    constraints: await q(`
      select tc.table_name, tc.constraint_type,
             string_agg(kcu.column_name, ',' order by kcu.ordinal_position)
      from information_schema.table_constraints tc
      left join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
      where tc.table_schema = 'public' and tc.table_name <> 'payload_migrations'
        and tc.constraint_type in ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
      group by 1, 2, tc.constraint_name
      order by 1, 2, 3`),
    indexes: await q(`
      select tablename, indexname, regexp_replace(indexdef, 'INDEX \\S+ ON', 'INDEX ON')
      from pg_indexes
      where schemaname = 'public' and tablename <> 'payload_migrations'
      order by 1, 2`),
    enums: await q(`
      select t.typname, string_agg(e.enumlabel, ',' order by e.enumsortorder)
      from pg_type t
      join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
      group by 1
      order by 1`),
  }
  await c.end()
  return out
}

async function compare() {
  const migrated = await snapshot(local('MIGRATED_URI'))
  const pushed = await snapshot(local('PUSHED_URI'))
  let total = 0
  for (const kind of Object.keys(migrated) as (keyof typeof migrated)[]) {
    const a = new Set(migrated[kind])
    const b = new Set(pushed[kind])
    const onlyMigrations = [...a].filter((x) => !b.has(x))
    const onlyCode = [...b].filter((x) => !a.has(x))
    total += onlyMigrations.length + onlyCode.length
    console.log(`${kind}: ${a.size} from the migrations, ${b.size} from the code` +
      (onlyMigrations.length || onlyCode.length ? '' : ' — identical'))
    for (const x of onlyMigrations) console.log(`  migrations only: ${x}`)
    for (const x of onlyCode) console.log(`  code only:       ${x}`)
  }
  if (total) {
    console.log(`\n${total} difference(s). The migrations do not build the schema the collections define.`)
    console.log('Write a migration for the change (see src/migrations/), or fix the one that is wrong.')
    process.exit(1)
  }
  console.log('\nThe migrations build exactly the schema the code defines.')
}

const mode = process.argv[2]
if (mode === 'push') await push()
else if (mode === 'compare') await compare()
else throw new Error('usage: schema-drift.ts push | compare')
process.exit(0)
