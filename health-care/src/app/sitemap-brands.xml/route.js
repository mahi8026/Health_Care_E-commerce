/**
 * Brand Pages Sitemap for MediportBD
 * Contains all public brand/manufacturer landing pages.
 */

import { SITE_CONFIG } from '@/config/seo';
import { API } from '@/constants/api';

export async function GET() {
  const now = new Date().toISOString();

  let brands = [];
  try {
    const res = await fetch(`${API}/manufacturers`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const list = data.data?.manufacturers || data.manufacturers || [];
      brands = Array.isArray(list) ? list : [];
    }
  } catch {
    // fall through with empty list
  }

  const brandPages = brands
    .filter(b => b.slug)
    .map(b => ({
      url: `${SITE_CONFIG.url}/brands/${b.slug}`,
      lastModified: b.updatedAt || now,
    }));

  const urlset = brandPages.map(page => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${new Date(page.lastModified).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
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