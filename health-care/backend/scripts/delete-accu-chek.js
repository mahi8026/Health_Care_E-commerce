#!/usr/bin/env node

const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function deleteAccuChek() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Accu-Chek products
    const products = await Product.find({ name: /Accu-Chek/i });
    
    console.log(`Found ${products.length} Accu-Chek products to delete:\n`);
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (৳${product.price})`);
    });
    
    console.log(`\nDeleting ${products.length} products...`);
    
    const result = await Product.deleteMany({ name: /Accu-Chek/i });
    
    console.log(`\n✅ Deleted ${result.deletedCount} products\n`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteAccuChek();
