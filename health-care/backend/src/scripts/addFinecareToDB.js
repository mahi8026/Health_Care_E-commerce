require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Manufacturer = require('../models/Manufacturer');

/**
 * Quick script to add Finecare manufacturer to production database
 * Usage: node src/scripts/addFinecareToDB.js
 */

async function addFinecare() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if Finecare already exists
    const existing = await Manufacturer.findOne({ 
      name: { $regex: new RegExp('^Finecare$', 'i') } 
    });

    if (existing) {
      console.log('⚠️  Finecare manufacturer already exists!');
      console.log(`   ID: ${existing._id}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Slug: ${existing.slug}`);
      console.log(`   Active: ${existing.isActive}\n`);
      
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
        console.log('✅ Activated Finecare manufacturer\n');
      }
    } else {
      // Create Finecare manufacturer
      const finecare = await Manufacturer.create({
        name: 'Finecare',
        description: 'Finecare Biosystems - Leading manufacturer of rapid diagnostic test systems and fluorescence immunoassay analyzers',
        country: 'China',
        website: 'https://www.finecarebio.com',
        isActive: true
      });

      console.log('✅ Created Finecare manufacturer!');
      console.log(`   ID: ${finecare._id}`);
      console.log(`   Name: ${finecare.name}`);
      console.log(`   Slug: ${finecare.slug}`);
      console.log(`   Country: ${finecare.country}\n`);
    }

    console.log('✅ Done!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the script
addFinecare();

