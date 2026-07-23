#!/usr/bin/env node
/**
 * Sync Categories Script
 * Adds missing categories that are referenced in frontend code but don't exist in database
 * 
 * Usage: node sync-categories.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/models/Category');

// Categories that should exist (based on frontend hardcoded references)
const REQUIRED_CATEGORIES = [
  {
    name: 'Diagnostic Equipment',
    slug: 'diagnostic-equipment',
    description: 'Diagnostic equipment and instruments',
    isActive: true
  },
  {
    name: 'Surgical Instruments',
    slug: 'surgical-instruments',
    description: 'Surgical instruments and tools',
    isActive: true
  },
  {
    name: 'Laboratory Reagents',
    slug: 'laboratory-reagents',
    description: 'Laboratory reagents and test kits',
    isActive: true
  },
  {
    name: 'Hospital Machines',
    slug: 'hospital-machines',
    description: 'Hospital equipment and machines',
    isActive: true
  },
  {
    name: 'Laboratory Equipment',
    slug: 'laboratory-equipment',
    description: 'Laboratory equipment and instruments',
    isActive: true
  },
  {
    name: 'Medical Devices',
    slug: 'medical-devices',
    description: 'Medical devices and equipment',
    isActive: true
  },
  {
    name: 'Medical Supplies',
    slug: 'medical-supplies',
    description: 'Medical supplies and consumables',
    isActive: true
  },
  {
    name: 'Consumables',
    slug: 'consumables',
    description: 'Medical consumables and supplies',
    isActive: true
  },
  {
    name: 'Compression Garments',
    slug: 'compression-garments',
    description: 'Compression garments and medical equipment and supplies',
    isActive: true
  },
  {
    name: 'Orthopedic Supports',
    slug: 'orthopedic-supports',
    description: 'Orthopedic supports and braces',
    isActive: true
  },
  {
    name: 'Respiratory Equipment',
    slug: 'respiratory-equipment',
    description: 'Respiratory equipment and accessories',
    isActive: true
  },
  {
    name: 'Diagnostic Devices',
    slug: 'diagnostic-devices',
    description: 'Diagnostic devices and monitors',
    isActive: true
  }
];

async function syncCategories() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📋 Syncing categories...\n');

    let created = 0;
    let existing = 0;
    let updated = 0;

    for (const catData of REQUIRED_CATEGORIES) {
      // Check if category exists by name
      const existingCat = await Category.findOne({ name: catData.name });

      if (existingCat) {
        console.log(`  ✓ "${catData.name}" already exists`);
        existing++;

        // Update slug if it's different
        if (existingCat.slug !== catData.slug) {
          existingCat.slug = catData.slug;
          await existingCat.save();
          console.log(`    → Updated slug to "${catData.slug}"`);
          updated++;
        }
      } else {
        // Create new category
        await Category.create(catData);
        console.log(`  + Created "${catData.name}"`);
        created++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Created: ${created}`);
    console.log(`  Existing: ${existing}`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Total: ${REQUIRED_CATEGORIES.length}`);

    console.log('\n✅ Category sync complete!');

    // List all categories
    console.log('\n📋 All categories in database:');
    const allCategories = await Category.find({}).sort({ name: 1 });
    allCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug}) [${cat.isActive ? 'Active' : 'Inactive'}]`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the sync
syncCategories();
