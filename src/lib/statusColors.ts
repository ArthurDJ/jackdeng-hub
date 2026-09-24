/**
 * Badge colours for project and tool statuses.
 *
 * Built from theme tokens so each theme gets a text colour that reads on its
 * own tint. These were hex literals copied into four files, tuned for the dark
 * theme only: in light mode the green "Active" badge was 2.2:1 and the indigo
 * "Completed" 3.3:1, under the 4.5:1 WCAG AA floor. The tool pages built their
 * tints by appending hex alpha to the colour, which a CSS variable cannot take,
 * so they use the same color-mix() tints.
 */
export interface BadgeColors {
  bg: string
  text: string
  border: string
}

function badge(token: string): BadgeColors {
  return {
    bg: `color-mix(in srgb, var(${token}) 10%, transparent)`,
    text: `var(${token})`,
    border: `color-mix(in srgb, var(${token}) 22%, transparent)`,
  }
}

const PROJECT_STATUS: Record<string, BadgeColors> = {
  active: badge('--status-success'),
  completed: badge('--status-completed'),
  'on-hold': badge('--status-warning'),
}

export function projectStatusColors(status: string | null | undefined): BadgeColors {
  return PROJECT_STATUS[status ?? ''] ?? PROJECT_STATUS.active
}

const TOOL_STATUS: Record<string, BadgeColors> = {
  online: badge('--status-success'),
  offline: badge('--status-neutral'),
  maintenance: badge('--status-warning'),
}

export function toolStatusColors(status: string | null | undefined): BadgeColors {
  return TOOL_STATUS[status ?? ''] ?? TOOL_STATUS.online
}
