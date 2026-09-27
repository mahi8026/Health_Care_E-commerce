/**
 * WS-3D.1 — Technical SEO hygiene guards.
 *
 * F-01  Products listing metadata treats every supported filter param as
 *       noindex + canonical /products (no conflicting signals with robots.txt).
 * F-05/F-13  Product image alt text never serializes objects, never embeds
 *       price, and never presents the placeholder "Generic" as a brand.
 * F-14  All category meta descriptions stay within 160 characters.
 */

import { generateProductAltText } from '@/utils/bangladeshSEO'
import { CATEGORY_SEO } from '@/config/seo'

// ── F-01: products listing generateMetadata ────────────────────────────────
jest.mock('@/views/ProductsPage', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/lib/listingData', () => ({
  fetchListing: jest.fn().mockResolvedValue({
    products: [],
    pagination: {},
    categories: [],
    brands: [],
    filters: {},
  }),
}))
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}))

import { generateMetadata } from '@/app/products/page'

const meta = (searchParams) => generateMetadata({ searchParams })
const NOINDEX = { index: false, follow: true }
const PRODUCT_CANONICAL = 'https://www.mediportbd.com/products'

describe('F-01: facet robots directive consistency', () => {
  const filteredCases = [
    ['minPrice only', { minPrice: '100' }],
    ['maxPrice only', { maxPrice: '5000' }],
    ['combined min/max', { minPrice: '100', maxPrice: '5000' }],
    ['sort', { sort: 'price-asc' }],
    ['page', { page: '3' }],
    ['brand', { brand: 'Omron' }],
    ['category', { category: 'Massager' }],
    ['search q', { q: 'ecg machine' }],
    ['inStock', { inStock: 'true' }],
  ]

  for (const [label, searchParams] of filteredCases) {
    it(`noindex + canonical /products for ${label}`, async () => {
      const m = await meta(searchParams)
      expect(m.robots).toEqual(NOINDEX)
      expect(m.alternates.canonical).toBe(PRODUCT_CANONICAL)
    })
  }

  it('canonical /products page stays indexable (no accidental noindex)', async () => {
    const m = await meta({})
    expect(m.robots).toBeUndefined()
    expect(m.alternates.canonical).toBe(PRODUCT_CANONICAL)
    expect(m.title).toBeTruthy()
  })

  it('unknown/unrelated params are not broadened into noindex', async () => {
    const m = await meta({ utm_source: 'newsletter' })
    expect(m.robots).toBeUndefined()
    expect(m.alternates.canonical).toBe(PRODUCT_CANONICAL)
  })
})

// ── F-05 / F-13: alt text generation ───────────────────────────────────────
describe('F-05/F-13: product image alt text', () => {
  it('normalizes a populated brand object (no [object Object])', () => {
    const alt = generateProductAltText({
      name: 'Digital BP Monitor',
      brand: { _id: 'b1', name: 'Omron' },
      price: 3650,
      category: { name: 'Diagnostic Equipment' },
    })
    expect(alt).toContain('by Omron')
    expect(alt).not.toContain('[object Object]')
  })

  it('omits an unverified brand object without a name', () => {
    const alt = generateProductAltText({
      name: 'Scalp Massager',
      brand: { _id: 'b2' },
      category: 'Massager',
    })
    expect(alt).toContain('Scalp Massager')
    expect(alt).not.toContain('[object Object]')
    expect(alt).not.toContain('by')
  })

  it('never presents the placeholder "Generic" brand as real', () => {
    const alt = generateProductAltText({
      name: 'Smart Scalp Massager with Red Light',
      brand: 'Generic',
      price: 700,
    })
    expect(alt).not.toContain('Generic')
  })

  it('never embeds price in alt text', () => {
    const alt = generateProductAltText({
      name: 'Fascia Gun',
      brand: 'GPL',
      price: 1650,
    })
    expect(alt).not.toMatch(/Price/)
    expect(alt).not.toContain('৳')
    expect(alt).not.toContain('1650')
  })

  it('appends a real Bengali category label when one exists', () => {
    const alt = generateProductAltText({
      name: 'Blood Pressure Monitor',
      category: { name: 'Diagnostic Equipment' },
    })
    expect(alt).toContain('ডায়াগনস্টিক যন্ত্রপাতি')
    expect(alt).not.toContain('[object Object]')
  })

  it('does not leak raw slugs when no Bengali translation exists', () => {
    const alt = generateProductAltText({
      name: 'Calf Massager',
      category: 'massager',
    })
    expect(alt).not.toContain('(massager)')
    expect(alt).not.toContain('[object Object]')
  })

  it('keeps the meaningful view suffix for gallery images', () => {
    const alt = generateProductAltText(
      { name: 'Fascia Gun', brand: 'GPL' },
      'gallery'
    )
    expect(alt).toContain('front view')
    expect(alt).toContain('Bangladesh')
    expect(alt).toContain('— MediportBD')
  })

  it('survives missing fields without throwing', () => {
    const alt = generateProductAltText({})
    expect(typeof alt).toBe('string')
    expect(alt).not.toContain('[object Object]')
  })
})

// ── F-14: category description lengths ─────────────────────────────────────
describe('F-14: category meta description hygiene', () => {
  it('every category description is at most 160 characters', () => {
    for (const seo of Object.values(CATEGORY_SEO)) {
      expect(seo.description.length).toBeLessThanOrEqual(160)
    }
  })
})
