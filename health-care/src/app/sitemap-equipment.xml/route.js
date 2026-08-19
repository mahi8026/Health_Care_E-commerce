/**
 * Equipment Landing Pages Sitemap for MediportBD
 * All /equipment and /equipment/[slug] URLs.
 */

import { SITE_CONFIG } from '@/config/seo';
import { LANDING_PAGES } from '@/config/landingPages';

export async function GET() {
  const now = new Date().toISOString();

  const urls = [
    { url: `${SITE_CONFIG.url}/equipment`, lastmod: now, priority: 0.9 },
    ...LANDING_PAGES.map(page => ({
      url: `${SITE_CONFIG.url}/equipment/${page.slug}`,
      lastmod: now,
      priority: 0.8,
    })),
  ];

  const urlset = urls.map(page => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
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