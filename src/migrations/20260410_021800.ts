import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ── tools: drop old api_route, add new columns ────────────────
  await db.execute(sql`
    ALTER TABLE "tools"
      DROP COLUMN IF EXISTS "api_route",
      ADD COLUMN IF NOT EXISTS "icon"              varchar,
      ADD COLUMN IF NOT EXISTS "tool_type"         varchar NOT NULL DEFAULT 'interactive',
      ADD COLUMN IF NOT EXISTS "embed_url"         varchar,
      ADD COLUMN IF NOT EXISTS "embed_type"        varchar DEFAULT 'iframe',
      ADD COLUMN IF NOT EXISTS "cron_schedule"     varchar,
      ADD COLUMN IF NOT EXISTS "config"            jsonb,
      ADD COLUMN IF NOT EXISTS "last_run_at"       timestamp with time zone,
      ADD COLUMN IF NOT EXISTS "last_run_status"   varchar,
      ADD COLUMN IF NOT EXISTS "notify_webhook"    varchar;
  `)

  // ── tool_runs: create new table ───────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tool_runs" (
      "id"         serial PRIMARY KEY,
      "tool_id"    integer NOT NULL REFERENCES "tools"("id") ON DELETE CASCADE,
      "status"     varchar NOT NULL DEFAULT 'running',
      "summary"    varchar,
      "detail"     text,
      "metadata"   jsonb,
      "run_at"     timestamp with time zone NOT NULL DEFAULT now(),
      "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp with time zone NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS "tool_runs_tool_id_idx" ON "tool_runs" ("tool_id");
    CREATE INDEX IF NOT EXISTS "tool_runs_run_at_idx"  ON "tool_runs" ("run_at" DESC);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "tool_runs";`)
  await db.execute(sql`
    ALTER TABLE "tools"
      ADD COLUMN IF NOT EXISTS "api_route" varchar,
      DROP COLUMN IF EXISTS "icon",
      DROP COLUMN IF EXISTS "tool_type",
      DROP COLUMN IF EXISTS "embed_url",
      DROP COLUMN IF EXISTS "embed_type",
      DROP COLUMN IF EXISTS "cron_schedule",
      DROP COLUMN IF EXISTS "config",
      DROP COLUMN IF EXISTS "last_run_at",
      DROP COLUMN IF EXISTS "last_run_status",
      DROP COLUMN IF EXISTS "notify_webhook";
  `)
}
