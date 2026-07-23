#!/usr/bin/env node
/**
 * Setup Recommended Categories
 * Based on actual product inventory analysis
 * 
 * Usage: node setup-recommended-categories.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/models/Category');

// Recommended categories based on actual products
const RECOMMENDED_CATEGORIES = [
  {
    name: 'Diagnostic Equipment',
    slug: 'diagnostic-equipment',
    description: 'Medical diagnostic devices and monitoring equipment for patient assessment and vital signs measurement',
    keywords: 'stethoscope, blood pressure monitor, pulse oximeter, thermometer, fetal doppler, weight scale, ophthalmoscope, otoscope',
    isActive: true
  },
  {
    name: 'Laboratory Equipment',
    slug: 'laboratory-equipment',
    description: 'Laboratory machines, analyzers and diagnostic equipment for clinical testing',
    keywords: 'ESR machine, calibration system, laboratory analyzer, lab equipment',
    isActive: true
  },
  {
    name: 'Laboratory Reagents',
    slug: 'laboratory-reagents',
    description: 'Laboratory reagents, test kits and chemical supplies for diagnostic testing',
    keywords: 'RF/RA latex, TSH reagent, IGE reagent, FT4 reagent, T4 reagent, dengue test, rapid test',
    isActive: true
  },
  {
    name: 'IV & Infusion Therapy',
    slug: 'iv-infusion-therapy',
    description: 'Intravenous access devices, infusion sets and fluid delivery systems',
    keywords: 'IV cannula, spinal needle, burette set, infusion set, scalp vein set, butterfly needle',
    isActive: true
  },
  {
    name: 'Blood Bank Supplies',
    slug: 'blood-bank-supplies',
    description: 'Blood collection bags, blood storage and transfusion supplies',
    keywords: 'blood collection bag, blood bag, blood bank, transfusion supplies',
    isActive: true
  },
  {
    name: 'Hospital Machines',
    slug: 'hospital-machines',
    description: 'Hospital equipment including respiratory support, suction and critical care machines',
    keywords: 'nebulizer, BiPAP, CPAP, suction machine, ventilator, respiratory equipment',
    isActive: true
  },
  {
    name: 'Surgical & Wound Care',
    slug: 'surgical-wound-care',
    description: 'Surgical supplies, wound management and ostomy care products',
    keywords: 'surgical tape, colostomy set, wound care, surgical supplies, ostomy care',
    isActive: true
  },
  {
    name: 'Diabetes Care',
    slug: 'diabetes-care',
    description: 'Blood glucose monitoring systems, test strips and continuous glucose monitoring devices',
    keywords: 'glucometer, blood glucose meter, test strips, CGM, continuous glucose monitoring, diabetes',
    isActive: true
  },
  {
    name: 'Physiotherapy & Rehabilitation',
    slug: 'physiotherapy-rehabilitation',
    description: 'Physical therapy equipment, pain management and rehabilitation devices',
    keywords: 'TENS therapy, infrared lamp, heating pad, physiotherapy, pain relief, electrotherapy',
    isActive: true
  },
  {
    name: 'Medical Supplies',
    slug: 'medical-supplies',
    description: 'General medical supplies and patient care products',
    keywords: 'mattress, medical supplies, patient care, hospital supplies',
    isActive: true
  },
  {
    name: 'Ophthalmology & ENT Equipment',
    slug: 'ophthalmology-ent-equipment',
    description: 'Eye, ear, nose and throat examination equipment and diagnostic tools',
    keywords: 'ophthalmoscope, otoscope, retinoscope, hearing amplifier, ENT equipment, eye examination',
    isActive: true
  }
];

async function setupCategories() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📋 Setting up recommended categories...\n');

    let created = 0;
    let existing = 0;
    let updated = 0;

    for (const catData of RECOMMENDED_CATEGORIES) {
      const existingCat = await Category.findOne({ slug: catData.slug });

      if (existingCat) {
        console.log(`  ✓ "${catData.name}" already exists`);
        existing++;

        // Update description and keywords if they're different
        let changed = false;
        if (existingCat.description !== catData.description) {
          existingCat.description = catData.description;
          changed = true;
        }
        if (existingCat.keywords !== catData.keywords) {
          existingCat.keywords = catData.keywords;
          changed = true;
        }
        if (changed) {
          await existingCat.save();
          console.log(`    → Updated description and keywords`);
          updated++;
        }
      } else {
        await Category.create(catData);
        console.log(`  + Created "${catData.name}"`);
        created++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Created: ${created}`);
    console.log(`  Existing: ${existing}`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Total: ${RECOMMENDED_CATEGORIES.length}`);

    console.log('\n✅ Category setup complete!');

    // List all active categories
    console.log('\n📋 All active categories in database:');
    const allCategories = await Category.find({ isActive: true }).sort({ name: 1 });
    allCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} (${cat.slug})`);
    });

    console.log('\n💡 Next Steps:');
    console.log('  1. Refresh your admin panel (Ctrl + Shift + R)');
    console.log('  2. Start assigning products to these categories');
    console.log('  3. Add subcategories as needed');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the setup
setupCategories();
