#!/usr/bin/env node

/**
 * Master Seed Script - Seed All Products to Production
 * Runs all individual seed scripts in sequence
 * 
 * Usage: node src/scripts/seedAllProductsToProduction.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env.production') });
const { execSync } = require('child_process');
const path = require('path');

const seedScripts = [
  'seedFinecareBiosystems.js',
  'seedBSMIProducts.js',
  'seedLabKit.js',
  'seedGPLBiochemistry.js',
  'seedGenesisInternational.js',
  'seedPacificSurgical.js',
  'seedMRTradingProducts.js',
  'seedTrologyAtlasProducts.js',
  'seedCareForceShantoProducts.js',
  'seedSalmonellaLabInstruments.js',
  'seedTurbilatex.js'
];

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         SEED ALL PRODUCTS TO PRODUCTION                    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log(`📦 Found ${seedScripts.length} seed scripts\n`);
console.log(`🔗 Database: ${process.env.MONGODB_URI?.split('@')[1]?.split('?')[0] || 'Unknown'}\n`);

console.log('⚠️  WARNING: This will seed products to PRODUCTION database!');
console.log('   Press Ctrl+C within 5 seconds to cancel...\n');

// Wait 5 seconds
setTimeout(() => {
  console.log('🚀 Starting seed process...\n');

  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (const script of seedScripts) {
    const scriptPath = path.join(__dirname, script);
    const scriptName = script.replace('.js', '');

    try {
      console.log(`\n📋 Running: ${scriptName}...`);
      console.log('─'.repeat(60));

      // Check if script exists
      const fs = require('fs');
      if (!fs.existsSync(scriptPath)) {
        console.log(`⏭️  Skipped: ${scriptName} (file not found)`);
        results.push({ script: scriptName, status: 'skipped', reason: 'File not found' });
        continue;
      }

      // Run the seed script
      execSync(`node "${scriptPath}"`, {
        stdio: 'inherit',
        env: { ...process.env }
      });

      console.log(`✅ Completed: ${scriptName}`);
      successCount++;
      results.push({ script: scriptName, status: 'success' });

    } catch (error) {
      console.error(`❌ Failed: ${scriptName}`);
      console.error(`   Error: ${error.message}`);
      failCount++;
      results.push({ script: scriptName, status: 'failed', error: error.message });
    }
  }

  // Print summary
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    SEED SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${seedScripts.length}\n`);

  if (results.length > 0) {
    console.log('📋 Detailed Results:\n');
    results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⏭️';
      console.log(`   ${icon} ${result.script}: ${result.status}`);
      if (result.reason) console.log(`      Reason: ${result.reason}`);
      if (result.error) console.log(`      Error: ${result.error}`);
    });
    console.log('');
  }

  console.log('🎉 Seed process completed!\n');
  console.log('📝 Next steps:');
  console.log('   1. Restart backend on Render.com (to clear cache)');
  console.log('   2. Visit: https://health-care-e-commerce-murex.vercel.app/products');
  console.log('   3. Filter by each brand to verify products\n');

  process.exit(failCount > 0 ? 1 : 0);

}, 5000);
