/**
 * Sitemap Generator for MedCore BD
 *
 * Served at /sitemap.xml by the Next.js App Router convention.
 * Includes static pages, category landing pages, and all product detail pages.
 */

import { SITE_CONFIG } from '@/config/seo';
import { API } from '@/constants/api';

const SITE_URL = SITE_CONFIG.url;

// Product categories to include as crawlable category pages
const CATEGORIES = [
  'Diagnostic Equipment',
  'Surgical Instruments',
  'Laboratory Reagents',
  'Hospital Machines',
  'Lab Equipment',
  'PPE & Safety',
  'Dental Equipment',
  'Implants & Ortho',
];

export default async function sitemap() {
  const now = new Date().toISOString();

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPages = [
    { url: SITE_URL,                    lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/products`,      lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/reagent-store`, lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/b2b`,           lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/search`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${SITE_URL}/register`,      lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/login`,         lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // ── Category landing pages ────────────────────────────────────────────────
  const categoryPages = CATEGORIES.map(cat => ({
    url:             `${SITE_URL}/products?category=${encodeURIComponent(cat)}`,
    lastModified:    now,
    changeFrequency: 'daily',
    priority:        0.85,
  }));

  // ── Dynamic product pages ─────────────────────────────────────────────────
  let productPages = [];
  try {
    // Build absolute URL for API call
    // In dev: API is '/api', need to prepend SITE_URL
    // In prod: API is already absolute 'https://...'
    const apiUrl = API.startsWith('http') ? API : `${SITE_URL}${API}`;
    const productsUrl = `${apiUrl}/products?limit=5000&fields=slug,_id,updatedAt`;
    
    const res = await fetch(productsUrl, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const products = data.data?.products || data.products || [];

    productPages = products.map(product => ({
      url:             `${SITE_URL}/products/${product.slug || product._id}`,
      lastModified:    product.updatedAt ? new Date(product.updatedAt).toISOString() : now,
      changeFrequency: 'weekly',
      priority:        0.7,
    }));
  } catch (err) {
    // Graceful degrade — static + category pages always returned
    // Note: During build time, backend may not be running, so this is expected
    process.env.NODE_ENV !== "production" && console.error('[sitemap] Failed to fetch products:', err.message);
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
