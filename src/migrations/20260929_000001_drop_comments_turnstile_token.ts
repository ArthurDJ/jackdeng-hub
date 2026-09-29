import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * The second half of retiring `comments.turnstile_token` (#36 took the first).
 *
 * #36 moved the Turnstile check into the submission request and stopped
 * writing the token: it is single-use, so a stored copy proves nothing once
 * spent. The field stayed defined, and the column in place, so that either
 * deployment order was safe. The code that ships with this migration no
 * longer defines the field, so this drops the column.
 *
 * Read-only check on production, 2026-09-29: no other table has a Turnstile
 * column, and `comments` has no rows, so nothing is lost. Run it after the
 * deploy: the old code still selects the column, the new code does not.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "comments" DROP COLUMN IF EXISTS "turnstile_token";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "turnstile_token" varchar;
  `)
}
