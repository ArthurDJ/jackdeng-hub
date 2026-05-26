import { Client } from 'pg'

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URI })
  await client.connect()

  const migrations = await client.query(
    `SELECT name FROM payload_migrations ORDER BY id DESC LIMIT 5`
  )
  console.log('Last 5 migrations applied:')
  migrations.rows.forEach((r) => console.log('  -', r.name))

  const projTable = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'projects' AND table_schema = 'public'
     ORDER BY ordinal_position`
  )
  console.log('\nprojects columns:', projTable.rows.map((r) => r.column_name).join(', '))

  const projLocales = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'projects_locales' AND table_schema = 'public'
     ORDER BY ordinal_position`
  )
  console.log('projects_locales columns:', projLocales.rows.map((r) => r.column_name).join(', ') || '(table does not exist)')

  const localeCount = await client.query(
    `SELECT _locale, COUNT(*) FROM projects_locales GROUP BY _locale`
  ).catch(() => ({ rows: [] }))
  console.log('\nprojects_locales by locale:')
  localeCount.rows.forEach((r) => console.log(`  ${r._locale}: ${r.count}`))

  await client.end()
  process.exit(0)
}

run().catch((e) => { console.error(e); process.exit(1) })
