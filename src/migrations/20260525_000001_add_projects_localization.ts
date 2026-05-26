import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Move projects.name, .short_description, .long_description into projects_locales.
 * Existing rows are copied into the `zh` slot (matches payload.config defaultLocale).
 * User is expected to backfill `en` translations in admin after this migration.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "projects_locales" (
      "name" varchar NOT NULL,
      "short_description" varchar NOT NULL,
      "long_description" jsonb,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    INSERT INTO "projects_locales" ("name", "short_description", "long_description", "_locale", "_parent_id")
      SELECT "name", "short_description", "long_description", 'zh'::"_locales", "id"
      FROM "projects";

    ALTER TABLE "projects_locales"
      ADD CONSTRAINT "projects_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX IF NOT EXISTS "projects_locales_locale_parent_id_unique"
      ON "projects_locales" USING btree ("_locale", "_parent_id");

    ALTER TABLE "projects" DROP COLUMN "name";
    ALTER TABLE "projects" DROP COLUMN "short_description";
    ALTER TABLE "projects" DROP COLUMN "long_description";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "projects" ADD COLUMN "name" varchar;
    ALTER TABLE "projects" ADD COLUMN "short_description" varchar;
    ALTER TABLE "projects" ADD COLUMN "long_description" jsonb;

    -- Restore from zh slot (best-effort)
    UPDATE "projects" p
      SET "name" = pl."name",
          "short_description" = pl."short_description",
          "long_description" = pl."long_description"
      FROM "projects_locales" pl
      WHERE pl."_parent_id" = p."id" AND pl."_locale" = 'zh';

    ALTER TABLE "projects" ALTER COLUMN "name" SET NOT NULL;
    ALTER TABLE "projects" ALTER COLUMN "short_description" SET NOT NULL;

    DROP TABLE IF EXISTS "projects_locales" CASCADE;
  `)
}
