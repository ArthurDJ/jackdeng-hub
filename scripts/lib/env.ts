/**
 * Shared bootstrap for the one-off scripts under scripts/ and src/scripts/.
 *
 * Two jobs, both of which used to be copy-pasted (or forgotten) per script:
 *
 *   loadEnv()      — populate process.env from .env / .env.local
 *   requireApply() — refuse to touch a production database by accident
 *
 * This module must never import src/payload.config, directly or transitively:
 * scripts call loadEnv() and only then pull the config in dynamically, because
 * the config reads process.env.DATABASE_URI the moment it is evaluated.
 */
import { config as dotenvConfig } from 'dotenv'
import { isLocalDatabaseUrl } from '../../src/lib/localDatabase'

/**
 * Load .env then .env.local. Call this before importing the Payload config or
 * constructing a pg Client — anything that reads process.env.DATABASE_URI.
 */
export function loadEnv(): void {
  dotenvConfig({ path: '.env' })
  dotenvConfig({ path: '.env.local' })
}

export type Target = {
  /** Hostname only — never the full URI, which carries the password. */
  host: string
  isProduction: boolean
}

/**
 * Describe what DATABASE_URI points at, without ever surfacing credentials.
 *
 * Fails closed: only a database on this machine, by the same test the schema
 * push uses (src/lib/localDatabase.ts), counts as not production. This used to
 * be the other way round, matching *.supabase.co/com as production and letting
 * everything else through, so a database moved to another host, or a missing
 * or unparseable URI, would have run a write script with no --apply.
 */
export function describeTarget(uri: string | undefined = process.env.DATABASE_URI): Target {
  const isProduction = !isLocalDatabaseUrl(uri)
  if (!uri) return { host: '(DATABASE_URI not set)', isProduction }
  try {
    return { host: new URL(uri).hostname, isProduction }
  } catch {
    return { host: '(unparseable DATABASE_URI)', isProduction }
  }
}

/**
 * Gate for scripts that write. Against a production database this exits unless
 * `--apply` was passed, printing what the script would have touched.
 *
 * Until recently these scripts were kept honest by accident: nothing loaded
 * .env, so the adapter fell back to localhost:5432 and they died on connect.
 * Fixing the env loading removed that fuse. This is the deliberate replacement
 * — "fails unless you say so" in place of "fails unless the env happens to be
 * right" — and it is a refusal, not a dry run: no script's own logic changes,
 * so passing --apply behaves exactly as before.
 */
export function requireApply(
  opts: { script: string; writes: string[] },
  target: Target = describeTarget(),
  argv: string[] = process.argv,
): void {
  if (!target.isProduction) return
  if (argv.includes('--apply')) {
    console.log(`⚠ writing to PRODUCTION (${target.host}) — --apply given, proceeding.\n`)
    return
  }

  console.error(`
  ⛔ refusing to run against a PRODUCTION database (anything not on localhost counts)
     host: ${target.host}
     script writes to: ${opts.writes.join(', ')}

  re-run with --apply if this is intended:
     npx tsx ${opts.script} --apply
`)
  process.exit(1)
}
