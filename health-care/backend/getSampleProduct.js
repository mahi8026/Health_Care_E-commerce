require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function getSampleProduct() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get a random product with images
    const product = await Product.findOne({ 
      images: { $exists: true, $ne: [] } 
    }).populate('category manufacturer');
    
    if (product) {
      console.log('\n📦 Sample Product:');
      console.log('Name:', product.name);
      console.log('SKU:', product.sku);
      console.log('Category:', product.category?.name);
      console.log('Manufacturer:', product.manufacturer?.name);
      console.log('\n🖼️ Images:');
      product.images.forEach((img, index) => {
        console.log(`  ${index + 1}. ${img.url}`);
        console.log(`     Public ID: ${img.publicId}`);
        console.log(`     Primary: ${img.isPrimary}`);
        console.log(`     Alt: ${img.alt}\n`);
      });
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getSampleProduct();
