/**
 * Structured Data (JSON-LD) Generator for MediportBD
 *
 * Generates Schema.org JSON-LD structured data for rich search results.
 * Supports Product, Organization, BreadcrumbList, and WebSite schemas.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { organization, siteConfig } from '@/config/seo';
import { escapeJsonLd } from '@/utils/helpers';

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
 * @param {Array} [product.images] - Array of product image objects or URLs
 * @param {string|Object} [product.brand] - Brand name or brand object with name property
 * @param {string} [product.sku] - Stock-keeping unit identifier
 * @param {number|string} [product.price] - Product price
 * @param {string} [product.priceCurrency='BDT'] - ISO 4217 currency code
 * @param {boolean} [product.inStock=true] - Whether the product is in stock
 * @param {string} [product.url] - Canonical product URL
 * @param {string} [product.slug] - Product slug for URL generation
 * @param {string} [product._id] - Product ID (used to build URL if url and slug not provided)
 * @param {number|Object} [product.rating] - Product rating (number or {average, count} object)
 * @param {number} [product.reviewCount] - Number of reviews
 * @param {Array<string>} [product.certifications] - Array of certifications (DGDA, CE, ISO)
 * @returns {Object|null} Product JSON-LD object or null if product is invalid
 *
 * Validates: Requirements 3, 4, 7, 10
 */
export function generateProductSchema(product) {
  // Handle null/undefined inputs gracefully
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
    images,
    brand,
    sku,
    price,
    priceCurrency = 'BDT',
    inStock = true,
    url,
    slug,
    _id,
    rating,
    reviewCount,
    certifications,
  } = product;

  // Prefer slug over _id for canonical URLs
  const productUrl =
    url ||
    (slug ? `${siteConfig.url}/products/${slug}` : _id ? `${siteConfig.url}/products/${_id}` : siteConfig.url);

  // Availability: InStock or OutOfStock based on product.inStock
  const availability = inStock
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  // Resolve brand name whether it's a string or populated object
  const brandName = typeof brand === 'object' ? brand?.name : brand;

  // Collect all product images for the schema (as array of all image URLs)
  const imageUrls = images?.length
    ? images.map(img => (typeof img === 'string' ? img : img?.url)).filter(Boolean)
    : image
    ? [image]
    : [];

  // Handle rating - can be a number or { average, count } object
  let ratingValue = null;
  let ratingCount = reviewCount;

  if (rating) {
    if (typeof rating === 'object' && rating.average !== undefined) {
      // Rating is an object with { average, count }
      ratingValue = rating.average;
      ratingCount = rating.count || ratingCount;
    } else if (typeof rating === 'number') {
      // Rating is a simple number
      ratingValue = rating;
    }
  }

  // priceValidUntil: 1 year from now in ISO format
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const priceValidUntil = oneYearFromNow.toISOString().split('T')[0];

  // Build the schema
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: escapeJsonLd(name || ''),
    description: escapeJsonLd(description || ''),
    // Include all images as array
    ...(imageUrls.length > 0 && { image: imageUrls }),
    // Brand as { "@type": "Brand", "name": brandName }
    ...(brandName && {
      brand: {
        '@type': 'Brand',
        name: escapeJsonLd(brandName),
      },
    }),
    ...(sku && { sku }),
    url: productUrl,
    // AggregateRating — only when product.rating exists and is valid
    ...(ratingValue && Number(ratingValue) > 0 && ratingCount && Number(ratingCount) > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(ratingValue).toFixed(1),
        reviewCount: Number(ratingCount),
        bestRating: '5',
        worstRating: '1',
      },
    }),
    // Offers object with all required fields
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency,
      price: price !== undefined ? Number(price).toFixed(2) : '0.00',
      availability,
      priceValidUntil,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'MediportBD',
        url: siteConfig.url,
      },
      // Shipping details for Bangladesh delivery
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'BDT',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'BD',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 2,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 5,
            unitCode: 'DAY',
          },
        },
      },
    },
    // additionalProperty array for certifications (DGDA, CE, ISO)
    ...(certifications?.length > 0 && {
      additionalProperty: certifications.map(cert => ({
        '@type': 'PropertyValue',
        name: escapeJsonLd(cert),
        value: 'Certified',
      })),
    }),
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
 * Accepts array of { name, url } items and generates BreadcrumbList with ListItem entries
 * at positions 1 (Home), 2 (Category), 3 (Product), using slug in product URL with ID fallback.
 *
 * @param {Array<{name: string, url: string}>} breadcrumbs - Ordered list of breadcrumb items
 * @returns {Object|null} BreadcrumbList JSON-LD object, or null if input is invalid
 *
 * Validates: Requirements 3, 4, 7, 10
 */
export function generateBreadcrumbSchema(breadcrumbs) {
  // Handle null/undefined inputs gracefully (return null, log error in dev)
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
    name: escapeJsonLd(crumb.name),
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
      // Use string shorthand — NOT an EntryPoint object.
      // The EntryPoint object format causes Google to crawl the template URL
      // literally as /products?q={search_term_string} (Soft 404).
      // The string shorthand is the correct format per Google's Sitelinks
      // Search Box documentation and prevents the literal crawl.
      target: `${siteConfig.url}/products?q={search_term_string}`,
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

