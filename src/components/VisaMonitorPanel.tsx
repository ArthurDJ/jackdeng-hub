'use client'

import React, { useEffect, useState } from 'react'

type RunRecord = {
  id: string
  status: string
  summary: string
  detail?: string
  runAt: string
  metadata?: Record<string, any>
}

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

export const VisaMonitorPanel: React.FC = () => {
  const [runs, setRuns] = useState<RunRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchRuns = async () => {
    try {
      const res = await fetch(
        '/api/tool-runs?where[tool.slug][equals]=visa-checker&sort=-runAt&limit=20&depth=0',
      )
      const data = await res.json()
      setRuns(data.docs ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRuns()
    const interval = setInterval(fetchRuns, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const latest = runs[0]

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <span style={{ fontSize: '24px' }}>🛂</span>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#ededed' }}>
          Visa Appointment Monitor
        </h2>
        {latest && (
          <span style={{
            marginLeft: 'auto',
            background: STATUS_COLOR[latest.status] + '22',
            color: STATUS_COLOR[latest.status],
            border: `1px solid ${STATUS_COLOR[latest.status]}44`,
            borderRadius: '6px',
            padding: '3px 10px',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            {STATUS_LABEL[latest.status] ?? latest.status}
          </span>
        )}
      </div>

      {/* Latest metadata */}
      {latest?.metadata && (
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
        }}>
          {Object.entries(latest.metadata).map(([k, v]) => (
            <div key={k}>
              <div style={{ color: '#71717a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {k.replace(/_/g, ' ')}
              </div>
              <div style={{ color: '#ededed', fontSize: '14px', marginTop: '2px' }}>
                {String(v)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Run history */}
      <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '8px' }}>
        最近 20 条记录（每 30 秒自动刷新）
      </div>

      {loading ? (
        <div style={{ color: '#52525b', padding: '20px 0' }}>加载中...</div>
      ) : runs.length === 0 ? (
        <div style={{ color: '#52525b', padding: '20px 0' }}>暂无运行记录</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {runs.map((run) => {
            const isExpanded = expandedId === run.id
            const hasDetail = Boolean(run.detail) || Boolean(run.metadata && Object.keys(run.metadata).length)
            return (
              <div key={run.id} style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${isExpanded ? (STATUS_COLOR[run.status] ?? '#71717a') + '44' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '6px',
                overflow: 'hidden',
              }}>
                {/* Row */}
                <div
                  onClick={() => hasDetail && setExpandedId(isExpanded ? null : run.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px',
                    cursor: hasDetail ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[run.status] ?? '#71717a', flexShrink: 0 }} />
                  <span style={{ color: '#a1a1aa', fontSize: '12px', width: '140px', flexShrink: 0 }}>
                    {new Date(run.runAt).toLocaleString('zh-CN')}
                  </span>
                  <span style={{ color: STATUS_COLOR[run.status] ?? '#a1a1aa', fontSize: '12px', width: '80px', flexShrink: 0 }}>
                    {STATUS_LABEL[run.status] ?? run.status}
                  </span>
                  <span style={{ color: '#d4d4d8', fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {run.summary}
                  </span>
                  {hasDetail && (
                    <span style={{ color: '#52525b', fontSize: '12px', flexShrink: 0, transform: isExpanded ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>›</span>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {run.metadata && Object.keys(run.metadata).length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
                        {Object.entries(run.metadata).map(([k, v]) => (
                          <div key={k} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '4px', padding: '8px 10px' }}>
                            <div style={{ color: '#52525b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{k.replace(/_/g, ' ')}</div>
                            <div style={{ color: '#e4e4e7', fontSize: '13px', marginTop: '2px' }}>{String(v)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {run.detail && (
                      <pre style={{
                        background: 'rgba(0,0,0,0.3)', borderRadius: '4px', padding: '10px 12px',
                        fontSize: '11px', color: '#a1a1aa', lineHeight: 1.6,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                        maxHeight: '200px', overflowY: 'auto',
                        fontFamily: 'monospace',
                      }}>
                        {run.detail}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
