require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const total = await Product.countDocuments();
    const withSlugs = await Product.countDocuments({ 
      slug: { $exists: true, $ne: '' } 
    });
    const withoutSlugs = total - withSlugs;

    console.log(`\nProduct Status:`);
    console.log(`Total products: ${total}`);
    console.log(`Products with slugs: ${withSlugs}`);
    console.log(`Products without slugs: ${withoutSlugs}`);

    if (withoutSlugs > 0) {
      console.log(`\n⚠️  Run 'npm run generate-slugs' to fix ${withoutSlugs} products`);
    } else if (total > 0) {
      console.log(`\n✅ All products have slugs!`);
      
      // Show a sample
      const sample = await Product.findOne({ slug: { $exists: true } })
        .select('name slug')
        .lean();
      if (sample) {
        console.log(`\nSample: ${sample.name}`);
        console.log(`Slug: ${sample.slug}`);
      }
    } else {
      console.log(`\n⚠️  No products found in database`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Check failed:', error.message);
    process.exit(1);
  }
}

check();
