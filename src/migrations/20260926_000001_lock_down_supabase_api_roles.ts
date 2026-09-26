import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Take the public schema away from Supabase's API roles.
 *
 * Supabase serves the public schema over its Data API (PostgREST) to anyone
 * holding the project's anon key, and its default privileges give the `anon`
 * and `authenticated` roles ALL on every table the `postgres` role creates.
 * Payload creates every table as `postgres`, and none had row-level security.
 * A read-only check on 2026-09-26 found both roles with SELECT, INSERT,
 * UPDATE, DELETE and TRUNCATE on all 22 tables: `users` (the admin's password
 * hash), `users_sessions`, and `comments` (commenters' email and IP) among
 * them. The anon key is designed to be public once RLS is on; this site never
 * uses the Data API, so it had never been handed out, but nothing else stood
 * between it and the data.
 *
 * Two layers, so that neither alone has to hold:
 *
 * 1. Revoke every privilege the two roles have on the tables and sequences,
 *    and the default privileges that would grant them on whatever later
 *    migrations create. There are no functions in public; the default for
 *    functions goes too, before there are.
 * 2. Enable row-level security on every table, with no policies. Payload is
 *    unaffected: it connects as `postgres`, which owns the tables (owners are
 *    exempt unless FORCE is set) and has BYPASSRLS besides.
 *
 * Only Supabase has these roles. On CI's Postgres and a local container the
 * revokes are skipped; RLS is enabled everywhere, which the schema-drift
 * check does not compare. The Data API should also be off in the Supabase
 * dashboard (Settings → API); this migration keeps the data closed if it is
 * ever switched back on.
 */
const hasApiRoles = `EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
      AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')`

const forEachTable = (statement: string) => `
    FOR t IN
      SELECT c.relname FROM pg_class c
      WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p')
    LOOP
      EXECUTE format('${statement}', t.relname);
    END LOOP;`

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(`
  DO $$
  DECLARE t record;
  BEGIN
    IF ${hasApiRoles} THEN
      REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
      REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
      REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
    END IF;
    ${forEachTable('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY')}
  END $$;`))
}

// Puts back what Supabase had, hole included. Only for rolling back a bad
// deploy; there is nothing in the code that depends on this migration.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(`
  DO $$
  DECLARE t record;
  BEGIN
    ${forEachTable('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY')}
    IF ${hasApiRoles} THEN
      GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;
    END IF;
  END $$;`))
}
