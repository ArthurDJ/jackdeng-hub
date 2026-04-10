'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useSession, signIn } from 'next-auth/react'

// ── Types ──────────────────────────────────────────────────────────────────
type RunRecord = {
  id: string
  status: string
  summary: string
  detail?: string
  metadata?: Record<string, unknown>
  runAt: string
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

const STATUS_LABEL: Record<string, string> = {
  running:   '运行中',
  found:     '找到名额 🎉',
  booked:    '已改签 ✅',
  heartbeat: '心跳',
  error:     '错误 ❌',
  exited:    '已退出',
}

const META_LABEL: Record<string, string> = {
  consulate:           '领事馆',
  earliest_available:  '最早可用',
  current_appointment: '当前预约',
  acceptable_range:    '目标区间',
  total_slots:         '可用名额数',
  auto_reschedule:     '自动改签',
  available_date:      '找到日期',
  booked_date:         '改签日期',
  booked_time:         '改签时间',
  verified_date:       '验证日期',
  old_appointment:     '原预约',
  session_count:       '运行 Session 数',
}

// ── Helper ─────────────────────────────────────────────────────────────────
function fmt(dt: string) {
  return new Date(dt).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function timeSince(dt: string) {
  const secs = Math.floor((Date.now() - new Date(dt).getTime()) / 1000)
  if (secs < 60) return `${secs}s 前`
  if (secs < 3600) return `${Math.floor(secs / 60)}m 前`
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m 前`
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
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
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function MetaCard({ data }: { data: Record<string, unknown> }) {
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
            {META_LABEL[k] ?? k.replace(/_/g, ' ')}
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, wordBreak: 'break-all' }}>
            {String(v)}
          </div>
        </div>
      ))}
    </div>
  )
}

function RunRow({ run, isExpanded, onToggle }: {
  run: RunRecord
  isExpanded: boolean
  onToggle: () => void
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
          {fmt(run.runAt)}
        </span>

        {/* badge */}
        <span style={{ width: 100, flexShrink: 0 }}>
          <StatusBadge status={run.status} />
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
            <MetaCard data={run.metadata as Record<string, unknown>} />
          )}

          {/* Detail log text */}
          {run.detail && (
            <div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                运行详情
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
  const { data: session, status } = useSession()
  const [runs, setRuns] = useState<RunRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/tool-runs?where[tool.slug][equals]=${slug}&sort=-runAt&limit=50&depth=0`,
      )
      const data = await res.json()
      setRuns(data.docs ?? [])
      setLastRefresh(new Date())
    } catch {
      // silent
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
        验证身份中...
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
          此工具为私有，需要登录后查看
        </p>
        <button
          onClick={() => signIn('google')}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          使用 Google 登录
        </button>
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
            <StatusBadge status={latestStatus} />
            {latest && (
              <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
                {timeSince(latest.runAt)} · {fmt(latest.runAt)}
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
          ↻ 刷新
        </button>
      </div>

      {/* ── Latest metadata cards ─────────────────────────────────────── */}
      {latest?.metadata && Object.keys(latest.metadata).length > 0 && (
        <div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            最新状态
          </div>
          <MetaCard data={latest.metadata as Record<string, unknown>} />
        </div>
      )}

      {/* ── Notable events ────────────────────────────────────────────── */}
      {notableRuns.length > 0 && (
        <div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            重要事件
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {notableRuns.slice(0, 5).map(run => (
              <RunRow
                key={run.id}
                run={run}
                isExpanded={expandedId === run.id}
                onToggle={() => setExpandedId(expandedId === run.id ? null : run.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Full run log ──────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            运行记录（最近 50 条）
          </div>
          {lastRefresh && (
            <div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>
              自动刷新 · 上次 {lastRefresh.toLocaleTimeString('zh-CN')}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-tertiary)', padding: '20px 0', textAlign: 'center' }}>加载中...</div>
        ) : runs.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', padding: '20px 0', textAlign: 'center' }}>暂无运行记录</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {runs.map(run => (
              <RunRow
                key={run.id}
                run={run}
                isExpanded={expandedId === run.id}
                onToggle={() => setExpandedId(expandedId === run.id ? null : run.id)}
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
