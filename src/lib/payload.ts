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
 * Run a find() and render it as empty if it throws. This is the behaviour the
 * pages already had, spelled `.catch(() => ({ docs: [] }))` at each call site —
 * moved here because with `strict: false` that literal `[]` is `any[]`, and
 * the union with the real result turned every document on the page into
 * `any`. Inside a generic function the fallback is typed as `T[]`.
 *
 * Kept as-is, not endorsed: on an ISR page a transient database error is
 * served, and cached, as an empty list with a 200.
 */
export function orEmpty<T>(query: Promise<PaginatedDocs<T>>): Promise<{ docs: T[]; totalPages: number }> {
  return query.catch(() => ({ docs: [], totalPages: 1 }))
}
