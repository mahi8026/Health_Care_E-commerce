require('dotenv').config();
const mongoose = require('mongoose');
const Manufacturer = require('../models/Manufacturer');
const logger = require('../utils/logger');

async function migrateManufacturers() {
  try {
    console.log('🚀 Starting manufacturer migration...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get native MongoDB driver (bypass Mongoose schema validation)
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    // Step 1: Get all unique brand/manufacturer strings from products
    const uniqueBrands = await productsCollection.distinct('brand', {
      brand: { $type: 'string' } // Only get string values
    });
    
    console.log(`📊 Found ${uniqueBrands.length} unique string brands in products:`);
    uniqueBrands.forEach(brand => console.log(`   - ${brand}`));
    console.log('');
    
    if (uniqueBrands.length === 0) {
      console.log('✅ No string brands found. All products already migrated!\n');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    // Step 2: Create Manufacturer documents
    const createdManufacturers = [];
    const skippedManufacturers = [];
    
    for (const brandName of uniqueBrands) {
      // Check if manufacturer already exists
      const existing = await Manufacturer.findOne({ name: brandName });
      
      if (existing) {
        console.log(`⏭️  Manufacturer "${brandName}" already exists (ID: ${existing._id})`);
        skippedManufacturers.push({ name: brandName, id: existing._id });
        continue;
      }
      
      // Create new manufacturer with basic info
      const manufacturer = await Manufacturer.create({
        name: brandName,
        description: `${brandName} medical equipment and supplies`,
        isActive: true,
        seo: {
          metaTitle: `${brandName} Products | MedCore BD`,
          metaDescription: `Browse ${brandName} medical equipment and supplies available at MedCore BD.`,
          keywords: [brandName.toLowerCase(), 'medical equipment', 'healthcare']
        }
      });
      
      console.log(`✅ Created manufacturer "${brandName}" (ID: ${manufacturer._id})`);
      createdManufacturers.push({ name: brandName, id: manufacturer._id });
    }
    
    console.log(`\n📝 Manufacturer Creation Summary:`);
    console.log(`   ✅ Created: ${createdManufacturers.length}`);
    console.log(`   ⏭️  Skipped (already exist): ${skippedManufacturers.length}`);
    console.log('');
    
    // Step 3: Update products to reference Manufacturer ObjectId using native driver
    console.log('🔄 Updating products with manufacturer references...\n');
    
    const allManufacturers = [...createdManufacturers, ...skippedManufacturers];
    let totalUpdated = 0;
    let totalErrors = 0;
    
    for (const { name, id } of allManufacturers) {
      try {
        // Use native MongoDB driver to bypass Mongoose validation
        const result = await productsCollection.updateMany(
          { brand: name }, // Find products where brand is still a string
          { $set: { brand: new mongoose.Types.ObjectId(id) } } // Convert to ObjectId
        );
        
        console.log(`✅ Updated ${result.modifiedCount} products for manufacturer "${name}"`);
        totalUpdated += result.modifiedCount;
      } catch (error) {
        console.error(`❌ Error updating products for manufacturer "${name}":`, error.message);
        totalErrors++;
      }
    }
    
    console.log(`\n📊 Product Update Summary:`);
    console.log(`   ✅ Total products updated: ${totalUpdated}`);
    console.log(`   ❌ Errors: ${totalErrors}`);
    console.log('');
    
    // Step 4: Verify migration
    console.log('🔍 Verifying migration...\n');
    
    const productsWithStringBrand = await productsCollection.countDocuments({ 
      brand: { $type: 'string' } 
    });
    
    const productsWithObjectIdBrand = await productsCollection.countDocuments({ 
      brand: { $type: 'objectId' } 
    });
    
    console.log(`   📊 String brands remaining: ${productsWithStringBrand}`);
    console.log(`   📊 ObjectId brands: ${productsWithObjectIdBrand}`);
    console.log('');
    
    if (productsWithStringBrand > 0) {
      console.log(`⚠️  Warning: ${productsWithStringBrand} products still have string brands\n`);
      const samples = await productsCollection.find({ 
        brand: { $type: 'string' } 
      }).limit(5).toArray();
      console.log('   Sample products with string brands:');
      samples.forEach(p => console.log(`      - ${p.name}: "${p.brand}"`));
      console.log('');
    } else {
      console.log('✅ All products successfully migrated to ObjectId references!\n');
    }
    
    // Final summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    MIGRATION COMPLETE                     ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🏭 Manufacturers created: ${createdManufacturers.length}`);
    console.log(`📦 Products updated: ${totalUpdated}`);
    console.log(`❌ Errors: ${totalErrors}`);
    console.log(`✅ Success rate: ${totalErrors === 0 ? '100%' : Math.round((totalUpdated / (totalUpdated + totalErrors)) * 100) + '%'}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (totalErrors === 0 && productsWithStringBrand === 0) {
      console.log('🎉 Migration completed successfully! All products now use ObjectId references.\n');
    } else {
      console.log('⚠️  Migration completed with warnings. Please review the output above.\n');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    logger.error(`[migrateManufacturers] ${error.message}`);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run migration
migrateManufacturers();
