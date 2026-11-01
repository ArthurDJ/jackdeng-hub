'use client'

import React, { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CronError, FIELDS, compact, nextRuns, parseCron, type Schedule } from '@/lib/cron'
import { relative } from '@/lib/epoch'
import { intlLocale } from '@/lib/formatDate'

/**
 * Cron Explainer: type a five-field cron expression, see what each field
 * allows and the next ten runs. The rules are in src/lib/cron.ts.
 *
 * GitHub Actions and Vercel run cron in UTC, so that is the default; the
 * toggle shows the same expression read in the visitor's own zone, which is
 * what a plain crontab on their machine would do. The run list waits for
 * hydration, since "next" depends on the visitor's clock.
 */

const PRESETS = ['*/5 * * * *', '0 * * * *', '0 2 * * *', '30 8 * * 1-5', '0 0 1 * *', '@weekly']

export function CronExplainer() {
  const t = useTranslations('tools.cron')
  const locale = useLocale()
  const [expr, setExpr] = useState('0 2 * * *')
  const [utc, setUtc] = useState(true)
  const [now, setNow] = useState<Date | null>(null)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setNow(new Date()) }, [])

  let schedule: Schedule | null = null
  let error: CronError | null = null
  try {
    schedule = parseCron(expr)
  } catch (e) {
    error = e instanceof CronError ? e : new CronError('badValue')
  }

  const runs = schedule && now ? nextRuns(schedule, now, 10, utc) : []
  const fmt = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    ...(utc ? { timeZone: 'UTC' } : {}),
  })

  const panel: React.CSSProperties = {
    background: 'var(--bg-panel)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 20,
  }
  const mono: React.CSSProperties = { fontFamily: 'var(--font-geist-mono, ui-monospace, monospace)' }
  const label: React.CSSProperties = { fontSize: 11, fontWeight: 510, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }
  const chip: React.CSSProperties = {
    ...mono, fontSize: 12, padding: '3px 10px', borderRadius: 9999, cursor: 'pointer',
    color: 'var(--text-secondary)', background: 'var(--bg-hover)', border: '1px solid var(--border-default)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={panel}>
        <label htmlFor="cron-input" style={{ ...label, display: 'block', marginBottom: 8 }}>{t('inputLabel')}</label>
        <input
          id="cron-input"
          className="ds-input w-full"
          style={{ ...mono, fontSize: 18 }}
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby="cron-status"
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
          {PRESETS.map((p) => (
            <button key={p} type="button" style={chip} onClick={() => setExpr(p)}>{p}</button>
          ))}
        </div>
        <p id="cron-status" role="status" style={{ fontSize: 13, marginTop: 12, minHeight: 20, color: error ? 'var(--status-error)' : 'var(--text-secondary)' }}>
          {error
            ? t(`errors.${error.code}`, { field: error.field ? t(`fields.${error.field}`) : '', token: error.token ?? '' })
            : t('valid')}
        </p>
      </div>

      {schedule && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
          {FIELDS.map(({ key }) => (
            <div key={key} style={{ ...panel, padding: '12px 14px' }}>
              <p style={label}>{t(`fields.${key}`)}</p>
              <p style={{ ...mono, fontSize: 14, color: 'var(--text-primary)', margin: '6px 0 0', overflowWrap: 'anywhere' }}>
                {schedule.any[key] ? t('every') : compact(schedule.values[key], key)}
              </p>
            </div>
          ))}
        </div>
      )}

      {schedule && (
        <div style={panel}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <p style={label}>{t('nextRuns')}</p>
            <div className="ds-seg-group inline-flex" role="group" aria-label={t('zoneLabel')}>
              <button type="button" className="ds-seg" aria-pressed={utc} onClick={() => setUtc(true)}>UTC</button>
              <button type="button" className="ds-seg" aria-pressed={!utc} onClick={() => setUtc(false)}>{t('localZone')}</button>
            </div>
          </div>
          {now && runs.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{t('never')}</p>
          ) : (
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {runs.map((d, i) => (
                <li key={d.getTime()} style={{
                  display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                  padding: '8px 0', borderTop: i ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <span style={{ ...mono, fontSize: 14, color: 'var(--text-primary)' }}>{fmt.format(d)}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{relative(d, now!, locale)}</span>
                </li>
              ))}
            </ol>
          )}
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 14, lineHeight: 1.6 }}>{t('note')}</p>
        </div>
      )}
    </div>
  )
}
