import type { ComponentType } from 'react'
import dynamic from 'next/dynamic'

/**
 * Which slug renders which in-repo component.
 *
 * Before this existed the detail page branched on toolType alone:
 *
 *   isAutomation ? <VisaMonitorDashboard /> : hasIframe ? ... : hasScript ? ...
 *
 * which meant every automation tool rendered the visa monitor — the component
 * is named after one specific tool — and `embedType: 'builtin'`, an option the
 * admin UI offers as "Built-in page", fell through to a 🚧 placeholder because
 * nothing handled it. Both were invisible while the collection was empty.
 *
 * A slug that is not listed here still falls through to the placeholder, which
 * is the honest outcome: the record exists but its page has not been written.
 */
export type BuiltinToolProps = { slug: string }

export const BUILTIN_TOOLS: Record<string, ComponentType<BuiltinToolProps>> = {
  'visa-checker': dynamic(() =>
    import('../VisaMonitorDashboard').then((m) => m.VisaMonitorDashboard)),
  'falling-sand': dynamic(() =>
    import('./FallingSand').then((m) => m.FallingSand)),
}

export function getBuiltinTool(slug: string) {
  return BUILTIN_TOOLS[slug] ?? null
}
