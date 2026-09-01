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
          '/returns/request',
          '/returns/request/*',
          '/returns/my-returns',
          '/returns/my-returns/*',
          '/orders',
          '/orders/*',
          '/track',
          '/track/*',
          // Block Next.js static font files — they have no SEO value and
          // waste crawl budget (seen as "Crawled - currently not indexed" in GSC)
          '/_next/static/media/',
          '/_next/static/media/*',
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
          '/returns/request',
          '/returns/request/*',
          '/returns/my-returns',
          '/returns/my-returns/*',
          '/orders',
          '/orders/*',
          '/track',
          '/track/*',
          '/_next/static/media/',
          '/_next/static/media/*',
        ],
        crawlDelay: 2,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host:    SITE_URL,
  };
}
