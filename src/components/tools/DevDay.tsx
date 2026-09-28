'use client'

import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  END, START, score, step, newDay, workRate,
  type Action, type DayState, type Kind, type LogEntry, type StatKey, type Task,
} from '@/lib/devDay'

/**
 * Dev Day: a programmer simulator. One working day, one decision an hour;
 * the rules are in src/lib/devDay.ts and this file only draws them.
 *
 * The day starts on a button rather than on load, so the server has nothing
 * random to render and the page hydrates without a mismatch. The best score
 * is kept in localStorage, which may be unavailable; the game does not need it.
 */

const BEST_KEY = 'jd-devday-best'

const STAT_RGB: Record<StatKey, string> = {
  energy: '74 222 128',
  focus: '77 143 248',
  debt: '239 98 98',
  mood: '245 180 70',
}
const KIND_RGB: Record<Kind, string> = {
  incident: '239 98 98',
  bug: '245 158 11',
  feature: '77 143 248',
  request: '148 148 160',
}
const STATS: StatKey[] = ['energy', 'focus', 'debt', 'mood']

const clock = (h: number) => `${String(h).padStart(2, '0')}:00`

function readBest(): number | null {
  try {
    const v = window.localStorage.getItem(BEST_KEY)
    return v ? Number(v) : null
  } catch {
    return null
  }
}

function saveBest(n: number) {
  try { window.localStorage.setItem(BEST_KEY, String(n)) } catch { /* private mode */ }
}

export function DevDay() {
  const t = useTranslations('tools.devDay')
  const [day, setDay] = useState<DayState | null>(null)
  const [best, setBest] = useState<number | null>(null)
  const [announce, setAnnounce] = useState('')

  useEffect(() => { setBest(readBest()) }, [])

  const line = (e: LogEntry) => t(`log.${e.key}`, {
    task: e.task ? t(`tasks.${e.task}`) : '',
    meeting: e.meeting ? t(`meetings.${e.meeting}`) : '',
    n: e.n ?? 0,
  })

  const begin = (n: number) => {
    const d = newDay(n)
    setDay(d)
    setAnnounce(d.log.map(line).join(' '))
  }

  const act = (a: Action) => {
    if (!day) return
    const next = step(day, a)
    if (next === day) return
    setDay(next)
    setAnnounce(next.log.slice(day.log.length).map(line).join(' '))
    if (next.ending) {
      const s = score(next)
      if (best === null || s > best) { setBest(s); saveBest(s) }
    }
  }

  const btn = (tone: 'plain' | 'primary' | 'warn' = 'plain'): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '7px 12px', fontSize: '13px', cursor: 'pointer', borderRadius: '8px',
    color: tone === 'primary' ? '#ffffff' : 'var(--text-secondary)',
    backgroundColor: tone === 'primary' ? 'var(--accent-solid)' : 'transparent',
    border: `1px solid ${tone === 'primary' ? 'transparent' : tone === 'warn' ? 'rgb(245 158 11 / 0.55)' : 'var(--border-default)'}`,
  })
  const panel: React.CSSProperties = {
    background: 'var(--bg-panel)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 20,
  }
  const mono: React.CSSProperties = { fontFamily: 'var(--font-geist-mono, ui-monospace, monospace)' }
  const label: React.CSSProperties = { fontSize: 11, fontWeight: 510, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }

  if (!day) {
    return (
      <div style={{ ...panel, padding: 28 }}>
        <p style={{ ...mono, fontSize: 40, fontWeight: 590, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 16 }}>{clock(START)}</p>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>{t('intro')}</p>
        <ul style={{ margin: '0 0 20px', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(['rule1', 'rule2', 'rule3'] as const).map((k) => (
            <li key={k} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, listStyle: 'disc' }}>{t(k)}</li>
          ))}
        </ul>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => begin(1 + Math.floor(Math.random() * 9999))} style={btn('primary')}>{t('start')}</button>
          {best !== null && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t('best', { n: best })}</span>}
        </div>
      </div>
    )
  }

  const rate = workRate(day.stats, false)
  const meeting = day.meetings[day.hour]
  const schedule = Object.entries(day.meetings)
    .map(([h, m]) => ({ h: Number(h), m: m! }))
    .filter((x) => x.h >= day.hour)
    .sort((a, b) => a.h - b.h)
  const recent = [...day.log].reverse().slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p className="sr-only" aria-live="polite">{announce}</p>

      {/* ── Clock and the four numbers ── */}
      <div style={{ ...panel, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
        <div style={{ minWidth: 120 }}>
          <p style={{ ...mono, fontSize: 36, fontWeight: 590, color: 'var(--text-primary)', lineHeight: 1 }}>{clock(day.hour)}</p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
            {t('day', { n: day.day })} · {day.ending ? t('offWork') : t('hoursLeft', { n: END - day.hour })}
          </p>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4" style={{ flex: 1, minWidth: 240, gap: 14, margin: 0 }}>
          {STATS.map((k) => (
            <div key={k}>
              <dt style={{ display: 'flex', justifyContent: 'space-between', ...label }}>
                <span>{t(`stats.${k}`)}</span>
                <span style={{ ...mono, color: 'var(--text-secondary)' }}>{day.stats[k]}</span>
              </dt>
              <dd style={{ margin: '6px 0 0', height: 6, borderRadius: 9999, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                <div style={{
                  width: `${day.stats[k]}%`, height: '100%', borderRadius: 9999,
                  background: `rgb(${STAT_RGB[k]})`, transition: 'width 300ms var(--ease-default)',
                }} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {day.ending ? (
        <Ending day={day} best={best} t={t} panel={panel} btn={btn} mono={mono} onAgain={() => begin(1 + Math.floor(Math.random() * 9999))} onReplay={() => begin(day.day)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-[1fr_280px]">
          {/* ── Inbox ── */}
          <section style={panel} aria-labelledby="devday-inbox">
            <h2 id="devday-inbox" style={{ ...label, marginBottom: 12 }}>{t('inbox')}</h2>
            {day.tasks.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{t('inboxEmpty')}</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {day.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} hour={day.hour} rate={rate} t={t} btn={btn} mono={mono} onWork={(hack) => act({ type: 'work', id: task.id, hack })} />
                ))}
              </ul>
            )}
          </section>

          {/* ── This hour: above the inbox on a phone, so a meeting is not missed below the fold ── */}
          <section className="order-first md:order-last" style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 14 }} aria-labelledby="devday-hour">
            <h2 id="devday-hour" style={label}>{t('thisHour')}</h2>
            {meeting && (
              <div style={{ padding: 12, borderRadius: 8, border: '1px solid rgb(245 180 70 / 0.5)', background: 'rgb(245 180 70 / 0.1)' }}>
                <p style={{ fontSize: 13, fontWeight: 510, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {clock(day.hour)} {t(`meetingTitles.${meeting}`)}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>{t('skipWarn')}</p>
                <button type="button" onClick={() => act({ type: 'meeting' })} style={{ ...btn('primary'), width: '100%' }}>{t('attend')}</button>
              </div>
            )}
            <div style={{ display: 'grid', gap: 8 }}>
              <button type="button" onClick={() => act({ type: 'coffee' })} style={btn()}>☕ {t('coffee')}</button>
              <button type="button" onClick={() => act({ type: 'break' })} style={btn()}>🚶 {t('break')}</button>
              <button type="button" onClick={() => act({ type: 'refactor' })} style={btn()}>🧹 {t('refactor')}</button>
            </div>
            {schedule.length > 0 && (
              <div>
                <p style={{ ...label, marginBottom: 6 }}>{t('schedule')}</p>
                {schedule.map((x) => (
                  <p key={x.h} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    <span style={mono}>{clock(x.h)}</span> {t(`meetingTitles.${x.m}`)}
                  </p>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── What happened ── */}
      <section style={panel} aria-labelledby="devday-log">
        <h2 id="devday-log" style={{ ...label, marginBottom: 10 }}>{t('logTitle')}</h2>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {recent.map((e, i) => (
            <li key={day.log.length - i} style={{ display: 'flex', gap: 10, fontSize: 13, lineHeight: 1.6, opacity: i === 0 ? 1 : 0.8 }}>
              <span style={{ ...mono, fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }}>{clock(e.hour)}</span>
              <span style={{ color: e.tone === 'good' ? 'rgb(74 190 120)' : e.tone === 'bad' ? 'rgb(229 90 90)' : 'var(--text-secondary)' }}>{line(e)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

type T = ReturnType<typeof useTranslations<'tools.devDay'>>
type Btn = (tone?: 'plain' | 'primary' | 'warn') => React.CSSProperties

function TaskRow({ task, hour, rate, t, btn, mono, onWork }: {
  task: Task; hour: number; rate: number; t: T; btn: Btn; mono: React.CSSProperties; onWork: (hack: boolean) => void
}) {
  const left = task.effort - task.progress
  const hours = Math.ceil(left / rate - 1e-9)
  const late = hours > task.due - hour
  return (
    <li style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 11, fontWeight: 510, padding: '1px 8px', borderRadius: 9999,
          color: `rgb(${KIND_RGB[task.kind]})`, border: `1px solid rgb(${KIND_RGB[task.kind]} / 0.5)`, background: `rgb(${KIND_RGB[task.kind]} / 0.1)`,
        }}>
          {t(`kinds.${task.kind}`)}
        </span>
        <span style={{ fontSize: 14, fontWeight: 510, color: 'var(--text-primary)' }}>{t(`tasks.${task.key}`)}</span>
      </div>
      <p style={{ fontSize: 12, color: late ? 'rgb(229 90 90)' : 'var(--text-tertiary)', marginBottom: 8 }}>
        <span style={mono}>{t('due', { time: clock(task.due) })}</span> · {t('left', { n: hours })}
        {late && <> · {t('atRisk')}</>}
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((task.progress / task.effort) * 100)}
        aria-label={t(`tasks.${task.key}`)}
        style={{ height: 4, borderRadius: 9999, background: 'var(--bg-elevated)', overflow: 'hidden', marginBottom: 10 }}
      >
        <div style={{ width: `${Math.min(100, (task.progress / task.effort) * 100)}%`, height: '100%', background: `rgb(${KIND_RGB[task.kind]})`, transition: 'width 300ms var(--ease-default)' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => onWork(false)} style={btn()}>{t('careful')}</button>
        <button type="button" onClick={() => onWork(true)} style={btn('warn')} title={t('hackHint')}>
          {t('hack')} <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{t('hackHint')}</span>
        </button>
      </div>
    </li>
  )
}

function Ending({ day, best, t, panel, btn, mono, onAgain, onReplay }: {
  day: DayState; best: number | null; t: T; panel: React.CSSProperties; btn: Btn; mono: React.CSSProperties
  onAgain: () => void; onReplay: () => void
}) {
  const s = score(day)
  const e = day.ending!
  return (
    <section style={{ ...panel, padding: 28 }} aria-labelledby="devday-end">
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>{t('endingLabel')}</p>
      <h2 id="devday-end" style={{ fontSize: 24, fontWeight: 590, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 10 }}>
        {t(`endings.${e}.title`)}
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>{t(`endings.${e}.text`)}</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
        <span style={{ ...mono, fontSize: 20, fontWeight: 590, color: 'var(--text-primary)', marginRight: 10 }}>{t('score', { n: s })}</span>
        {t('summary', { done: day.done, missed: day.missed, coffees: day.coffees })}
        {best !== null && <> · {t('best', { n: best })}</>}
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" onClick={onAgain} style={btn('primary')}>{t('again')}</button>
        <button type="button" onClick={onReplay} style={btn()}>{t('replay', { n: day.day })}</button>
      </div>
    </section>
  )
}
