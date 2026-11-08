/**
 * The order every project list uses: the editor-set `sortOrder` first (lower
 * first, 0 by default), then newest first. Sorting by
 * creation date alone put each newly added side project at the top.
 *
 * Postgres puts a NULL sortOrder (a value cleared in /admin) last.
 */
export const PROJECT_SORT: string[] = ['sortOrder', '-createdAt']
