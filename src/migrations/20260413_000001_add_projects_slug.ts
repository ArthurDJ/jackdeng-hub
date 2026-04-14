import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "projects"
      ADD COLUMN IF NOT EXISTS "slug" varchar;
    ALTER TABLE "projects"
      ADD COLUMN IF NOT EXISTS "github_link" varchar;
    ALTER TABLE "projects"
      ADD COLUMN IF NOT EXISTS "cover_image_id" integer
        REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    CREATE UNIQUE INDEX IF NOT EXISTS "projects_slug_idx"
      ON "projects" USING btree ("slug");
    CREATE TABLE IF NOT EXISTS "projects_tech_stack" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
      "id" varchar PRIMARY KEY NOT NULL,
      "tech" varchar NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "projects_tech_stack_order_idx"
      ON "projects_tech_stack" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "projects_tech_stack_parent_id_idx"
      ON "projects_tech_stack" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "projects_tech_stack";
    DROP INDEX IF EXISTS "projects_slug_idx";
    ALTER TABLE "projects"
      DROP COLUMN IF EXISTS "slug",
      DROP COLUMN IF EXISTS "github_link",
      DROP COLUMN IF EXISTS "cover_image_id";
  `)
}
