import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * The four indexes Payload 3.91 adds, found by the CI schema-drift check
 * (scripts/schema-drift.ts) as the only differences between the migrations
 * and the upgraded code — "code only" on all four, nothing dropped:
 *
 *   blogs_locales      | blogs_locales_parent_id_idx
 *   categories_locales | categories_locales_parent_id_idx
 *   projects_locales   | projects_locales_parent_id_idx
 *   tools_locales      | tools_locales_parent_id_idx
 *
 * 3.91 indexes the `_parent_id` foreign key on every localized table. Earlier
 * versions declared the column and the FK constraint but no index, so every
 * join from a row to its translations was a sequential scan over the locale
 * table. Nothing about the columns themselves changes: this is additive and
 * index-only, no data is read or rewritten.
 *
 * Safe in either deploy order, unlike the 3.90 column additions: an index is
 * invisible to the application, so the build still live on 3.90 neither needs
 * it nor notices it, and 3.91 only plans queries better once it exists.
 *
 * Plain CREATE INDEX rather than CONCURRENTLY: Payload runs migrations inside
 * a transaction and CONCURRENTLY cannot, and all four tables hold tens of
 * rows, so the write lock is momentary.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "blogs_locales_parent_id_idx" ON "blogs_locales" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "categories_locales_parent_id_idx" ON "categories_locales" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "projects_locales_parent_id_idx" ON "projects_locales" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "tools_locales_parent_id_idx" ON "tools_locales" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "tools_locales_parent_id_idx";
    DROP INDEX IF EXISTS "projects_locales_parent_id_idx";
    DROP INDEX IF EXISTS "categories_locales_parent_id_idx";
    DROP INDEX IF EXISTS "blogs_locales_parent_id_idx";
  `)
}
