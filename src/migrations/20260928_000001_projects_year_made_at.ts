import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Two optional columns for the project archive table: projects.year (plain
 * text, e.g. "2024" or "2022–2023") and projects_locales.made_at (localized:
 * employer, school or "Personal"). Additive only, so it can run before or
 * after the deploy that reads them.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "year" varchar;
    ALTER TABLE "projects_locales" ADD COLUMN IF NOT EXISTS "made_at" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "projects_locales" DROP COLUMN IF EXISTS "made_at";
    ALTER TABLE "projects" DROP COLUMN IF EXISTS "year";
  `)
}
