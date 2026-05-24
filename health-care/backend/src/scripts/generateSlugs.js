require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function migrate() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env file');
      console.log('Please ensure .env file exists in backend/ directory with MONGODB_URI set');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const products = await Product.find({ $or: [{ slug: null }, { slug: '' }] })
      .populate('brand', 'name');
    console.log(`Found ${products.length} products without slugs`);

    let fixed = 0;
    let errors = 0;

    for (const product of products) {
      try {
        // Trigger pre-save hook by marking name as modified
        product.slug = undefined;
        await product.save();
        fixed++;
        if (fixed % 50 === 0) console.log(`Fixed ${fixed}/${products.length}...`);
      } catch (err) {
        console.error(`Failed for ${product.name}:`, err.message);
        errors++;
      }
    }

    console.log(`\n✅ Done. Generated slugs for ${fixed} products.`);
    if (errors > 0) console.log(`⚠️  ${errors} products failed.`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
