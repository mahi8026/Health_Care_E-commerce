#!/usr/bin/env node
/**
 * Sync Missing Categories to Production
 * Creates the 6 new categories that exist locally but not in production
 * 
 * Usage: Set MONGODB_URI to production connection string, then run:
 *        node sync-categories-to-production.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/models/Category');

// The 6 categories that need to be created in production
const MISSING_CATEGORIES = [
  {
    name: 'Blood Bank Supplies',
    slug: 'blood-bank-supplies',
    description: 'Blood bags, blood collection equipment, transfusion supplies',
    isActive: true,
    displayOrder: 0,
    seo: {
      metaTitle: 'Blood Bank Supplies Bangladesh | Blood Bags & Collection Equipment',
      metaDescription: 'Buy blood bank supplies in Bangladesh - blood bags, collection sets, transfusion equipment. DGDA approved, ISO certified.',
      keywords: ['blood bank supplies', 'blood bags Bangladesh', 'blood collection equipment', 'transfusion supplies BD']
    }
  },
  {
    name: 'IV & Infusion Therapy',
    slug: 'iv-and-infusion-therapy',
    description: 'IV cannulas, infusion sets, burette sets, extension lines',
    isActive: true,
    displayOrder: 0,
    seo: {
      metaTitle: 'IV & Infusion Therapy Supplies Bangladesh | IV Cannula & Sets',
      metaDescription: 'Buy IV cannulas, infusion sets, and infusion therapy supplies in Bangladesh. Medical-grade, sterile products.',
      keywords: ['IV cannula', 'infusion set', 'burette set', 'IV therapy Bangladesh']
    }
  },
  {
    name: 'Surgical & Wound Care',
    slug: 'surgical-and-wound-care',
    description: 'Surgical tapes, wound dressings, ostomy supplies, surgical consumables',
    isActive: true,
    displayOrder: 0,
    seo: {
      metaTitle: 'Surgical & Wound Care Products Bangladesh | Dressings & Ostomy',
      metaDescription: 'Buy surgical tapes, wound dressings, ostomy supplies in Bangladesh. ConvaTec, Duoderm, and more.',
      keywords: ['surgical tape', 'wound dressing', 'ostomy supplies', 'surgical care Bangladesh']
    }
  },
  {
    name: 'Diabetes Care',
    slug: 'diabetes-care',
    description: 'Blood glucose meters, test strips, CGM systems, diabetes management',
    isActive: true,
    displayOrder: 0,
    seo: {
      metaTitle: 'Diabetes Care Products Bangladesh | Glucose Meters & Test Strips',
      metaDescription: 'Buy diabetes care products in Bangladesh - glucometers, test strips, CGM systems. Accu-Chek, Yuwell, and more.',
      keywords: ['glucose meter', 'glucometer Bangladesh', 'test strips', 'diabetes care BD', 'CGM']
    }
  },
  {
    name: 'Physiotherapy & Rehabilitation',
    slug: 'physiotherapy-and-rehabilitation',
    description: 'TENS units, heating pads, infrared lamps, physical therapy equipment',
    isActive: true,
    displayOrder: 0,
    seo: {
      metaTitle: 'Physiotherapy Equipment Bangladesh | TENS, Heating Pads & Rehab',
      metaDescription: 'Buy physiotherapy and rehabilitation equipment in Bangladesh. TENS therapy, heating pads, infrared lamps.',
      keywords: ['TENS therapy', 'physiotherapy equipment', 'heating pad', 'infrared lamp Bangladesh']
    }
  },
  {
    name: 'Ophthalmology & ENT Equipment',
    slug: 'ophthalmology-and-ent-equipment',
    description: 'Ophthalmoscopes, otoscopes, retinoscopes, ENT examination equipment',
    isActive: true,
    displayOrder: 0,
    seo: {
      metaTitle: 'Ophthalmology & ENT Equipment Bangladesh | Heine, Examination Tools',
      metaDescription: 'Buy ophthalmology and ENT equipment in Bangladesh. Heine ophthalmoscopes, otoscopes, retinoscopes.',
      keywords: ['ophthalmoscope', 'otoscope', 'retinoscope', 'ENT equipment Bangladesh', 'Heine']
    }
  }
];

async function syncCategories() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log(`   Database: ${process.env.MONGODB_URI.split('@')[1]?.split('/')[0] || 'production'}`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📋 Syncing 6 missing categories to production...\n');

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const categoryData of MISSING_CATEGORIES) {
      try {
        // Check if category already exists
        const existing = await Category.findOne({ slug: categoryData.slug });
        
        if (existing) {
          console.log(`  ⏭️  Skipped: "${categoryData.name}" (already exists)`);
          skipped++;
          continue;
        }
        
        // Create new category
        const category = await Category.create(categoryData);
        console.log(`  ✅ Created: "${categoryData.name}" (ID: ${category._id})`);
        created++;
        
      } catch (error) {
        console.error(`  ❌ Error creating "${categoryData.name}": ${error.message}`);
        errors++;
      }
    }

    // Verify final count
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });

    console.log('\n📊 Summary:');
    console.log(`  ✅ Created: ${created}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log(`\n  Total categories in database: ${totalCategories}`);
    console.log(`  Active categories: ${activeCategories}`);

    if (created > 0) {
      console.log('\n✅ Categories synced successfully!');
      console.log('\n💡 Next Steps:');
      console.log('  1. Hard refresh admin panel: Ctrl + Shift + R');
      console.log('  2. All 18 categories should now be visible!');
      console.log('  3. Run product organization script if needed');
    } else if (skipped === MISSING_CATEGORIES.length) {
      console.log('\n✅ All categories already exist in production!');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║       Sync Missing Categories to Production                 ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

syncCategories();
