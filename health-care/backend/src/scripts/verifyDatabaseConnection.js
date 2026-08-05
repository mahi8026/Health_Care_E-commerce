#!/usr/bin/env node

/**
 * Verify Database Connection
 * 
 * Checks which database is currently connected
 * Use this to verify consolidation is complete
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function verifyConnection() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Database Connection Verification');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    console.log('→ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const dbName = mongoose.connection.db.databaseName;
    console.log('✓ Connected successfully\n');
    
    console.log('📊 Connection Details:');
    console.log(`   Database Name: ${dbName}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}\n`);

    // Check if it's the correct database
    if (dbName === 'medcore-bd') {
      console.log('✅ CORRECT: Connected to production database (medcore-bd)');
    } else if (dbName === 'mediport-bd') {
      console.log('⚠️  WARNING: Connected to OLD database (mediport-bd)');
      console.log('   Action needed: Update .env to use medcore-bd');
    } else {
      console.log(`⚠️  UNKNOWN: Connected to unexpected database (${dbName})`);
    }

    // List some collections
    console.log('\n📁 Collections in database:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.slice(0, 10).forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    if (collections.length > 10) {
      console.log(`   ... and ${collections.length - 10} more`);
    }

    console.log(`\n   Total: ${collections.length} collections`);

    // Check for ALPK2
    console.log('\n🔍 Checking for ALPK2 brand...');
    const Manufacturer = require('../models/Manufacturer');
    const alpk2 = await Manufacturer.findOne({ name: /ALPK2/i });
    
    if (alpk2) {
      console.log('✓ ALPK2 brand found in this database');
      const Product = require('../models/Product');
      const productCount = await Product.countDocuments({ brand: alpk2._id });
      console.log(`✓ ${productCount} ALPK2 products found`);
    } else {
      console.log('✗ ALPK2 brand NOT found in this database');
    }

    await mongoose.connection.close();
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifyConnection();
