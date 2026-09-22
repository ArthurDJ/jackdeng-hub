import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Phase 2 of 20260922_000003_localize_tools, and the same shape as
 * 20260922_000002 did for categories.
 *
 * Phase 1 kept tools.name and .description so it could run before the deploy
 * without breaking the build that was still live. Both have been dead since
 * that build shipped — Payload reads tools_locales — so they can go.
 *
 * down() restores them from the 'en' slot, because 20260922_000003's own
 * down() updates these columns before dropping the locales table; rolling the
 * chain back in reverse order would otherwise hit a column that is gone.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tools" DROP COLUMN IF EXISTS "name";
    ALTER TABLE "tools" DROP COLUMN IF EXISTS "description";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "name" varchar;
    ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "description" varchar;

    UPDATE "tools" t
      SET "name" = tl."name",
          "description" = tl."description"
      FROM "tools_locales" tl
      WHERE tl."_parent_id" = t."id" AND tl."_locale" = 'en';
  `)
}
