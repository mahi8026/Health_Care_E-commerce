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
import { CATEGORY_SLUG_MAP } from '@/constants/categories';

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

  // Only slugs the category route can actually render may be advertised.
  //
  // /products/category/[slug] calls notFound() for any slug that is missing
  // from CATEGORY_SLUG_MAP, so the raw API/DB list can (and did) advertise
  // URLs that return 404, while also omitting slugs that do render.
  // CATEGORY_SLUG_MAP is therefore the authoritative slug set; the API is
  // used only to obtain real lastmod timestamps where available.
  const dbBySlug = new Map(
    (Array.isArray(categories) ? categories : [])
      .filter((c) => c && c.slug)
      .map((c) => [c.slug, c])
  );

  const categoryPages = Object.keys(CATEGORY_SLUG_MAP).map(slug => ({
    url: `${SITE_CONFIG.url}/products/category/${slug}`,
    lastModified: dbBySlug.get(slug)?.updatedAt || FALLBACK_DATE,
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
