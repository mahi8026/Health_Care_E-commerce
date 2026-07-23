#!/usr/bin/env node

/**
 * Fetch Healthway Tynor Products from API
 * Downloads product data directly from Healthway API and saves to healthway-raw.json
 * 
 * Usage:
 *   node scripts/fetch-healthway-tynor.js
 *   node scripts/fetch-healthway-tynor.js --offset=35
 *   node scripts/fetch-healthway-tynor.js --all
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const HEALTHWAY_API = 'https://healthway.com.bd/api/v1/product/public/products/';
const OUTPUT_FILE = path.join(__dirname, 'healthway-raw.json');

async function fetchHealthwayProducts(options = {}) {
  const {
    brand = 'tynor',
    limit = 35,
    offset = 0,
    sortOrder = 1,
    fetchAll = false
  } = options;

  console.log(`
┌────────────────────────────────────────────────────────────┐
│    Healthway Tynor Products API Fetcher                    │
└────────────────────────────────────────────────────────────┘
  `);

  console.log(`🌐 Fetching from: ${HEALTHWAY_API}`);
  console.log(`📦 Brand: ${brand}`);
  console.log(`📊 Limit: ${limit}, Offset: ${offset}\n`);

  try {
    let allProducts = [];
    let currentOffset = offset;
    let totalFetched = 0;
    let hasMore = true;

    while (hasMore) {
      console.log(`📡 Fetching products (offset: ${currentOffset})...`);
      
      const response = await axios.get(HEALTHWAY_API, {
        params: {
          brand,
          limit,
          offset: currentOffset,
          sort_order: sortOrder
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        timeout: 30000,
      });

      if (!response.data || !response.data.results) {
        console.log('❌ Invalid API response structure');
        console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 500));
        break;
      }

      const { results, count, next } = response.data;
      
      console.log(`✅ Fetched ${results.length} products`);
      console.log(`📊 Total available: ${count}`);
      
      allProducts.push(...results);
      totalFetched += results.length;

      if (!fetchAll || !next || results.length === 0) {
        hasMore = false;
      } else {
        currentOffset += limit;
        console.log(`⏭️  Fetching next page...\n`);
        // Add delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (allProducts.length === 0) {
      console.log('⚠️  No products found!');
      return;
    }

    console.log(`\n✅ Total fetched: ${allProducts.length} products\n`);

    // Save to file
    const outputData = {
      results: allProducts,
      count: allProducts.length,
      fetchedAt: new Date().toISOString(),
      source: 'healthway.com.bd',
      brand: brand
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    
    console.log(`💾 Saved to: ${OUTPUT_FILE}\n`);
    
    // Show preview
    console.log('📋 Product Preview (first 5):');
    allProducts.slice(0, 5).forEach((product, index) => {
      const variant = product.variant || {};
      const price = variant.price || 0;
      console.log(`  ${index + 1}. ${product.name} (৳${parseFloat(price).toLocaleString()})`);
    });
    
    if (allProducts.length > 5) {
      console.log(`  ... and ${allProducts.length - 5} more\n`);
    }

    // Show statistics
    const inStock = allProducts.filter(p => {
      const variant = p.variant || {};
      return variant.quantity > 0;
    }).length;
    
    console.log('📊 Statistics:');
    console.log(`   Total products: ${allProducts.length}`);
    console.log(`   In stock: ${inStock}`);
    console.log(`   Out of stock: ${allProducts.length - inStock}`);
    console.log('');

    console.log('🚀 Next steps:');
    console.log('   1. Run: npm run format:healthway');
    console.log('   2. Run: npm run import:auto');
    console.log('');

  } catch (error) {
    if (error.response) {
      console.error('\n❌ API Error:', error.response.status, error.response.statusText);
      if (error.response.data) {
        console.error('Response:', JSON.stringify(error.response.data, null, 2).substring(0, 500));
      }
    } else if (error.request) {
      console.error('\n❌ Network Error: No response received');
      console.error('Make sure you have internet connection');
    } else {
      console.error('\n❌ Error:', error.message);
    }
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  if (arg.startsWith('--offset=')) {
    options.offset = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--brand=')) {
    options.brand = arg.split('=')[1];
  } else if (arg === '--all') {
    options.fetchAll = true;
  }
});

// Run
fetchHealthwayProducts(options);
