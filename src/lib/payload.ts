/**
 * Server-only helper to obtain a Payload instance.
 *
 * Uses the singleton pattern so that in `next dev` the instance is reused
 * across hot-reloads instead of spawning a new connection on every request.
 */
import 'server-only'
import { getPayload as _getPayload, type PaginatedDocs } from 'payload'
import config from '../payload.config'

export const getPayload = async () => _getPayload({ config })

/**
 * Run a find() for an optional section of a page and render that section as
 * empty if the query fails, logging why. Generic so the fallback is typed as
 * `T[]`: with `strict: false` an inline `.catch(() => ({ docs: [] }))` is
 * `any[]`, and the union with the real result turns every document into `any`.
 *
 * Only for content the page is still correct without, such as related posts.
 * A page's main list must not use this. Let it throw: during ISR revalidation
 * a throw keeps the last good version cached, whereas an empty list is served
 * as a 200 and cached for the whole revalidate window. On a cold render the
 * throw reaches error.tsx.
 */
export function orEmpty<T>(query: Promise<PaginatedDocs<T>>, context: string): Promise<{ docs: T[] }> {
  return query.catch((err: unknown) => {
    console.error(`[orEmpty] ${context}: query failed, rendering the section empty`, err)
    return { docs: [] }
  })
}
