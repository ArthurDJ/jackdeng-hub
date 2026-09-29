/**
 * When this deployment was built and from which commit, for the footer's
 * status line. next.config.mjs writes both into the build (`env`), so a page
 * that regenerates later still reports the deploy, not the regeneration.
 * Vercel provides the commit; a local build has none and shows the date
 * alone.
 */
import { REPO_URL } from './profile'

export interface BuildInfo {
  /** ISO instant the build ran, or null when unknown. */
  time: string | null
  /** Seven-character short hash, or null. */
  commit: string | null
  commitUrl: string | null
}

/**
 * Pass `{ BUILD_TIME: process.env.BUILD_TIME, BUILD_COMMIT: process.env.BUILD_COMMIT }`
 * spelled out like that: Next substitutes each `process.env.NAME` literally at
 * build time, and a whole `process.env` handed over has neither key at run time.
 */
export function buildInfo(env: { BUILD_TIME?: string; BUILD_COMMIT?: string }): BuildInfo {
  const time = env.BUILD_TIME && !Number.isNaN(Date.parse(env.BUILD_TIME)) ? env.BUILD_TIME : null
  const sha = env.BUILD_COMMIT && /^[0-9a-f]{7,40}$/i.test(env.BUILD_COMMIT) ? env.BUILD_COMMIT : null
  return {
    time,
    commit: sha ? sha.slice(0, 7) : null,
    commitUrl: sha ? `${REPO_URL}/commit/${sha}` : null,
  }
}
