require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');

async function checkALPK2() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find ALPK2 brand
    const alpk2 = await Manufacturer.findOne({ name: /ALPK2/i });
    
    if (!alpk2) {
      console.log('❌ ALPK2 brand not found!');
      await mongoose.connection.close();
      return;
    }

    console.log('✓ ALPK2 Brand Found:');
    console.log(`  ID: ${alpk2._id}`);
    console.log(`  Name: ${alpk2.name}`);
    console.log(`  Slug: ${alpk2.slug}`);
    console.log(`  Active: ${alpk2.isActive}`);
    console.log(`  Country: ${alpk2.country}\n`);

    // Find products
    const products = await Product.find({ brand: alpk2._id }).select('name brand isActive slug price');
    
    console.log(`✓ ALPK2 Products Found: ${products.length}\n`);
    
    if (products.length > 0) {
      products.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   - Active: ${p.isActive}`);
        console.log(`   - Price: ৳${p.price}`);
        console.log(`   - Slug: ${p.slug}`);
        console.log(`   - Brand ID: ${p.brand}\n`);
      });
    } else {
      console.log('❌ No products found for ALPK2');
    }

    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkALPK2();
