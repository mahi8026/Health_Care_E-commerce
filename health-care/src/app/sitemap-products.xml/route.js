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
 * Priority calculation based on:
 * - Product age (newer products get higher priority)
 * - Stock status (in-stock products prioritized)
 * - Category importance (diagnostic equipment > accessories)
 * - Update frequency (recently updated products ranked higher)
 *
 * Route: /sitemap-products.xml
 */

import { SITE_CONFIG } from '@/config/seo';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://health-care-e-commerce-ubyy.onrender.com/api';

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;

// Top-priority categories for SEO
const TOP_CATEGORIES = [
  'Diagnostic Equipment',
  'Laboratory Reagents',
  'Hospital Machines',
  'Surgical Instruments',
  'Laboratory Equipment'
];

/**
 * Calculate dynamic priority for a product based on multiple factors
 * @param {Object} product - Product data with slug, createdAt, stock, category
 * @returns {string} Priority value between 0.4 and 0.9
 */
function calculatePriority(product) {
  let priority = 0.5; // Base priority for all products

  // 1. Category importance boost (+0.2 for top categories)
  const categoryName = typeof product.category === 'object' 
    ? product.category?.name 
    : product.category;
  
  if (categoryName && TOP_CATEGORIES.includes(categoryName)) {
    priority += 0.2;
  }

  // 2. Stock status boost (+0.1 for in-stock)
  if (product.stock > 0 || product.inStock === true) {
    priority += 0.1;
  }

  // 3. Product age boost (newer products within 60 days get +0.15)
  if (product.createdAt) {
    const daysSinceCreated = (Date.now() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 60) {
      priority += 0.15;
    }
  }

  // 4. Recently updated boost (+0.05 for updates within 30 days)
  if (product.updatedAt) {
    const daysSinceUpdated = (Date.now() - new Date(product.updatedAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdated < 30) {
      priority += 0.05;
    }
  }

  // Cap at 0.9 (homepage is 1.0, category pages are 0.9)
  return Math.min(priority, 0.9).toFixed(1);
}

/**
 * Calculate changefreq based on product update patterns
 * @param {Object} product - Product with updatedAt timestamp
 * @returns {string} One of: daily, weekly, monthly
 */
function calculateChangeFreq(product) {
  if (!product.updatedAt) return 'monthly';

  const daysSinceUpdate = (Date.now() - new Date(product.updatedAt)) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate < 7) return 'daily';
  if (daysSinceUpdate < 30) return 'weekly';
  return 'monthly';
}

/** Fetch one page of products (slug + updatedAt only). */
async function fetchPage(page) {
  try {
    const res = await fetch(
      `${API_BASE}/products?page=${page}&limit=100&fields=slug,updatedAt,createdAt,stock,inStock,category`,
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
      const priority = calculatePriority(p);
      const changefreq = calculateChangeFreq(p);
      
      return `
  <url>
    <loc>${SITE_CONFIG.url}/products/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
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
