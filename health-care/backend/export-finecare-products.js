/**
 * Export Finecare products from local MongoDB to JSON file
 * Run: node export-finecare-products.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to LOCAL MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medcore';

const productSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
const manufacturerSchema = new mongoose.Schema({}, { strict: false, collection: 'manufacturers' });

const Product = mongoose.model('Product', productSchema);
const Manufacturer = mongoose.model('Manufacturer', manufacturerSchema);

async function exportFinecareProducts() {
  try {
    console.log('🔌 Connecting to LOCAL MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to LOCAL MongoDB\n');

    // Find Finecare manufacturer
    const finecare = await Manufacturer.findOne({ 
      name: { $regex: /finecare/i } 
    }).lean();

    if (!finecare) {
      console.log('❌ Finecare manufacturer not found in local database');
      process.exit(1);
    }

    console.log('✅ Found Finecare manufacturer:', finecare.name);
    console.log('   ID:', finecare._id);
    console.log('   Country:', finecare.country || 'N/A');
    console.log('   Website:', finecare.website || 'N/A');
    console.log();

    // Find all Finecare products
    const products = await Product.find({ 
      brand: finecare._id 
    }).lean();

    console.log(`📦 Found ${products.length} Finecare products:\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Price: ৳${product.price}`);
      console.log(`   Stock: ${product.stock}`);
      console.log(`   Images: ${product.images?.length || 0}`);
      console.log(`   Active: ${product.isActive !== false ? 'Yes' : 'No'}`);
      console.log();
    });

    // Prepare export data
    const exportData = {
      manufacturer: finecare,
      products: products,
      exportDate: new Date().toISOString(),
      totalProducts: products.length
    };

    // Save to JSON file
    const exportDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filename = `finecare-products-${Date.now()}.json`;
    const filepath = path.join(exportDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

    console.log('✅ Export completed successfully!');
    console.log(`📁 File saved: ${filepath}`);
    console.log(`📊 Total products exported: ${products.length}`);
    console.log();
    console.log('Next steps:');
    console.log('1. Review the exported file');
    console.log('2. Run: node import-finecare-products.js');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

exportFinecareProducts();
