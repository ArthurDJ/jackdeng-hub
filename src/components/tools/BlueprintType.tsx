'use client'

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { GRID, layoutWord, moveBox, snap, type Box } from '@/lib/blueprint'

/**
 * A wordmark on a blueprint sheet: outlined letters on the 8px grid the
 * site's layout uses, each with its coordinates. Drag a letter, or focus it
 * and use the arrow keys (one grid step; Shift for a single pixel), and the
 * guides and read-outs follow.
 *
 * The idea is React Bits' Tech Text; this implementation is separate and its
 * snapping and layout live in src/lib/blueprint.ts with tests. Colours are
 * the accent and text tokens, so the sheet follows the theme.
 */

const MAX_WORD = 12

export function BlueprintType() {
  const t = useTranslations('tools.blueprint')
  const [word, setWord] = useState('JACK DENG')
  const [snapOn, setSnapOn] = useState(true)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [active, setActive] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [sheet, setSheet] = useState({ w: 0, h: 0 })
  const [font, setFont] = useState(80)

  const sheetRef = useRef<HTMLDivElement>(null)
  const measureRefs = useRef<(HTMLSpanElement | null)[]>([])
  const drag = useRef<{ i: number; ox: number; oy: number } | null>(null)

  const letters = [...word]

  const layout = useCallback(() => {
    const el = sheetRef.current
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    setSheet({ w, h })
    const sizes = measureRefs.current.slice(0, letters.length).map((m) => ({
      w: Math.ceil(m?.offsetWidth ?? 0),
      h: Math.ceil(m?.offsetHeight ?? 0),
    }))
    // Glyph widths scale with the font size, so one measurement says which
    // size fits the sheet with 32px to spare on each side. Re-measure at that
    // size before placing anything.
    const sum = sizes.reduce((a, b) => a + b.w, 0)
    const gaps = GRID * Math.max(0, sizes.length - 1)
    const most = w < 560 ? 48 : 80
    const fit = sum > 0 ? Math.floor((font * (w - 64 - gaps)) / sum) : most
    const size = Math.max(16, Math.min(most, fit))
    if (size !== font) { setFont(size); return }
    const xs = layoutWord(sizes.map((b) => b.w), w, GRID)
    const y = snap((h - (sizes[0]?.h ?? 0)) / 2)
    setBoxes(sizes.map((b, i) => ({ x: xs[i], y, w: b.w, h: b.h })))
    // `letters` comes from `word`, so the word and the font size are the inputs.
  }, [word, font])

  useLayoutEffect(() => {
    layout()
    const el = sheetRef.current
    if (!el) return
    let width = el.clientWidth
    const ro = new ResizeObserver(() => {
      // Only a width change re-centres; height is fixed by CSS.
      if (el.clientWidth !== width) { width = el.clientWidth; layout() }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [layout])

  const toSheet = (e: React.PointerEvent) => {
    const r = sheetRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onPointerDown = (i: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toSheet(e)
    drag.current = { i, ox: p.x - boxes[i].x, oy: p.y - boxes[i].y }
    setActive(i)
    setDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const p = toSheet(e)
    setBoxes((bs) => bs.map((b, j) => (j === d.i ? moveBox({ ...b, x: 0, y: 0 }, p.x - d.ox, p.y - d.oy, sheet, snapOn ? GRID : null) : b)))
  }
  const onPointerUp = () => {
    drag.current = null
    setDragging(false)
  }

  const onKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 1 : GRID
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
    if (!d) return
    e.preventDefault()
    // A one-pixel nudge would be undone by snapping, so Shift moves freely.
    setBoxes((bs) => bs.map((b, j) => (j === i ? moveBox(b, d[0], d[1], sheet, snapOn && !e.shiftKey ? GRID : null) : b)))
  }

  const scatter = () => {
    setBoxes((bs) => bs.map((b) => moveBox(
      { ...b, x: 0, y: 0 },
      Math.random() * Math.max(0, sheet.w - b.w),
      Math.random() * Math.max(0, sheet.h - b.h),
      sheet,
      snapOn ? GRID : null,
    )))
  }

  const btn = (on = false): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '7px 13px', fontSize: '13px', cursor: 'pointer', borderRadius: '8px',
    color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
    backgroundColor: on ? 'var(--bg-elevated)' : 'transparent',
    border: `1px solid ${on ? 'var(--border-strong)' : 'var(--border-default)'}`,
  })

  const a = active !== null ? boxes[active] : undefined

  return (
    <div>
      <div
        ref={sheetRef}
        className="ds-blueprint"
        role="group"
        aria-label={t('sheetLabel')}
        style={{ ['--bp-font' as string]: `${font}px` }}
      >
        {/* Off-screen copies, measured for each letter's box. */}
        <div aria-hidden="true" style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', whiteSpace: 'pre' }}>
          {letters.map((ch, i) => (
            <span key={`${i}-${ch}`} ref={(el) => { measureRefs.current[i] = el }} className="ds-bp-glyph">{ch}</span>
          ))}
        </div>

        {a && (
          <>
            <div className="ds-bp-guide ds-bp-guide-v" style={{ transform: `translateX(${a.x}px)` }} aria-hidden="true" />
            <div className="ds-bp-guide ds-bp-guide-h" style={{ transform: `translateY(${a.y + a.h}px)` }} aria-hidden="true" />
            <div className="ds-bp-dim" style={{ transform: `translate(${a.x}px, ${a.y - 18}px)`, width: a.w }} aria-hidden="true">
              <span>{a.w}</span>
            </div>
          </>
        )}

        {boxes.map((b, i) => letters[i] === ' ' ? null : (
          <div
            key={`${i}-${letters[i]}`}
            className="ds-bp-letter"
            data-active={active === i ? '' : undefined}
            data-dragging={dragging && active === i ? '' : undefined}
            style={{ transform: `translate(${b.x}px, ${b.y}px)`, width: b.w, height: b.h }}
            role="button"
            aria-roledescription={t('letterRole')}
            aria-label={t('letterLabel', { ch: letters[i], x: b.x, y: b.y })}
            tabIndex={0}
            onPointerDown={onPointerDown(i)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onFocus={() => setActive(i)}
            onMouseEnter={() => { if (!dragging) setActive(i) }}
            onKeyDown={onKeyDown(i)}
          >
            <span className="ds-bp-glyph">{letters[i]}</span>
            <span className="ds-bp-coords" aria-hidden="true">x {b.x} · y {b.y}</span>
          </div>
        ))}

        <span className="ds-bp-stamp" aria-hidden="true">
          {t('stamp', { w: sheet.w, h: sheet.h, grid: GRID })}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {t('word')}
          <input
            type="text"
            value={word}
            maxLength={MAX_WORD}
            onChange={(e) => { setActive(null); setWord(e.target.value) }}
            style={{
              width: '14ch', padding: '7px 10px', fontSize: '13px', borderRadius: '8px',
              border: '1px solid var(--border-default)', background: 'var(--bg-base)', color: 'var(--text-primary)',
            }}
          />
        </label>
        <button type="button" onClick={() => setSnapOn((s) => !s)} aria-pressed={snapOn} style={btn(snapOn)}>
          {t('snap', { grid: GRID })}
        </button>
        <button type="button" onClick={scatter} style={btn()}>{t('scatter')}</button>
        <button type="button" onClick={() => { setActive(null); layout() }} style={btn()}>{t('reset')}</button>
      </div>

      <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
        {t('hint')}
      </p>
    </div>
  )
}
