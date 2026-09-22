'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

/**
 * A falling-sand toy. Cellular automaton on a coarse grid, drawn by scaling a
 * grid-sized ImageData up with smoothing off, so the cost is the simulation
 * rather than thousands of fillRect calls.
 *
 * The canvas is painted with clearRect and left transparent; its background
 * comes from CSS (var(--bg-panel)). That is what keeps it correct in both
 * themes without reading computed styles or re-rendering on a theme change.
 */

const EMPTY = 0
const SAND = 1
const WATER = 2
const STONE = 3

type Material = typeof SAND | typeof WATER | typeof STONE | typeof EMPTY

// RGB chosen to sit readably on both the light and the dark panel token.
const COLORS: Record<number, [number, number, number]> = {
  [SAND]: [214, 158, 74],
  [WATER]: [59, 130, 246],
  [STONE]: [120, 120, 128],
}

const COLS = 200
const ROWS = 120

export function FallingSand() {
  const t = useTranslations('tools.sand')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gridRef = useRef<Uint8Array>(new Uint8Array(COLS * ROWS))
  const rafRef = useRef<number | undefined>(undefined)
  const pointerRef = useRef<{ x: number; y: number; down: boolean }>({ x: 0, y: 0, down: false })

  // Refs mirror the controls so the animation loop reads current values without
  // being torn down and restarted on every click.
  const materialRef = useRef<Material>(SAND)
  const brushRef = useRef(4)
  const runningRef = useRef(true)

  const [material, setMaterial] = useState<Material>(SAND)
  const [brush, setBrush] = useState(4)
  const [running, setRunning] = useState(true)

  useEffect(() => { materialRef.current = material }, [material])
  useEffect(() => { brushRef.current = brush }, [brush])
  useEffect(() => { runningRef.current = running }, [running])

  // Someone who asked for less motion should not land on a screen that is
  // already moving. The toy still works — they press play.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) setRunning(false)
  }, [])

  const paint = useCallback((cx: number, cy: number) => {
    const grid = gridRef.current
    const r = brushRef.current
    const mat = materialRef.current
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue
        const x = cx + dx
        const y = cy + dy
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) continue
        // Sand and water are sprayed rather than packed solid, which keeps the
        // stroke looking granular instead of like a painted blob.
        if (mat !== STONE && mat !== EMPTY && Math.random() > 0.55) continue
        grid[y * COLS + x] = mat
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = COLS
    canvas.height = ROWS
    ctx.imageSmoothingEnabled = false

    const image = ctx.createImageData(COLS, ROWS)
    const grid = gridRef.current

    // Seed a heap so the first thing on screen is sand settling rather than an
    // empty rectangle that gives no hint the canvas is the toy.
    if (!grid.some((c) => c !== EMPTY)) {
      for (let y = 0; y < 26; y++) {
        for (let x = 0; x < COLS; x++) {
          const edge = Math.min(x, COLS - 1 - x)
          if (edge < 30 && y > edge) continue
          if (Math.random() < 0.55) grid[y * COLS + x] = SAND
        }
      }
    }

    const step = () => {
      // Bottom-up so a cell that just moved down is not moved again this tick.
      for (let y = ROWS - 2; y >= 0; y--) {
        // Alternating scan direction each row cancels the drift a fixed
        // left-to-right sweep would build up in the piles.
        const ltr = Math.random() < 0.5
        for (let i = 0; i < COLS; i++) {
          const x = ltr ? i : COLS - 1 - i
          const idx = y * COLS + x
          const cell = grid[idx]
          if (cell === EMPTY || cell === STONE) continue

          const below = idx + COLS

          if (grid[below] === EMPTY) {
            grid[below] = cell
            grid[idx] = EMPTY
            continue
          }

          // Sand is denser than water, so it trades places and sinks.
          if (cell === SAND && grid[below] === WATER) {
            grid[below] = SAND
            grid[idx] = WATER
            continue
          }

          const dir = Math.random() < 0.5 ? -1 : 1
          for (const d of [dir, -dir]) {
            const nx = x + d
            if (nx < 0 || nx >= COLS) continue
            const diag = below + d
            if (grid[diag] === EMPTY) {
              grid[diag] = cell
              grid[idx] = EMPTY
              break
            }
            if (cell === SAND && grid[diag] === WATER) {
              grid[diag] = SAND
              grid[idx] = WATER
              break
            }
            // Water alone also spreads sideways, which is what makes it level
            // off instead of standing in a column like sand.
            if (cell === WATER) {
              const side = idx + d
              if (grid[side] === EMPTY) {
                grid[side] = WATER
                grid[idx] = EMPTY
                break
              }
            }
          }
        }
      }
    }

    const draw = () => {
      const data = image.data
      for (let i = 0; i < grid.length; i++) {
        const o = i * 4
        const cell = grid[i]
        if (cell === EMPTY) {
          data[o + 3] = 0
          continue
        }
        const c = COLORS[cell]
        data[o] = c[0]
        data[o + 1] = c[1]
        data[o + 2] = c[2]
        data[o + 3] = 255
      }
      ctx.putImageData(image, 0, 0)
    }

    const frame = () => {
      const p = pointerRef.current
      if (p.down) paint(p.x, p.y)
      if (runningRef.current) step()
      draw()
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)

    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
  }, [paint])

  const toGrid = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: Math.floor(((e.clientX - rect.left) / rect.width) * COLS),
      y: Math.floor(((e.clientY - rect.top) / rect.height) * ROWS),
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = toGrid(e)
    pointerRef.current = { x, y, down: true }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = toGrid(e)
    pointerRef.current.x = x
    pointerRef.current.y = y
  }
  const onPointerUp = () => { pointerRef.current.down = false }

  const clear = () => { gridRef.current.fill(EMPTY) }

  const MATERIALS: { value: Material; label: string; swatch: string }[] = [
    { value: SAND, label: t('sand'), swatch: 'rgb(214,158,74)' },
    { value: WATER, label: t('water'), swatch: 'rgb(59,130,246)' },
    { value: STONE, label: t('stone'), swatch: 'rgb(120,120,128)' },
    { value: EMPTY, label: t('eraser'), swatch: 'transparent' },
  ]

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        aria-label={t('canvasLabel')}
        role="img"
        style={{
          width: '100%',
          aspectRatio: `${COLS} / ${ROWS}`,
          display: 'block',
          borderRadius: '12px',
          border: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-panel)',
          cursor: 'crosshair',
          touchAction: 'none',
          imageRendering: 'pixelated',
        }}
      />

      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px',
        marginTop: '16px',
      }}>
        <div role="group" aria-label={t('materialLabel')} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {MATERIALS.map((m) => {
            const active = material === m.value
            return (
              <button
                key={m.label}
                type="button"
                onClick={() => setMaterial(m.value)}
                aria-pressed={active}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '7px 13px', fontSize: '13px', cursor: 'pointer',
                  borderRadius: '8px',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: active ? 'var(--bg-elevated)' : 'transparent',
                  border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border-default)'}`,
                }}
              >
                <span aria-hidden="true" style={{
                  width: '11px', height: '11px', borderRadius: '3px',
                  backgroundColor: m.swatch,
                  border: m.value === EMPTY ? '1px dashed var(--border-strong)' : 'none',
                }} />
                {m.label}
              </button>
            )
          })}
        </div>

        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          fontSize: '13px', color: 'var(--text-secondary)',
        }}>
          {t('brush')}
          <input
            type="range" min={1} max={12} value={brush}
            onChange={(e) => setBrush(Number(e.target.value))}
            style={{ accentColor: 'var(--accent-primary)' }}
          />
        </label>

        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: '7px 13px', fontSize: '13px', cursor: 'pointer',
            borderRadius: '8px', color: 'var(--text-secondary)',
            backgroundColor: 'transparent', border: '1px solid var(--border-default)',
          }}
        >
          {running ? t('pause') : t('play')}
        </button>

        <button
          type="button"
          onClick={clear}
          style={{
            padding: '7px 13px', fontSize: '13px', cursor: 'pointer',
            borderRadius: '8px', color: 'var(--text-secondary)',
            backgroundColor: 'transparent', border: '1px solid var(--border-default)',
          }}
        >
          {t('clear')}
        </button>
      </div>

      <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
        {t('hint')}
      </p>
    </div>
  )
}
