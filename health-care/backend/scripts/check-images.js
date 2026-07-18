#!/usr/bin/env node

const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function checkImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const products = await Product.find().limit(10);
    
    console.log(`Checking first ${products.length} products:\n`);
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      if (product.images && product.images.length > 0) {
        const firstImage = product.images[0];
        console.log(`   Image type: ${typeof firstImage}`);
        if (typeof firstImage === 'object') {
          console.log(`   Image URL: ${firstImage.url}`);
          console.log(`   Has publicId: ${!!firstImage.publicId}`);
          console.log(`   Is Cloudinary: ${firstImage.url?.includes('cloudinary.com')}`);
        } else {
          console.log(`   Image URL: ${firstImage}`);
          console.log(`   Is Cloudinary: ${firstImage.includes('cloudinary.com')}`);
        }
      } else {
        console.log(`   No images`);
      }
      console.log('');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkImages();
