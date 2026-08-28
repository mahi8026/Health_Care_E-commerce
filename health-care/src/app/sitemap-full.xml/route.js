/**
 * Full Sitemap for MediportBD
 *
 * Combines all page types into one sitemap: static pages, categories,
 * brands, guides, equipment, topics, and products.
 *
 * This replaces the old build-time generated public/sitemap-full.xml.
 * Cached at the CDN edge for 12 hours so new content surfaces quickly.
 *
 * Route: /sitemap-full.xml
 */

import { SITE_CONFIG } from '@/config/seo';
import { CATEGORY_SLUG_MAP } from '@/constants/categories';
import { API } from '@/constants/api';

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;
const SITE_URL = SITE_CONFIG.url;

// ---------------------------------------------------------------------------
// Static pages — these never change
// ---------------------------------------------------------------------------
function staticUrls(now) {
  return [
    { loc: SITE_URL,                         pri: 1.0, freq: 'daily'   },
    { loc: `${SITE_URL}/products`,           pri: 0.9, freq: 'daily'   },
    { loc: `${SITE_URL}/equipment`,          pri: 0.9, freq: 'weekly'  },
    { loc: `${SITE_URL}/reagent-store`,      pri: 0.9, freq: 'daily'   },
    { loc: `${SITE_URL}/b2b`,                pri: 0.8, freq: 'weekly'  },
    { loc: `${SITE_URL}/topics`,             pri: 0.8, freq: 'weekly'  },
    { loc: `${SITE_URL}/guides`,             pri: 0.8, freq: 'monthly' },
    { loc: `${SITE_URL}/brands`,             pri: 0.8, freq: 'weekly'  },
    { loc: `${SITE_URL}/compare`,            pri: 0.7, freq: 'monthly' },
    { loc: `${SITE_URL}/about`,              pri: 0.7, freq: 'monthly' },
    { loc: `${SITE_URL}/dgda-info`,          pri: 0.7, freq: 'monthly' },
    { loc: `${SITE_URL}/certifications`,     pri: 0.7, freq: 'monthly' },
    { loc: `${SITE_URL}/faq`,                pri: 0.6, freq: 'monthly' },
    { loc: `${SITE_URL}/contact`,            pri: 0.6, freq: 'monthly' },
    { loc: `${SITE_URL}/careers`,            pri: 0.6, freq: 'monthly' },
    { loc: `${SITE_URL}/news`,               pri: 0.6, freq: 'weekly'  },
    { loc: `${SITE_URL}/warranty`,           pri: 0.6, freq: 'monthly' },
    { loc: `${SITE_URL}/help`,               pri: 0.5, freq: 'monthly' },
    { loc: `${SITE_URL}/privacy`,            pri: 0.3, freq: 'yearly'  },
    { loc: `${SITE_URL}/terms`,              pri: 0.3, freq: 'yearly'  },
  ].map(p => ({ ...p, lastmod: now }));
}

// ---------------------------------------------------------------------------
// Category pages — from constants (no API call needed)
// ---------------------------------------------------------------------------
function categoryUrls(now) {
  return Object.keys(CATEGORY_SLUG_MAP).map(slug => ({
    loc:     `${SITE_URL}/products/category/${slug}`,
    lastmod: now,
    pri:     0.85,
    freq:    'daily',
  }));
}

// ---------------------------------------------------------------------------
// Brands — live API fetch
// ---------------------------------------------------------------------------
async function brandUrls(now) {
  try {
    const res = await fetch(`${API}/manufacturers?limit=100`, {
      next: { revalidate: 43200 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = data.data?.manufacturers || data.manufacturers || [];
    return (Array.isArray(list) ? list : [])
      .filter(b => b.slug)
      .map(b => ({
        loc:     `${SITE_URL}/brands/${b.slug}`,
        lastmod: b.updatedAt ? new Date(b.updatedAt).toISOString() : now,
        pri:     0.7,
        freq:    'weekly',
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Products — paginated live API fetch
// ---------------------------------------------------------------------------
async function productUrls(now) {
  const all = [];
  let page = 1;
  const MAX_PAGES = 50;

  while (page <= MAX_PAGES) {
    try {
      const res = await fetch(
        `${API}/products?page=${page}&limit=100&fields=slug,updatedAt`,
        { next: { revalidate: 43200 } }
      );
      if (!res.ok) break;
      const data = await res.json();
      const products = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.products)
        ? data.products
        : [];

      products
        .filter(p => p.slug && !MONGO_ID_RE.test(p.slug))
        .forEach(p => all.push({
          loc:     `${SITE_URL}/products/${p.slug}`,
          lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString() : now,
          pri:     0.7,
          freq:    'weekly',
        }));

      const pagination = data.pagination || {};
      if (page >= (pagination.totalPages || 1) || products.length < 100) break;
      page++;
    } catch {
      break;
    }
  }
  return all;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function GET() {
  const now = new Date().toISOString();

  // Fetch all dynamic data in parallel
  const [brands, products] = await Promise.all([
    brandUrls(now),
    productUrls(now),
  ]);

  const allUrls = [
    ...staticUrls(now),
    ...categoryUrls(now),
    ...brands,
    ...products,
  ];

  const urlset = allUrls.map(u => `
  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlset}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=43200, stale-while-revalidate=86400',
    },
  });
}
