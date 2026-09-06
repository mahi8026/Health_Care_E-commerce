/**
 * robots.txt Generator for MediportBD
 *
 * Served at /robots.txt by the Next.js App Router convention.
 * Disallows private/transactional paths and provides Googlebot-specific rules.
 */

import { SITE_CONFIG } from '@/config/seo';

export default function robots() {
  const SITE_URL = SITE_CONFIG.url;

  return {
    rules: [
      // All crawlers — allow everything except private/utility paths
      {
        userAgent: '*',
        allow:     '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/account',
          '/account/*',
          '/checkout',
          '/checkout/*',
          '/cart',
          '/b2b/dashboard',
          '/b2b/dashboard/*',
          '/api/*',
          '/oauth/*',
          '/auth/*',
          '/offline',
          '/demo',
          '/demo/*',
          '/demo-loading',
          '/og',
          '/og/*',
          '/search', // Search results should not be indexed
          '/search/*',
          '/returns/request',
          '/returns/request/*',
          '/returns/my-returns',
          '/returns/my-returns/*',
          '/orders',
          '/orders/*',
          '/track',
          '/track/*',
          '/quotes', // Quote requests are private
          '/quotes/*',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/wishlist', // User-specific content
          // Block Next.js static font files — they have no SEO value and
          // waste crawl budget (seen as "Crawled - currently not indexed" in GSC)
          '/_next/static/media/',
          '/_next/static/media/*',
          // Block paginated/filtered product URLs to prevent duplicate content
          '/products?*page=*', // Pagination
          '/products?*sort=*', // Sort variations
          '/products?*minPrice=*', // Price filters
          '/products?*maxPrice=*',
        ],
      },
      // Googlebot — same disallows (must be kept in sync with * rule)
      {
        userAgent:  'Googlebot',
        allow:      '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/account/*',
          '/checkout',
          '/checkout/*',
          '/cart',
          '/b2b/dashboard',
          '/b2b/dashboard/*',
          '/api/*',
          '/oauth/*',
          '/auth/*',
          '/offline',
          '/demo',
          '/demo/*',
          '/demo-loading',
          '/og',
          '/og/*',
          '/search',
          '/search/*',
          '/returns/request',
          '/returns/request/*',
          '/returns/my-returns',
          '/returns/my-returns/*',
          '/orders',
          '/orders/*',
          '/track',
          '/track/*',
          '/quotes',
          '/quotes/*',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/wishlist',
          '/_next/static/media/',
          '/_next/static/media/*',
          '/products?*page=*',
          '/products?*sort=*',
          '/products?*minPrice=*',
          '/products?*maxPrice=*',
        ],
        crawlDelay: 1, // Reduced from 2 to 1 second for faster crawling
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host:    SITE_URL,
  };
}
