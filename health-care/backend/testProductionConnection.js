const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.production') });
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB Atlas connection...\n');
    console.log('📍 URI:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    console.log('');
    
    console.log('⏳ Connecting...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!\n');
    
    const Product = require('./src/models/Product');
    const productCount = await Product.countDocuments();
    
    console.log('📊 Current database status:');
    console.log('   Products:', productCount);
    
    await mongoose.connection.close();
    console.log('\n✅ Connection test successful!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('\n💡 Possible solutions:');
    console.error('   1. Check your internet connection');
    console.error('   2. Verify MongoDB Atlas credentials in .env.production');
    console.error('   3. Check if your IP is whitelisted in MongoDB Atlas');
    console.error('   4. Try using a VPN if your network blocks MongoDB Atlas');
    process.exit(1);
  }
}

testConnection();
