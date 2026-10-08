import { describe, expect, it } from 'vitest'
import { EDUCATION, TIMELINE } from '../../src/lib/profile'
import { renderResumeHtml } from './resume'

describe('renderResumeHtml', () => {
  const html = renderResumeHtml()

  it('lists every job and every school the site lists', () => {
    for (const { place, role } of TIMELINE) {
      expect(html).toContain(place.replace(/&/g, '&amp;'))
      expect(html).toContain(role.en.replace(/&/g, '&amp;'))
    }
    for (const { school } of EDUCATION) expect(html).toContain(school)
  })

  it('has no phone number', () => {
    expect(html).not.toMatch(/\+?1?[\s-]?\(?\d{3}\)?[\s-]\d{3}-\d{4}/)
    expect(html).not.toContain('tel:')
  })

  it('does not bring back claims the site has corrected', () => {
    for (const phrase of ['0-to-1', 'Drizzle', 'edge routing', 'data sovereignty', 'self-hosted']) {
      expect(html).not.toContain(phrase)
    }
  })
})
