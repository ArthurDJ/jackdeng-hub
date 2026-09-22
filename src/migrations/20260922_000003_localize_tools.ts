import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Move tools.name and .description into tools_locales.
 *
 * Same shape and the same reasoning as 20260922_000001_localize_categories:
 * additive, so it can run before the deploy without breaking the build that is
 * still live, with the dead columns dropped by a follow-up once the new build
 * ships. NOT NULL comes off tools.name so Payload can still INSERT a tool while
 * the dead column is there.
 *
 * Both existing rows were inconsistent before this. visa-checker had an English
 * name with a Chinese description; falling-sand had its English name overwritten
 * by the Chinese one, because writing a second locale to a non-localized column
 * is just an UPDATE. Both are split into proper slots here.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tools_locales" (
      "name" varchar NOT NULL,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    INSERT INTO "tools_locales" ("name", "description", "_locale", "_parent_id")
      SELECT v."name", v."description", 'en'::"_locales", t."id"
      FROM "tools" t
      JOIN (VALUES
        ('visa-checker', 'Visa Checker',
         'Watches US visa appointment slots and rebooks automatically when an earlier date opens.'),
        ('falling-sand', 'Falling Sand',
         'A grain-by-grain sandbox. Pour sand, water and stone, and watch them settle.')
      ) AS v("slug", "name", "description") ON v."slug" = t."slug";

    INSERT INTO "tools_locales" ("name", "description", "_locale", "_parent_id")
      SELECT v."name", v."description", 'zh'::"_locales", t."id"
      FROM "tools" t
      JOIN (VALUES
        ('visa-checker', '签证名额监控',
         '自动监控美国签证预约名额，发现更早日期时自动改签。'),
        ('falling-sand', '落沙',
         '一个逐粒模拟的沙盒。倾倒沙、水和石头，看它们各自安顿下来。')
      ) AS v("slug", "name", "description") ON v."slug" = t."slug";

    -- Anything not named above (a tool added between writing and running this)
    -- still needs both slots, or it would vanish from the site entirely.
    INSERT INTO "tools_locales" ("name", "description", "_locale", "_parent_id")
      SELECT t."name", t."description", l."loc"::"_locales", t."id"
      FROM "tools" t
      CROSS JOIN (VALUES ('en'), ('zh')) AS l("loc")
      WHERE NOT EXISTS (
        SELECT 1 FROM "tools_locales" tl
        WHERE tl."_parent_id" = t."id" AND tl."_locale" = l."loc"::"_locales"
      );

    ALTER TABLE "tools_locales"
      ADD CONSTRAINT "tools_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."tools"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX IF NOT EXISTS "tools_locales_locale_parent_id_unique"
      ON "tools_locales" USING btree ("_locale", "_parent_id");

    ALTER TABLE "tools" ALTER COLUMN "name" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "tools" t
      SET "name" = tl."name",
          "description" = tl."description"
      FROM "tools_locales" tl
      WHERE tl."_parent_id" = t."id" AND tl."_locale" = 'en';

    ALTER TABLE "tools" ALTER COLUMN "name" SET NOT NULL;

    DROP TABLE IF EXISTS "tools_locales" CASCADE;
  `)
}
