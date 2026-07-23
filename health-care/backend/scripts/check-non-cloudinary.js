#!/usr/bin/env node

const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function checkNonCloudinary() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const allProducts = await Product.find();
    
    console.log(`Total products: ${allProducts.length}\n`);
    
    const nonCloudinary = allProducts.filter(p => {
      if (!p.images || p.images.length === 0) return false;
      
      return p.images.some(img => {
        const url = typeof img === 'string' ? img : (img.url || '');
        return url && url.startsWith('http') && !url.includes('cloudinary.com');
      });
    });
    
    console.log(`Products with non-Cloudinary images: ${nonCloudinary.length}\n`);
    
    if (nonCloudinary.length > 0) {
      nonCloudinary.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        product.images.forEach((img, imgIndex) => {
          const url = typeof img === 'string' ? img : (img.url || '');
          if (url && !url.includes('cloudinary.com')) {
            console.log(`   [${imgIndex + 1}] ${url.substring(0, 80)}...`);
          }
        });
        console.log('');
      });
    } else {
      console.log('✅ All product images are on Cloudinary!');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkNonCloudinary();
