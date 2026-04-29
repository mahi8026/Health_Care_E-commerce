/**
 * Metadata Generator Utility for MedCore BD
 *
 * Centralized metadata generation for all pages using the Next.js Metadata API.
 * Includes Open Graph tags, Twitter Card tags, canonical URLs, and robots directives.
 */

import { siteConfig } from '@/config/seo'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build an absolute URL from a path.
 * @param {string} path - Relative path (e.g. '/products/123')
 * @returns {string} Absolute URL
 */
function buildUrl(path) {
  const base = siteConfig.url.replace(/\/$/, '')
  const normalised = path ? `/${path.replace(/^\//, '')}` : ''
  return `${base}${normalised}`
}

/**
 * Build the robots directive string from noindex / nofollow flags.
 * @param {boolean} noindex
 * @param {boolean} nofollow
 * @returns {Object} Next.js robots metadata object
 */
function buildRobots(noindex = false, nofollow = false) {
  return {
    index: !noindex,
    follow: !nofollow,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the default Open Graph image URL.
 * Falls back to the site-wide ogImage defined in siteConfig.
 *
 * @returns {string} Absolute URL to the default OG image
 */
export function getDefaultOGImage() {
  const image = siteConfig.ogImage || '/og-default.png'
  // If already absolute, return as-is; otherwise make it absolute.
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image
  }
  return buildUrl(image)
}

/**
 * Generate a Next.js metadata object for a generic page.
 *
 * @param {Object} params
 * @param {string}  params.title       - Page title (will be suffixed with site name)
 * @param {string}  params.description - Meta description
 * @param {string}  [params.path]      - Relative path used for canonical URL
 * @param {string}  [params.image]     - Open Graph image URL (absolute or relative)
 * @param {string}  [params.type]      - Open Graph type (default: 'website')
 * @param {boolean} [params.noindex]   - Prevent search-engine indexing
 * @param {boolean} [params.nofollow]  - Prevent link following
 * @returns {Object} Next.js metadata object
 */
export function generatePageMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  nofollow = false,
} = {}) {
  const resolvedTitle = title
    ? `${title} | ${siteConfig.name}`
    : siteConfig.name

  const resolvedDescription = description || siteConfig.description

  const canonicalUrl = path ? buildUrl(path) : siteConfig.url

  const ogImage = image
    ? image.startsWith('http')
      ? image
      : buildUrl(image)
    : getDefaultOGImage()

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: buildRobots(noindex, nofollow),
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: canonicalUrl,
      type,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
      siteName: siteConfig.name,
      locale: siteConfig.locale,
    },
    twitter: {
      card: siteConfig.twitter?.card || 'summary_large_image',
      site: siteConfig.twitter?.site,
      title: resolvedTitle,
      description: resolvedDescription,
      images: [ogImage],
    },
  }
}

/**
 * Generate a Next.js metadata object for a product detail page.
 * Handles null / undefined product gracefully by returning a noindex fallback.
 *
 * @param {Object|null} product
 * @param {string} product.name        - Product name
 * @param {string} product.description - Product description
 * @param {string} [product.image]     - Product image URL
 * @param {string} [product.brand]     - Product brand
 * @param {string} [product.category]  - Product category
 * @param {string} [product._id]       - Product ID (used to build canonical URL)
 * @returns {Object} Next.js metadata object
 */
export function generateProductMetadata(product) {
  // Graceful fallback when product data is missing
  if (!product) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[metadata] generateProductMetadata called with null/undefined product')
    }
    return generatePageMetadata({
      title: 'Product Not Found',
      description: 'The requested product could not be found on MedCore BD.',
      path: '/products',
      noindex: true,
    })
  }

  const name = product.name || 'Product'
  const brand = product.brand ? ` | ${product.brand}` : ''
  const category = product.category ? ` | ${product.category}` : ''

  const title = `${name}${brand}${category} | ${siteConfig.name}`

  const description =
    product.description ||
    `View detailed information, pricing, and availability for ${name} on ${siteConfig.name}.`

  const path = product._id ? `/products/${product._id}` : '/products'
  const canonicalUrl = buildUrl(path)

  const ogImage = product.image
    ? product.image.startsWith('http')
      ? product.image
      : buildUrl(product.image)
    : getDefaultOGImage()

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: buildRobots(false, false),
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
      siteName: siteConfig.name,
      locale: siteConfig.locale,
    },
    twitter: {
      card: siteConfig.twitter?.card || 'summary_large_image',
      site: siteConfig.twitter?.site,
      title,
      description,
      images: [ogImage],
    },
  }
}
