/**
 * robots.txt Generator for MedCore BD
 *
 * Next.js App Router convention: this file is automatically picked up
 * and served at /robots.txt by the framework.
 *
 * Requirements: 7.4, 7.5
 */

/**
 * Generate robots.txt directives.
 *
 * Disallows crawling of authenticated/private paths and includes a
 * Sitemap directive so crawlers can discover all public URLs.
 *
 * @returns {{ rules: Array, sitemap: string }}
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/b2b', '/checkout', '/cart', '/api'],
      },
    ],
    sitemap: 'https://medcorebd.com/sitemap.xml',
  }
}
