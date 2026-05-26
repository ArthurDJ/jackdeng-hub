import { Client } from 'pg'

/**
 * Apply add_projects_localization migration directly via pg, bypassing the
 * Payload migrate CLI (which hangs against the Supabase pooler in this env).
 *
 * Runs the same SQL as src/migrations/20260525_000001_add_projects_localization.ts
 * inside a transaction, then records it in payload_migrations.
 */
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URI })
  await client.connect()

  const MIGRATION_NAME = '20260525_000001_add_projects_localization'

  const exists = await client.query(
    `SELECT 1 FROM payload_migrations WHERE name = $1`,
    [MIGRATION_NAME],
  )
  if ((exists.rowCount ?? 0) > 0) {
    console.log(`Migration ${MIGRATION_NAME} already applied. Nothing to do.`)
    await client.end()
    process.exit(0)
  }

  console.log(`Applying ${MIGRATION_NAME}...`)

  try {
    await client.query('BEGIN')

    await client.query(`
      CREATE TABLE IF NOT EXISTS "projects_locales" (
        "name" varchar NOT NULL,
        "short_description" varchar NOT NULL,
        "long_description" jsonb,
        "id" serial PRIMARY KEY NOT NULL,
        "_locale" "_locales" NOT NULL,
        "_parent_id" integer NOT NULL
      );
    `)
    console.log('  ✓ created projects_locales')

    const ins = await client.query(`
      INSERT INTO "projects_locales" ("name", "short_description", "long_description", "_locale", "_parent_id")
        SELECT "name", "short_description", "long_description", 'zh'::"_locales", "id"
        FROM "projects"
      ON CONFLICT DO NOTHING
      RETURNING id;
    `)
    console.log(`  ✓ copied ${ins.rowCount} row(s) into zh slot`)

    await client.query(`
      ALTER TABLE "projects_locales"
        ADD CONSTRAINT "projects_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id")
        ON DELETE cascade ON UPDATE no action;
    `)
    console.log('  ✓ added FK projects_locales -> projects')

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "projects_locales_locale_parent_id_unique"
        ON "projects_locales" USING btree ("_locale", "_parent_id");
    `)
    console.log('  ✓ created unique index')

    await client.query(`ALTER TABLE "projects" DROP COLUMN "name";`)
    await client.query(`ALTER TABLE "projects" DROP COLUMN "short_description";`)
    await client.query(`ALTER TABLE "projects" DROP COLUMN "long_description";`)
    console.log('  ✓ dropped 3 columns from projects')

    await client.query(
      `INSERT INTO payload_migrations (name, batch, updated_at, created_at)
       VALUES ($1, COALESCE((SELECT MAX(batch) FROM payload_migrations), 0) + 1, NOW(), NOW())`,
      [MIGRATION_NAME],
    )
    console.log(`  ✓ recorded ${MIGRATION_NAME} in payload_migrations`)

    await client.query('COMMIT')
    console.log('Done. Transaction committed.')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('FAILED — transaction rolled back:', e)
    process.exitCode = 1
  } finally {
    await client.end()
  }

  process.exit()
}

run().catch((e) => { console.error(e); process.exit(1) })
