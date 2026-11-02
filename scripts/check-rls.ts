/**
 * Every table in `public` has row-level security on, and the Data API roles
 * (`anon`, `authenticated`) hold no privilege on any of them or their sequences.
 *
 *   DATABASE_URI=postgresql://…/migrated npx tsx scripts/check-rls.ts
 *
 * #82 turned RLS on for the 21 tables that existed then and revoked the two
 * roles' privileges. Nothing turns it on for a table a later migration adds,
 * and Supabase's Data API would serve such a table to anyone holding the
 * public anon key. CI runs this against the database the migrations build, so
 * a migration that adds a table without `ENABLE ROW LEVEL SECURITY` fails
 * there. Read-only, so it can also be pointed at production to audit it.
 *
 * The CI database is plain Postgres with no `anon` / `authenticated` roles;
 * the privilege half only runs where they exist.
 */
import pg from 'pg'
import { loadEnv } from './lib/env'

loadEnv()

const DATA_API_ROLES = ['anon', 'authenticated']

async function run() {
  const uri = process.env.DATABASE_URI
  if (!uri) {
    console.error('set DATABASE_URI')
    process.exit(1)
  }
  const client = new pg.Client({ connectionString: uri })
  await client.connect()
  try {
    const { rows: tables } = await client.query<{ name: string; rls: boolean }>(
      `select c.relname as name, c.relrowsecurity as rls
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind in ('r', 'p')
        order by 1`,
    )
    const { rows: roles } = await client.query<{ rolname: string }>(
      `select rolname from pg_roles where rolname = any($1)`,
      [DATA_API_ROLES],
    )
    const { rows: grants } = roles.length
      ? await client.query<{ grantee: string; table_name: string; privilege_type: string }>(
          // Tables, and sequences too: usage on one lets a role advance ids.
          `select grantee, table_name, privilege_type from information_schema.role_table_grants
            where table_schema = 'public' and grantee = any($1)
           union all
           select r.rolname, c.relname, p.priv
             from pg_class c join pg_namespace n on n.oid = c.relnamespace
             cross join pg_roles r
             cross join unnest(array['USAGE', 'SELECT', 'UPDATE']) as p(priv)
            where n.nspname = 'public' and c.relkind = 'S' and r.rolname = any($1)
              and has_sequence_privilege(r.rolname, c.oid, p.priv)
           order by 1, 2, 3`,
          [DATA_API_ROLES],
        )
      : { rows: [] }

    const withoutRls = tables.filter((t) => !t.rls).map((t) => t.name)
    console.log(`${tables.length} tables in public; ${withoutRls.length} without RLS`)
    for (const name of withoutRls) console.log(`  no RLS: ${name}`)
    console.log(roles.length ? `${grants.length} privileges held by ${roles.map((r) => r.rolname).join(', ')}` : 'no Data API roles here; privileges not checked')
    for (const g of grants) console.log(`  ${g.grantee} has ${g.privilege_type} on ${g.table_name}`)

    if (!tables.length) {
      console.error('no tables in public: wrong database?')
      process.exit(1)
    }
    if (withoutRls.length || grants.length) {
      console.error('FAIL: enable RLS in the migration that creates a table, and grant nothing to anon / authenticated (#82)')
      process.exit(1)
    }
    console.log('ok')
  } finally {
    await client.end()
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
