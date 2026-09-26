import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * The second half of retiring automation tools (#83 took the code out).
 *
 * No automation tool had run since the visa checker was deleted (#33):
 * production had one tool, falling-sand, and `tool_runs` was empty (read-only
 * check, 2026-09-26). #83 removed the callback route and hid the fields; the
 * code that ships with this migration no longer defines them, so this drops:
 *
 * - `tool_runs`, and its column in `payload_locked_documents_rels`.
 * - The five automation columns on `tools`, and `tool_type` itself: with
 *   automation gone every tool is interactive, so the field said nothing.
 * - The three enum types those columns used.
 *
 * Dropping a column takes the foreign keys and indexes on it along, so this
 * does not depend on constraint names (production had Payload's push-mode
 * names in places, see 20260924_000003). Run it after the deploy: the old
 * code still reads these columns, the new code does not, and `tool_type` has
 * a database default, so a tool created in between is still valid.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "tool_runs_id";
    DROP TABLE IF EXISTS "tool_runs";
    DROP TYPE IF EXISTS "public"."enum_tool_runs_status";

    ALTER TABLE "tools"
      DROP COLUMN IF EXISTS "tool_type",
      DROP COLUMN IF EXISTS "cron_schedule",
      DROP COLUMN IF EXISTS "config",
      DROP COLUMN IF EXISTS "last_run_at",
      DROP COLUMN IF EXISTS "last_run_status",
      DROP COLUMN IF EXISTS "notify_webhook";
    DROP TYPE IF EXISTS "public"."enum_tools_tool_type";
    DROP TYPE IF EXISTS "public"."enum_tools_last_run_status";
  `)
}

// Rebuilds the schema as the migrations had it, empty. Data is not restored:
// there was none.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_tools_tool_type" AS ENUM('interactive', 'automation');
    CREATE TYPE "public"."enum_tools_last_run_status" AS ENUM('running', 'found', 'booked', 'heartbeat', 'error', 'exited');
    ALTER TABLE "tools"
      ADD COLUMN "tool_type" "enum_tools_tool_type" DEFAULT 'interactive' NOT NULL,
      ADD COLUMN "cron_schedule" varchar,
      ADD COLUMN "config" jsonb,
      ADD COLUMN "last_run_at" timestamp with time zone,
      ADD COLUMN "last_run_status" "enum_tools_last_run_status",
      ADD COLUMN "notify_webhook" varchar;

    CREATE TYPE "public"."enum_tool_runs_status" AS ENUM('running', 'found', 'booked', 'heartbeat', 'error', 'exited');
    CREATE TABLE "tool_runs" (
      "id" serial PRIMARY KEY NOT NULL,
      "tool_id" integer NOT NULL,
      "status" "enum_tool_runs_status" DEFAULT 'running' NOT NULL,
      "summary" varchar,
      "detail" varchar,
      "metadata" jsonb,
      "run_at" timestamp with time zone NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
    ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_tool_id_tools_id_fk"
      FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "tool_runs_tool_idx" ON "tool_runs" USING btree ("tool_id");
    CREATE INDEX "tool_runs_updated_at_idx" ON "tool_runs" USING btree ("updated_at");
    CREATE INDEX "tool_runs_created_at_idx" ON "tool_runs" USING btree ("created_at");
    ALTER TABLE "tool_runs" ENABLE ROW LEVEL SECURITY;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tool_runs_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tool_runs_fk"
      FOREIGN KEY ("tool_runs_id") REFERENCES "public"."tool_runs"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "payload_locked_documents_rels_tool_runs_id_idx" ON "payload_locked_documents_rels" USING btree ("tool_runs_id");
  `)
}
