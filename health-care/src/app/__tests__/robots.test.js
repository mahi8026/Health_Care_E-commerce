/**
 * Unit tests for the robots.txt generator.
 *
 * Validates: Requirements 7.4, 7.5
 */

import robots from '../robots'
import { SITE_CONFIG } from '@/config/seo'

describe('robots()', () => {
  let result

  beforeEach(() => {
    result = robots()
  })

  // -------------------------------------------------------------------------
  // Return shape
  // -------------------------------------------------------------------------

  it('returns an object with rules and sitemap properties', () => {
    expect(result).toHaveProperty('rules')
    expect(result).toHaveProperty('sitemap')
  })

  it('rules is a non-empty array', () => {
    expect(Array.isArray(result.rules)).toBe(true)
    expect(result.rules.length).toBeGreaterThan(0)
  })

  // -------------------------------------------------------------------------
  // Disallow directives — Requirement 7.4
  // -------------------------------------------------------------------------

  describe('disallow directives', () => {
    let disallowedPaths

    beforeEach(() => {
      // Collect all disallowed paths across all rules
      disallowedPaths = result.rules.flatMap((rule) =>
        Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow].filter(Boolean)
      )
    })

    it('disallows /admin', () => {
      expect(disallowedPaths).toContain('/admin')
    })

    it('disallows the private /b2b/dashboard but keeps /b2b crawlable', () => {
      // /b2b is the PUBLIC B2B marketing landing page (indexed, earns GSC
      // impressions) — it must stay crawlable. Only the private dashboard is
      // blocked.
      expect(disallowedPaths).toContain('/b2b/dashboard')
      expect(disallowedPaths).not.toContain('/b2b')
    })

    it('disallows /checkout', () => {
      expect(disallowedPaths).toContain('/checkout')
    })

    it('disallows /cart', () => {
      expect(disallowedPaths).toContain('/cart')
    })

    it('disallows /api/*', () => {
      expect(disallowedPaths).toContain('/api/*')
    })

    it('applies rules to all user agents (*)', () => {
      const wildcardRule = result.rules.find((r) => r.userAgent === '*')
      expect(wildcardRule).toBeDefined()
    })

    it('allows the root path / for all user agents', () => {
      const wildcardRule = result.rules.find((r) => r.userAgent === '*')
      expect(wildcardRule).toBeDefined()
      expect(wildcardRule.allow).toBe('/')
    })
  })

  // -------------------------------------------------------------------------
  // Sitemap directive — Requirement 7.5
  // -------------------------------------------------------------------------

  describe('sitemap directive', () => {
    it('includes the sitemap URL', () => {
      expect(result.sitemap).toBeTruthy()
    })

    it('points to the correct sitemap URL', () => {
      // Assert against SITE_CONFIG so the test holds for any canonical origin
      // (localhost in tests, https://www.mediportbd.com in production).
      expect(result.sitemap).toBe(`${SITE_CONFIG.url}/sitemap.xml`)
    })

    it('sitemap URL is a valid HTTPS URL', () => {
      expect(result.sitemap).toMatch(/^https:\/\//)
    })

    it('sitemap URL ends with /sitemap.xml', () => {
      expect(result.sitemap).toMatch(/\/sitemap\.xml$/)
    })
  })

  // -------------------------------------------------------------------------
  // Idempotency — calling robots() multiple times returns consistent output
  // -------------------------------------------------------------------------

  it('returns the same output on repeated calls', () => {
    const first = robots()
    const second = robots()
    expect(first).toEqual(second)
  })
})
