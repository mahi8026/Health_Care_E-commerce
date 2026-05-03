require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const PRODUCTION_URI = 'mongodb+srv://Health_Care_E-commerce:ibQkT9ppTdivDtXt@cluster0.rqyzhey.mongodb.net/medcore-bd?retryWrites=true&w=majority&appName=Cluster0';

async function verifyProduction() {
  try {
    console.log('Connecting to production...');
    await mongoose.connect(PRODUCTION_URI);
    console.log('✅ Connected\n');
    
    const count = await Product.countDocuments();
    const withImages = await Product.countDocuments({ images: { $exists: true, $ne: [] } });
    const withoutImages = await Product.countDocuments({ $or: [{ images: { $exists: false } }, { images: { $size: 0 } }] });
    
    console.log('Production Database:');
    console.log('  Total Products:', count);
    console.log('  With Images:', withImages);
    console.log('  Without Images:', withoutImages);
    
    // Show some sample SKUs
    const samples = await Product.find({}).select('sku name').limit(10);
    console.log('\nSample products:');
    samples.forEach(p => console.log(`  - ${p.sku}: ${p.name}`));
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyProduction();
