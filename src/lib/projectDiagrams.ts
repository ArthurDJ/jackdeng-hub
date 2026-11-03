/**
 * Simplified architecture diagrams for project pages, keyed by project slug.
 *
 * A diagram is a left-to-right row of stages; each stage is one box or a
 * dashed group of boxes. The text lives in messages under
 * `projectDiagrams.<slug>.<id>` (and `<id>Note` for the second line), so the
 * data here is only structure. `self` marks what the project itself is: it
 * gets the accent colour, everything else is context.
 *
 * Cards show a one-line version at about 250px wide: a group shrinks to its
 * name unless `cardBoxes` says its boxes are short enough, and a stage with
 * `card: false` is left out.
 *
 * Work projects name no vendor, supplier or volume: "ERP", "Supplier".
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

/** Every message key a diagram reads, for the test that keeps the two in step. */
export function diagramMessageKeys(slug: string, stages: DiagramStage[]): string[] {
  const keys: string[] = []
  for (const stage of stages) {
    const boxes = 'box' in stage ? [stage.box] : stage.boxes
    if ('group' in stage) keys.push(`${slug}.${stage.group}`)
    for (const b of boxes) {
      keys.push(`${slug}.${b.id}`)
      if (b.note) keys.push(`${slug}.${b.id}Note`)
    }
  }
  return keys
}
