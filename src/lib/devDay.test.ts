import { describe, expect, it } from 'vitest'
import { END, START, classify, isValid, newDay, score, step, workRate, type Action, type DayState, type Task } from './devDay'

/** A day with no surprises: no tasks, no meetings, a fixed dice state. */
function quiet(over: Partial<DayState> = {}): DayState {
  return {
    ...newDay(1),
    tasks: [],
    meetings: {},
    log: [],
    ...over,
    stats: { energy: 70, focus: 60, debt: 25, mood: 50, ...(over.stats ?? {}) },
  }
}

function task(over: Partial<Task> = {}): Task {
  return { id: 99, key: 'wrongKpi', kind: 'bug', effort: 2, progress: 0, due: END, reward: 10, penalty: 12, hacked: false, ...over }
}

describe('newDay', () => {
  it('starts at 09:00 with the dashboard, the export and two meetings', () => {
    const d = newDay(42)
    expect(d.hour).toBe(START)
    expect(d.tasks.map((t) => t.key)).toEqual(expect.arrayContaining(['newDashboard', 'excelExport']))
    expect(d.meetings[10]).toBe('standup')
    expect(Object.values(d.meetings)).toContain('review')
    expect(d.ending).toBeNull()
  })

  it('is the same day for the same number', () => {
    expect(newDay(7)).toEqual(newDay(7))
    const a = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => JSON.stringify(newDay(n).tasks.map((t) => t.key)))
    expect(new Set(a).size).toBeGreaterThan(1)
  })
})

describe('step', () => {
  it('moves the clock one hour per action', () => {
    expect(step(quiet(), { type: 'refactor' }).hour).toBe(START + 1)
  })

  it('does not change the input state', () => {
    const s = quiet({ tasks: [task()] })
    const copy = JSON.parse(JSON.stringify(s))
    step(s, { type: 'work', id: 99, hack: true })
    expect(s).toEqual(copy)
  })

  it('works a task forward, twice as fast the quick way, which adds debt', () => {
    const s = quiet({ tasks: [task({ effort: 10 })] })
    const careful = step(s, { type: 'work', id: 99, hack: false })
    const hack = step(s, { type: 'work', id: 99, hack: true })
    const p = (d: DayState) => d.tasks.find((t) => t.id === 99)!.progress
    expect(p(hack)).toBeCloseTo(p(careful) * 2, 9)
    expect(hack.stats.debt).toBeGreaterThan(careful.stats.debt)
  })

  it('pays the reward when a task is finished', () => {
    const s = quiet({ tasks: [task({ effort: 1, progress: 0.9, reward: 10 })] })
    const d = step(s, { type: 'work', id: 99, hack: false })
    expect(d.tasks.find((t) => t.id === 99)).toBeUndefined()
    expect(d.done).toBe(1)
    expect(d.log.some((e) => e.key === 'done' && e.task === 'wrongKpi')).toBe(true)
  })

  it('charges the penalty when a deadline passes', () => {
    const s = quiet({ tasks: [task({ due: START + 1, penalty: 12 })] })
    const d = step(s, { type: 'refactor' })
    expect(d.missed).toBe(1)
    expect(d.tasks.find((t) => t.id === 99)).toBeUndefined()
    expect(d.log.some((e) => e.key === 'missed')).toBe(true)
  })

  it('costs mood to skip a meeting, and gains some to attend', () => {
    const s = quiet({ meetings: { [START]: 'standup' } })
    const skipped = step(s, { type: 'refactor' })
    const went = step(s, { type: 'meeting' })
    expect(skipped.log.some((e) => e.key === 'skipped' && e.meeting === 'standup')).toBe(true)
    expect(went.log.some((e) => e.key === 'skipped')).toBe(false)
    expect(went.stats.mood).toBeGreaterThan(skipped.stats.mood)
  })

  it('turns the third coffee into jitters', () => {
    let d = quiet()
    d = step(d, { type: 'coffee' })
    d = step(d, { type: 'coffee' })
    d = step(d, { type: 'coffee' })
    expect(d.log.filter((e) => e.key === 'coffee')).toHaveLength(2)
    expect(d.log.filter((e) => e.key === 'jitters')).toHaveLength(1)
  })

  it('keeps every stat between 0 and 100', () => {
    let d = quiet({ stats: { energy: 95, focus: 95, debt: 5, mood: 50 } })
    d = step(d, { type: 'coffee' })
    d = step(d, { type: 'refactor' })
    for (const v of Object.values(d.stats)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    }
  })

  it('ends the day early on burnout', () => {
    const d = step(quiet({ tasks: [task({ effort: 10 })], stats: { energy: 10, focus: 60, debt: 25, mood: 50 } }), { type: 'work', id: 99, hack: true })
    expect(d.ending).toBe('burnout')
  })

  it('does not call it burnout when the energy runs out at 18:00', () => {
    const d = step(quiet({ hour: END - 1, tasks: [task({ effort: 10 })], stats: { energy: 10, focus: 60, debt: 25, mood: 60 } }), { type: 'work', id: 99, hack: true })
    expect(d.stats.energy).toBe(0)
    expect(d.ending).not.toBe('burnout')
    expect(d.log.at(-1)?.key).toBe('wrap')
  })

  it('ends the day early when the boss has had enough', () => {
    const d = step(quiet({ tasks: [task({ due: START + 1, penalty: 40 })], stats: { energy: 70, focus: 60, debt: 25, mood: 30 } }), { type: 'refactor' })
    expect(d.ending).toBe('fired')
  })

  it('ends at 18:00 and then ignores further actions', () => {
    const last = quiet({ hour: END - 1 })
    const d = step(last, { type: 'refactor' })
    expect(d.hour).toBe(END)
    expect(d.ending).not.toBeNull()
    expect(step(d, { type: 'coffee' })).toBe(d)
  })

  it('ignores actions that do not apply', () => {
    const s = quiet()
    expect(step(s, { type: 'work', id: 12345, hack: false })).toBe(s)
    expect(step(s, { type: 'meeting' })).toBe(s)
    expect(isValid(s, { type: 'coffee' })).toBe(true)
  })

  it('replays the same day for the same actions', () => {
    const plan: Action[] = [{ type: 'coffee' }, { type: 'break' }, { type: 'refactor' }, { type: 'coffee' }]
    const run = () => plan.reduce(step, newDay(3))
    expect(run()).toEqual(run())
  })

  it('always reaches an ending when played to the end', () => {
    for (let day = 1; day <= 40; day++) {
      let d = newDay(day)
      for (let i = 0; i < 20 && !d.ending; i++) {
        const t = d.tasks[0]
        d = step(d, d.meetings[d.hour] ? { type: 'meeting' } : t ? { type: 'work', id: t.id, hack: i % 2 === 0 } : { type: 'coffee' })
      }
      expect(d.ending).not.toBeNull()
      expect(d.hour).toBeLessThanOrEqual(END)
    }
  })
})

describe('workRate', () => {
  it('is faster with focus and slower when exhausted', () => {
    const base = { energy: 70, focus: 60, debt: 0, mood: 50 }
    expect(workRate({ ...base, focus: 100 }, false)).toBeGreaterThan(workRate(base, false))
    expect(workRate({ ...base, energy: 10 }, false)).toBeLessThan(workRate(base, false))
  })
})

describe('classify', () => {
  const at = (mood: number, debt: number, missed = 0) => classify({ stats: { energy: 50, focus: 50, mood, debt }, missed })
  it('names the day', () => {
    expect(at(80, 30)).toBe('legend')
    expect(at(80, 30, 1)).not.toBe('legend')
    expect(at(60, 70)).toBe('firefighter')
    expect(at(40, 40, 3)).toBe('rough')
    expect(at(40, 20)).toBe('invisible')
    expect(at(55, 45)).toBe('normal')
  })
})

describe('score', () => {
  it('rewards finished work and punishes missed deadlines', () => {
    const s = quiet()
    expect(score({ ...s, done: 3 })).toBeGreaterThan(score(s))
    expect(score({ ...s, missed: 3 })).toBeLessThan(score(s))
  })
})
