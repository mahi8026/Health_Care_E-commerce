/**
 * Fix Product Timestamps Script
 * 
 * IMPORTANT: Only run this if diagnose-timestamps.js confirms the problem.
 * 
 * This script fixes products with incorrect updatedAt by:
 * 1. Setting updatedAt = createdAt for products that have never been edited
 * 2. Preserving actual update timestamps for products that were modified
 * 
 * This ensures sitemap lastmod accurately reflects product freshness.
 * 
 * Usage:
 *   node scripts/fix-product-timestamps.js --dry-run  (preview changes)
 *   node scripts/fix-product-timestamps.js            (apply changes)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

const DRY_RUN = process.argv.includes('--dry-run');

async function fixTimestamps() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Mediport');
    console.log('✅ Connected to MongoDB\n');

    if (DRY_RUN) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    } else {
      console.log('⚠️  LIVE MODE - Changes will be applied to database\n');
    }

    // Find products where updatedAt is suspiciously recent or identical
    const products = await Product.find({ isActive: true })
      .select('slug name createdAt updatedAt')
      .lean();

    console.log(`📊 Total Active Products: ${products.length}\n`);

    // Strategy: For products where createdAt and updatedAt are within 1 second,
    // we'll stagger the updatedAt timestamps slightly based on creation order
    // to avoid having 600+ products with identical lastmod

    const toUpdate = [];
    
    products.forEach((p, index) => {
      if (!p.createdAt || !p.updatedAt) return;
      
      const diff = Math.abs(new Date(p.updatedAt) - new Date(p.createdAt)) / 1000;
      
      // If timestamps are identical or within 1 second, they likely weren't actually updated
      if (diff < 1) {
        // Use createdAt as the base, don't artificially inflate the timestamp
        toUpdate.push({
          _id: p._id,
          slug: p.slug,
          name: p.name,
          currentUpdatedAt: p.updatedAt,
          newUpdatedAt: p.createdAt, // Set updatedAt = createdAt for unmodified products
        });
      }
    });

    console.log(`📝 Products to Fix: ${toUpdate.length}\n`);

    if (toUpdate.length === 0) {
      console.log('✅ No products need timestamp fixes!');
      await mongoose.connection.close();
      return;
    }

    // Show sample
    console.log('Sample of products to update:');
    toUpdate.slice(0, 5).forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (${p.slug})`);
      console.log(`   Current: ${p.currentUpdatedAt.toISOString()}`);
      console.log(`   New:     ${p.newUpdatedAt.toISOString()}`);
    });
    console.log('');

    if (!DRY_RUN) {
      console.log('Applying fixes...\n');
      
      // Update in batches of 100 to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < toUpdate.length; i += batchSize) {
        const batch = toUpdate.slice(i, i + batchSize);
        
        await Promise.all(batch.map(p => 
          Product.updateOne(
            { _id: p._id },
            { $set: { updatedAt: p.newUpdatedAt } }
          )
        ));
        
        console.log(`  ✓ Updated ${Math.min(i + batchSize, toUpdate.length)} / ${toUpdate.length}`);
      }

      console.log('\n✅ Timestamp fix complete!');
      console.log('\n📝 Next steps:');
      console.log('   1. Trigger sitemap regeneration by visiting /sitemap-products.xml');
      console.log('   2. Verify sitemap shows varied lastmod dates');
      console.log('   3. Submit updated sitemap to Google Search Console');
    } else {
      console.log('✅ Dry run complete. Run without --dry-run to apply changes.');
    }

    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixTimestamps();
