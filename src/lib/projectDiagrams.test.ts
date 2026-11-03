import { describe, expect, it } from 'vitest'
import en from '../i18n/messages/en.json'
import zh from '../i18n/messages/zh.json'
import { PROJECT_DIAGRAMS, cardStages, diagramMessageKeys, diagramNamespace, projectDiagram } from './projectDiagrams'

// i18n:check only compares the two files with each other; it can't see that a
// box id here has no text there, which renders as the raw key on the page.
const flatten = (o: object, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  )

describe('project diagrams', () => {
  for (const [locale, messages] of [['en', en.projectDiagrams], ['zh', zh.projectDiagrams]] as const) {
    it(`every diagram's text is in ${locale}.json, and nothing else is`, () => {
      const used = Object.entries(PROJECT_DIAGRAMS).flatMap(([slug, stages]) => diagramMessageKeys(slug, stages))
      const present = flatten(messages).filter((k) => k !== 'caption')
      expect(present.sort()).toEqual([...new Set(used)].sort())
    })
  }

  it('marks exactly one stage as the project itself', () => {
    for (const [slug, stages] of Object.entries(PROJECT_DIAGRAMS)) {
      expect(stages.filter((s) => s.self), slug).toHaveLength(1)
    }
  })

  it('leaves card: false stages off the card only', () => {
    const stages = projectDiagram('b2b-customer-portal')!
    expect(stages.some((s) => 'box' in s && s.box.id === 'proxy')).toBe(true)
    expect(cardStages(stages).some((s) => 'box' in s && s.box.id === 'proxy')).toBe(false)
  })

  it('reads its text from a camelCase namespace, like every other message key', () => {
    expect(diagramNamespace('b2b-customer-portal')).toBe('b2bCustomerPortal')
    expect(diagramNamespace('jackdeng-hub')).toBe('jackdengHub')
    expect(Object.keys(en.projectDiagrams).filter((k) => k.includes('-'))).toEqual([])
  })

  it('has nothing for an unknown or missing slug', () => {
    expect(projectDiagram('no-such-project')).toBeNull()
    expect(projectDiagram(null)).toBeNull()
  })
})
