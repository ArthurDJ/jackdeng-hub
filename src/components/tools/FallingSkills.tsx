'use client'

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type Matter from 'matter-js'
import { SKILLS } from '@/lib/profile'
import { groupColour, spawnPoints, type Point, type Size } from '@/lib/skillDrop'

/**
 * The skills from the About page as physics bodies: they drop into a box when
 * it scrolls into view, and can be picked up and thrown. The idea is React
 * Bits' Falling Text; the physics is matter-js (MIT), loaded only once the
 * box is on screen, so it never reaches another page or an idle visitor.
 *
 * The pills stay DOM text, not canvas, so they are readable and selectable
 * and the server can render them. Before physics starts (no JavaScript yet,
 * or reduced motion) they sit wrapped at the bottom of the box; with reduced
 * motion nothing drops until the visitor presses the button.
 *
 * Dragging is a constraint between the pointer and the body rather than
 * matter-js's MouseConstraint, which calls preventDefault on wheel and touch
 * events and would stop the page scrolling over the box.
 */

type Engine = Matter.Engine
type Body = Matter.Body

const STEP = 1000 / 60
const PILLS = SKILLS.flatMap((g, group) => g.items.map((label) => ({ label, group })))

export function FallingSkills() {
  const t = useTranslations('tools.skills')
  const locale = useLocale() as 'en' | 'zh'
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(false)

  const boxRef = useRef<HTMLUListElement>(null)
  const pillRefs = useRef<(HTMLLIElement | null)[]>([])
  const sizes = useRef<Size[]>([])
  const spawn = useRef<Point[]>([])
  const world = useRef<{
    M: typeof Matter
    engine: Engine
    bodies: Body[]
    walls: Body[]
    drag: Matter.Constraint | null
  } | null>(null)
  const raf = useRef<number | undefined>(undefined)
  const last = useRef(0)
  const lag = useRef(0)
  const visible = useRef(true)
  const starting = useRef(false)

  const place = useCallback(() => {
    const w = world.current
    if (!w) return
    w.bodies.forEach((b, i) => {
      const el = pillRefs.current[i]
      const s = sizes.current[i]
      if (el && s) el.style.transform = `translate(${b.position.x - s.w / 2}px, ${b.position.y - s.h / 2}px) rotate(${b.angle}rad)`
    })
  }, [])

  // Fixed 60 Hz steps, however fast the display refreshes, so the fall looks
  // the same on a 120 Hz screen. A long gap (a background tab) is dropped
  // rather than replayed.
  const loop = useCallback((now: number) => {
    const w = world.current
    if (!w) return
    lag.current = Math.min(lag.current + (last.current ? now - last.current : 0), 100)
    last.current = now
    while (lag.current >= STEP) {
      w.M.Engine.update(w.engine, STEP)
      lag.current -= STEP
    }
    place()
    raf.current = visible.current ? requestAnimationFrame(loop) : undefined
  }, [place])

  const resume = useCallback(() => {
    if (raf.current !== undefined) return
    last.current = 0
    raf.current = requestAnimationFrame(loop)
  }, [loop])

  const layWalls = useCallback(() => {
    const w = world.current
    const box = boxRef.current
    if (!w || !box) return
    const { Bodies, Composite } = w.M
    const W = box.clientWidth
    const H = box.clientHeight
    const T = 200
    if (w.walls.length) Composite.remove(w.engine.world, w.walls)
    // Tall side walls, so pills thrown upward come back down inside the box.
    w.walls = [
      Bodies.rectangle(W / 2, H + T / 2, W + 2 * T, T, { isStatic: true }),
      Bodies.rectangle(-T / 2, H / 2 - H * 2, T, H * 6, { isStatic: true }),
      Bodies.rectangle(W + T / 2, H / 2 - H * 2, T, H * 6, { isStatic: true }),
    ]
    Composite.add(w.engine.world, w.walls)
  }, [])

  const drop = useCallback(() => {
    const w = world.current
    const box = boxRef.current
    if (!w || !box) return
    const points = spawnPoints(sizes.current, box.clientWidth)
    w.bodies.forEach((b, i) => {
      w.M.Body.setPosition(b, points[i])
      w.M.Body.setAngle(b, (Math.random() - 0.5) * 0.6)
      w.M.Body.setVelocity(b, { x: 0, y: 0 })
      w.M.Body.setAngularVelocity(b, 0)
    })
  }, [])

  const start = useCallback(async () => {
    const box = boxRef.current
    if (world.current || starting.current || !box) return
    starting.current = true
    setLoading(true)
    const M = (await import('matter-js')).default
    // Measured while the pills are still wrapped in normal flow.
    sizes.current = pillRefs.current.map((el) => ({ w: el?.offsetWidth ?? 60, h: el?.offsetHeight ?? 30 }))
    spawn.current = spawnPoints(sizes.current, box.clientWidth)
    const engine = M.Engine.create()
    engine.gravity.y = 1
    const bodies = sizes.current.map((s, i) => M.Bodies.rectangle(spawn.current[i].x, spawn.current[i].y, s.w, s.h, {
      chamfer: { radius: s.h / 2 },
      restitution: 0.3,
      friction: 0.2,
      frictionAir: 0.012,
      angle: (Math.random() - 0.5) * 0.6,
    }))
    M.Composite.add(engine.world, bodies)
    world.current = { M, engine, bodies, walls: [], drag: null }
    layWalls()
    starting.current = false
    setLive(true)
    setLoading(false)
  }, [layWalls])

  // After the switch to absolute positioning, place the pills before the
  // browser paints so none flashes at the top-left corner.
  useLayoutEffect(() => {
    if (!live) return
    place()
    resume()
    return () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current)
      raf.current = undefined
    }
  }, [live, place, resume])

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting
      if (!e.isIntersecting) return
      if (!world.current) { if (!reduced) void start(); return }
      resume()
    }, { threshold: 0.35 })
    io.observe(box)
    let width = box.clientWidth
    const ro = new ResizeObserver(() => {
      if (box.clientWidth === width) return
      width = box.clientWidth
      layWalls()
      // Anything now outside the narrower box comes back in from above.
      const w = world.current
      w?.bodies.forEach((b, i) => {
        const s = sizes.current[i]
        if (b.position.x + s.w / 2 > width) w.M.Body.setPosition(b, { x: width - s.w / 2, y: -s.h })
      })
    })
    ro.observe(box)
    return () => {
      io.disconnect()
      ro.disconnect()
      const w = world.current
      if (w) { w.M.Engine.clear(w.engine); w.M.Composite.clear(w.engine.world, false) }
      world.current = null
    }
  }, [start, resume, layWalls])

  const toBox = (e: React.PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onPointerDown = (i: number) => (e: React.PointerEvent<HTMLLIElement>) => {
    const w = world.current
    if (!w) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toBox(e)
    const body = w.bodies[i]
    w.drag = w.M.Constraint.create({
      pointA: p,
      bodyB: body,
      pointB: { x: p.x - body.position.x, y: p.y - body.position.y },
      stiffness: 0.18,
      damping: 0.08,
      length: 0,
    })
    w.M.Composite.add(w.engine.world, w.drag)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLLIElement>) => {
    const d = world.current?.drag
    if (d) d.pointA = toBox(e)
  }
  const onPointerUp = () => {
    const w = world.current
    if (w?.drag) { w.M.Composite.remove(w.engine.world, w.drag); w.drag = null }
  }

  const shake = () => {
    const w = world.current
    if (!w) { void start(); return }
    for (const b of w.bodies) {
      w.M.Body.setVelocity(b, { x: (Math.random() - 0.5) * 14, y: -8 - Math.random() * 10 })
      w.M.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.3)
    }
  }

  const btn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '7px 13px', fontSize: '13px', cursor: 'pointer', borderRadius: '8px',
    color: 'var(--text-secondary)', backgroundColor: 'transparent',
    border: '1px solid var(--border-default)',
  }

  return (
    <div>
      <ul ref={boxRef} className="ds-skills-box" data-live={live ? '' : undefined} aria-label={t('boxLabel')}>
        {PILLS.map((p, i) => (
          <li
            key={p.label}
            ref={(el) => { pillRefs.current[i] = el }}
            className="ds-skill"
            style={{ ['--skill-rgb' as string]: groupColour(p.group) }}
            onPointerDown={onPointerDown(i)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {p.label}
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
        <button type="button" onClick={() => (world.current ? drop() : void start())} style={btn} disabled={loading}>
          {live ? t('dropAgain') : t('drop')}
        </button>
        <button type="button" onClick={shake} style={btn} disabled={loading}>{t('shake')}</button>
        <ul aria-label={t('legend')} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', listStyle: 'none', margin: 0, padding: 0 }}>
          {SKILLS.map((g, i) => (
            <li key={g.group.en} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>
              <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 3, background: `rgb(${groupColour(i)})` }} />
              {g.group[locale]}
            </li>
          ))}
        </ul>
      </div>

      <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
        {t('hint')}
      </p>
    </div>
  )
}
