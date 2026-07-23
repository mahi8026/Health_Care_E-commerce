/**
 * Unit tests for the sitemap generator.
 *
 * Validates: Requirements 7.1, 7.2, 7.6
 */

import sitemap from '../sitemap'

// Mock the siteConfig so tests are not coupled to the real domain value
jest.mock('@/config/seo', () => ({
  siteConfig: {
    url: 'https://MediportBD.com',
  },
}))

// Mock fetchProducts so tests run without a real backend
jest.mock('@/utils/serverFetch', () => ({
  fetchProducts: jest.fn(),
}))

import { fetchProducts } from '@/utils/serverFetch'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE = 'https://MediportBD.com'

/** URLs that must always appear in the sitemap (static public pages). */
const REQUIRED_STATIC_URLS = [
  BASE,
  `${BASE}/search`,
  `${BASE}/reagent-store`,
  `${BASE}/mobile-app`,
  `${BASE}/login`,
  `${BASE}/register`,
]

/** Paths that must NEVER appear in the sitemap. */
const EXCLUDED_PATHS = ['/admin', '/b2b', '/checkout', '/cart', '/api']

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('sitemap()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // Static pages — Requirement 7.1
  // -------------------------------------------------------------------------

  describe('static pages', () => {
    beforeEach(() => {
      fetchProducts.mockResolvedValue([])
    })

    it('includes all required static page URLs', async () => {
      const entries = await sitemap()
      const urls = entries.map((e) => e.url)

      for (const expected of REQUIRED_STATIC_URLS) {
        expect(urls).toContain(expected)
      }
    })

    it('does not include admin, b2b, checkout, cart, or api paths', async () => {
      const entries = await sitemap()
      const urls = entries.map((e) => e.url)

      for (const excluded of EXCLUDED_PATHS) {
        const match = urls.find((u) => u.includes(excluded))
        expect(match).toBeUndefined()
      }
    })

    it('assigns changeFrequency and priority to every static entry', async () => {
      const entries = await sitemap()
      // Filter to only static entries (no product pages when fetchProducts returns [])
      for (const entry of entries) {
        expect(entry).toHaveProperty('changeFrequency')
        expect(entry).toHaveProperty('priority')
        expect(typeof entry.priority).toBe('number')
      }
    })

    it('gives the homepage the highest priority of 1.0', async () => {
      const entries = await sitemap()
      const home = entries.find((e) => e.url === BASE)
      expect(home).toBeDefined()
      expect(home.priority).toBe(1.0)
    })
  })

  // -------------------------------------------------------------------------
  // Product pages — Requirement 7.2
  // -------------------------------------------------------------------------

  describe('product pages', () => {
    const mockProducts = [
      { _id: 'prod-1', updatedAt: '2024-01-15T10:00:00.000Z' },
      { _id: 'prod-2', updatedAt: '2024-02-20T12:00:00.000Z' },
      { _id: 'prod-3' }, // no updatedAt — should fall back to current date
    ]

    beforeEach(() => {
      fetchProducts.mockResolvedValue(mockProducts)
    })

    it('includes a URL entry for every product returned by fetchProducts', async () => {
      const entries = await sitemap()
      const urls = entries.map((e) => e.url)

      for (const product of mockProducts) {
        expect(urls).toContain(`${BASE}/products/${product._id}`)
      }
    })

    it('sets lastModified to the product updatedAt date when available', async () => {
      const entries = await sitemap()
      const prod1Entry = entries.find((e) => e.url === `${BASE}/products/prod-1`)

      expect(prod1Entry).toBeDefined()
      expect(prod1Entry.lastModified).toBeInstanceOf(Date)
      expect(prod1Entry.lastModified.toISOString()).toBe('2024-01-15T10:00:00.000Z')
    })

    it('falls back to current date for products without updatedAt', async () => {
      const before = new Date()
      const entries = await sitemap()
      const after = new Date()

      const prod3Entry = entries.find((e) => e.url === `${BASE}/products/prod-3`)
      expect(prod3Entry).toBeDefined()
      expect(prod3Entry.lastModified).toBeInstanceOf(Date)
      expect(prod3Entry.lastModified.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(prod3Entry.lastModified.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('assigns changeFrequency "weekly" and priority 0.7 to product entries', async () => {
      const entries = await sitemap()
      const productEntries = entries.filter((e) => e.url.includes('/products/'))

      for (const entry of productEntries) {
        expect(entry.changeFrequency).toBe('weekly')
        expect(entry.priority).toBe(0.7)
      }
    })

    it('returns static pages plus product pages when products are available', async () => {
      const entries = await sitemap()
      const urls = entries.map((e) => e.url)

      // All static pages present
      for (const expected of REQUIRED_STATIC_URLS) {
        expect(urls).toContain(expected)
      }

      // All product pages present
      for (const product of mockProducts) {
        expect(urls).toContain(`${BASE}/products/${product._id}`)
      }
    })
  })

  // -------------------------------------------------------------------------
  // Error handling — Requirement 7.1 (graceful degradation), 7.6
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('returns only static pages when fetchProducts throws an error', async () => {
      fetchProducts.mockRejectedValue(new Error('Database connection failed'))

      const entries = await sitemap()
      const urls = entries.map((e) => e.url)

      // Static pages must still be present
      for (const expected of REQUIRED_STATIC_URLS) {
        expect(urls).toContain(expected)
      }

      // No product pages should appear
      const productEntries = entries.filter((e) => e.url.includes('/products/'))
      expect(productEntries).toHaveLength(0)
    })

    it('does not throw when fetchProducts rejects', async () => {
      fetchProducts.mockRejectedValue(new Error('Network timeout'))

      await expect(sitemap()).resolves.not.toThrow()
    })

    it('returns a non-empty array even when the database is unavailable', async () => {
      fetchProducts.mockRejectedValue(new Error('DB unavailable'))

      const entries = await sitemap()
      expect(entries.length).toBeGreaterThan(0)
    })
  })
})
