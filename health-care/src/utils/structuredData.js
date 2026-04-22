/**
 * Structured Data (JSON-LD) Generator for MedCore BD
 *
 * Generates Schema.org JSON-LD structured data for rich search results.
 * Supports Product, Organization, BreadcrumbList, and WebSite schemas.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { organization, siteConfig } from '@/config/seo';

// ---------------------------------------------------------------------------
// Schema validation (development mode only)
// ---------------------------------------------------------------------------

/**
 * Required fields per schema type for development-mode validation.
 */
const REQUIRED_FIELDS = {
  Product: ['name', 'description', 'offers'],
  Organization: ['name', 'url'],
  BreadcrumbList: ['itemListElement'],
  WebSite: ['name', 'url'],
};

/**
 * Validate a JSON-LD schema object in development mode.
 * Logs errors for missing required fields and returns false if invalid.
 *
 * @param {Object} schema - The JSON-LD schema object to validate
 * @returns {boolean} true if valid (or not in development), false if invalid
 */
function validateSchema(schema) {
  if (process.env.NODE_ENV !== 'development') {
    return true;
  }

  if (!schema || typeof schema !== 'object') {
    console.error('[StructuredData] Schema must be a non-null object');
    return false;
  }

  if (!schema['@context']) {
    console.error('[StructuredData] Missing required field "@context" in schema');
    return false;
  }

  const type = schema['@type'];
  if (!type) {
    console.error('[StructuredData] Missing required field "@type" in schema');
    return false;
  }

  const required = REQUIRED_FIELDS[type] || [];
  let valid = true;

  for (const field of required) {
    if (schema[field] === undefined || schema[field] === null) {
      console.error(
        `[StructuredData] Missing required field "${field}" in ${type} schema`
      );
      valid = false;
    }
  }

  return valid;
}

// ---------------------------------------------------------------------------
// Schema generators
// ---------------------------------------------------------------------------

/**
 * Generate a Product JSON-LD schema block.
 *
 * @param {Object} product - Product data
 * @param {string} product.name - Product name
 * @param {string} product.description - Product description
 * @param {string} [product.image] - Product image URL
 * @param {string} [product.brand] - Brand name
 * @param {string} [product.sku] - Stock-keeping unit identifier
 * @param {number|string} [product.price] - Product price
 * @param {string} [product.priceCurrency='BDT'] - ISO 4217 currency code
 * @param {boolean} [product.inStock=true] - Whether the product is in stock
 * @param {string} [product.url] - Canonical product URL
 * @param {string} [product._id] - Product ID (used to build URL if url not provided)
 * @returns {Object} Product JSON-LD object
 *
 * Validates: Requirements 6.1
 */
export function generateProductSchema(product) {
  if (!product) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[StructuredData] generateProductSchema: product data is required');
    }
    return null;
  }

  const {
    name,
    description,
    image,
    brand,
    sku,
    price,
    priceCurrency = 'BDT',
    inStock = true,
    url,
    _id,
  } = product;

  const productUrl =
    url ||
    (_id ? `${siteConfig.url}/products/${_id}` : siteConfig.url);

  const availability = inStock
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name || '',
    description: description || '',
    ...(image && { image }),
    ...(brand && {
      brand: {
        '@type': 'Brand',
        name: brand,
      },
    }),
    ...(sku && { sku }),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency,
      price: price !== undefined ? Number(price).toFixed(2) : '0.00',
      availability,
      seller: {
        '@type': 'Organization',
        name: siteConfig.name,
      },
    },
    url: productUrl,
  };

  return schema;
}

/**
 * Generate an Organization JSON-LD schema block.
 * Uses the `organization` export from `src/config/seo.js`.
 *
 * @returns {Object} Organization JSON-LD object
 *
 * Validates: Requirements 6.2
 */
export function generateOrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organization.name,
    url: organization.url,
    logo: {
      '@type': 'ImageObject',
      url: organization.logo,
    },
    ...(organization.contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: organization.contactPoint.telephone,
        contactType: organization.contactPoint.contactType,
        areaServed: organization.contactPoint.areaServed,
        availableLanguage: organization.contactPoint.availableLanguage,
      },
    }),
    ...(organization.sameAs && { sameAs: organization.sameAs }),
  };

  return schema;
}

/**
 * Generate a BreadcrumbList JSON-LD schema block.
 *
 * @param {Array<{name: string, url: string}>} breadcrumbs - Ordered list of breadcrumb items
 * @returns {Object|null} BreadcrumbList JSON-LD object, or null if input is invalid
 *
 * Validates: Requirements 6.3
 */
export function generateBreadcrumbSchema(breadcrumbs) {
  if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '[StructuredData] generateBreadcrumbSchema: breadcrumbs must be a non-empty array'
      );
    }
    return null;
  }

  const itemListElement = breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: crumb.url,
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };

  return schema;
}

/**
 * Generate a WebSite JSON-LD schema block with a SearchAction potentialAction.
 * Enables Google Sitelinks Search Box for the site.
 *
 * @returns {Object} WebSite JSON-LD object
 *
 * Validates: Requirements 6.4
 */
export function generateWebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return schema;
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

/**
 * StructuredData React component.
 * Renders a `<script type="application/ld+json">` tag containing the provided
 * JSON-LD schema. Returns null if the schema fails validation.
 *
 * @param {Object} props
 * @param {Object} props.schema - JSON-LD schema object to embed
 * @returns {React.Element|null} Script element or null
 *
 * Validates: Requirements 6.5, 6.6
 */
export function StructuredData({ schema }) {
  if (!validateSchema(schema)) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default StructuredData;
