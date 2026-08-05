/**
 * Guides & Comparisons Sitemap for MediportBD
 *
 * All /guides and /compare URLs, sourced from the content registry.
 * Route: /sitemap-guides.xml
 */

import { SITE_CONFIG } from '@/config/seo';
import { GUIDES } from '@/config/guides';

export async function GET() {
  const now = new Date().toISOString();

  const urls = [
    { url: `${SITE_CONFIG.url}/guides`, lastmod: now, priority: 0.8 },
    { url: `${SITE_CONFIG.url}/compare`, lastmod: now, priority: 0.7 },
    ...GUIDES.map(guide => ({
      url: `${SITE_CONFIG.url}/guides/${guide.slug}`,
      lastmod: guide.updatedAt,
      priority: guide.type === 'pillar' ? 0.9 : 0.7,
    })),
  ];

  const urlset = urls.map(page => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page.priority}</priority>
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
