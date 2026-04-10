import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'

/**
 * POST /api/tools/[slug]/callback
 *
 * Receives status pushes from automation tools (e.g. USVISA-CA Python script).
 * Authenticated via CRON_SECRET header to prevent unauthorized writes.
 *
 * Request body:
 * {
 *   status: 'running' | 'found' | 'booked' | 'heartbeat' | 'error' | 'exited'
 *   summary: string
 *   detail?: string
 *   metadata?: object   // e.g. { availableDate, currentAppointment, consulate }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  // ── Auth ──────────────────────────────────────────────────────
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const body = await request.json().catch(() => null)

  if (!body?.status) {
    return NextResponse.json({ error: 'Missing status field' }, { status: 400 })
  }

  const payload = await getPayload()

  // ── Find tool by slug ─────────────────────────────────────────
  const { docs } = await payload.find({
    collection: 'tools',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })

  const tool = docs[0]
  if (!tool) {
    return NextResponse.json({ error: `Tool '${slug}' not found` }, { status: 404 })
  }

  // ── Create run record ─────────────────────────────────────────
  const run = await payload.create({
    collection: 'tool-runs',
    data: {
      tool: tool.id,
      status: body.status,
      summary: body.summary ?? '',
      detail: body.detail ?? '',
      metadata: body.metadata ?? null,
      runAt: new Date().toISOString(),
    },
  })

  // ── Update tool's last run fields ─────────────────────────────
  await payload.update({
    collection: 'tools',
    id: tool.id,
    data: {
      lastRunAt: new Date().toISOString(),
      lastRunStatus: body.status,
    },
  })

  // ── Forward to webhook if configured and event is notable ─────
  const notableStatuses = ['found', 'booked', 'error']
  if (tool.notifyWebhook && notableStatuses.includes(body.status)) {
    try {
      await fetch(tool.notifyWebhook as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: tool.name,
          status: body.status,
          summary: body.summary,
          metadata: body.metadata,
          time: new Date().toISOString(),
        }),
      })
    } catch (e) {
      console.error('[ToolCallback] Webhook forward failed:', e)
    }
  }

  return NextResponse.json({ ok: true, runId: run.id })
}
