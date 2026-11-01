'use client'

import React, { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { inZone, parseInput, relative, toEpochs, type EpochUnit } from '@/lib/epoch'

/**
 * Epoch Converter: paste a Unix timestamp or a date, read it in every unit
 * and a few time zones. The rules are in src/lib/epoch.ts.
 *
 * The clock starts after hydration — the server's "now" is not the
 * visitor's, so rendering it there would mismatch.
 */

const ZONES = ['UTC', 'America/Los_Angeles', 'America/New_York', 'Asia/Shanghai'] as const
const UNITS: EpochUnit[] = ['s', 'ms', 'us', 'ns']

export function EpochConverter() {
  const t = useTranslations('tools.epoch')
  const locale = useLocale()
  const [now, setNow] = useState<Date | null>(null)
  const [input, setInput] = useState('')
  const [unit, setUnit] = useState<EpochUnit | 'auto'>('auto')
  const [copied, setCopied] = useState<string | null>(null)
  const [localZone, setLocalZone] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const parsed = input.trim() ? parseInput(input, unit === 'auto' ? undefined : unit) : null
  const date = input.trim() ? parsed?.date ?? null : now

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      window.setTimeout(() => setCopied((k) => (k === key ? null : k)), 1200)
    } catch { /* clipboard blocked: the value is on screen to select */ }
  }

  const panel: React.CSSProperties = {
    background: 'var(--bg-panel)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 20,
  }
  const mono: React.CSSProperties = { fontFamily: 'var(--font-geist-mono, ui-monospace, monospace)' }
  const label: React.CSSProperties = { fontSize: 11, fontWeight: 510, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }
  const copyBtn: React.CSSProperties = {
    fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', flexShrink: 0,
    color: 'var(--text-secondary)', background: 'transparent', border: '1px solid var(--border-default)',
  }

  const rows: { key: string; name: string; value: string; hint?: string }[] = []
  if (date) {
    const e = toEpochs(date)
    for (const u of UNITS) rows.push({ key: u, name: t(`units.${u}`), value: e[u] })
    rows.push({ key: 'iso', name: 'ISO 8601', value: date.toISOString() })
    const zones = localZone && !ZONES.includes(localZone as (typeof ZONES)[number]) ? [localZone, ...ZONES] : [...ZONES]
    for (const z of zones) {
      const { text, offset } = inZone(date, z)
      rows.push({ key: z, name: z === localZone ? t('local', { zone: z }) : z, value: text, hint: z === 'UTC' ? undefined : `UTC${offset}` })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...panel, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p style={label}>{t('nowLabel')}</p>
          <p style={{ ...mono, fontSize: 28, fontWeight: 590, color: 'var(--text-primary)', margin: '4px 0 0', minHeight: 34 }} aria-live="off">
            {now ? toEpochs(now).s : ' '}
          </p>
        </div>
        {now && (
          <button type="button" style={copyBtn} onClick={() => copy('now', toEpochs(now).s)}>
            {copied === 'now' ? t('copied') : t('copy')}
          </button>
        )}
      </div>

      <div style={panel}>
        <label htmlFor="epoch-input" style={{ ...label, display: 'block', marginBottom: 8 }}>{t('inputLabel')}</label>
        <input
          id="epoch-input"
          className="ds-input w-full"
          style={mono}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('placeholder')}
          spellCheck={false}
          autoComplete="off"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t('unitLabel')}</span>
          <div className="ds-seg-group inline-flex" role="group" aria-label={t('unitLabel')}>
            {(['auto', ...UNITS] as const).map((u) => (
              <button key={u} type="button" className="ds-seg" aria-pressed={unit === u} onClick={() => setUnit(u)}>
                {u === 'auto' ? t('auto') : u}
              </button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 13, marginTop: 12, minHeight: 20, color: input.trim() && !parsed ? 'var(--status-error)' : 'var(--text-secondary)' }} role="status">
          {!input.trim()
            ? t('showingNow')
            : !parsed
              ? t('invalid')
              : parsed.kind === 'epoch'
                ? t('readAs', { unit: t(`units.${parsed.unit}`) })
                : t('readAsDate')}
          {date && now && input.trim() && parsed ? ` · ${relative(date, now, locale)}` : ''}
        </p>
      </div>

      {date && (
        <div style={{ ...panel, padding: 0, overflow: 'hidden' }}>
          {rows.map((r, i) => (
            <div key={r.key} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
              borderTop: i ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
                  {r.name}
                  {r.hint && <span style={{ ...mono, marginLeft: 6, opacity: 0.8 }}>{r.hint}</span>}
                </p>
                <p style={{ ...mono, fontSize: 14, color: 'var(--text-primary)', margin: '2px 0 0', overflowWrap: 'anywhere' }}>{r.value}</p>
              </div>
              <button type="button" style={copyBtn} onClick={() => copy(r.key, r.value)}>
                {copied === r.key ? t('copied') : t('copy')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
