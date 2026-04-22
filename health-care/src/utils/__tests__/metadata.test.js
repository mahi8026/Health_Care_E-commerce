/**
 * Tests for src/utils/metadata.js
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import {
  generatePageMetadata,
  generateProductMetadata,
  getDefaultOGImage,
} from '../metadata'

// ---------------------------------------------------------------------------
// getDefaultOGImage
// ---------------------------------------------------------------------------

describe('getDefaultOGImage', () => {
  it('returns an absolute URL', () => {
    const url = getDefaultOGImage()
    expect(url).toMatch(/^https?:\/\//)
  })

  it('includes the og-default.png path', () => {
    const url = getDefaultOGImage()
    expect(url).toContain('og-default.png')
  })
})

// ---------------------------------------------------------------------------
// generatePageMetadata
// ---------------------------------------------------------------------------

describe('generatePageMetadata', () => {
  const baseParams = {
    title: 'Reagent Store',
    description: 'Browse our extensive collection of laboratory reagents.',
    path: '/reagent-store',
  }

  it('includes the site name in the title', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.title).toContain('MedCore BD')
    expect(meta.title).toContain('Reagent Store')
  })

  it('sets the description', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.description).toBe(baseParams.description)
  })

  it('generates a canonical URL from the path', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.alternates.canonical).toContain('/reagent-store')
    expect(meta.alternates.canonical).toMatch(/^https?:\/\//)
  })

  it('defaults og:type to "website"', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.openGraph.type).toBe('website')
  })

  it('accepts a custom og:type', () => {
    const meta = generatePageMetadata({ ...baseParams, type: 'article' })
    expect(meta.openGraph.type).toBe('article')
  })

  it('includes og:site_name', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.openGraph.siteName).toBe('MedCore BD')
  })

  it('includes og:locale', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.openGraph.locale).toBe('en_US')
  })

  it('includes og:url matching the canonical URL', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.openGraph.url).toBe(meta.alternates.canonical)
  })

  it('includes og:image', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.openGraph.images).toHaveLength(1)
    expect(meta.openGraph.images[0].url).toMatch(/^https?:\/\//)
  })

  it('uses a custom image when provided', () => {
    const customImage = 'https://example.com/custom.png'
    const meta = generatePageMetadata({ ...baseParams, image: customImage })
    expect(meta.openGraph.images[0].url).toBe(customImage)
  })

  it('falls back to default OG image when no image provided', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.openGraph.images[0].url).toBe(getDefaultOGImage())
  })

  it('includes twitter:card', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.twitter.card).toBeDefined()
  })

  it('includes twitter:title', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.twitter.title).toContain('Reagent Store')
  })

  it('includes twitter:description', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.twitter.description).toBe(baseParams.description)
  })

  it('includes twitter:image', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.twitter.images).toHaveLength(1)
    expect(meta.twitter.images[0]).toMatch(/^https?:\/\//)
  })

  it('sets robots index:true and follow:true by default', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.robots.index).toBe(true)
    expect(meta.robots.follow).toBe(true)
  })

  it('sets robots index:false when noindex is true', () => {
    const meta = generatePageMetadata({ ...baseParams, noindex: true })
    expect(meta.robots.index).toBe(false)
  })

  it('sets robots follow:false when nofollow is true', () => {
    const meta = generatePageMetadata({ ...baseParams, nofollow: true })
    expect(meta.robots.follow).toBe(false)
  })

  it('sets both noindex and nofollow for admin pages', () => {
    const meta = generatePageMetadata({
      title: 'Admin Dashboard',
      description: 'Admin area.',
      path: '/admin',
      noindex: true,
      nofollow: true,
    })
    expect(meta.robots.index).toBe(false)
    expect(meta.robots.follow).toBe(false)
  })

  it('falls back to site description when no description provided', () => {
    const meta = generatePageMetadata({ title: 'Test Page', path: '/test' })
    expect(meta.description).toBeTruthy()
  })

  it('falls back to site name when no title provided', () => {
    const meta = generatePageMetadata({})
    expect(meta.title).toBe('MedCore BD')
  })

  it('handles missing path gracefully', () => {
    const meta = generatePageMetadata({ title: 'No Path', description: 'Test' })
    expect(meta.alternates.canonical).toMatch(/^https?:\/\//)
  })
})

// ---------------------------------------------------------------------------
// generateProductMetadata
// ---------------------------------------------------------------------------

describe('generateProductMetadata', () => {
  const validProduct = {
    _id: 'prod-001',
    name: 'Digital Blood Pressure Monitor',
    description: 'Professional-grade digital blood pressure monitor with large LCD display.',
    image: 'https://example.com/bp-monitor.jpg',
    brand: 'Omron',
    category: 'Diagnostic Equipment',
  }

  it('includes the product name in the title', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.title).toContain(validProduct.name)
  })

  it('includes the site name in the title', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.title).toContain('MedCore BD')
  })

  it('includes the brand in the title', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.title).toContain(validProduct.brand)
  })

  it('includes the category in the title', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.title).toContain(validProduct.category)
  })

  it('sets the description from the product', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.description).toBe(validProduct.description)
  })

  it('generates a canonical URL containing the product ID', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.alternates.canonical).toContain(validProduct._id)
    expect(meta.alternates.canonical).toMatch(/^https?:\/\//)
  })

  it('sets og:type to "product"', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.openGraph.type).toBe('product')
  })

  it('uses the product image as og:image', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.openGraph.images[0].url).toBe(validProduct.image)
  })

  it('falls back to default OG image when product image is missing', () => {
    const product = { ...validProduct, image: undefined }
    const meta = generateProductMetadata(product)
    expect(meta.openGraph.images[0].url).toBe(getDefaultOGImage())
  })

  it('includes og:site_name', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.openGraph.siteName).toBe('MedCore BD')
  })

  it('includes og:locale', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.openGraph.locale).toBe('en_US')
  })

  it('includes twitter card tags', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.twitter.card).toBeDefined()
    expect(meta.twitter.title).toContain(validProduct.name)
    expect(meta.twitter.description).toBe(validProduct.description)
    expect(meta.twitter.images[0]).toBe(validProduct.image)
  })

  it('allows indexing for valid products', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.robots.index).toBe(true)
    expect(meta.robots.follow).toBe(true)
  })

  // --- Null / missing product handling ---

  it('returns metadata when product is null', () => {
    const meta = generateProductMetadata(null)
    expect(meta).toBeDefined()
    expect(meta.title).toBeDefined()
  })

  it('sets noindex when product is null', () => {
    const meta = generateProductMetadata(null)
    expect(meta.robots.index).toBe(false)
  })

  it('returns metadata when product is undefined', () => {
    const meta = generateProductMetadata(undefined)
    expect(meta).toBeDefined()
    expect(meta.robots.index).toBe(false)
  })

  it('handles product with missing name gracefully', () => {
    const product = { ...validProduct, name: undefined }
    const meta = generateProductMetadata(product)
    expect(meta.title).toContain('MedCore BD')
  })

  it('handles product with missing description gracefully', () => {
    const product = { ...validProduct, description: undefined }
    const meta = generateProductMetadata(product)
    expect(meta.description).toBeTruthy()
  })

  it('handles product without brand or category', () => {
    const product = {
      _id: 'prod-002',
      name: 'Stethoscope',
      description: 'Classic stethoscope.',
    }
    const meta = generateProductMetadata(product)
    expect(meta.title).toContain('Stethoscope')
    expect(meta.title).toContain('MedCore BD')
  })

  it('handles product without _id (no canonical product path)', () => {
    const product = { name: 'Test', description: 'Test product' }
    const meta = generateProductMetadata(product)
    expect(meta.alternates.canonical).toMatch(/^https?:\/\//)
  })

  it('makes relative product image URLs absolute', () => {
    const product = { ...validProduct, image: '/images/product.jpg' }
    const meta = generateProductMetadata(product)
    expect(meta.openGraph.images[0].url).toMatch(/^https?:\/\//)
  })
})
