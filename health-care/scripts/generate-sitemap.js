/**
 * Build-Time Product Sitemap Generator
 * 
 * Fetches all products from backend API and generates a static sitemap XML file.
 * This runs during `npm run build` to avoid runtime API calls and timeouts.
 * 
 * Output: public/sitemap-products-static.xml
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://health-care-e-commerce.mahimrahman545.workers.dev';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://health-care-e-commerce.onrender.com/api';
const OUTPUT_FILE = path.join(__dirname, '../public/sitemap-products-static.xml');
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch with retry logic
async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[Sitemap] Fetching: ${url} (attempt ${i + 1}/${retries})`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MedCore-Sitemap-Generator',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(`[Sitemap] Attempt ${i + 1} failed:`, error.message);
      
      if (i < retries - 1) {
        console.log(`[Sitemap] Retrying in ${RETRY_DELAY / 1000}s...`);
        await sleep(RETRY_DELAY);
      } else {
        throw error;
      }
    }
  }
}

// Fetch all products with pagination
async function fetchAllProducts() {
  console.log('[Sitemap] Starting product fetch...');
  
  let allProducts = [];
  let currentPage = 1;
  let totalPages = 1;
  
  do {
    const url = `${BACKEND_URL}/products?page=${currentPage}&limit=100&fields=slug,_id,updatedAt`;
    
    try {
      const data = await fetchWithRetry(url);
      
      // Handle response structure: { success, data: [...], pagination }
      const products = Array.isArray(data.data) ? data.data : (data.data?.products || data.products || []);
      
      if (products.length === 0) {
        console.log(`[Sitemap] Page ${currentPage} returned no products. Stopping.`);
        break;
      }
      
      allProducts = allProducts.concat(products);
      console.log(`[Sitemap] Page ${currentPage}: fetched ${products.length} products (total: ${allProducts.length})`);
      
      // Check pagination
      const pagination = data.pagination || data.data?.pagination;
      if (pagination) {
        totalPages = pagination.totalPages || totalPages;
        
        if (currentPage >= totalPages) {
          console.log(`[Sitemap] Reached last page (${totalPages})`);
          break;
        }
      }
      
      currentPage++;
      
      // Small delay between requests to avoid rate limiting
      if (currentPage <= totalPages) {
        await sleep(500);
      }
      
    } catch (error) {
      console.error(`[Sitemap] Failed to fetch page ${currentPage}:`, error.message);
      console.error(`[Sitemap] Stopping at ${allProducts.length} products`);
      break;
    }
    
  } while (currentPage <= totalPages);
  
  return allProducts;
}

// Generate sitemap XML
function generateSitemapXML(products) {
  const now = new Date().toISOString();
  
  const urls = products
    .filter(product => product.slug || product._id)
    .map(product => {
      const url = `${SITE_URL}/products/${product.slug || product._id}`;
      const lastmod = product.updatedAt ? new Date(product.updatedAt).toISOString() : now;
      
      return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

// Main execution
async function main() {
  console.log('=================================================');
  console.log('  MedCore BD - Build-Time Sitemap Generator');
  console.log('=================================================');
  console.log(`Site URL: ${SITE_URL}`);
  console.log(`Backend API: ${BACKEND_URL}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log('=================================================\n');
  
  try {
    // Fetch all products
    const startTime = Date.now();
    const products = await fetchAllProducts();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (products.length === 0) {
      console.error('\n[Sitemap] ERROR: No products fetched!');
      console.error('[Sitemap] The backend may be down or unreachable.');
      console.error('[Sitemap] Generating empty sitemap as fallback...\n');
    }
    
    console.log(`\n[Sitemap] Fetched ${products.length} products in ${elapsed}s`);
    
    // Generate XML
    console.log('[Sitemap] Generating XML...');
    const xml = generateSitemapXML(products);
    
    // Ensure public directory exists
    const publicDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write to file
    fs.writeFileSync(OUTPUT_FILE, xml, 'utf-8');
    
    console.log(`[Sitemap] ✅ Sitemap generated successfully!`);
    console.log(`[Sitemap] File: ${OUTPUT_FILE}`);
    console.log(`[Sitemap] Size: ${(xml.length / 1024).toFixed(2)} KB`);
    console.log(`[Sitemap] URLs: ${products.length}`);
    
    // Show sample URLs
    if (products.length > 0) {
      console.log('\n[Sitemap] Sample product URLs:');
      products.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${SITE_URL}/products/${p.slug || p._id}`);
      });
    }
    
    console.log('\n=================================================');
    console.log('  ✅ Sitemap generation complete!');
    console.log('=================================================\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n=================================================');
    console.error('  ❌ Sitemap generation failed!');
    console.error('=================================================');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    console.error('\n=================================================\n');
    
    // Generate empty sitemap as fallback
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Build-time sitemap generation failed. Backend may be unreachable. -->
  <!-- Products: 0 -->
</urlset>`;
    
    fs.writeFileSync(OUTPUT_FILE, emptyXml, 'utf-8');
    console.log('[Sitemap] Generated empty sitemap as fallback.');
    
    // Don't fail the build
    process.exit(0);
  }
}

// Run
main();
