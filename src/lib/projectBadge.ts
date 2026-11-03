import { projectStatusColors, type BadgeColors } from './statusColors'

/** A year badge reads as a fact, not a state, so it takes no status colour. */
const NEUTRAL: BadgeColors = {
  bg: 'var(--bg-elevated)',
  text: 'var(--text-secondary)',
  border: 'var(--border-default)',
}

export interface BadgeLabels {
  /** "2026–present" for a project that started in `year` and is still going. */
  since: (year: string) => string
  completed: string
  onHold: string
  active: string
}

/**
 * The labels, from the `home` messages. Takes next-intl's `t` for that
 * namespace; typed loosely because its key union is not exported.
 */
export function badgeLabels(t: (key: any, values?: any) => string): BadgeLabels {
  return {
    since: (year) => t('projectSince', { year }),
    active: t('projectStatus.active'),
    completed: t('projectStatus.completed'),
    onHold: t('projectStatus.onHold'),
  }
}

/**
 * What a project's badge says. Every project used to read "Active", which
 * told a visitor nothing; an active project now shows when it started (its
 * `year`, "2026–" read as "2026–present"), and only a finished or paused one
 * shows its status. One place, rather than a label map in each of the four
 * views that draw the badge.
 */
export function projectBadge(
  project: { status?: string | null; year?: string | null },
  labels: BadgeLabels,
): { label: string; colors: BadgeColors } | null {
  const { status, year } = project
  if (status === 'completed') return { label: labels.completed, colors: projectStatusColors(status) }
  if (status === 'on-hold') return { label: labels.onHold, colors: projectStatusColors(status) }
  const open = year?.trim().match(/^(\d{4})\s*[–-]$/)
  if (open) return { label: labels.since(open[1]), colors: NEUTRAL }
  if (year?.trim()) return { label: year.trim(), colors: NEUTRAL }
  if (status) return { label: labels.active, colors: projectStatusColors(status) }
  return null
}
