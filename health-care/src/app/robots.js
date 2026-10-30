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
          // NOTE: /search is deliberately NOT disallowed. The page emits its own
          // meta noindex (app/search/page.jsx); a robots.txt block would stop
          // crawlers from ever reading that noindex, which is how URLs end up
          // reported as "indexed, though blocked by robots.txt".
          '/returns/request',
          '/returns/request/*',
          '/returns/my-returns',
          '/returns/my-returns/*',
          '/orders',
          '/orders/*',
          '/track',
          '/track/*',
          // /quotes/request carries its own noindex (app/quotes/request/page.jsx)
          // and is now linked from four public CTAs, so it must stay crawlable
          // for that noindex to be seen.
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
          // Same reasoning as the * group above: noindex, not robots-blocked.
          '/returns/request',
          '/returns/request/*',
          '/returns/my-returns',
          '/returns/my-returns/*',
          '/orders',
          '/orders/*',
          '/track',
          '/track/*',
          // /quotes/request: noindex page linked publicly — must stay crawlable.
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
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host:    SITE_URL,
  };
}
