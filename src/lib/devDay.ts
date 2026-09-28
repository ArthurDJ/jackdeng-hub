/**
 * Rules for "Dev Day", the Playground's programmer simulator: one working day
 * from 09:00 to 18:00, one decision per hour.
 *
 * Four numbers, 0 to 100: energy, focus, tech debt and how the boss feels
 * about you (mood). Work moves a task forward; doing it the quick way moves
 * it twice as fast and adds debt, and debt makes incidents more likely later
 * in the day. Deadlines that pass cost mood, skipped meetings too. Energy at
 * zero ends the day early, and so does mood at zero.
 *
 * The state is plain data and `step` is pure: the random state travels in the
 * state itself, so a day number replays the same day, and tests can pin every
 * roll. Text lives in the messages files; entries here carry keys.
 */
import { mulberry32 } from './seeded'

export const START = 9
export const END = 18
const INBOX_MAX = 5

export type StatKey = 'energy' | 'focus' | 'debt' | 'mood'
export type Stats = Record<StatKey, number>

export type Kind = 'incident' | 'bug' | 'feature' | 'request'
export type TaskKey =
  | 'dbtFailed' | 'erpStuck' | 'ciRed'
  | 'wrongKpi' | 'nullCustomer'
  | 'newDashboard' | 'apiEndpoint'
  | 'excelExport' | 'accessRequest'
export type MeetingKey = 'standup' | 'review'

interface Template { kind: Kind; effort: number; window: number | 'eod'; reward: number; penalty: number }

export const TEMPLATES: Record<TaskKey, Template> = {
  dbtFailed: { kind: 'incident', effort: 2, window: 3, reward: 14, penalty: 14 },
  erpStuck: { kind: 'incident', effort: 2, window: 3, reward: 12, penalty: 12 },
  ciRed: { kind: 'incident', effort: 1, window: 2, reward: 6, penalty: 6 },
  wrongKpi: { kind: 'bug', effort: 2, window: 5, reward: 10, penalty: 8 },
  nullCustomer: { kind: 'bug', effort: 1, window: 4, reward: 6, penalty: 5 },
  newDashboard: { kind: 'feature', effort: 3, window: 'eod', reward: 20, penalty: 12 },
  apiEndpoint: { kind: 'feature', effort: 3, window: 6, reward: 14, penalty: 8 },
  excelExport: { kind: 'request', effort: 1, window: 4, reward: 6, penalty: 4 },
  accessRequest: { kind: 'request', effort: 1, window: 2, reward: 4, penalty: 3 },
}

const INCIDENTS: TaskKey[] = ['dbtFailed', 'erpStuck', 'ciRed']
const ARRIVALS: TaskKey[] = ['wrongKpi', 'nullCustomer', 'apiEndpoint', 'excelExport', 'accessRequest']

export interface Task {
  id: number
  key: TaskKey
  kind: Kind
  effort: number
  progress: number
  due: number
  reward: number
  penalty: number
  hacked: boolean
}

export type LogKey =
  | 'morning' | 'worked' | 'done' | 'doneHack' | 'coffee' | 'jitters' | 'break' | 'caught'
  | 'refactor' | 'meeting' | 'skipped' | 'missed' | 'slack' | 'arrived' | 'incident' | 'wrap'

export interface LogEntry {
  hour: number
  key: LogKey
  tone: 'good' | 'bad' | 'plain'
  task?: TaskKey
  meeting?: MeetingKey
  n?: number
}

export type Ending = 'burnout' | 'fired' | 'legend' | 'firefighter' | 'rough' | 'invisible' | 'normal'

export interface DayState {
  day: number
  rng: number
  hour: number
  stats: Stats
  tasks: Task[]
  meetings: Partial<Record<number, MeetingKey>>
  done: number
  missed: number
  coffees: number
  nextId: number
  log: LogEntry[]
  ending: Ending | null
}

export type Action =
  | { type: 'work'; id: number; hack: boolean }
  | { type: 'coffee' }
  | { type: 'break' }
  | { type: 'refactor' }
  | { type: 'meeting' }

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)))

/** A mutable working copy with its own dice, so `step` reads top to bottom. */
function draft(s: DayState) {
  const d: DayState = { ...s, stats: { ...s.stats }, tasks: s.tasks.map((t) => ({ ...t })), meetings: { ...s.meetings }, log: [...s.log] }
  const roll = () => {
    const [v, next] = mulberry32(d.rng)
    d.rng = next
    return v
  }
  return { d, roll }
}

function makeTask(d: DayState, key: TaskKey, hour: number): Task {
  const tpl = TEMPLATES[key]
  return {
    id: d.nextId++,
    key,
    kind: tpl.kind,
    effort: tpl.effort,
    progress: 0,
    due: tpl.window === 'eod' ? END : Math.min(END, hour + tpl.window),
    reward: tpl.reward,
    penalty: tpl.penalty,
    hacked: false,
  }
}

function pick<T>(xs: T[], roll: () => number): T | undefined {
  return xs.length ? xs[Math.floor(roll() * xs.length)] : undefined
}

export function newDay(day: number): DayState {
  const d: DayState = {
    day,
    rng: (Math.imul(day >>> 0, 2654435761) ^ 0x5bd1e995) >>> 0,
    hour: START,
    stats: { energy: 80, focus: 65, debt: 25, mood: 55 },
    tasks: [],
    meetings: {},
    done: 0,
    missed: 0,
    coffees: 0,
    nextId: 1,
    log: [{ hour: START, key: 'morning', tone: 'plain' }],
    ending: null,
  }
  const w = draft(d)
  w.d.tasks.push(makeTask(w.d, 'newDashboard', START), makeTask(w.d, 'excelExport', START))
  w.d.meetings[10] = 'standup'
  w.d.meetings[w.roll() < 0.5 ? 14 : 15] = 'review'
  // Half the days start with something already on fire.
  if (w.roll() < 0.5) {
    w.d.tasks.unshift(makeTask(w.d, 'dbtFailed', START))
    w.d.log.push({ hour: START, key: 'incident', tone: 'bad', task: 'dbtFailed' })
  }
  return w.d
}

/** How much one hour of work moves a task: focus helps, exhaustion hurts. */
export function workRate(stats: Stats, hack: boolean): number {
  const base = (0.75 + stats.focus / 160) * (stats.energy < 25 ? 0.6 : 1)
  return hack ? base * 2 : base
}

export function isValid(s: DayState, a: Action): boolean {
  if (s.ending) return false
  if (a.type === 'work') return s.tasks.some((t) => t.id === a.id)
  if (a.type === 'meeting') return s.meetings[s.hour] !== undefined
  return true
}

export function step(state: DayState, action: Action): DayState {
  if (!isValid(state, action)) return state
  const { d, roll } = draft(state)
  const h = d.hour
  const st = d.stats
  const log = (e: Omit<LogEntry, 'hour'>, hour = h) => d.log.push({ hour, ...e })

  switch (action.type) {
    case 'work': {
      const task = d.tasks.find((t) => t.id === action.id)!
      task.progress += workRate(st, action.hack)
      st.energy -= action.hack ? 11 : 8
      st.focus -= 4
      if (action.hack) { st.debt += 7; task.hacked = true }
      if (task.progress >= task.effort - 1e-9) {
        d.tasks = d.tasks.filter((t) => t !== task)
        d.done++
        st.mood += task.reward
        log({ key: task.hacked ? 'doneHack' : 'done', tone: 'good', task: task.key, n: task.reward })
      } else {
        log({ key: 'worked', tone: 'plain', task: task.key, n: Math.round((task.progress / task.effort) * 100) })
      }
      break
    }
    case 'coffee':
      d.coffees++
      if (d.coffees <= 2) {
        st.energy += 20; st.focus += 8
        log({ key: 'coffee', tone: 'good', n: d.coffees })
      } else {
        st.energy += 8; st.focus -= 12
        log({ key: 'jitters', tone: 'bad', n: d.coffees })
      }
      break
    case 'break':
      st.energy += 10; st.focus += 20
      if (roll() < 0.3) { st.mood -= 7; log({ key: 'caught', tone: 'bad' }) }
      else log({ key: 'break', tone: 'good' })
      break
    case 'refactor':
      st.debt -= 20; st.energy -= 8; st.focus -= 4; st.mood -= 2
      log({ key: 'refactor', tone: 'plain' })
      break
    case 'meeting':
      st.energy -= 4; st.focus -= 6; st.mood += 5
      log({ key: 'meeting', tone: 'plain', meeting: d.meetings[h] })
      delete d.meetings[h]
      break
  }

  const skipped = d.meetings[h]
  if (skipped) {
    st.mood -= 9
    log({ key: 'skipped', tone: 'bad', meeting: skipped })
    delete d.meetings[h]
  }

  // The hour passes.
  st.energy -= 2
  d.hour = h + 1
  const now = d.hour

  for (const t of d.tasks.filter((t) => t.due <= now)) {
    d.missed++
    st.mood -= t.penalty
    log({ key: 'missed', tone: 'bad', task: t.key, n: t.penalty }, now)
  }
  d.tasks = d.tasks.filter((t) => t.due > now)

  if (now < END) {
    if (roll() < 0.25) { st.focus -= 10; log({ key: 'slack', tone: 'bad' }, now) }
    const open = new Set(d.tasks.map((t) => t.key))
    // Debt is what turns a quiet afternoon into an incident.
    if (d.tasks.length < INBOX_MAX && roll() < 0.015 + st.debt / 350) {
      const key = pick(INCIDENTS.filter((k) => !open.has(k)), roll)
      if (key) { d.tasks.unshift(makeTask(d, key, now)); open.add(key); log({ key: 'incident', tone: 'bad', task: key }, now) }
    }
    // New work stops arriving after 14:00; what is left is the endgame.
    if (now <= 14 && d.tasks.length < INBOX_MAX && roll() < 0.22) {
      const key = pick(ARRIVALS.filter((k) => !open.has(k)), roll)
      if (key) { d.tasks.push(makeTask(d, key, now)); log({ key: 'arrived', tone: 'plain', task: key }, now) }
    }
  }

  for (const k of Object.keys(st) as StatKey[]) st[k] = clamp(st[k])

  // Running out of energy only ends the day before 18:00; at 18:00 you have
  // made it to the end, however tired.
  if (st.mood <= 0) d.ending = 'fired'
  else if (st.energy <= 0 && now < END) d.ending = 'burnout'
  else if (now >= END) { d.ending = classify(d); log({ key: 'wrap', tone: 'plain' }, now) }
  return d
}

/** How a day that reached 18:00 is remembered. */
export function classify(s: Pick<DayState, 'stats' | 'missed'>): Ending {
  const { mood, debt } = s.stats
  if (mood >= 75 && debt <= 35 && s.missed === 0) return 'legend'
  if (mood >= 55 && debt >= 60) return 'firefighter'
  if (s.missed >= 3) return 'rough'
  if (debt <= 25 && mood < 50) return 'invisible'
  return 'normal'
}

export function score(s: DayState): number {
  return Math.max(0, Math.round(s.stats.mood + (100 - s.stats.debt) / 2 + s.done * 6 - s.missed * 8))
}
