/**
 * Import Finecare products to PRODUCTION MongoDB
 * Run: node import-finecare-products.js <filename>
 * Example: node import-finecare-products.js finecare-products-1234567890.json
 */

require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to PRODUCTION MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.production');
  process.exit(1);
}

const productSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
const manufacturerSchema = new mongoose.Schema({}, { strict: false, collection: 'manufacturers' });

const Product = mongoose.model('Product', productSchema);
const Manufacturer = mongoose.model('Manufacturer', manufacturerSchema);

async function importFinecareProducts() {
  try {
    // Get filename from command line argument
    const filename = process.argv[2];
    if (!filename) {
      console.error('❌ Please provide the export filename');
      console.log('Usage: node import-finecare-products.js <filename>');
      console.log('Example: node import-finecare-products.js finecare-products-1234567890.json');
      process.exit(1);
    }

    const filepath = path.join(__dirname, 'exports', filename);
    
    if (!fs.existsSync(filepath)) {
      console.error(`❌ File not found: ${filepath}`);
      process.exit(1);
    }

    console.log('📂 Reading export file:', filepath);
    const exportData = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    console.log(`📊 Export contains ${exportData.totalProducts} products`);
    console.log(`📅 Exported on: ${exportData.exportDate}\n`);

    console.log('🔌 Connecting to PRODUCTION MongoDB...');
    console.log('   URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to PRODUCTION MongoDB\n');

    // Step 1: Ensure Finecare manufacturer exists
    console.log('🏭 Checking Finecare manufacturer...');
    let manufacturer = await Manufacturer.findOne({ 
      name: { $regex: /finecare/i } 
    });

    if (!manufacturer) {
      console.log('   Creating Finecare manufacturer...');
      const manufacturerData = { ...exportData.manufacturer };
      delete manufacturerData._id; // Let MongoDB generate new ID
      manufacturer = await Manufacturer.create(manufacturerData);
      console.log('   ✅ Created manufacturer:', manufacturer.name, '(ID:', manufacturer._id + ')');
    } else {
      console.log('   ✅ Manufacturer exists:', manufacturer.name, '(ID:', manufacturer._id + ')');
    }
    console.log();

    // Step 2: Import products
    console.log('📦 Importing products...\n');
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const productData of exportData.products) {
      try {
        // Check if product already exists by SKU
        const existingProduct = await Product.findOne({ sku: productData.sku });

        if (existingProduct) {
          console.log(`⚠️  Product exists: ${productData.name} (SKU: ${productData.sku})`);
          console.log(`   Updating...`);
          
          // Update existing product
          const updateData = { ...productData };
          delete updateData._id; // Don't update _id
          updateData.brand = manufacturer._id; // Use production manufacturer ID
          
          await Product.findByIdAndUpdate(existingProduct._id, updateData);
          updated++;
          console.log(`   ✅ Updated\n`);
        } else {
          // Create new product
          const newProductData = { ...productData };
          delete newProductData._id; // Let MongoDB generate new ID
          newProductData.brand = manufacturer._id; // Use production manufacturer ID
          
          const newProduct = await Product.create(newProductData);
          created++;
          console.log(`✅ Created: ${newProduct.name} (SKU: ${newProduct.sku})`);
          console.log(`   Price: ৳${newProduct.price}, Stock: ${newProduct.stock}, Images: ${newProduct.images?.length || 0}\n`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error importing ${productData.name}:`, error.message);
        console.log();
      }
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Import completed!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Created: ${created} products`);
    console.log(`   🔄 Updated: ${updated} products`);
    console.log(`   ⏭️  Skipped: ${skipped} products`);
    console.log(`   ❌ Errors: ${errors} products`);
    console.log(`   📦 Total: ${exportData.totalProducts} products`);
    console.log('═══════════════════════════════════════════════════════');
    console.log();
    console.log('🎉 Finecare products are now available in production!');
    console.log('🔗 Visit: https://health-care-e-commerce.onrender.com/products?brand=Finecare');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

importFinecareProducts();
