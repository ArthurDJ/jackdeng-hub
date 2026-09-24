/**
 * Parsing for Content-Security-Policy violation reports.
 *
 * Browsers send these to the policy's report-uri (next.config.mjs) in one of
 * two shapes:
 *
 *   - report-uri, `application/csp-report`: `{ "csp-report": { … } }` with
 *     kebab-case keys (`blocked-uri`, `effective-directive`, …)
 *   - Reporting API, `application/reports+json`: an array of
 *     `{ type: "csp-violation", body: { … } }` with camelCase keys
 *     (`blockedURL`, `effectiveDirective`, …)
 *
 * Both are reduced to one flat record for the log. Query strings and
 * fragments are dropped from every URL: a report carries the address of the
 * page the visitor was on, and that is all the log needs to know.
 */

export interface CspViolation {
  directive: string
  blocked: string
  page: string
  source?: string
  line?: number
  disposition?: string
}

/** Reports are small; anything bigger is not a browser talking. */
export const MAX_REPORT_BYTES = 16 * 1024

/** A browser can batch several reports into one POST. */
export const MAX_REPORTS_PER_REQUEST = 20

type Raw = Record<string, unknown>

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

/**
 * Keep scheme, host and path; drop query and fragment. Keywords the browser
 * uses in place of a URL (`inline`, `eval`, `data`, `self`) pass through.
 */
export function stripUrl(value: string): string {
  try {
    const u = new URL(value)
    if (u.protocol === 'data:' || u.protocol === 'blob:') return u.protocol.slice(0, -1)
    return `${u.origin}${u.pathname}`
  } catch {
    return value.slice(0, 100)
  }
}

function one(r: Raw): CspViolation | null {
  const directive =
    str(r['effective-directive']) ?? str(r.effectiveDirective) ??
    str(r['violated-directive']) ?? str(r.violatedDirective)
  const blocked = str(r['blocked-uri']) ?? str(r.blockedURL)
  const page = str(r['document-uri']) ?? str(r.documentURL)
  if (!directive || !page) return null

  const source = str(r['source-file']) ?? str(r.sourceFile)
  const line = r['line-number'] ?? r.lineNumber
  const disposition = str(r.disposition)

  return {
    directive: directive.split(' ')[0],
    // An inline script or style has no URL; browsers send "inline" or "".
    blocked: blocked ? stripUrl(blocked) : 'inline',
    page: stripUrl(page),
    ...(source ? { source: stripUrl(source) } : {}),
    ...(typeof line === 'number' ? { line } : {}),
    ...(disposition ? { disposition } : {}),
  }
}

/** Every violation in a report body, in either shape. Anything else: []. */
export function parseCspReports(body: unknown): CspViolation[] {
  if (Array.isArray(body)) {
    return body
      .slice(0, MAX_REPORTS_PER_REQUEST)
      .filter((x): x is Raw => typeof x === 'object' && x !== null && (x as Raw).type === 'csp-violation')
      .map((x) => (typeof x.body === 'object' && x.body !== null ? one(x.body as Raw) : null))
      .filter((v): v is CspViolation => v !== null)
  }
  if (typeof body === 'object' && body !== null) {
    const inner = (body as Raw)['csp-report']
    if (typeof inner === 'object' && inner !== null) {
      const v = one(inner as Raw)
      return v ? [v] : []
    }
  }
  return []
}
