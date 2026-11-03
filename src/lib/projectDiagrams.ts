/**
 * Simplified architecture diagrams for project pages, keyed by project slug.
 *
 * A diagram is a left-to-right row of stages; each stage is one box or a
 * dashed group of boxes. The text lives in messages under
 * `projectDiagrams.<slugInCamelCase>.<id>` (and `<id>Note` for the second
 * line; message keys are camelCase), so the
 * data here is only structure. `self` marks what the project itself is: it
 * gets the accent colour, everything else is context.
 *
 * Cards show a one-line version at about 250px wide: a group shrinks to its
 * name unless `cardBoxes` says its boxes are short enough, and a stage with
 * `card: false` is left out.
 *
 * Work projects name no vendor, supplier or volume: "ERP", "Supplier".
 *
 * Keyed by slug, which /admin can change: renaming a project's slug drops its
 * diagram (the card falls back to dots) until the key here is renamed too.
 */

export interface DiagramBox {
  id: string
  /** Has a second line at `<id>Note`. Not shown on cards. */
  note?: boolean
}

export type DiagramStage = { self?: boolean; card?: false } & (
  | { box: DiagramBox }
  | { group: string; boxes: DiagramBox[]; cardBoxes?: true }
)

export const PROJECT_DIAGRAMS: Record<string, DiagramStage[]> = {
  'jackdeng-hub': [
    { box: { id: 'visitor' } },
    {
      group: 'vercel',
      self: true,
      boxes: [
        { id: 'cdn', note: true },
        { id: 'app', note: true },
      ],
    },
    { box: { id: 'postgres', note: true } },
  ],
  'data-hub': [
    { box: { id: 'erp', note: true } },
    {
      group: 'hub',
      self: true,
      boxes: [
        { id: 'jobs', note: true },
        { id: 'switch', note: true },
      ],
    },
    { box: { id: 'supplier', note: true } },
  ],
  'b2b-customer-portal': [
    { box: { id: 'customer' } },
    { box: { id: 'proxy', note: true }, card: false },
    {
      group: 'portal',
      self: true,
      boxes: [
        { id: 'app', note: true },
        { id: 'mirror', note: true },
      ],
    },
    { box: { id: 'erp', note: true } },
  ],
  'order-tracking-portal': [
    { box: { id: 'customer', note: true } },
    { box: { id: 'portal', note: true }, self: true },
    { box: { id: 'views', note: true } },
    { box: { id: 'erp' } },
  ],
  'enterprise-manufacturing-analytics': [
    { box: { id: 'erp', note: true } },
    {
      group: 'lakehouse',
      self: true,
      cardBoxes: true,
      boxes: [{ id: 'bronze' }, { id: 'silver' }, { id: 'gold' }, { id: 'mart' }],
    },
    { box: { id: 'powerbi', note: true } },
  ],
}

export function projectDiagram(slug: string | null | undefined): DiagramStage[] | null {
  return (slug && PROJECT_DIAGRAMS[slug]) || null
}

/** The stages a card shows. */
export function cardStages(stages: DiagramStage[]): DiagramStage[] {
  return stages.filter((s) => s.card !== false)
}

/** `b2b-customer-portal` → `b2bCustomerPortal`, the diagram's messages namespace. */
export function diagramNamespace(slug: string): string {
  return slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

/** Every message key a diagram reads, for the test that keeps the two in step. */
export function diagramMessageKeys(slug: string, stages: DiagramStage[]): string[] {
  const ns = diagramNamespace(slug)
  const keys: string[] = []
  for (const stage of stages) {
    const boxes = 'box' in stage ? [stage.box] : stage.boxes
    if ('group' in stage) keys.push(`${ns}.${stage.group}`)
    for (const b of boxes) {
      keys.push(`${ns}.${b.id}`)
      if (b.note) keys.push(`${ns}.${b.id}Note`)
    }
  }
  return keys
}
