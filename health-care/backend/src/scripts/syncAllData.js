#!/usr/bin/env node

/**
 * Sync All Data Script
 * Ensures all manufacturers, categories, and products are properly synced
 * Can be run manually or as part of deployment process
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env.production') });
const mongoose = require('mongoose');
const { syncData, verifyDataIntegrity } = require('../services/dataSync');

async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              SYNC ALL DATA - PRODUCTION                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🔌 Connecting to MongoDB...');
    console.log(`   Database: ${process.env.MONGODB_URI?.split('@')[1]?.split('?')[0] || 'Unknown'}\n`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Run synchronization
    console.log('🔄 Running data synchronization...\n');
    const stats = await syncData();

    if (!stats) {
      console.error('❌ Synchronization failed\n');
      process.exit(1);
    }

    // Verify integrity
    console.log('\n🔍 Verifying data integrity...\n');
    const report = await verifyDataIntegrity();

    if (report.healthy) {
      console.log('✅ Data integrity verified - No issues found\n');
    } else {
      console.log('⚠️  Data integrity issues found:\n');
      report.issues.forEach(issue => {
        console.log(`   • ${issue.message}`);
      });
      console.log('');
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    SYNC COMPLETED                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('✅ All data synchronized successfully!\n');

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

// Run the script
main();
