/**
 * Tests for src/utils/metadata.js
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import {
  generatePageMetadata,
  generateProductMetadata,
  getDefaultOGImage,
  finalTitle,
  productTitle,
  productTitleText,
  socialTitle,
  TITLE_DISPLAY_BUDGET,
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
    expect(meta.title).toContain('MediportBD')
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
    expect(meta.openGraph.siteName).toBe('MediportBD')
  })

  it('includes og:locale', () => {
    const meta = generatePageMetadata(baseParams)
    expect(meta.openGraph.locale).toBe('en_BD')
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
    expect(meta.title).toBe('MediportBD')
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
    price: 4850,
  }

  it('includes the product name in the title', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.title).toContain(validProduct.name)
  })

  it('uses the product price in the title when priced', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.title).toContain('Price ৳4,850')
  })

  it('uses a generic online suffix when the product has no price', () => {
    const meta = generateProductMetadata({ ...validProduct, price: null })
    expect(meta.title).toContain('Buy Online Bangladesh')
  })

  it('includes the site name in the title', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.title).toContain('MediportBD')
  })

  it('includes the brand in the title', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.title).toContain(validProduct.brand)
  })

  it('does not duplicate the brand when the name already starts with it', () => {
    const product = { ...validProduct, name: 'Omron Digital Blood Pressure Monitor AX150', brand: 'Omron' }
    const meta = generateProductMetadata(product)
    // Brand appears already in the product name — prefixing it again would give
    // spammy "Omron Omron ..." which wastes title characters and hurts CTR.
    expect(meta.title).not.toContain('Omron Omron')
    expect(meta.title).toContain('Omron Digital Blood Pressure Monitor AX150')
  })

  it('includes the category in keywords', () => {
    const meta = generateProductMetadata(validProduct)
    // Category stays OUT of the title (keeps titles lean); it lives in keywords instead.

    expect(meta.keywords).toContain(`${validProduct.category} Bangladesh`)
  })

  it('builds a rich SEO description from the product', () => {
    const meta = generateProductMetadata(validProduct)
    // The description generator enriches the product description with buying
    // context (name,brand,price, trust signals) while keeping the original
    // product description as the leading sentence..
    expect(meta.description).toContain(`Buy ${validProduct.name} in Bangladesh.`)
    expect(meta.description).toContain(validProduct.description)
    expect(meta.description).toContain(`Brand: ${validProduct.brand}.`)
    expect(meta.description).toContain('DGDA-registered supplier. Free delivery Dhaka.')
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
    expect(meta.openGraph.siteName).toBe('MediportBD')
  })

  it('includes og:locale', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.openGraph.locale).toBe('en_BD')
  })

  it('includes twitter card tags', () => {
    const meta = generateProductMetadata(validProduct)
    expect(meta.twitter.card).toBeDefined()
    expect(meta.twitter.title).toContain(validProduct.name)
    expect(meta.twitter.description).toContain(`Buy ${validProduct.name} in Bangladesh.`)
    expect(meta.twitter.description).toContain('DGDA-registered supplier.')
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
    expect(meta.title).toContain('MediportBD')
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
    expect(meta.title).toContain('MediportBD')
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

// ---------------------------------------------------------------------------
// finalTitle / socialTitle
// ---------------------------------------------------------------------------

describe('finalTitle', () => {
  it('adds the site suffix to an unsuffixed retail title', () => {
    expect(finalTitle('Laboratory Reagents Bangladesh — Dengue, TSH Kits | Cold Chain')).toEqual({
      absolute: 'Laboratory Reagents Bangladesh — Dengue, TSH Kits | Cold Chain | MediportBD',
    })
  })

  it('does not duplicate the suffix already present in a retail title', () => {
    expect(finalTitle('Pulse Oximeter Price in Bangladesh 2026 | MediportBD')).toEqual({
      absolute: 'Pulse Oximeter Price in Bangladesh 2026 | MediportBD',
    })
  })

  it('renders plain strings exactly once for share cards', () => {
    expect(socialTitle('Medical Equipment Bangladesh — 350+ DGDA Products | MediportBD')).toBe(
      'Medical Equipment Bangladesh — 350+ DGDA Products | MediportBD'
    )
  })

  it('falls back to the site name when empty', () => {
    expect(finalTitle('')).toEqual({ absolute: 'MediportBD' })
  })
})

// ---------------------------------------------------------------------------
// productTitle — SEO-01 (no price in the <title>; site suffix only when it fits)
// ---------------------------------------------------------------------------

describe('productTitle', () => {
  it('returns a plain string when the site suffix still fits the display budget', () => {
    const title = productTitle('Comen Star 8000F Patient Monitor', 'Comen')
    expect(title).toBe('Comen Star 8000F Patient Monitor')
    expect(title.length + ' | MediportBD'.length).toBeLessThanOrEqual(TITLE_DISPLAY_BUDGET)
  })

  it('prefers dropping the site suffix over losing product words on long titles', () => {
    const name = 'Yamasu Aneroid Sphygmomanometer with Stethoscope (Made in Japan)'
    const title = productTitle(name, 'Yamasu')
    expect(title).toEqual({ absolute: name }) // full name preserved verbatim
    expect(title.absolute).toContain('Stethoscope') // meaningful words survive
    expect(title.absolute).not.toContain('MediportBD')
  })

  it('never truncates a product name to fit the budget', () => {
    const name = 'A'.repeat(120)
    expect(productTitle(name)).toEqual({ absolute: name })
  })

  it('has no price data anywhere in the title', () => {
    const flat = JSON.stringify([productTitle('GPL Iron Reagent (40+10 ml)', 'GPL'), productTitle('A'.repeat(80), 'Tynor')])
    expect(flat).not.toMatch(/৳|Price|BDT|Tk/)
  })

  it('prefixes the brand only when the name does not already start with it', () => {
    expect(productTitle('CMS50D1 Pulse Oximeter', 'CONTEC')).toBe('CONTEC CMS50D1 Pulse Oximeter')
    expect(productTitle('CONTEC CMS50D1 Pulse Oximeter', 'CONTEC')).toBe('CONTEC CMS50D1 Pulse Oximeter')
  })

  it('falls back to the site name when the product name is missing', () => {
    expect(productTitle('', 'GPL')).toEqual({ absolute: 'MediportBD' })
    expect(productTitle(null)).toEqual({ absolute: 'MediportBD' })
  })

  it('productTitleText renders share-card strings from either form', () => {
    const short = productTitle('Comen Star 8000F Patient Monitor')
    const long = 'A'.repeat(80)
    expect(productTitleText(short)).toBe(short)
    expect(productTitleText({ absolute: long })).toBe(long)
  })
})
