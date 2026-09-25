import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Bring the migration chain up to the schema the code actually defines.
 *
 * Until #46, Payload's dev-mode `push` ran against the production database
 * (.env.local points there), so production followed the collection configs
 * while the migrations did not: a database built from the migrations alone
 * differed from production in 26 places. Diffing three databases — one built
 * from the migrations, one pushed from the current code into an empty
 * Postgres, and production — showed production and the code identical, and
 * the migrations behind:
 *
 *   - four select fields stored as varchar instead of Postgres enums
 *     (tools.tool_type / .embed_type / .last_run_status, tool_runs.status)
 *   - tool_runs.detail as text instead of varchar; a now() default on
 *     tool_runs.run_at the code does not set; blogs.status nullable
 *   - index names and shapes: categories_locales (name, _locale) unique,
 *     tool_runs_tool_idx, and the created_at / updated_at / cover_image
 *     indexes the collections declare; no run_at DESC index
 *
 * Every step checks before it acts, so on production — already in the target
 * shape — up() changes nothing. On a database built from the migrations it
 * applies all 26. Where old data could stop a step, it is handled first:
 * blog posts with no status become drafts (the collection's default, so
 * nothing gets published by it), and a status column holding a value the new
 * enum lacks stops the migration with that value named, rather than with a
 * bare cast error, since there is no safe value to turn it into.
 *
 * down() restores the chain's previous shape, which is what a fresh database
 * looked like before this migration. On production that is a shape the code
 * does not expect, so this migration should not be rolled back there on its
 * own.
 */

// varchar → enum, only while the column is still varchar. The default has to
// come off first: Postgres cannot cast a varchar default to the new type.
const toEnum = (table: string, column: string, type: string, def: string | null) => `
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = '${table}'
               AND column_name = '${column}' AND udt_name = 'varchar') THEN
    SELECT string_agg(DISTINCT "${column}", ', ') INTO bad FROM "${table}"
      WHERE "${column}" IS NOT NULL
        AND "${column}" <> ALL (enum_range(NULL::"public"."${type}")::text[]);
    IF bad IS NOT NULL THEN
      RAISE EXCEPTION '${table}.${column} holds values the enum ${type} does not have: %. Fix or remove those rows, then migrate again.', bad;
    END IF;
    ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;
    ALTER TABLE "${table}" ALTER COLUMN "${column}"
      SET DATA TYPE "public"."${type}" USING "${column}"::"public"."${type}";
    ${def ? `ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '${def}';` : ''}
  END IF;`

const toVarchar = (table: string, column: string, type: string, def: string | null) => `
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = '${table}'
               AND column_name = '${column}' AND udt_name = '${type}') THEN
    ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;
    ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE varchar USING "${column}"::varchar;
    ${def ? `ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '${def}';` : ''}
  END IF;`

const COLUMNS: [table: string, column: string, type: string, def: string | null][] = [
  ['tools', 'tool_type', 'enum_tools_tool_type', 'interactive'],
  ['tools', 'embed_type', 'enum_tools_embed_type', 'iframe'],
  ['tools', 'last_run_status', 'enum_tools_last_run_status', null],
  ['tool_runs', 'status', 'enum_tool_runs_status', 'running'],
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_tools_tool_type" AS ENUM('interactive', 'automation');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_tools_embed_type" AS ENUM('iframe', 'script', 'builtin');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_tools_last_run_status" AS ENUM('running', 'found', 'booked', 'heartbeat', 'error', 'exited');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_tool_runs_status" AS ENUM('running', 'found', 'booked', 'heartbeat', 'error', 'exited');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ DECLARE bad text; BEGIN
      ${COLUMNS.map((c) => toEnum(...c)).join('\n')}

      IF EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'tool_runs'
                   AND column_name = 'detail' AND udt_name = 'text') THEN
        ALTER TABLE "tool_runs" ALTER COLUMN "detail" SET DATA TYPE varchar;
      END IF;

      -- A rename, not a drop and create: the index is the same, only the name
      -- differs. If both exist (should not happen), keep the code's.
      IF to_regclass('public.tool_runs_tool_id_idx') IS NOT NULL THEN
        IF to_regclass('public.tool_runs_tool_idx') IS NULL THEN
          ALTER INDEX "tool_runs_tool_id_idx" RENAME TO "tool_runs_tool_idx";
        ELSE
          DROP INDEX "tool_runs_tool_id_idx";
        END IF;
      END IF;
    END $$;

    ALTER TABLE "tool_runs" ALTER COLUMN "run_at" DROP DEFAULT;
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'blogs'
                   AND column_name = 'status' AND is_nullable = 'YES') THEN
        UPDATE "blogs" SET "status" = 'draft' WHERE "status" IS NULL;
        ALTER TABLE "blogs" ALTER COLUMN "status" SET NOT NULL;
      END IF;
    END $$;

    DROP INDEX IF EXISTS "categories_locales_name_idx";
    CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_idx" ON "categories_locales" USING btree ("name", "_locale");
    DROP INDEX IF EXISTS "tool_runs_run_at_idx";
    CREATE INDEX IF NOT EXISTS "tool_runs_created_at_idx" ON "tool_runs" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "tool_runs_updated_at_idx" ON "tool_runs" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "projects_cover_image_idx" ON "projects" USING btree ("cover_image_id");
  `))
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(`
    DROP INDEX IF EXISTS "projects_cover_image_idx";
    DROP INDEX IF EXISTS "tool_runs_updated_at_idx";
    DROP INDEX IF EXISTS "tool_runs_created_at_idx";
    CREATE INDEX IF NOT EXISTS "tool_runs_run_at_idx" ON "tool_runs" USING btree ("run_at" DESC);
    DROP INDEX IF EXISTS "categories_name_idx";
    CREATE UNIQUE INDEX IF NOT EXISTS "categories_locales_name_idx" ON "categories_locales" USING btree ("_locale", "name");

    ALTER TABLE "blogs" ALTER COLUMN "status" DROP NOT NULL;
    ALTER TABLE "tool_runs" ALTER COLUMN "run_at" SET DEFAULT now();

    DO $$ BEGIN
      IF to_regclass('public.tool_runs_tool_idx') IS NOT NULL
         AND to_regclass('public.tool_runs_tool_id_idx') IS NULL THEN
        ALTER INDEX "tool_runs_tool_idx" RENAME TO "tool_runs_tool_id_idx";
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'tool_runs'
                   AND column_name = 'detail' AND udt_name = 'varchar') THEN
        ALTER TABLE "tool_runs" ALTER COLUMN "detail" SET DATA TYPE text;
      END IF;

      ${COLUMNS.map((c) => toVarchar(...c)).join('\n')}
    END $$;

    DROP TYPE IF EXISTS "public"."enum_tool_runs_status";
    DROP TYPE IF EXISTS "public"."enum_tools_last_run_status";
    DROP TYPE IF EXISTS "public"."enum_tools_embed_type";
    DROP TYPE IF EXISTS "public"."enum_tools_tool_type";
  `))
}
