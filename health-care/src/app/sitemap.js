/**
 * Sitemap Generator for MedCore BD
 *
 * Served at /sitemap.xml by the Next.js App Router convention.
 * Includes static pages, category landing pages, and all product detail pages.
 * 
 * Note: This is a dynamic route that regenerates on each request with 1-hour cache.
 * This ensures the sitemap always reflects the current product catalog.
 */

import { SITE_CONFIG } from '@/config/seo';

const SITE_URL = SITE_CONFIG.url;

// Revalidate every hour
export const revalidate = 3600;

// Get the backend API URL - use the full URL from env var
const getBackendUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // If it's already a full URL, use it
  if (apiUrl && apiUrl.startsWith('http')) {
    return apiUrl;
  }
  
  // If it's a relative path, construct the full URL
  // In production, this should not happen as NEXT_PUBLIC_API_URL should be absolute
  if (apiUrl && apiUrl.startsWith('/')) {
    return `${SITE_URL}${apiUrl}`;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:5001/api';
};

// Wake up the backend if it's sleeping (Render.com free tier spins down after 15 min)
async function wakeUpBackend(backendUrl) {
  try {
    // Make a simple request to wake up the backend
    const wakeUpResponse = await fetch(`${backendUrl}/products?limit=1`, {
      signal: AbortSignal.timeout(30000), // 30 second timeout for wake-up
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MedCore-Sitemap-Generator',
      },
    });
    
    if (wakeUpResponse.ok) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    return false;
  }
}

// Category slugs — used for clean crawlable URLs in the sitemap.
// These match the category filter values used on the products page.
const CATEGORY_SLUGS = [
  { name: 'Diagnostic Equipment',  slug: 'diagnostic-equipment' },
  { name: 'Surgical Instruments',  slug: 'surgical-instruments' },
  { name: 'Laboratory Reagents',   slug: 'laboratory-reagents' },
  { name: 'Hospital Machines',     slug: 'hospital-machines' },
  { name: 'Lab Equipment',         slug: 'lab-equipment' },
  { name: 'PPE & Safety',          slug: 'ppe-safety' },
  { name: 'Dental Equipment',      slug: 'dental-equipment' },
  { name: 'Implants & Ortho',      slug: 'implants-ortho' },
];

export default async function sitemap() {
  const now = new Date().toISOString();

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPages = [
    { url: SITE_URL,                    lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/products`,      lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/reagent-store`, lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/b2b`,           lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/about`,         lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/search`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${SITE_URL}/register`,      lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/login`,         lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // ── Category landing pages ────────────────────────────────────────────────
  // Use slug-based URLs — Google indexes these as distinct pages with
  // their own title, description, and canonical URL.
  const categoryPages = CATEGORY_SLUGS.map(cat => ({
    url:             `${SITE_URL}/products/category/${cat.slug}`,
    lastModified:    now,
    changeFrequency: 'daily',
    priority:        0.85,
  }));

  // ── Dynamic product pages ─────────────────────────────────────────────────
  let productPages = [];
  try {
    const backendUrl = getBackendUrl();
    
    // Try to wake up the backend first (handles Render.com free tier spin-down)
    const isAwake = await wakeUpBackend(backendUrl);
    
    if (!isAwake) {
      return [...staticPages, ...categoryPages];
    }
    
    // Fetch products in paginated batches (backend limits to max 100 per request)
    const BATCH_SIZE = 100;
    const MAX_PRODUCTS = 10000; // Safety limit to prevent infinite loops
    let allProducts = [];
    let currentPage = 1;
    let hasMorePages = true;
    
    while (hasMorePages && allProducts.length < MAX_PRODUCTS) {
      const productsUrl = `${backendUrl}/products?page=${currentPage}&limit=${BATCH_SIZE}&fields=slug,_id,updatedAt`;

      const res = await fetch(productsUrl, { 
        next: { revalidate: 3600 },
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MedCore-Sitemap-Generator',
        },
        // Shorter timeout since backend should already be awake
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const products = data.data?.products || data.products || [];
      
      if (products.length === 0) {
        hasMorePages = false;
      } else {
        allProducts = allProducts.concat(products);
        
        // Check if there are more pages (pagination metadata)
        const totalPages = data.data?.pagination?.totalPages || data.pagination?.totalPages;
        if (totalPages && currentPage >= totalPages) {
          hasMorePages = false;
        } else if (products.length < BATCH_SIZE) {
          // If we got fewer products than requested, we've reached the end
          hasMorePages = false;
        } else {
          currentPage++;
        }
      }
    }

    productPages = allProducts
      .filter(product => product.slug || product._id) // skip products with no identifier
      .map(product => ({
        // Always prefer slug — canonical URLs must match generateMetadata()
        url:             `${SITE_URL}/products/${product.slug || product._id}`,
        lastModified:    product.updatedAt ? new Date(product.updatedAt).toISOString() : now,
        changeFrequency: 'weekly',
        priority:        0.7,
      }));
  } catch (err) {
    // Graceful degrade — static + category pages always returned.
    // This ensures the sitemap is always valid even if the backend is unavailable.
    console.error('[sitemap] Failed to fetch products:', err.message);
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
