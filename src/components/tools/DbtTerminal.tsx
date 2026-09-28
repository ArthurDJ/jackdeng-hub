'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { BREAKABLE_TEST, runDbt, type DbtCommand, type Tone } from '@/lib/dbtLog'

/**
 * A CRT screen that replays `dbt build` on jaffle_shop. The idea is ThreeUI's
 * CRT terminal; this is a CSS version (scanlines, vignette, phosphor glow)
 * rather than a port of its WebGL, so it costs no shader and no dependency.
 *
 * The log comes from src/lib/dbtLog.ts. It is a simulation and says so in the
 * hint: nothing runs against a warehouse.
 *
 * Phosphor colours are fixed rather than theme tokens. The screen is a dark
 * object in both themes, the way FallingSand's materials keep their colours;
 * the bezel around it is the themed part.
 */

type Printed = { id: number; text: string; tone: Tone | 'prompt' }

const PROMPT = 'jack@jaffle_shop %'
const DBT = /^dbt\s+(build|run|test|seed)$/
const TYPE_MS = 55

export function DbtTerminal() {
  const t = useTranslations('tools.terminal')
  const [lines, setLines] = useState<Printed[]>([])
  const [busy, setBusy] = useState(false)
  const [input, setInput] = useState('')
  const [broken, setBroken] = useState(false)
  const [status, setStatus] = useState('')

  const rootRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])
  const nextId = useRef(0)
  const history = useRef<string[]>([])
  const historyAt = useRef(0)
  const brokenRef = useRef(broken)
  const reduced = useRef(false)
  const started = useRef(false)

  useEffect(() => { brokenRef.current = broken }, [broken])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  const stopAll = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  useEffect(() => stopAll, [])

  const print = useCallback((text: string, tone: Printed['tone']) => {
    setLines((ls) => [...ls, { id: nextId.current++, text, tone }].slice(-400))
  }, [])

  // Stay pinned to the newest line, like a real terminal.
  useEffect(() => {
    const el = screenRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, input])

  const execute = useCallback((raw: string) => {
    const cmd = raw.trim().replace(/\s+/g, ' ')
    print(`${PROMPT} ${cmd}`, 'prompt')
    if (cmd) {
      history.current.push(cmd)
      historyAt.current = history.current.length
    }
    if (!cmd) return
    if (cmd === 'clear') { setLines([]); return }
    if (cmd === 'help') {
      print(t('helpIntro'), 'plain')
      for (const [c, k] of [['dbt build', 'helpBuild'], ['dbt run', 'helpRun'], ['dbt test', 'helpTest'], ['dbt seed', 'helpSeed'], ['clear', 'helpClear']] as const) {
        print(`  ${c.padEnd(10)} ${t(k)}`, 'dim')
      }
      return
    }
    const m = DBT.exec(cmd)
    if (!m) {
      print(cmd.startsWith('dbt') ? t('unknownDbt') : `zsh: command not found: ${cmd.split(' ')[0]}`, 'error')
      return
    }

    const run = runDbt(m[1] as DbtCommand, { failing: brokenRef.current ? BREAKABLE_TEST : null })
    const summary = run.lines.at(-1)!.text.replace(/^\S+\s+/, '')
    if (reduced.current) {
      setLines((ls) => [...ls, ...run.lines.map((l) => ({ id: nextId.current++, text: l.text, tone: l.tone }))].slice(-400))
      setStatus(t('finished', { summary }))
      return
    }
    setBusy(true)
    setStatus('')
    let at = 0
    for (const l of run.lines) {
      at += l.delay
      later(() => print(l.text, l.tone), at)
    }
    later(() => {
      setBusy(false)
      setStatus(t('finished', { summary }))
      inputRef.current?.focus({ preventScroll: true })
    }, at + 30)
  }, [print, t])

  /** Types a command into the prompt, then runs it. */
  const typeAndRun = useCallback((cmd: string) => {
    if (reduced.current) { execute(cmd); return }
    setBusy(true)
    ;[...cmd].forEach((_, i) => later(() => setInput(cmd.slice(0, i + 1)), TYPE_MS * (i + 1)))
    later(() => { setInput(''); setBusy(false); execute(cmd) }, TYPE_MS * (cmd.length + 3))
  }, [execute])

  // First run starts when the screen scrolls into view. With reduced motion it
  // prints the finished log at once instead of typing and streaming it.
  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return
      started.current = true
      io.disconnect()
      later(() => typeAndRun('dbt build'), reduced.current ? 0 : 400)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [typeAndRun])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (busy) return
      const v = input
      setInput('')
      execute(v)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const h = history.current
      if (!h.length) return
      historyAt.current = Math.max(0, Math.min(h.length, historyAt.current + (e.key === 'ArrowUp' ? -1 : 1)))
      setInput(h[historyAt.current] ?? '')
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([])
    }
  }

  const btn = (active = false): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '7px 13px', fontSize: '13px', cursor: 'pointer', borderRadius: '8px',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    backgroundColor: active ? 'var(--bg-elevated)' : 'transparent',
    border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border-default)'}`,
  })
  const mono: React.CSSProperties = { fontFamily: 'var(--font-geist-mono, ui-monospace, monospace)' }

  return (
    <div ref={rootRef}>
      <div className="ds-crt-bezel">
        <div className="ds-crt" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
          <div
            ref={screenRef}
            className="ds-crt-screen"
            role="log"
            aria-live="off"
            aria-label={t('screenLabel')}
            tabIndex={0}
          >
            {lines.map((l) => (
              <div key={l.id} className={`ds-crt-${l.tone}`}>{l.text || ' '}</div>
            ))}
            <div className="ds-crt-prompt">
              <span aria-hidden="true">{PROMPT} </span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                readOnly={busy}
                aria-label={t('inputLabel')}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className="ds-crt-input"
                style={{ width: `${Math.max(1, input.length + 1)}ch` }}
              />
              <span className="ds-crt-cursor" aria-hidden="true" />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 4px 0', fontSize: 11, color: 'var(--text-tertiary)', ...mono }}>
          <span aria-hidden="true" className={busy ? 'ds-crt-led ds-crt-led-on' : 'ds-crt-led'} />
          <span>jaffle_shop · target=dev</span>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{status}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
        {(['dbt build', 'dbt test'] as const).map((c) => (
          <button key={c} type="button" disabled={busy} onClick={() => typeAndRun(c)} style={{ ...btn(), ...mono, opacity: busy ? 0.5 : 1 }}>
            {c}
          </button>
        ))}
        <button type="button" onClick={() => setBroken((b) => !b)} aria-pressed={broken} style={btn(broken)}>
          <span aria-hidden="true" style={{
            width: '11px', height: '11px', borderRadius: '3px',
            backgroundColor: broken ? 'rgb(239, 98, 98)' : 'transparent',
            border: broken ? 'none' : '1px dashed var(--border-strong)',
          }} />
          {t('breakTest')}
        </button>
        <button type="button" onClick={() => { stopAll(); setBusy(false); setInput(''); setLines([]) }} style={btn()}>
          {t('clear')}
        </button>
      </div>

      <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
        {t('hint')}
      </p>
    </div>
  )
}
