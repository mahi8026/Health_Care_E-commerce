/**
 * Product Pages Sitemap for MedCore BD
 * 
 * Contains all product detail pages (up to 1000 products).
 * Optimized for Cloudflare Workers 30-second timeout.
 * 
 * Strategy:
 * 1. Fetch all products in a single request with high limit (faster than batching)
 * 2. If backend is cold/slow/times out, return empty sitemap (graceful degradation)
 * 3. Cache successful responses for 1 hour, empty responses for 5 minutes
 * 4. Google will retry empty sitemaps automatically
 * 
 * Route: /sitemap-products.xml
 */

import { SITE_CONFIG } from '@/config/seo';

const SITE_URL = SITE_CONFIG.url;

// Get the backend API URL
const getBackendUrl = () => {
  // In production on Cloudflare Workers, always use the production API
  if (process.env.NODE_ENV === 'production') {
    return 'https://health-care-e-commerce.onrender.com/api';
  }
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (apiUrl && apiUrl.startsWith('http')) {
    return apiUrl;
  }
  
  if (apiUrl && apiUrl.startsWith('/')) {
    return `${SITE_URL}${apiUrl}`;
  }
  
  return 'http://localhost:5001/api';
};

// Fetch products with timeout and retry logic
async function fetchProducts() {
  const backendUrl = getBackendUrl();
  const TIMEOUT_MS = 25000; // 25 seconds total timeout (Cloudflare Workers limit)
  
  try {
    const startTime = Date.now();
    
    // Fetch all products in a single request with high limit
    // This is faster than batching for Cloudflare Workers
    const productsUrl = `${backendUrl}/products?limit=1000&fields=slug,_id,updatedAt`;

    const res = await fetch(productsUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MedCore-Sitemap-Products',
      },
    });
    
    if (!res.ok) {
      console.error('[sitemap-products] Backend fetch failed:', res.status);
      return [];
    }
    
    const data = await res.json();
    // API returns { success, data: [...products], pagination }
    const products = Array.isArray(data.data) ? data.data : (data.data?.products || data.products || []);
    
    console.log(`[sitemap-products] Fetched ${products.length} products in ${Date.now() - startTime}ms`);
    return products;
    
  } catch (err) {
    console.error('[sitemap-products] Error fetching products:', err.message);
    return [];
  }
}

export async function GET() {
  const now = new Date().toISOString();
  
  // Fetch products
  const products = await fetchProducts();
  
  // If no products fetched, return minimal valid sitemap
  if (products.length === 0) {
    const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- No products available at generation time. Backend may be cold-starting. -->
  <!-- This sitemap will be regenerated on next request. -->
</urlset>`;

    return new Response(emptySitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minute cache (retry soon)
      },
    });
  }
  
  // Generate product URLs
  const productPages = products
    .filter(product => product.slug || product._id)
    .map(product => ({
      url: `${SITE_URL}/products/${product.slug || product._id}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt).toISOString() : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  const urlset = productPages.map(page => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlset}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
    },
  });
}
