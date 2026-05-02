require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function checkImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const withImages = await Product.countDocuments({ 
      images: { $exists: true, $ne: [] } 
    });
    
    const withoutImages = await Product.countDocuments({ 
      $or: [
        { images: { $exists: false } }, 
        { images: { $size: 0 } }
      ] 
    });
    
    const total = await Product.countDocuments();
    
    console.log('\n📊 Image Status:');
    console.log('✅ Products with images:', withImages);
    console.log('❌ Products without images:', withoutImages);
    console.log('📦 Total products:', total);
    console.log(`\n📈 Coverage: ${((withImages/total) * 100).toFixed(1)}%\n`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkImages();
