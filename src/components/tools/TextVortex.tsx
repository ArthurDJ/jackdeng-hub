'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { layoutRing, ringRadii, springStep, type Body } from '@/lib/vortex'

/**
 * Rings of text turning on a canvas. Moving the pointer through them pushes
 * the glyphs aside (they fade and tint as they scatter, then spring home);
 * pressing and holding pulls every ring toward the centre and spins it up.
 *
 * The idea is ThreeUI's Typography Vortex; this is a separate implementation
 * whose geometry lives in src/lib/vortex.ts with tests.
 *
 * Colours come from CSS: the canvas's own `color` (--text-primary) and the
 * --accent-primary token, re-read every half second so a theme switch
 * shows up without a reload. With reduced motion the rings start still; the
 * pointer still works, since that motion is the visitor's own.
 */

const PRESETS = ['BACKEND · DATA · PIPELINES · INTEGRATIONS · ', '后端 · 数据 · 管道 · 系统集成 · ', 'JACK DENG · ']
const MAX_PHRASE = 48
const FONT_PX = 13
const RING_GAP = 24
const REACH = 70

type Ring = { radius: number; dir: 1 | -1; speed: number; glyphs: { ch: string; angle: number; body: Body }[] }

export function TextVortex() {
  const t = useTranslations('tools.vortex')
  const locale = useLocale()
  const [phrase, setPhrase] = useState(PRESETS[locale === 'zh' ? 1 : 0])
  const [spinning, setSpinning] = useState(true)
  // Held by the pointer, or latched by the button for keyboard users.
  const [held, setHeld] = useState(false)
  const [latched, setLatched] = useState(false)
  const pulling = held || latched

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phraseRef = useRef(phrase)
  const spinningRef = useRef(spinning)
  const pullRef = useRef(false)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const rebuildRef = useRef<() => void>(() => {})

  useEffect(() => { spinningRef.current = spinning }, [spinning])
  useEffect(() => { pullRef.current = pulling }, [pulling])
  useEffect(() => {
    phraseRef.current = phrase
    rebuildRef.current()
  }, [phrase])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setSpinning(false)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let dpr = 1
    let w = 0
    let h = 0
    let rings: Ring[] = []
    let spin = 0
    let pull = 0
    let ink = '#888'
    let accent = '#5e6ad2'
    let inkClock = 0
    let raf: number | undefined
    let visible = true
    let prev = performance.now()

    const font = () => `500 ${FONT_PX * dpr}px ${getComputedStyle(canvas).fontFamily}`

    const build = () => {
      const text = [...(phraseRef.current.trim() ? phraseRef.current : ' ')]
      ctx.font = font()
      const widths = text.map((ch) => ctx.measureText(ch).width + 1.5 * dpr)
      const outer = Math.hypot(w, h) / 2
      rings = ringRadii(36 * dpr, outer, RING_GAP * dpr).map((radius, i) => {
        const layout = layoutRing(widths, radius)
        return {
          radius,
          dir: i % 2 ? -1 : 1,
          // Inner rings turn faster, as they would in a real vortex.
          speed: 0.35 * Math.sqrt((80 * dpr) / radius),
          glyphs: layout.angles.map((angle, j) => ({ ch: text[layout.chars[j]], angle, body: { x: 0, y: 0, vx: 0, vy: 0 } })),
        }
      })
    }
    rebuildRef.current = build

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      w = Math.round(rect.width * dpr)
      h = Math.round(rect.height * dpr)
      canvas.width = w
      canvas.height = h
      build()
    }

    const readColours = () => {
      const cs = getComputedStyle(canvas)
      ink = cs.color
      accent = cs.getPropertyValue('--accent-primary').trim() || accent
    }

    const frame = (now: number) => {
      const dt = Math.min(64, now - prev) / 1000
      prev = now
      inkClock += dt
      if (inkClock > 0.5) { inkClock = 0; readColours() }

      pull += ((pullRef.current ? 1 : 0) - pull) * 0.07
      if (spinningRef.current || pull > 0.01) spin += dt * (spinningRef.current ? 1 : 0) + dt * pull * 3

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.font = font()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const cx = w / 2
      const cy = h / 2
      const p = pointerRef.current
      const reach = REACH * dpr
      const n = rings.length

      rings.forEach((ring, i) => {
        const radius = ring.radius * (1 - pull * (0.72 - 0.25 * (i / Math.max(1, n - 1))))
        const turn = spin * ring.speed * ring.dir
        const alpha = 0.28 + 0.62 * (1 - i / Math.max(1, n))
        for (const g of ring.glyphs) {
          const a = g.angle + turn
          const cos = Math.cos(a)
          const sin = Math.sin(a)
          const hx = cx + cos * radius
          const hy = cy + sin * radius
          const b = g.body
          const near = p && Math.abs(p.x - hx) < reach && Math.abs(p.y - hy) < reach
          if (near || b.x !== 0 || b.y !== 0) {
            const next = springStep(b, near ? { x: p.x - hx, y: p.y - hy } : null, reach)
            // Snap tiny residues to rest so resting glyphs skip the maths.
            if (!near && Math.abs(next.x) + Math.abs(next.y) + Math.abs(next.vx) + Math.abs(next.vy) < 0.02) {
              b.x = b.y = b.vx = b.vy = 0
            } else Object.assign(b, next)
          }
          const x = hx + b.x
          const y = hy + b.y
          if (x < -20 || y < -20 || x > w + 20 || y > h + 20) continue
          const scatter = Math.min(1, Math.hypot(b.x, b.y) / (60 * dpr))
          const s = 1 - scatter * 0.45
          ctx.globalAlpha = alpha * (1 - scatter * 0.75)
          ctx.fillStyle = scatter > 0.08 ? accent : ink
          // Glyphs stand tangent to their ring.
          ctx.setTransform(-sin * s, cos * s, -cos * s, -sin * s, x, y)
          ctx.fillText(g.ch, 0, 0)
        }
      })
      ctx.globalAlpha = 1
      raf = visible ? requestAnimationFrame(frame) : undefined
    }

    readColours()
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    // Widths measured before the web font arrives are the fallback's.
    document.fonts?.ready.then(() => build())

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && raf === undefined) { prev = performance.now(); raf = requestAnimationFrame(frame) }
    })
    io.observe(canvas)

    return () => {
      ro.disconnect()
      io.disconnect()
      if (raf !== undefined) cancelAnimationFrame(raf)
      rebuildRef.current = () => {}
    }
  }, [])

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const dpr = e.currentTarget.width / rect.width
    return { x: (e.clientX - rect.left) * dpr, y: (e.clientY - rect.top) * dpr }
  }

  const btn = (active = false): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '7px 13px', fontSize: '13px', cursor: 'pointer', borderRadius: '8px',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    backgroundColor: active ? 'var(--bg-elevated)' : 'transparent',
    border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border-default)'}`,
  })

  return (
    <div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={t('canvasLabel', { phrase: phrase.trim() })}
        onPointerMove={(e) => { pointerRef.current = toCanvas(e) }}
        onPointerLeave={() => { pointerRef.current = null; setHeld(false) }}
        onPointerDown={(e) => { pointerRef.current = toCanvas(e); setHeld(true) }}
        onPointerUp={() => setHeld(false)}
        onPointerCancel={() => { pointerRef.current = null; setHeld(false) }}
        style={{
          width: '100%',
          aspectRatio: '5 / 3',
          display: 'block',
          borderRadius: '12px',
          border: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-panel)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-geist-mono, ui-monospace, monospace)',
          cursor: pulling ? 'grabbing' : 'crosshair',
          // Vertical swipes still scroll the page on a phone.
          touchAction: 'pan-y',
        }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', flex: '1 1 240px', minWidth: 0 }}>
          {t('phrase')}
          <input
            type="text"
            value={phrase}
            maxLength={MAX_PHRASE}
            onChange={(e) => setPhrase(e.target.value)}
            style={{
              flex: 1, minWidth: 0, padding: '7px 10px', fontSize: '13px', borderRadius: '8px',
              border: '1px solid var(--border-default)', background: 'var(--bg-base)', color: 'var(--text-primary)',
              fontFamily: 'var(--font-geist-mono, ui-monospace, monospace)',
            }}
          />
        </label>
        <div role="group" aria-label={t('presets')} style={{ display: 'flex', gap: '8px' }}>
          {PRESETS.map((p, i) => (
            <button key={p} type="button" onClick={() => setPhrase(p)} aria-pressed={phrase === p} style={btn(phrase === p)}>
              {[t('presetWork'), t('presetWorkZh'), t('presetName')][i]}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setSpinning((s) => !s)} style={btn()}>
          {spinning ? t('pause') : t('play')}
        </button>
        <button type="button" onClick={() => setLatched((v) => !v)} aria-pressed={latched} style={btn(latched)}>
          {t('pull')}
        </button>
      </div>

      <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
        {t('hint')}
      </p>
    </div>
  )
}
