import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Move categories.name and .description into categories_locales.
 *
 * Deliberately ADDITIVE: unlike 20260525_000001_add_projects_localization,
 * this does not drop the old columns. Dropping them here would open a window
 * where one side of the deploy is broken no matter which order things run in —
 * migrate first and the currently deployed code SELECTs a column that is gone;
 * deploy first and the new code SELECTs a table that does not exist yet. Keeping
 * the columns means both the old and the new build read something valid, so the
 * migration can run before the deploy with no downtime. The NOT NULL on
 * categories.name is dropped so Payload can still INSERT a new category while
 * the dead column is still there. A follow-up migration drops both columns once
 * the new build is live.
 *
 * Note the en/zh split below. The existing values are English, so they go into
 * the 'en' slot and Chinese is written into 'zh' — NOT the pattern used by the
 * projects migration, which copied everything into the default locale ('zh')
 * and left English to be backfilled by hand. That is how the site ended up
 * serving English from the zh slot via fallback in the first place.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "categories_locales" (
      "name" varchar NOT NULL,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    INSERT INTO "categories_locales" ("name", "description", "_locale", "_parent_id")
      SELECT "name", "description", 'en'::"_locales", "id"
      FROM "categories";

    INSERT INTO "categories_locales" ("name", "description", "_locale", "_parent_id")
      SELECT v."name", v."description", 'zh'::"_locales", c."id"
      FROM "categories" c
      JOIN (VALUES
        ('frontend',        '前端',          'React、Next.js、CSS、UI 工程与 Web 性能。'),
        ('backend',         '后端',          'Node.js、REST 与 GraphQL API、服务端架构。'),
        ('database',        '数据库',        'PostgreSQL、SQL 优化、数据建模、Supabase。'),
        ('algorithms',      '算法',          '数据结构、算法设计、LeetCode、计算机基础。'),
        ('devops-tools',    'DevOps 与工具', 'CI/CD、Docker、Vercel、Git 工作流、开发效率。'),
        ('career-thoughts', '职业与思考',    '职业成长、行业观察、个人思考。')
      ) AS v("slug", "name", "description") ON v."slug" = c."slug";

    ALTER TABLE "categories_locales"
      ADD CONSTRAINT "categories_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX IF NOT EXISTS "categories_locales_locale_parent_id_unique"
      ON "categories_locales" USING btree ("_locale", "_parent_id");

    CREATE UNIQUE INDEX IF NOT EXISTS "categories_locales_name_idx"
      ON "categories_locales" USING btree ("_locale", "name");

    ALTER TABLE "categories" ALTER COLUMN "name" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "categories" c
      SET "name" = cl."name",
          "description" = cl."description"
      FROM "categories_locales" cl
      WHERE cl."_parent_id" = c."id" AND cl."_locale" = 'en';

    ALTER TABLE "categories" ALTER COLUMN "name" SET NOT NULL;

    DROP TABLE IF EXISTS "categories_locales" CASCADE;
  `)
}
