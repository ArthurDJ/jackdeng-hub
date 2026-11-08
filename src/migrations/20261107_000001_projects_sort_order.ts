import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * projects.sort_order: the order of the project list (src/lib/projectOrder.ts),
 * lower first. Existing rows take the default 0, so the list keeps its current
 * order until a record is given another value. Additive only, but the deploy
 * that sorts by it fails on a database without the column: run this first.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "sort_order" numeric DEFAULT 0;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "projects" DROP COLUMN IF EXISTS "sort_order";
  `)
}
