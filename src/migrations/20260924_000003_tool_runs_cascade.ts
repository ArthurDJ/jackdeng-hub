import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * tool_runs.tool_id → tools.id, ON DELETE CASCADE: a tool's runs are deleted
 * with it.
 *
 * The migrations always created this key with CASCADE (20260410_021800), but
 * the code generated SET NULL, Payload's rule for every single relationship.
 * On a NOT NULL column SET NULL can only fail, so deleting a tool with runs
 * errored. The schema-drift check did not compare ON DELETE rules until it
 * was widened, which is when this showed up. payload.config.ts now asks for
 * CASCADE too.
 *
 * Production may have either rule, under either name (the migration's
 * tool_runs_tool_id_fkey, or Payload's tool_runs_tool_id_tools_id_fk from
 * the dev-mode push), so up() drops whatever foreign key tool_id has and
 * adds the one the code defines. Safe to run more than once.
 */
const dropToolIdForeignKeys = `
  DO $$
  DECLARE c record;
  BEGIN
    FOR c IN
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY (con.conkey)
      WHERE con.conrelid = 'public.tool_runs'::regclass
        AND con.contype = 'f'
        AND a.attname = 'tool_id'
    LOOP
      EXECUTE format('ALTER TABLE "tool_runs" DROP CONSTRAINT %I', c.conname);
    END LOOP;
  END $$;`

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(`
    ${dropToolIdForeignKeys}
    ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_tool_id_tools_id_fk"
      FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id")
      ON DELETE cascade ON UPDATE no action;
  `))
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(`
    ${dropToolIdForeignKeys}
    ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_tool_id_tools_id_fk"
      FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id")
      ON DELETE set null ON UPDATE no action;
  `))
}
