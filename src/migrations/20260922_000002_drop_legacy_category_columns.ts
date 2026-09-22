import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Phase 2 of the category localization started in
 * 20260922_000001_localize_categories.
 *
 * That migration deliberately left categories.name and .description in place
 * so it could run before the deploy without breaking the build that was still
 * live. Both columns have been dead since that build shipped — Payload reads
 * the localized values out of categories_locales — so they can go now.
 *
 * Dropping "name" also drops categories_name_idx, the unique index on it. The
 * uniqueness that matters is already enforced per locale by
 * categories_locales_name_idx, created in phase 1.
 *
 * down() puts the columns back and repopulates them from the 'en' slot, which
 * is where the original English values were written. It has to, because
 * 20260922_000001's own down() updates these columns before dropping the
 * locales table — rolling the chain back in reverse order would otherwise fail
 * on a column that no longer exists.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "name";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "description";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "name" varchar;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "description" varchar;

    UPDATE "categories" c
      SET "name" = cl."name",
          "description" = cl."description"
      FROM "categories_locales" cl
      WHERE cl."_parent_id" = c."id" AND cl."_locale" = 'en';

    CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_idx"
      ON "categories" USING btree ("name");
  `)
}
