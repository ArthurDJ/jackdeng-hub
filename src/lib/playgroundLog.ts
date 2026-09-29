/**
 * The Playground's log: when each piece went up and what changed since,
 * shown under the grid on /tools. Tool records only know when they were
 * created, so the history lives here, one entry per PR that changed what a
 * visitor sees. Every entry names its PR, so each line can be checked.
 *
 * The words are in messages (`tools.log.entries.<id>`); tool names come from
 * the records, so a renamed tool reads right without touching this file.
 * playgroundLog.test.ts fails when a builtin tool has no launch entry.
 */
import { REPO_URL } from './profile'

export type LogKind = 'launch' | 'update' | 'rename'

export interface LogEntry {
  /** Key under tools.log.entries in both message files. */
  id: string
  /** The day it shipped, YYYY-MM-DD. */
  date: string
  kind: LogKind
  pr: number
  /** Tools the entry is about; empty for a change to the section itself. */
  slugs: string[]
}

export const PLAYGROUND_LOG: LogEntry[] = [
  { id: 'devDay', date: '2026-09-28', kind: 'launch', pr: 94, slugs: ['dev-day'] },
  { id: 'batchThree', date: '2026-09-28', kind: 'launch', pr: 93, slugs: ['dbt-terminal', 'text-vortex', 'blueprint-type', 'falling-skills'] },
  { id: 'renamed', date: '2026-09-26', kind: 'rename', pr: 83, slugs: [] },
  { id: 'gameOfLife', date: '2026-09-22', kind: 'update', pr: 35, slugs: ['falling-sand'] },
  { id: 'fallingSand', date: '2026-09-22', kind: 'launch', pr: 31, slugs: ['falling-sand'] },
]

/**
 * The entries a visitor can follow: each keeps only the tools that are
 * public, and an entry about tools none of which are public is left out.
 */
export function visibleLog<T extends { slug?: string | null }>(
  entries: LogEntry[],
  publicTools: T[],
): { entry: LogEntry; tools: T[] }[] {
  const bySlug = new Map(publicTools.filter((t) => t.slug).map((t) => [t.slug as string, t]))
  return entries.flatMap((entry) => {
    const tools = entry.slugs.map((s) => bySlug.get(s)).filter((t): t is T => Boolean(t))
    return entry.slugs.length && !tools.length ? [] : [{ entry, tools }]
  })
}

export const prUrl = (pr: number) => `${REPO_URL}/pull/${pr}`
