/**
 * Setup B2B Discounts for All Categories
 * Sets the approved discount percentages for each product category
 * 
 * Usage: node setup-b2b-discounts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/models/Category');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medcore';

// Approved B2B discount percentages by category
const CATEGORY_DISCOUNTS = {
  'Orthopedic Supports': 15,              // 12-15% → using 15%
  'Diagnostic Equipment': 18,             // 15-18% → using 18%
  'Surgical & Wound Care': 12,            // 10-12% → using 12%
  'Hospital Machines': 22,                // 18-22% → using 22%
  'Consumables': 10,                      // 8-10% → using 10%
  'Diabetes Care': 15,                    // 12-15% → using 15%
  'Ophthalmology & ENT Equipment': 18,    // 15-18% → using 18%
  'IV & Infusion Therapy': 12,            // 10-12% → using 12%
  'Laboratory Equipment': 18,             // 15-18% → using 18%
  'Laboratory Reagents': 25,              // 20-25% → using 25%
  'Physiotherapy & Rehabilitation': 15,   // 12-15% → using 15%
  'Blood Bank Supplies': 8,               // As specified
  'Medical Supplies': 10,                 // 8-10% → using 10%
  'Medical Devices': 18,                  // 15-18% → using 18%
  'Respiratory Equipment': 18,            // 15-18% → using 18%
  'Compression Garments': 12,             // 10-12% → using 12%
  'Diagnostic Devices': 18,               // 15-18% → using 18%
  'Surgical Instruments': 12              // 10-12% → using 12%
};

async function setupB2BDiscounts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Setting up B2B discounts for all categories...\n');
    console.log('═'.repeat(70));

    let updated = 0;
    let notFound = 0;

    for (const [categoryName, discountPct] of Object.entries(CATEGORY_DISCOUNTS)) {
      const category = await Category.findOne({ name: categoryName });

      if (category) {
        category.b2bDiscountEnabled = true;
        category.b2bDiscountPct = discountPct;
        await category.save();

        console.log(`✅ ${categoryName.padEnd(40)} → ${discountPct}% B2B discount`);
        updated++;
      } else {
        console.log(`⚠️  ${categoryName.padEnd(40)} → NOT FOUND in database`);
        notFound++;
      }
    }

    console.log('═'.repeat(70));
    console.log(`\n📋 Summary:`);
    console.log(`   ✅ Updated: ${updated} categories`);
    console.log(`   ⚠️  Not Found: ${notFound} categories`);

    // Display all categories with their B2B settings
    console.log('\n📦 All Categories with B2B Discounts:\n');
    const allCategories = await Category.find({ isActive: true })
      .select('name b2bDiscountEnabled b2bDiscountPct productCount')
      .sort({ name: 1 });

    allCategories.forEach(cat => {
      const status = cat.b2bDiscountEnabled ? '✅' : '❌';
      const discount = cat.b2bDiscountEnabled ? `${cat.b2bDiscountPct}%` : 'Disabled';
      console.log(`   ${status} ${cat.name.padEnd(40)} → ${discount.padStart(10)} (${cat.productCount || 0} products)`);
    });

    console.log('\n✅ B2B discount setup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
setupB2BDiscounts();
