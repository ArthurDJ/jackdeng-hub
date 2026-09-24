import { describe, expect, it } from 'vitest'
import { toJsonLd } from './jsonLd'
import { PROFILE_LINKS, personJsonLd } from './profile'

describe('toJsonLd', () => {
  it('cannot close the script tag it sits in', () => {
    const out = toJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(out).not.toContain('</script>')
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>')
  })
})

describe('personJsonLd', () => {
  const person = personJsonLd('https://www.jackdeng.cc', 'en', 'Full-Stack Engineer · Backend & Data')

  it('links the profiles a search engine can match, and nothing else', () => {
    expect(person.sameAs).toEqual(
      PROFILE_LINKS.filter((l) => ['GitHub', 'LinkedIn', 'LeetCode'].includes(l.label)).map((l) => l.href),
    )
    expect(person.sameAs.some((u) => u.startsWith('mailto:') || u.endsWith('.pdf'))).toBe(false)
  })

  it('does not claim a job title or publish an email address', () => {
    expect(person).not.toHaveProperty('jobTitle')
    expect(person).not.toHaveProperty('email')
  })

  it('carries the headline and the current employer', () => {
    expect(person.description).toBe('Full-Stack Engineer · Backend & Data')
    expect(person.worksFor.name).toBe('Value Windows & Doors')
    expect(person.knowsAbout.length).toBeGreaterThan(10)
  })
})
