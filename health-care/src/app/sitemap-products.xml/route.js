/**
 * Product Pages Sitemap — Live Dynamic Route
 *
 * Fetches all active products from the API and emits a full sitemap.
 * Cached at the CDN edge for 12 hours (s-maxage=43200) so Google sees
 * fresh URLs within half a day of a new product being published —
 * no build/deploy needed.
 *
 * Filters out bare MongoDB ObjectIds so the sitemap only contains
 * canonical slug-based URLs (e.g. /products/siemens-ecg-cardiostat-pro).
 *
 * Route: /sitemap-products.xml
 */

import { SITE_CONFIG } from '@/config/seo';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://health-care-e-commerce-ubyy.onrender.com/api';

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;

/** Fetch one page of products (slug + updatedAt only). */
async function fetchPage(page) {
  try {
    const res = await fetch(
      `${API_BASE}/products?page=${page}&limit=100&fields=slug,updatedAt`,
      // 6-hour ISR cache (was 12h). Halved so deleted/renamed products stop
      // appearing in the sitemap within half a day rather than a full day,
      // reducing "Redirect error" entries in Google Search Console.
      { next: { revalidate: 21600 } }
    );
    if (!res.ok) return { products: [], hasMore: false };
    const data = await res.json();
    const products = Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.products)
      ? data.products
      : [];
    const pagination = data.pagination || {};
    const hasMore = page < (pagination.totalPages || 1) && products.length === 100;
    return { products, hasMore };
  } catch {
    return { products: [], hasMore: false };
  }
}

/** Fetch all products across pages (max 50 pages = 5,000 products). */
async function fetchAllProducts() {
  const all = [];
  let page = 1;
  const MAX_PAGES = 50;

  while (page <= MAX_PAGES) {
    const { products, hasMore } = await fetchPage(page);
    all.push(...products);
    if (!hasMore) break;
    page++;
  }

  return all;
}

export async function GET() {
  const now = new Date().toISOString();
  const products = await fetchAllProducts();

  const urls = products
    .filter(p => p.slug && !MONGO_ID_RE.test(p.slug))
    .map(p => {
      const lastmod = p.updatedAt
        ? new Date(p.updatedAt).toISOString()
        : now;
      return `
  <url>
    <loc>${SITE_CONFIG.url}/products/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      // Edge CDN caches for 6 hours; browser revalidates after 1 hour.
      // Halved from 12h so deleted/renamed products clear the sitemap faster.
      'Cache-Control': 'public, max-age=3600, s-maxage=21600, stale-while-revalidate=43200',
    },
  });
}
