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

/**
 * Load .env then .env.local. Call this before importing the Payload config or
 * constructing a pg Client — anything that reads process.env.DATABASE_URI.
 */
export function loadEnv(): void {
  dotenvConfig({ path: '.env' })
  dotenvConfig({ path: '.env.local' })
}

/** Hosts we treat as production. Supabase is the only one this project uses. */
const PRODUCTION_HOST = /(^|\.)supabase\.(co|com)$/i

export type Target = {
  /** Hostname only — never the full URI, which carries the password. */
  host: string
  isProduction: boolean
}

/**
 * Describe what DATABASE_URI points at, without ever surfacing credentials.
 * An unparseable or missing URI is reported as a non-production unknown host;
 * the script will fail on connect soon enough, with a clearer error than
 * anything we could raise here.
 */
export function describeTarget(): Target {
  const uri = process.env.DATABASE_URI
  if (!uri) return { host: '(DATABASE_URI not set)', isProduction: false }
  try {
    const host = new URL(uri).hostname
    return { host, isProduction: PRODUCTION_HOST.test(host) }
  } catch {
    return { host: '(unparseable DATABASE_URI)', isProduction: false }
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
export function requireApply(opts: { script: string; writes: string[] }): void {
  const target = describeTarget()
  if (!target.isProduction) return
  if (process.argv.includes('--apply')) {
    console.log(`⚠ writing to PRODUCTION (${target.host}) — --apply given, proceeding.\n`)
    return
  }

  console.error(`
  ⛔ refusing to run against a PRODUCTION database
     host: ${target.host}
     script writes to: ${opts.writes.join(', ')}

  re-run with --apply if this is intended:
     npx tsx ${opts.script} --apply
`)
  process.exit(1)
}
