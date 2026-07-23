/**
 * Category Pages Sitemap for MediportBD
 * Contains all category landing pages.
 * Slugs must match MongoDB Category.slug field exactly.
 */

import { SITE_CONFIG } from '@/config/seo';
import { CATEGORY_SLUG_MAP } from '@/constants/categories';

export async function GET() {
  const now = new Date().toISOString();

  const categoryPages = Object.keys(CATEGORY_SLUG_MAP).map(slug => ({
    url: `${SITE_CONFIG.url}/products/category/${slug}`,
    lastModified: now,
  }));

  const urlset = categoryPages.map(page => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlset}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
