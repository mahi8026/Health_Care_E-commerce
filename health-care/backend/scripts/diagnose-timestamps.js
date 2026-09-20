/**
 * Diagnostic Script: Check Product Timestamps
 * 
 * This script diagnoses the sitemap lastmod issue by:
 * 1. Checking how many products have identical updatedAt timestamps
 * 2. Identifying products with suspicious timestamp patterns
 * 3. Showing distribution of updatedAt vs createdAt
 * 
 * Run: node scripts/diagnose-timestamps.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function diagnoseTimestamps() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Mediport');
    console.log('✅ Connected to MongoDB\n');

    // Get all products with timestamp fields
    const products = await Product.find({ isActive: true })
      .select('slug name createdAt updatedAt')
      .lean();

    console.log(`📊 Total Active Products: ${products.length}\n`);

    // Group by updatedAt timestamp
    const timestampGroups = {};
    products.forEach(p => {
      const timestamp = p.updatedAt ? p.updatedAt.toISOString() : 'null';
      if (!timestampGroups[timestamp]) {
        timestampGroups[timestamp] = [];
      }
      timestampGroups[timestamp].push(p);
    });

    // Find the most common timestamp (the problematic one)
    const sortedGroups = Object.entries(timestampGroups)
      .sort((a, b) => b[1].length - a[1].length);

    console.log('🔍 Top 10 Most Common updatedAt Timestamps:\n');
    sortedGroups.slice(0, 10).forEach(([timestamp, prods], index) => {
      console.log(`${index + 1}. ${timestamp}`);
      console.log(`   Count: ${prods.length} products`);
      console.log(`   Example: ${prods[0].name} (${prods[0].slug})`);
      console.log('');
    });

    // Check for identical timestamps
    const identicalCount = sortedGroups[0][1].length;
    const identicalPct = ((identicalCount / products.length) * 100).toFixed(1);

    console.log('⚠️  DIAGNOSIS:\n');
    if (identicalPct > 50) {
      console.log(`🔴 PROBLEM FOUND: ${identicalCount} products (${identicalPct}%) have the SAME updatedAt timestamp!`);
      console.log(`   Timestamp: ${sortedGroups[0][0]}`);
      console.log(`   This is why your sitemap has duplicate lastmod values.\n`);
    } else {
      console.log(`✅ Timestamps look healthy. Only ${identicalPct}% share the same updatedAt.\n`);
    }

    // Check createdAt vs updatedAt differences
    const differences = products
      .filter(p => p.createdAt && p.updatedAt)
      .map(p => ({
        slug: p.slug,
        name: p.name,
        diff: Math.abs(new Date(p.updatedAt) - new Date(p.createdAt)) / 1000, // seconds
      }))
      .filter(p => p.diff < 1); // Less than 1 second difference

    console.log(`📅 Products with createdAt ≈ updatedAt: ${differences.length}`);
    if (differences.length > products.length * 0.8) {
      console.log(`   This suggests products were bulk-imported without subsequent updates.\n`);
    }

    // Show sample of products with different timestamps
    const updated = products.filter(p => {
      if (!p.createdAt || !p.updatedAt) return false;
      const diff = Math.abs(new Date(p.updatedAt) - new Date(p.createdAt)) / 1000;
      return diff > 60; // More than 60 seconds
    });

    console.log(`\n✨ Products with Real Updates: ${updated.length}`);
    if (updated.length > 0) {
      console.log('\nExamples:');
      updated.slice(0, 5).forEach(p => {
        console.log(`  - ${p.name}`);
        console.log(`    Created:  ${p.createdAt.toISOString()}`);
        console.log(`    Updated:  ${p.updatedAt.toISOString()}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Diagnosis complete');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

diagnoseTimestamps();
