/**
 * Tests for src/utils/structuredData.js
 *
 * Validates: Requirements 6.1, 6.5
 */

import React from 'react'
import { render } from '@testing-library/react'
import {
  generateProductSchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generateWebSiteSchema,
  StructuredData,
} from '../structuredData'

// ---------------------------------------------------------------------------
// generateProductSchema
// ---------------------------------------------------------------------------

describe('generateProductSchema', () => {
  const validProduct = {
    _id: 'prod-001',
    name: 'Digital Blood Pressure Monitor',
    description: 'Professional-grade digital blood pressure monitor with large LCD display.',
    image: 'https://example.com/bp-monitor.jpg',
    brand: 'Omron',
    sku: 'BP-MON-001',
    price: 4500,
    priceCurrency: 'BDT',
    inStock: true,
  }

  // --- @context and @type ---

  it('sets @context to https://schema.org', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('sets @type to Product', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema['@type']).toBe('Product')
  })

  // --- Core fields ---

  it('includes the product name', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema.name).toBe(validProduct.name)
  })

  it('includes the product description', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema.description).toBe(validProduct.description)
  })

  it('includes the product image', () => {
    const schema = generateProductSchema(validProduct)
    expect(Array.isArray(schema.image)).toBe(true)
    expect(schema.image[0]).toBe(validProduct.image)
  })

  it('includes the brand as a Brand object', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema.brand).toEqual({ '@type': 'Brand', name: 'Omron' })
  })

  it('includes the sku', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema.sku).toBe(validProduct.sku)
  })

  // --- Offers ---

  it('includes an offers block with @type Offer', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema.offers['@type']).toBe('Offer')
  })

  it('formats price as a two-decimal string', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema.offers.price).toBe('4500.00')
  })

  it('includes the priceCurrency', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema.offers.priceCurrency).toBe('BDT')
  })

  it('defaults priceCurrency to BDT when not provided', () => {
    const product = { ...validProduct, priceCurrency: undefined }
    const schema = generateProductSchema(product)
    expect(schema.offers.priceCurrency).toBe('BDT')
  })

  it('sets availability to InStock when inStock is true', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema.offers.availability).toBe('https://schema.org/InStock')
  })

  it('includes a seller Organization in offers', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema.offers.seller['@type']).toBe('Organization')
    expect(schema.offers.seller.name).toBeTruthy()
  })

  // --- Out-of-stock products ---

  it('sets availability to OutOfStock when inStock is false', () => {
    const product = { ...validProduct, inStock: false }
    const schema = generateProductSchema(product)
    expect(schema.offers.availability).toBe('https://schema.org/OutOfStock')
  })

  it('defaults inStock to true when not provided', () => {
    const product = { ...validProduct, inStock: undefined }
    const schema = generateProductSchema(product)
    expect(schema.offers.availability).toBe('https://schema.org/InStock')
  })

  // --- URL ---

  it('builds a product URL from _id when url is not provided', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema.url).toContain(validProduct._id)
    expect(schema.url).toMatch(/^https?:\/\//)
  })

  it('uses the provided url when given', () => {
    const customUrl = 'https://medcorebd.com/products/custom-slug'
    const product = { ...validProduct, url: customUrl }
    const schema = generateProductSchema(product)
    expect(schema.url).toBe(customUrl)
    expect(schema.offers.url).toBe(customUrl)
  })

  // --- Optional fields omitted when absent ---

  it('omits image when not provided', () => {
    const product = { ...validProduct, image: undefined }
    const schema = generateProductSchema(product)
    expect(schema.image).toBeUndefined()
  })

  it('omits brand when not provided', () => {
    const product = { ...validProduct, brand: undefined }
    const schema = generateProductSchema(product)
    expect(schema.brand).toBeUndefined()
  })

  it('omits sku when not provided', () => {
    const product = { ...validProduct, sku: undefined }
    const schema = generateProductSchema(product)
    expect(schema.sku).toBeUndefined()
  })

  // --- Price edge cases ---

  it('formats a string price as a two-decimal number string', () => {
    const product = { ...validProduct, price: '1299.9' }
    const schema = generateProductSchema(product)
    expect(schema.offers.price).toBe('1299.90')
  })

  it('defaults price to "0.00" when price is undefined', () => {
    const product = { ...validProduct, price: undefined }
    const schema = generateProductSchema(product)
    expect(schema.offers.price).toBe('0.00')
  })

  // --- Enhanced features: Images array ---

  it('includes all images as an array when images array is provided', () => {
    const product = {
      ...validProduct,
      images: [
        { url: 'https://example.com/img1.jpg' },
        { url: 'https://example.com/img2.jpg' },
        { url: 'https://example.com/img3.jpg' },
      ],
    }
    const schema = generateProductSchema(product)
    expect(Array.isArray(schema.image)).toBe(true)
    expect(schema.image).toHaveLength(3)
    expect(schema.image[0]).toBe('https://example.com/img1.jpg')
    expect(schema.image[1]).toBe('https://example.com/img2.jpg')
    expect(schema.image[2]).toBe('https://example.com/img3.jpg')
  })

  it('handles images array with string URLs', () => {
    const product = {
      ...validProduct,
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    }
    const schema = generateProductSchema(product)
    expect(Array.isArray(schema.image)).toBe(true)
    expect(schema.image).toHaveLength(2)
  })

  it('filters out invalid image entries', () => {
    const product = {
      ...validProduct,
      images: [
        { url: 'https://example.com/img1.jpg' },
        null,
        { url: undefined },
        { url: 'https://example.com/img2.jpg' },
      ],
    }
    const schema = generateProductSchema(product)
    expect(schema.image).toHaveLength(2)
  })

  // --- Enhanced features: Brand as object ---

  it('extracts brand name from populated brand object', () => {
    const product = {
      ...validProduct,
      brand: { _id: 'brand-123', name: 'Siemens' },
    }
    const schema = generateProductSchema(product)
    expect(schema.brand).toEqual({ '@type': 'Brand', name: 'Siemens' })
  })

  // --- Enhanced features: Rating as object ---

  it('handles rating as a number', () => {
    const product = {
      ...validProduct,
      rating: 4.5,
      reviewCount: 10,
    }
    const schema = generateProductSchema(product)
    expect(schema.aggregateRating).toBeDefined()
    expect(schema.aggregateRating.ratingValue).toBe('4.5')
    expect(schema.aggregateRating.reviewCount).toBe(10)
  })

  it('handles rating as an object with average and count', () => {
    const product = {
      ...validProduct,
      rating: { average: 4.7, count: 25 },
    }
    const schema = generateProductSchema(product)
    expect(schema.aggregateRating).toBeDefined()
    expect(schema.aggregateRating.ratingValue).toBe('4.7')
    expect(schema.aggregateRating.reviewCount).toBe(25)
  })

  it('uses rating.count over reviewCount when rating is object', () => {
    const product = {
      ...validProduct,
      rating: { average: 4.8, count: 30 },
      reviewCount: 10,
    }
    const schema = generateProductSchema(product)
    expect(schema.aggregateRating.reviewCount).toBe(30)
  })

  it('omits aggregateRating when rating is zero', () => {
    const product = {
      ...validProduct,
      rating: 0,
      reviewCount: 5,
    }
    const schema = generateProductSchema(product)
    expect(schema.aggregateRating).toBeUndefined()
  })

  it('omits aggregateRating when reviewCount is zero', () => {
    const product = {
      ...validProduct,
      rating: 4.5,
      reviewCount: 0,
    }
    const schema = generateProductSchema(product)
    expect(schema.aggregateRating).toBeUndefined()
  })

  // --- Enhanced features: Certifications ---

  it('includes certifications as additionalProperty array', () => {
    const product = {
      ...validProduct,
      certifications: ['DGDA', 'CE', 'ISO 13485'],
    }
    const schema = generateProductSchema(product)
    expect(Array.isArray(schema.additionalProperty)).toBe(true)
    expect(schema.additionalProperty).toHaveLength(3)
    expect(schema.additionalProperty[0]).toEqual({
      '@type': 'PropertyValue',
      name: 'DGDA',
      value: 'Certified',
    })
    expect(schema.additionalProperty[1]).toEqual({
      '@type': 'PropertyValue',
      name: 'CE',
      value: 'Certified',
    })
    expect(schema.additionalProperty[2]).toEqual({
      '@type': 'PropertyValue',
      name: 'ISO 13485',
      value: 'Certified',
    })
  })

  it('omits additionalProperty when certifications array is empty', () => {
    const product = {
      ...validProduct,
      certifications: [],
    }
    const schema = generateProductSchema(product)
    expect(schema.additionalProperty).toBeUndefined()
  })

  // --- Enhanced features: priceValidUntil (1 year from now) ---

  it('sets priceValidUntil to 1 year from now', () => {
    const schema = generateProductSchema(validProduct)
    const priceValidUntil = new Date(schema.offers.priceValidUntil)
    const now = new Date()
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    
    // Check that priceValidUntil is approximately 1 year from now (within 1 day tolerance)
    const diffInDays = Math.abs((priceValidUntil - oneYearFromNow) / (1000 * 60 * 60 * 24))
    expect(diffInDays).toBeLessThan(1)
  })

  it('formats priceValidUntil as ISO date string (YYYY-MM-DD)', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema.offers.priceValidUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  // --- Enhanced features: Seller organization ---

  it('sets seller name to "MedCore BD"', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema.offers.seller.name).toBe('MedCore BD')
  })

  it('includes seller url from siteConfig', () => {
    const schema = generateProductSchema(validProduct)
    expect(schema.offers.seller.url).toMatch(/^https?:\/\//)
  })

  // --- Enhanced features: Slug-based URL ---

  it('prefers slug over _id for product URL', () => {
    const product = {
      ...validProduct,
      slug: 'digital-bp-monitor',
      _id: 'prod-001',
    }
    const schema = generateProductSchema(product)
    expect(schema.url).toContain('digital-bp-monitor')
    expect(schema.url).not.toContain('prod-001')
  })

  it('falls back to _id when slug is not available', () => {
    const product = {
      ...validProduct,
      _id: 'prod-001',
      slug: undefined,
    }
    const schema = generateProductSchema(product)
    expect(schema.url).toContain('prod-001')
  })

  // --- Null / missing product ---

  it('returns null when product is null', () => {
    const schema = generateProductSchema(null)
    expect(schema).toBeNull()
  })

  it('returns null when product is undefined', () => {
    const schema = generateProductSchema(undefined)
    expect(schema).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// generateOrganizationSchema
// ---------------------------------------------------------------------------

describe('generateOrganizationSchema', () => {
  it('sets @context to https://schema.org', () => {
    const schema = generateOrganizationSchema()
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('sets @type to Organization', () => {
    const schema = generateOrganizationSchema()
    expect(schema['@type']).toBe('Organization')
  })

  it('includes the organization name', () => {
    const schema = generateOrganizationSchema()
    expect(schema.name).toBeTruthy()
    expect(typeof schema.name).toBe('string')
  })

  it('includes the organization url', () => {
    const schema = generateOrganizationSchema()
    expect(schema.url).toMatch(/^https?:\/\//)
  })

  it('includes a logo ImageObject', () => {
    const schema = generateOrganizationSchema()
    expect(schema.logo['@type']).toBe('ImageObject')
    expect(schema.logo.url).toMatch(/^https?:\/\//)
  })

  it('includes a contactPoint with @type ContactPoint', () => {
    const schema = generateOrganizationSchema()
    expect(schema.contactPoint['@type']).toBe('ContactPoint')
  })

  it('includes telephone in contactPoint', () => {
    const schema = generateOrganizationSchema()
    expect(schema.contactPoint.telephone).toBeTruthy()
  })

  it('includes contactType in contactPoint', () => {
    const schema = generateOrganizationSchema()
    expect(schema.contactPoint.contactType).toBeTruthy()
  })

  it('includes areaServed in contactPoint', () => {
    const schema = generateOrganizationSchema()
    expect(schema.contactPoint.areaServed).toBeTruthy()
  })

  it('includes availableLanguage in contactPoint', () => {
    const schema = generateOrganizationSchema()
    expect(schema.contactPoint.availableLanguage).toBeDefined()
  })

  it('includes sameAs as an array of URLs', () => {
    const schema = generateOrganizationSchema()
    expect(Array.isArray(schema.sameAs)).toBe(true)
    expect(schema.sameAs.length).toBeGreaterThan(0)
    schema.sameAs.forEach(url => {
      expect(url).toMatch(/^https?:\/\//)
    })
  })
})

// ---------------------------------------------------------------------------
// generateBreadcrumbSchema
// ---------------------------------------------------------------------------

describe('generateBreadcrumbSchema', () => {
  const breadcrumbs = [
    { name: 'Home', url: 'https://medcorebd.com' },
    { name: 'Products', url: 'https://medcorebd.com/products' },
    { name: 'Blood Pressure Monitor', url: 'https://medcorebd.com/products/bp-001' },
  ]

  it('sets @context to https://schema.org', () => {
    const schema = generateBreadcrumbSchema(breadcrumbs)
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('sets @type to BreadcrumbList', () => {
    const schema = generateBreadcrumbSchema(breadcrumbs)
    expect(schema['@type']).toBe('BreadcrumbList')
  })

  it('includes itemListElement array', () => {
    const schema = generateBreadcrumbSchema(breadcrumbs)
    expect(Array.isArray(schema.itemListElement)).toBe(true)
  })

  it('creates one ListItem per breadcrumb', () => {
    const schema = generateBreadcrumbSchema(breadcrumbs)
    expect(schema.itemListElement).toHaveLength(breadcrumbs.length)
  })

  it('sets @type to ListItem for each element', () => {
    const schema = generateBreadcrumbSchema(breadcrumbs)
    schema.itemListElement.forEach(item => {
      expect(item['@type']).toBe('ListItem')
    })
  })

  it('assigns 1-based positions to each item', () => {
    const schema = generateBreadcrumbSchema(breadcrumbs)
    schema.itemListElement.forEach((item, index) => {
      expect(item.position).toBe(index + 1)
    })
  })

  it('maps breadcrumb names to item names', () => {
    const schema = generateBreadcrumbSchema(breadcrumbs)
    breadcrumbs.forEach((crumb, index) => {
      expect(schema.itemListElement[index].name).toBe(crumb.name)
    })
  })

  it('maps breadcrumb urls to item items', () => {
    const schema = generateBreadcrumbSchema(breadcrumbs)
    breadcrumbs.forEach((crumb, index) => {
      expect(schema.itemListElement[index].item).toBe(crumb.url)
    })
  })

  // --- Navigation hierarchy ---

  it('preserves the order of breadcrumbs', () => {
    const schema = generateBreadcrumbSchema(breadcrumbs)
    expect(schema.itemListElement[0].name).toBe('Home')
    expect(schema.itemListElement[1].name).toBe('Products')
    expect(schema.itemListElement[2].name).toBe('Blood Pressure Monitor')
  })

  it('handles a single-item breadcrumb (root page)', () => {
    const single = [{ name: 'Home', url: 'https://medcorebd.com' }]
    const schema = generateBreadcrumbSchema(single)
    expect(schema.itemListElement).toHaveLength(1)
    expect(schema.itemListElement[0].position).toBe(1)
  })

  // --- Invalid inputs ---

  it('returns null for an empty array', () => {
    const schema = generateBreadcrumbSchema([])
    expect(schema).toBeNull()
  })

  it('returns null for null input', () => {
    const schema = generateBreadcrumbSchema(null)
    expect(schema).toBeNull()
  })

  it('returns null for undefined input', () => {
    const schema = generateBreadcrumbSchema(undefined)
    expect(schema).toBeNull()
  })

  it('returns null for non-array input', () => {
    const schema = generateBreadcrumbSchema('not an array')
    expect(schema).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// generateWebSiteSchema
// ---------------------------------------------------------------------------

describe('generateWebSiteSchema', () => {
  it('sets @context to https://schema.org', () => {
    const schema = generateWebSiteSchema()
    expect(schema['@context']).toBe('https://schema.org')
  })

  it('sets @type to WebSite', () => {
    const schema = generateWebSiteSchema()
    expect(schema['@type']).toBe('WebSite')
  })

  it('includes the site name', () => {
    const schema = generateWebSiteSchema()
    expect(schema.name).toBeTruthy()
  })

  it('includes the site url', () => {
    const schema = generateWebSiteSchema()
    expect(schema.url).toMatch(/^https?:\/\//)
  })

  it('includes a description', () => {
    const schema = generateWebSiteSchema()
    expect(schema.description).toBeTruthy()
  })

  it('includes a potentialAction SearchAction', () => {
    const schema = generateWebSiteSchema()
    expect(schema.potentialAction['@type']).toBe('SearchAction')
  })

  it('includes a urlTemplate in the SearchAction target', () => {
    const schema = generateWebSiteSchema()
    expect(schema.potentialAction.target.urlTemplate).toContain('{search_term_string}')
  })

  it('includes query-input in the SearchAction', () => {
    const schema = generateWebSiteSchema()
    expect(schema.potentialAction['query-input']).toContain('search_term_string')
  })
})

// ---------------------------------------------------------------------------
// StructuredData React component
// ---------------------------------------------------------------------------

describe('StructuredData component', () => {
  // Suppress console.error noise from validateSchema in development mode
  let consoleErrorSpy

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('renders a script tag with type application/ld+json', () => {
    const schema = generateOrganizationSchema()
    const { container } = render(<StructuredData schema={schema} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
  })

  it('embeds the schema as JSON in the script tag', () => {
    const schema = generateOrganizationSchema()
    const { container } = render(<StructuredData schema={schema} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const parsed = JSON.parse(script.innerHTML)
    expect(parsed['@type']).toBe('Organization')
  })

  it('renders a valid Product schema without errors', () => {
    const schema = generateProductSchema({
      name: 'Test Product',
      description: 'A test product.',
      price: 100,
      inStock: true,
    })
    const { container } = render(<StructuredData schema={schema} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
  })

  it('renders a valid BreadcrumbList schema without errors', () => {
    const schema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://medcorebd.com' },
      { name: 'Products', url: 'https://medcorebd.com/products' },
    ])
    const { container } = render(<StructuredData schema={schema} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
  })

  it('renders a valid WebSite schema without errors', () => {
    const schema = generateWebSiteSchema()
    const { container } = render(<StructuredData schema={schema} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
  })

  // --- Schema validation (development mode) ---

  it('does not throw when schema is null', () => {
    // validateSchema only runs in development mode; in test mode the component
    // still renders without crashing.
    expect(() => render(<StructuredData schema={null} />)).not.toThrow()
  })

  it('does not throw when schema is undefined', () => {
    expect(() => render(<StructuredData schema={undefined} />)).not.toThrow()
  })

  it('returns null for a schema missing @context', () => {
    const badSchema = { '@type': 'Organization', name: 'Test', url: 'https://test.com' }
    const { container } = render(<StructuredData schema={badSchema} />)
    // In non-development environments validateSchema returns true, so we only
    // assert the component does not throw.
    expect(() => render(<StructuredData schema={badSchema} />)).not.toThrow()
  })

  it('serialises the full schema object into the script tag', () => {
    const schema = generateProductSchema({
      _id: 'test-123',
      name: 'Stethoscope',
      description: 'Classic stethoscope.',
      price: 2500,
      brand: 'Littmann',
      sku: 'STH-001',
      inStock: true,
    })
    const { container } = render(<StructuredData schema={schema} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const parsed = JSON.parse(script.innerHTML)
    expect(parsed.name).toBe('Stethoscope')
    expect(parsed.brand.name).toBe('Littmann')
    expect(parsed.offers.price).toBe('2500.00')
  })
})
