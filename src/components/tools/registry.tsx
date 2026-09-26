import type { ComponentType } from 'react'
import dynamic from 'next/dynamic'

/**
 * Which slug renders which in-repo component.
 *
 * Before this existed the detail page branched on toolType alone:
 *
 *   isAutomation ? <VisaMonitorDashboard /> : hasIframe ? ... : hasScript ? ...
 *
 * which meant every automation tool rendered VisaMonitorDashboard — a component
 * that only made sense for the one tool it was written for. That tool and its
 * dashboard went first (#33); the automation plumbing behind them (the ToolRuns
 * collection and POST /api/tools/[slug]/callback) was retired in #83 and its
 * schema dropped in #86, with no automation running. Everything here is a client-side component, keyed by slug.
 *
 * A slug that is not listed here still falls through to the placeholder, which
 * is the honest outcome: the record exists but its page has not been written.
 */
export type BuiltinToolProps = { slug: string }

export const BUILTIN_TOOLS: Record<string, ComponentType<BuiltinToolProps>> = {
  'falling-sand': dynamic(() =>
    import('./FallingSand').then((m) => m.FallingSand)),
}

export function getBuiltinTool(slug: string) {
  return BUILTIN_TOOLS[slug] ?? null
}
