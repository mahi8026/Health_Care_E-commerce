/**
 * Category Pages Sitemap for MediportBD
 * Contains all category landing pages.
 * Slugs must match MongoDB Category.slug field exactly.
 * 
 * IMPORTANT: lastmod should reflect actual category content changes,
 * not sitemap generation time. We fetch categories from API to get
 * real updatedAt timestamps.
 */

import { SITE_CONFIG } from '@/config/seo';
import { API } from '@/constants/api';

const FALLBACK_DATE = '2026-08-15T00:00:00.000Z'; // Realistic fallback for established categories

export async function GET() {
  const now = new Date().toISOString();

  // Fetch categories from API to get actual updatedAt timestamps
  let categories = [];
  try {
    const res = await fetch(`${API}/categories`, { next: { revalidate: 86400 } }); // 24h cache
    if (res.ok) {
      const data = await res.json();
      const list = data.data?.categories || data.categories || [];
      categories = Array.isArray(list) ? list : [];
    }
  } catch (err) {
    console.error('Failed to fetch categories for sitemap:', err.message);
  }

  // Use actual category data if available, otherwise use static slugs
  const categoryPages = categories.length > 0
    ? categories.filter(c => c.slug).map(c => ({
        url: `${SITE_CONFIG.url}/products/category/${c.slug}`,
        lastModified: c.updatedAt || FALLBACK_DATE,
      }))
    : Object.keys(require('@/constants/categories').CATEGORY_SLUG_MAP || {}).map(slug => ({
        url: `${SITE_CONFIG.url}/products/category/${slug}`,
        lastModified: FALLBACK_DATE,
      }));

  const urlset = categoryPages.map(page => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${new Date(page.lastModified).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
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
