'use client'

import React, { useEffect, useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { scrub, ScrubError, type Finding, type Report } from '@/lib/metaScrub'

/**
 * Metadata Scrubber: pick a JPEG or PNG, see what it carries besides the
 * picture, download a copy without it. The rules are in src/lib/metaScrub.ts.
 *
 * The file is read with File.arrayBuffer() and never leaves the page: there
 * is no request, and the download is a blob URL made here.
 */

const kb = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`)

export function MetaScrub() {
  const t = useTranslations('tools.scrub')
  const inputId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  // A blob URL holds the file in memory until it is revoked.
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])

  const load = async (f: File | undefined) => {
    if (!f) return
    setFile(f)
    setReport(null)
    setError(null)
    setUrl(null)
    try {
      const r = scrub(new Uint8Array(await f.arrayBuffer()))
      setReport(r)
      if (r.findings.length) {
        setUrl(URL.createObjectURL(new Blob([r.cleaned as Uint8Array<ArrayBuffer>], { type: r.format === 'jpeg' ? 'image/jpeg' : 'image/png' })))
      }
    } catch (e) {
      setError(t(`errors.${e instanceof ScrubError ? e.code : 'corrupt'}`))
    }
  }

  const cleanName = (name: string) => name.replace(/(\.[^.]+)?$/, (ext) => `-clean${ext || ''}`)

  const panel: React.CSSProperties = {
    background: 'var(--bg-panel)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 20,
  }
  const mono: React.CSSProperties = { fontFamily: 'var(--font-geist-mono, ui-monospace, monospace)' }

  const describe = (f: Finding): { title: string; lines: string[]; risky?: boolean } => {
    switch (f.kind) {
      case 'exif': {
        const e = f.exif
        const lines: string[] = []
        if (e.make || e.model) lines.push(t('exif.camera', { camera: [e.make, e.model].filter(Boolean).join(' ') }))
        if (e.dateTimeOriginal || e.dateTime) lines.push(t('exif.taken', { time: (e.dateTimeOriginal ?? e.dateTime)! }))
        if (e.software) lines.push(t('exif.software', { software: e.software }))
        if (e.gps) lines.push(t('exif.gps', { lat: e.gps.lat.toFixed(5), lon: e.gps.lon.toFixed(5) }))
        if (e.orientation && e.orientation !== 1) lines.push(t('exif.orientation'))
        return { title: t('kinds.exif'), lines, risky: Boolean(e.gps) }
      }
      case 'text':
        return { title: t('kinds.text', { key: f.key }), lines: f.preview ? [f.preview] : [], risky: /prompt|workflow|parameters/i.test(f.key) }
      case 'comment':
        return { title: t('kinds.comment'), lines: f.text ? [f.text] : [] }
      case 'other':
        return { title: t('kinds.other', { name: f.name }), lines: [] }
      default:
        return { title: t(`kinds.${f.kind}`), lines: [] }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label
        htmlFor={inputId}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); load(e.dataTransfer.files[0]) }}
        style={{
          ...panel,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center',
          padding: '36px 20px', cursor: 'pointer',
          borderStyle: 'dashed', borderColor: dragging ? 'var(--accent-primary)' : 'var(--border-strong)',
          background: dragging ? 'var(--accent-subtle)' : 'var(--bg-panel)',
        }}
      >
        <span style={{ fontSize: 32 }} aria-hidden="true">🖼️</span>
        <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 510 }}>{t('pick')}</span>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{t('privacy')}</span>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => load(e.target.files?.[0])}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
        />
      </label>

      {error && (
        <p role="alert" style={{ ...panel, color: 'var(--status-error)', fontSize: 14 }}>{error}</p>
      )}

      {file && report && (
        <div style={panel} role="status">
          <p style={{ ...mono, fontSize: 12, color: 'var(--text-tertiary)', overflowWrap: 'anywhere' }}>{file.name}</p>
          {report.findings.length === 0 ? (
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 10 }}>{t('clean')}</p>
          ) : (
            <>
              <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0 }}>
                {report.findings.map((f, i) => {
                  const d = describe(f)
                  return (
                    <li key={i} style={{ padding: '10px 0', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 510, color: d.risky ? 'var(--status-warning)' : 'var(--text-primary)' }}>
                          {d.risky ? '⚠ ' : ''}{d.title}
                        </span>
                        <span style={{ ...mono, fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }}>{kb(f.bytes)}</span>
                      </div>
                      {d.lines.map((line, j) => (
                        <p key={j} style={{ ...mono, fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', overflowWrap: 'anywhere' }}>{line}</p>
                      ))}
                    </li>
                  )
                })}
              </ul>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                {url && (
                  <a
                    href={url}
                    download={cleanName(file.name)}
                    className="ds-accent-btn"
                    style={{
                      display: 'inline-flex', alignItems: 'center', padding: '8px 18px', borderRadius: 9999,
                      background: 'var(--accent-solid)', color: '#ffffff', fontSize: 14, fontWeight: 500, textDecoration: 'none',
                    }}
                  >
                    {t('download')}
                  </a>
                )}
                <span style={{ ...mono, fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {t('sizes', { before: kb(file.size), after: kb(report.cleaned.length) })}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12, lineHeight: 1.6 }}>{t('kept')}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
