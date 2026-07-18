#!/usr/bin/env node

/**
 * Healthway.com.bd Tynor Products Scraper
 * This site uses API calls, so we'll fetch directly from their API
 */

const axios = require('axios');
const mongoose = require('mongoose');
const { importProduct, findOrCreateManufacturer, findOrCreateCategory } = require('../src/utils/productScraper');
const logger = require('../src/utils/logger');
require('dotenv').config();

async function scrapeHealthwayTynor() {
  console.log(`
┌────────────────────────────────────────────────────────────┐
│    Healthway.com.bd - Tynor Products Scraper               │
└────────────────────────────────────────────────────────────┘
  `);

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🕷️  Fetching Tynor products from Healthway API...\n');

    // Try to fetch from their API
    // The URL structure suggests they might have an API endpoint
    const apiUrl = 'https://healthway.com.bd/api/v1/products';
    
    const response = await axios.get(apiUrl, {
      params: {
        brand: 'tynor',
        limit: 100,
        offset: 0,
        sort_order: 1,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    console.log('Response received:', response.status);
    console.log('Data type:', typeof response.data);
    
    // Log the structure to understand the API response
    if (response.data) {
      console.log('Keys:', Object.keys(response.data));
      console.log('Full response:', JSON.stringify(response.data, null, 2).substring(0, 1000));
    }

    let products = [];
    
    // Try different possible structures
    if (Array.isArray(response.data)) {
      products = response.data;
    } else if (response.data.products) {
      products = response.data.products;
    } else if (response.data.data) {
      products = response.data.data;
    } else if (response.data.items) {
      products = response.data.items;
    }

    console.log(`\n✅ Found ${products.length} Tynor products\n`);

    if (products.length === 0) {
      console.log('⚠️  No products found. The API might use a different structure.');
      console.log('📋 Response structure:', JSON.stringify(response.data, null, 2).substring(0, 500));
      return;
    }

    // Find or create Tynor manufacturer
    const manufacturerId = await findOrCreateManufacturer('Tynor');
    const categoryId = await findOrCreateCategory('Orthopedic Supports');

    const results = {
      total: products.length,
      success: 0,
      failed: 0,
      skipped: 0,
      products: [],
      errors: [],
    };

    // Process each product
    for (const product of products) {
      try {
        // Map the API response to our product structure
        const productData = {
          name: product.name || product.title || product.product_name,
          price: parseFloat(product.price || product.selling_price || 0),
          compareAtPrice: parseFloat(product.mrp || product.regular_price || product.price),
          description: product.description || product.details || '',
          images: [],
          brand: 'Tynor',
          category: 'Orthopedic Supports',
          stock: product.stock || product.quantity || 100,
          sku: product.sku || product.product_code || product.id,
          specifications: {},
        };

        // Extract images
        if (product.image) {
          productData.images.push(product.image);
        }
        if (product.images && Array.isArray(product.images)) {
          productData.images.push(...product.images);
        }
        if (product.thumbnail) {
          productData.images.push(product.thumbnail);
        }

        // Import product
        console.log(`Processing: ${productData.name}...`);
        
        const importResult = await importProduct(productData, {
          brandName: 'Tynor',
          categoryName: 'Orthopedic Supports',
          uploadImages: true,
          skipExisting: true,
        });

        if (importResult.success) {
          results.success++;
          results.products.push(importResult.product);
          console.log(`  ✅ Imported: ${productData.name} (৳${productData.price})`);
        } else if (importResult.reason === 'already_exists') {
          results.skipped++;
          console.log(`  ⏭️  Skipped: ${productData.name} (already exists)`);
        } else {
          results.failed++;
          results.errors.push({
            product: productData.name,
            error: importResult.reason,
          });
          console.log(`  ❌ Failed: ${productData.name} - ${importResult.reason}`);
        }

        // Add delay to avoid overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error processing product:`, error.message);
        results.failed++;
        results.errors.push({
          product: product.name || 'Unknown',
          error: error.message,
        });
      }
    }

    // Display results
    console.log('\n┌────────────────────────────────────────────────────────────┐');
    console.log('│                    IMPORT RESULTS                          │');
    console.log('└────────────────────────────────────────────────────────────┘\n');
    console.log(`  Total Products:  ${results.total}`);
    console.log(`  ✅ Imported:     ${results.success}`);
    console.log(`  ⏭️  Skipped:      ${results.skipped} (already exist)`);
    console.log(`  ❌ Failed:       ${results.failed}`);
    console.log('');

    if (results.success > 0) {
      console.log('Successfully imported products:');
      results.products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (৳${product.price?.toLocaleString()})`);
      });
      console.log('');
    }

    if (results.errors.length > 0) {
      console.log('Errors encountered:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.product}: ${error.error}`);
      });
      console.log('');
    }

    console.log('✅ Import complete!\n');

  } catch (error) {
    if (error.response) {
      console.error('\n❌ API Error:', error.response.status, error.response.statusText);
      console.error('Response data:', error.response.data);
      
      // If API doesn't work, provide manual instructions
      console.log('\n📋 The API endpoint might not be publicly accessible.');
      console.log('Alternative approach:');
      console.log('1. Visit: https://healthway.com.bd/stores?brand=tynor');
      console.log('2. Open browser DevTools (F12) → Network tab');
      console.log('3. Filter by "Fetch/XHR"');
      console.log('4. Look for API calls when products load');
      console.log('5. Copy the actual API endpoint and update this script\n');
    } else {
      console.error('\n❌ Error:', error.message);
    }
    logger.error('Healthway scraper failed', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Interrupted by user. Cleaning up...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run
scrapeHealthwayTynor();
