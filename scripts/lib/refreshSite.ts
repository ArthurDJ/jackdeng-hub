/**
 * After a script writes to the production database, ask the live site to
 * expire its caches (POST /api/revalidate), the same as a save in /admin
 * does. Scripts run outside Next.js, so the collection hooks that normally
 * do this cannot, and pages used to catch up only with the hourly
 * revalidation. A deploy does not reliably do it either: Vercel keeps the
 * data caches (sidebar, search) across deployments.
 *
 * Needs REVALIDATE_SECRET in .env.local, the same value as in Vercel's
 * Production environment. Without it the script says so and carries on;
 * nothing here ever fails the write that came before it.
 */
export const SITE_URL = 'https://www.jackdeng.cc'

export type RefreshResult = 'refreshed' | 'skipped' | 'failed'

export async function refreshLiveSite({
  isProduction,
  env = process.env,
  fetchImpl = fetch,
  log = console.log,
}: {
  /** Only a write to the production database has a live site to refresh. */
  isProduction: boolean
  env?: Record<string, string | undefined>
  fetchImpl?: typeof fetch
  log?: (line: string) => void
}): Promise<RefreshResult> {
  if (!isProduction) return 'skipped'
  const secret = env.REVALIDATE_SECRET?.trim()
  const later = 'They update within the hour, or at once after saving anything in /admin.'
  if (!secret) {
    log(`Live pages not refreshed: REVALIDATE_SECRET is not set in .env.local. ${later}`)
    return 'skipped'
  }
  const site = (env.SITE_URL ?? SITE_URL).replace(/\/+$/, '')
  try {
    const res = await fetchImpl(`${site}/api/revalidate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    })
    if (res.ok) {
      log(`Live pages refreshed (${site}).`)
      return 'refreshed'
    }
    const why =
      res.status === 503 ? 'the site has no REVALIDATE_SECRET (set it in Vercel, Production, and redeploy)'
      : res.status === 401 ? 'the site refused the secret: .env.local and Vercel hold different values'
      : `the site answered ${res.status}`
    log(`Live pages not refreshed: ${why}. ${later}`)
  } catch (err) {
    log(`Live pages not refreshed: could not reach ${site} (${err instanceof Error ? err.message : String(err)}). ${later}`)
  }
  return 'failed'
}
