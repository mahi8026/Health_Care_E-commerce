/**
 * Build-Time Product Sitemap Generator
 * 
 * Fetches all products from backend API and generates a static sitemap XML file.
 * This runs during `npm run build` to avoid runtime API calls and timeouts.
 * 
 * Output: public/sitemap-products-static.xml
 * 
 * GRACEFUL FAILURE: If this script fails, the build continues with an empty sitemap.
 * The product sitemap route will fall back gracefully.
 */

const fs = require('fs');
const path = require('path');

// Canonical origin must match the serving host (www) — see src/config/seo.js
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '') || 'https://www.mediportbd.com';
// Local dev uses a relative API URL (/api) that only works via Next's dev
// proxy — fall back to the production backend when it is not absolute.
const envApi = process.env.NEXT_PUBLIC_API_URL;
const BACKEND_URL = envApi && /^https?:\/\//.test(envApi)
  ? envApi
  : 'https://health-care-e-commerce-ubyy.onrender.com/api';
const OUTPUT_FILE = path.join(__dirname, '../public/sitemap-products-static.xml');
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Check if fetch is available (Node 18+) or use dynamic import
let fetchImpl;
try {
  // Try using built-in fetch (Node 18+)
  fetchImpl = global.fetch || fetch;
} catch {
  // If fetch not available, we'll handle it in main()
  fetchImpl = null;
}

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch with retry logic
async function fetchWithRetry(url, retries = MAX_RETRIES) {
  // Import node-fetch if native fetch not available
  if (!fetchImpl) {
    try {
      const nodeFetch = await import('node-fetch');
      fetchImpl = nodeFetch.default;
    } catch (err) {
      throw new Error('Fetch is not available. Please use Node.js 18+ or install node-fetch.');
    }
  }
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[Sitemap] Fetching: ${url} (attempt ${i + 1}/${retries})`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetchImpl(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mediport-Sitemap-Generator',
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

// Fetch all categories from the API
async function fetchAllCategories() {
  console.log('[Sitemap] Fetching categories...');
  try {
    const data = await fetchWithRetry(`${BACKEND_URL}/categories?limit=100`);
    const list = Array.isArray(data.data?.categories) ? data.data.categories
      : (Array.isArray(data.categories) ? data.categories : []);
    console.log(`[Sitemap] Fetched ${list.length} categories`);
    return list;
  } catch (err) {
    console.error('[Sitemap] Category fetch failed:', err.message);
    return [];
  }
}

// Fetch all manufacturers from the API
async function fetchAllManufacturers() {
  console.log('[Sitemap] Fetching manufacturers...');
  try {
    const data = await fetchWithRetry(`${BACKEND_URL}/manufacturers?limit=100`);
    const list = Array.isArray(data.data?.manufacturers) ? data.data.manufacturers
      : (Array.isArray(data.manufacturers) ? data.manufacturers : []);
    console.log(`[Sitemap] Fetched ${list.length} manufacturers`);
    return list;
  } catch (err) {
    console.error('[Sitemap] Manufacturer fetch failed:', err.message);
    return [];
  }
}

// Import the guides config (ESM) for guide URLs
async function loadGuides() {
  try {
    const mod = await import('../src/config/guides.js');
    return Array.isArray(mod.GUIDES) ? mod.GUIDES : [];
  } catch (err) {
    console.error('[Sitemap] Guides config import failed:', err.message);
    return [];
  }
}

// Import the landing pages config (ESM) for equipment landing page URLs
async function loadLandingPages() {
  try {
    const mod = await import('../src/config/landingPages.js');
    return Array.isArray(mod.LANDING_PAGES) ? mod.LANDING_PAGES : [];
  } catch (err) {
    console.error('[Sitemap] Landing pages config import failed:', err.message);
    return [];
  }
}

// Import the topical clusters config (ESM) for /topics hub URLs
async function loadTopicalClusters() {
  try {
    const mod = await import('../src/config/topicalClusters.js');
    return Array.isArray(mod.TOPICAL_CLUSTERS) ? mod.TOPICAL_CLUSTERS : [];
  } catch (err) {
    console.error('[Sitemap] Topical clusters config import failed:', err.message);
    return [];
  }
}

// Generate a single combined sitemap covering all page types
function generateFullSitemapXML(products, categories, manufacturers, guides, landingPages = [], topicalClusters = []) {
  const now = new Date().toISOString();
  const urlset = [];

  // Static pages
  const staticPages = [
    { url: `${SITE_URL}`, lastmod: now, freq: 'daily', pri: 1.0 },
    { url: `${SITE_URL}/products`, lastmod: now, freq: 'daily', pri: 0.9 },
    { url: `${SITE_URL}/brands`, lastmod: now, freq: 'weekly', pri: 0.8 },
    { url: `${SITE_URL}/guides`, lastmod: now, freq: 'monthly', pri: 0.8 },
    { url: `${SITE_URL}/compare`, lastmod: now, freq: 'monthly', pri: 0.7 },
    { url: `${SITE_URL}/reagent-store`, lastmod: now, freq: 'daily', pri: 0.9 },
    { url: `${SITE_URL}/b2b`, lastmod: now, freq: 'weekly', pri: 0.8 },
    { url: `${SITE_URL}/about`, lastmod: now, freq: 'monthly', pri: 0.8 },
    { url: `${SITE_URL}/dgda-info`, lastmod: now, freq: 'monthly', pri: 0.7 },
    { url: `${SITE_URL}/certifications`, lastmod: now, freq: 'monthly', pri: 0.7 },
    { url: `${SITE_URL}/faq`, lastmod: now, freq: 'monthly', pri: 0.6 },
    { url: `${SITE_URL}/contact`, lastmod: now, freq: 'monthly', pri: 0.6 },
    { url: `${SITE_URL}/careers`, lastmod: now, freq: 'monthly', pri: 0.6 },
    { url: `${SITE_URL}/news`, lastmod: now, freq: 'weekly', pri: 0.6 },
    { url: `${SITE_URL}/warranty`, lastmod: now, freq: 'monthly', pri: 0.6 },
    { url: `${SITE_URL}/help`, lastmod: now, freq: 'monthly', pri: 0.5 },
    { url: `${SITE_URL}/track`, lastmod: now, freq: 'monthly', pri: 0.5 },
    { url: `${SITE_URL}/privacy`, lastmod: now, freq: 'yearly', pri: 0.3 },
    { url: `${SITE_URL}/terms`, lastmod: now, freq: 'yearly', pri: 0.3 },
  ];

  // Categories
  const categoryUrls = categories
    .filter(c => c.slug)
    .map(c => ({
      url: `${SITE_URL}/products/category/${c.slug}`,
      lastmod: c.updatedAt || now,
      freq: 'daily',
      pri: 0.85,
    }));

  // Brands
  const brandUrls = manufacturers
    .filter(b => b.slug)
    .map(b => ({
      url: `${SITE_URL}/brands/${b.slug}`,
      lastmod: b.updatedAt || now,
      freq: 'weekly',
      pri: 0.7,
    }));

  // Guides
  const guideUrls = guides
    .filter(g => g.slug)
    .map(g => ({
      url: `${SITE_URL}/guides/${g.slug}`,
      lastmod: g.updatedAt || now,
      freq: 'monthly',
      pri: g.type === 'pillar' ? 0.9 : 0.7,
    }));

  // Equipment landing pages
  const equipmentUrls = [
    { url: `${SITE_URL}/equipment`, lastmod: now, freq: 'weekly', pri: 0.9 },
    ...landingPages
      .filter(p => p.slug)
      .map(p => ({
        url: `${SITE_URL}/equipment/${p.slug}`,
        lastmod: now,
        freq: 'weekly',
        pri: 0.8,
      })),
  ];

  // Topical clusters
  const topicUrls = [
    { url: `${SITE_URL}/topics`, lastmod: now, freq: 'weekly', pri: 0.8 },
    ...topicalClusters
      .filter(c => c.slug)
      .map(c => ({
        url: `${SITE_URL}/topics/${c.slug}`,
        lastmod: now,
        freq: 'weekly',
        pri: 0.8,
      })),
  ];

  // Products
  const productUrls = products
    .filter(p => p.slug || p._id)
    .map(p => ({
      url: `${SITE_URL}/products/${p.slug || p._id}`,
      lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString() : now,
      freq: 'weekly',
      pri: 0.7,
    }));

  const all = [...staticPages, ...topicUrls, ...equipmentUrls, ...categoryUrls, ...brandUrls, ...guideUrls, ...productUrls];

  all.forEach(page => {
    urlset.push(`  <url>
    <loc>${page.url}</loc>
    <lastmod>${new Date(page.lastmod).toISOString()}</lastmod>
    <changefreq>${page.freq}</changefreq>
    <priority>${page.pri}</priority>
  </url>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset.join('\n')}
</urlset>`;
}

// Ensure a file is written (skips empty results)
function writeXmlFile(relPath, xml, label) {
  const out = path.join(__dirname, relPath);
  const dir = path.dirname(out);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(out, xml, 'utf-8');
  const kb = (xml.length / 1024).toFixed(2);
  const count = (xml.match(/<loc>/g) || []).length;
  console.log(`[Sitemap] ✅ ${label}: ${out} (${kb} KB, ${count} URLs)`);
}

// Main execution
async function main() {
  console.log('=================================================');
  console.log('  MediportBD - Build-Time Sitemap Generator');
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
      console.error('[Sitemap] Keeping the existing sitemap file instead of overwriting it with an empty one...\n');
      process.exit(0);
    }
    
    console.log(`\n[Sitemap] Fetched ${products.length} products in ${elapsed}s`);

    // Fetch supporting data for the full sitemap
    const [categories, manufacturers, guides, landingPages, topicalClusters] = await Promise.all([
      fetchAllCategories(),
      fetchAllManufacturers(),
      loadGuides(),
      loadLandingPages(),
      loadTopicalClusters(),
    ]);

    // Generate XML
    console.log('[Sitemap] Generating XML...');
    const xml = generateSitemapXML(products);
    const fullXml = generateFullSitemapXML(products, categories, manufacturers, guides, landingPages, topicalClusters);

    // Ensure public directory exists
    const publicDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write to file
    fs.writeFileSync(OUTPUT_FILE, xml, 'utf-8');
    writeXmlFile('../public/sitemap-full.xml', fullXml, 'Full sitemap');
    
    console.log(`[Sitemap] ✅ Product sitemap generated successfully!`);
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
    
    // Don't fail the build; keep whatever sitemap already exists so a
    // transient backend outage at build time cannot wipe the sitemap.
    console.log('[Sitemap] Keeping existing sitemap file as fallback.');
    process.exit(0);
  }
}

// Run
main();
