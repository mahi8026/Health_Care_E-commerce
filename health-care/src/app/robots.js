/**
 * robots.txt Generator for MedCore BD
 *
 * Served at /robots.txt by the Next.js App Router convention.
 * Disallows private/transactional paths and provides Googlebot-specific rules.
 */

import { SITE_CONFIG } from '@/config/seo';

export default function robots() {
  const SITE_URL = SITE_CONFIG.url;

  return {
    rules: [
      // All crawlers — allow everything except private paths
      {
        userAgent: '*',
        allow:     '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/account',
          '/account/*',
          '/checkout',
          '/cart',
          '/b2b/dashboard',
          '/api/*',
          '/oauth/*',
        ],
      },
      // Googlebot — same disallows with explicit crawl delay
      {
        userAgent:  'Googlebot',
        allow:      '/',
        disallow:   ['/admin/*', '/account/*', '/checkout', '/cart', '/api/*'],
        crawlDelay: 2,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host:    SITE_URL,
  };
}
