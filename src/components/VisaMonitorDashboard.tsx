'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'

// ── Types ──────────────────────────────────────────────────────────────────
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type RunRecord = {
  id: string
  status: string
  summary: string
  detail?: string
  metadata?: Record<string, unknown>
  runAt: string
}

type Labels = {
  status: Record<string, string>
  meta: Record<string, string>
}

// ── Constants ──────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  running:   '#3b82f6',
  found:     '#f59e0b',
  booked:    '#10b981',
  heartbeat: '#6366f1',
  error:     '#ef4444',
  exited:    '#71717a',
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(dt: string, locale: string) {
  return new Date(dt).toLocaleString(locale, {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatusBadge({ status, labels }: { status: string; labels: Labels }) {
  const color = STATUS_COLOR[status] ?? '#71717a'
  return (
    <span style={{
      background: color + '18',
      color,
      border: `1px solid ${color}30`,
      borderRadius: '6px',
      padding: '3px 10px',
      fontSize: '13px',
      fontWeight: 600,
    }}>
      {labels.status[status] ?? status}
    </span>
  )
}

function MetaCard({ data, labels }: { data: Record<string, unknown>; labels: Labels }) {
  const entries = Object.entries(data)
  if (!entries.length) return null
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: '12px',
    }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-default)',
          borderRadius: '8px',
          padding: '12px 14px',
        }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
            {labels.meta[k] ?? k.replace(/_/g, ' ')}
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, wordBreak: 'break-all' }}>
            {String(v)}
          </div>
        </div>
      ))}
    </div>
  )
}

function RunRow({ run, isExpanded, onToggle, labels, locale, detailHeading }: {
  run: RunRecord
  isExpanded: boolean
  onToggle: () => void
  labels: Labels
  locale: string
  detailHeading: string
}) {
  const color = STATUS_COLOR[run.status] ?? '#71717a'
  const hasDetail = Boolean(run.detail) || Boolean(run.metadata && Object.keys(run.metadata).length)

  return (
    <div style={{
      border: `1px solid ${isExpanded ? color + '40' : 'var(--border-default)'}`,
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* ── Row header ── */}
      <div
        onClick={hasDetail ? onToggle : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 14px',
          cursor: hasDetail ? 'pointer' : 'default',
          background: isExpanded ? color + '0a' : 'transparent',
          userSelect: 'none',
        }}
      >
        {/* status dot */}
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />

        {/* time */}
        <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', width: 120, flexShrink: 0 }}>
          {fmt(run.runAt, locale)}
        </span>

        {/* badge */}
        <span style={{ width: 100, flexShrink: 0 }}>
          <StatusBadge status={run.status} labels={labels} />
        </span>

        {/* summary */}
        <span style={{
          color: 'var(--text-secondary)',
          fontSize: '13px',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {run.summary}
        </span>

        {/* expand arrow */}
        {hasDetail && (
          <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', flexShrink: 0, transition: 'transform 0.15s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
            ›
          </span>
        )}
      </div>

      {/* ── Expanded detail ── */}
      {isExpanded && (
        <div style={{
          borderTop: `1px solid var(--border-default)`,
          padding: '16px',
          background: 'var(--bg-base)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}>
          {/* Metadata cards */}
          {run.metadata && Object.keys(run.metadata).length > 0 && (
            <MetaCard data={run.metadata as Record<string, unknown>} labels={labels} />
          )}

          {/* Detail log text */}
          {run.detail && (
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                {detailHeading}
              </div>
              <pre style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                padding: '12px 14px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
                maxHeight: '300px',
                overflowY: 'auto',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              }}>
                {run.detail}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function VisaMonitorDashboard({ slug }: { slug: string }) {
  const t = useTranslations('tools.dashboard')
  const locale = useLocale()
  // Payload's own session, not a second auth system. The run log this panel
  // reads (`/api/tool-runs`) is gated on Payload's `req.user`, so gating the UI
  // on anything else means a signed-in visitor sees the panel and gets nothing
  // back — which is exactly what the next-auth version did.
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [runs, setRuns] = useState<RunRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/users/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setStatus(d?.user ? 'authenticated' : 'unauthenticated')
      })
      .catch(() => {
        if (!cancelled) setStatus('unauthenticated')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Static maps — next-intl keys must stay statically analysable, so no
  // t('runStatus.' + x). The metadata keys are snake_case because they come
  // straight off the Python tool's JSON payload.
  const labels: Labels = {
    status: {
      running:   t('runStatus.running'),
      found:     t('runStatus.found'),
      booked:    t('runStatus.booked'),
      heartbeat: t('runStatus.heartbeat'),
      error:     t('runStatus.error'),
      exited:    t('runStatus.exited'),
    },
    meta: {
      consulate:           t('meta.consulate'),
      earliest_available:  t('meta.earliestAvailable'),
      current_appointment: t('meta.currentAppointment'),
      acceptable_range:    t('meta.acceptableRange'),
      total_slots:         t('meta.totalSlots'),
      auto_reschedule:     t('meta.autoReschedule'),
      available_date:      t('meta.availableDate'),
      booked_date:         t('meta.bookedDate'),
      booked_time:         t('meta.bookedTime'),
      verified_date:       t('meta.verifiedDate'),
      old_appointment:     t('meta.oldAppointment'),
      session_count:       t('meta.sessionCount'),
    },
  }

  const timeSince = (dt: string) => {
    const secs = Math.floor((Date.now() - new Date(dt).getTime()) / 1000)
    if (secs < 60) return t('agoSeconds', { n: secs })
    if (secs < 3600) return t('agoMinutes', { n: Math.floor(secs / 60) })
    return t('agoHours', { h: Math.floor(secs / 3600), m: Math.floor((secs % 3600) / 60) })
  }

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/tool-runs?where[tool.slug][equals]=${slug}&sort=-runAt&limit=50&depth=0`,
        { credentials: 'include' },
      )
      // Previously this swallowed everything: a 403 fell through to
      // `data.docs ?? []` and rendered as an empty panel, indistinguishable
      // from "the tool has never run". Surface the failure instead.
      if (!res.ok) throw new Error(`tool-runs responded ${res.status}`)
      const data = await res.json()
      setRuns(data.docs ?? [])
      setLoadError(false)
      setLastRefresh(new Date())
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRuns()
      const id = setInterval(fetchRuns, 30_000)
      return () => clearInterval(id)
    }
  }, [status, fetchRuns])

  // ── Auth gate ────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-tertiary)' }}>
        {t('verifying')}
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{
        border: '1px dashed var(--border-default)',
        borderRadius: '12px',
        padding: '60px 40px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px' }}>
          {t('privateNotice')}
        </p>
        {/* Deliberately no link to the admin login. This panel renders on a
            tool page that is public whenever the tool is online + public
            (see Tools.access.read), and the roadmap asks for the admin
            backend to stay unadvertised. The one person who needs it knows
            where it is. */}
      </div>
    )
  }

  // ── Authenticated view ───────────────────────────────────────────────────
  const latest = runs[0]
  const latestStatus = latest?.status ?? 'exited'
  const accentColor = STATUS_COLOR[latestStatus] ?? '#71717a'

  // Group non-heartbeat runs for highlight stats
  const notableRuns = runs.filter(r => !['heartbeat', 'running'].includes(r.status))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Load failure ─────────────────────────────────────────────── */}
      {loadError && (
        <div
          role="alert"
          style={{
            border: '1px solid var(--border-default)',
            borderLeft: '3px solid #ef4444',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
          }}
        >
          {t('loadError')}
        </div>
      )}

      {/* ── Status header ────────────────────────────────────────────── */}
      <div style={{
        background: accentColor + '0d',
        border: `1px solid ${accentColor}30`,
        borderRadius: '12px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          background: accentColor,
          boxShadow: latestStatus === 'running' ? `0 0 8px ${accentColor}` : 'none',
          animation: latestStatus === 'running' ? 'pulse 2s infinite' : 'none',
          flexShrink: 0,
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <StatusBadge status={latestStatus} labels={labels} />
            {latest && (
              <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
                {timeSince(latest.runAt)} · {fmt(latest.runAt, locale)}
              </span>
            )}
          </div>
          {latest?.summary && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              {latest.summary}
            </div>
          )}
        </div>
        <button
          onClick={fetchRuns}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-default)',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          ↻ {t('refresh')}
        </button>
      </div>

      {/* ── Latest metadata cards ─────────────────────────────────────── */}
      {latest?.metadata && Object.keys(latest.metadata).length > 0 && (
        <div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {t('latestStatus')}
          </div>
          <MetaCard data={latest.metadata as Record<string, unknown>} labels={labels} />
        </div>
      )}

      {/* ── Notable events ────────────────────────────────────────────── */}
      {notableRuns.length > 0 && (
        <div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {t('notableEvents')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {notableRuns.slice(0, 5).map(run => (
              <RunRow
                key={run.id}
                run={run}
                isExpanded={expandedId === run.id}
                onToggle={() => setExpandedId(expandedId === run.id ? null : run.id)}
                labels={labels}
                locale={locale}
                detailHeading={t('runDetail')}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Full run log ──────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {t('runLog')}
          </div>
          {lastRefresh && (
            <div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>
              {t('autoRefresh', { time: lastRefresh.toLocaleTimeString(locale) })}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-tertiary)', padding: '20px 0', textAlign: 'center' }}>{t('loading')}</div>
        ) : runs.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', padding: '20px 0', textAlign: 'center' }}>{t('noRuns')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {runs.map(run => (
              <RunRow
                key={run.id}
                run={run}
                isExpanded={expandedId === run.id}
                onToggle={() => setExpandedId(expandedId === run.id ? null : run.id)}
                labels={labels}
                locale={locale}
                detailHeading={t('runDetail')}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Pulse animation ───────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
