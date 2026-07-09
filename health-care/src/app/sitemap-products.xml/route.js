/**
 * Product Pages Sitemap for MedCore BD
 * 
 * Contains all product detail pages.
 * This sitemap is resilient to backend timeouts and cold starts.
 * 
 * Strategy:
 * 1. Attempt to fetch products from backend with aggressive timeout
 * 2. If backend is cold/slow, return empty sitemap (graceful degradation)
 * 3. Cache successful responses for 1 hour
 * 4. Google will retry failed requests automatically
 * 
 * Route: /sitemap-products.xml
 */

import { SITE_CONFIG } from '@/config/seo';

const SITE_URL = SITE_CONFIG.url;

// Get the backend API URL
const getBackendUrl = () => {
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
  const BATCH_SIZE = 100;
  const MAX_PRODUCTS = 10000;
  const TIMEOUT_MS = 45000; // 45 seconds total timeout for all requests
  
  let allProducts = [];
  let currentPage = 1;
  let hasMorePages = true;
  const startTime = Date.now();
  
  try {
    // Wake up backend with initial request
    const wakeUpRes = await fetch(`${backendUrl}/products?limit=1`, {
      signal: AbortSignal.timeout(20000), // 20 second timeout for cold start
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MedCore-Sitemap-Products',
      },
    });
    
    if (!wakeUpRes.ok) {
      console.error('[sitemap-products] Backend wake-up failed:', wakeUpRes.status);
      return [];
    }
    
    // Fetch products in batches
    while (hasMorePages && allProducts.length < MAX_PRODUCTS) {
      // Check if we're running out of time
      const elapsed = Date.now() - startTime;
      if (elapsed > TIMEOUT_MS) {
        console.warn('[sitemap-products] Timeout reached, returning partial results');
        break;
      }
      
      const remainingTime = TIMEOUT_MS - elapsed;
      const batchTimeout = Math.min(remainingTime, 10000); // Max 10 seconds per batch
      
      const productsUrl = `${backendUrl}/products?page=${currentPage}&limit=${BATCH_SIZE}&fields=slug,_id,updatedAt`;

      const res = await fetch(productsUrl, {
        signal: AbortSignal.timeout(batchTimeout),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MedCore-Sitemap-Products',
        },
      });
      
      if (!res.ok) {
        console.error(`[sitemap-products] Batch ${currentPage} failed:`, res.status);
        break;
      }
      
      const data = await res.json();
      // API returns { success, data: [...products], pagination }
      const products = Array.isArray(data.data) ? data.data : (data.data?.products || data.products || []);
      
      if (products.length === 0) {
        hasMorePages = false;
      } else {
        allProducts = allProducts.concat(products);
        
        // Check pagination metadata
        const totalPages = data.pagination?.totalPages;
        if (totalPages && currentPage >= totalPages) {
          hasMorePages = false;
        } else if (products.length < BATCH_SIZE) {
          hasMorePages = false;
        } else {
          currentPage++;
        }
      }
    }
    
    console.log(`[sitemap-products] Fetched ${allProducts.length} products in ${Date.now() - startTime}ms`);
    return allProducts;
    
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
