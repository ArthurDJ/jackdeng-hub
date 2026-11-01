'use client'

import { useSyncExternalStore } from 'react'
import { formatDate } from '@/lib/formatDate'

const noopSubscribe = () => () => {}

/**
 * A day in the viewer's own time zone, for the admin dashboard overview
 * (AdminOverview.tsx renders on the server, where the zone is UTC, so an
 * evening edit in California showed up as the next day).
 *
 * The server render and the hydration render both format in UTC, so they
 * match and React has nothing to patch; right after hydration
 * useSyncExternalStore switches to the client snapshot and re-renders with
 * the browser's zone. `suppressHydrationWarning` would not do: it only
 * silences the warning and leaves the server's text in place.
 */
export function AdminLocalDate({ iso, lang }: { iso: string; lang: string }) {
  const inBrowser = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
  return (
    <time className="jd-overview__date" dateTime={iso}>
      {formatDate(iso, lang, inBrowser ? undefined : 'UTC')}
    </time>
  )
}
