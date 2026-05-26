import { Client } from 'pg'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Raw pg snapshot of the `projects` table. Bypasses Payload init entirely —
 * runs in ~2 seconds. Use as a rollback baseline before applying the
 * add_projects_localization migration.
 *
 * Restore (manual): the JSON contains every column. INSERT rows back if needed.
 */
async function run() {
  const conn = process.env.DATABASE_URI
  if (!conn) {
    console.error('DATABASE_URI is not set; run with --env-file=.env')
    process.exit(1)
  }

  const client = new Client({ connectionString: conn })
  await client.connect()

  const result = await client.query('SELECT * FROM projects ORDER BY id')

  const backupsDir = join(process.cwd(), 'backups')
  if (!existsSync(backupsDir)) {
    mkdirSync(backupsDir, { recursive: true })
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = join(backupsDir, `projects_${stamp}.json`)

  writeFileSync(
    file,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        table: 'projects',
        rowCount: result.rowCount,
        columns: result.fields.map((f) => f.name),
        rows: result.rows,
      },
      null,
      2,
    ),
    'utf8',
  )

  await client.end()
  console.log(`OK  wrote ${result.rowCount} row(s) to ${file}`)
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
