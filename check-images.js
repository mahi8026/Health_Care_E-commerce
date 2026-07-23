// Quick script to check if products have images in the database
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/mediport';

async function checkImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    const totalProducts = await Product.countDocuments();
    const productsWithImages = await Product.countDocuments({ 'images.0': { $exists: true } });
    const productsWithoutImages = totalProducts - productsWithImages;
    
    console.log('\n=== Image Statistics ===');
    console.log(`Total products: ${totalProducts}`);
    console.log(`Products with images: ${productsWithImages}`);
    console.log(`Products without images: ${productsWithoutImages}`);
    
    // Sample a few products to see their image structure
    const samples = await Product.find({ 'images.0': { $exists: true } }).limit(3).lean();
    
    console.log('\n=== Sample Products with Images ===');
    samples.forEach((product, idx) => {
      console.log(`\n${idx + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Images count: ${product.images?.length || 0}`);
      if (product.images && product.images.length > 0) {
        console.log(`   First image URL: ${product.images[0].url || product.images[0]}`);
      }
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkImages();
