#!/usr/bin/env node

/**
 * MongoDB Connection Diagnostic Tool
 * 
 * This script helps diagnose MongoDB connection issues by:
 * 1. Checking environment variables
 * 2. Testing MongoDB connection
 * 3. Providing actionable solutions
 */

require('dotenv').config();
const mongoose = require('mongoose');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function diagnose() {
  section('MongoDB Connection Diagnostics');
  
  // Step 1: Check environment variables
  section('Step 1: Checking Environment Variables');
  
  const mongoUri = process.env.MONGODB_URI;
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  log(`Environment: ${nodeEnv}`, 'blue');
  
  if (!mongoUri) {
    log('❌ MONGODB_URI is not set in .env file', 'red');
    log('\nSolution:', 'yellow');
    log('Add one of these to your .env file:', 'yellow');
    log('  Local: MONGODB_URI=mongodb://localhost:27017/medcore-bd', 'yellow');
    log('  Atlas: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medcore-bd', 'yellow');
    process.exit(1);
  }
  
  log(`✓ MONGODB_URI is set`, 'green');
  
  // Mask password in URI for display
  const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
  log(`  URI: ${maskedUri}`, 'blue');
  
  // Determine connection type
  const isAtlas = mongoUri.includes('mongodb+srv://');
  const isLocal = mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');
  
  if (isAtlas) {
    log('  Type: MongoDB Atlas (Cloud)', 'blue');
  } else if (isLocal) {
    log('  Type: Local MongoDB', 'blue');
  } else {
    log('  Type: Remote MongoDB', 'blue');
  }
  
  // Step 2: Test connection
  section('Step 2: Testing MongoDB Connection');
  
  log('Attempting to connect...', 'yellow');
  
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    
    log('✓ Successfully connected to MongoDB!', 'green');
    log(`  Host: ${mongoose.connection.host}`, 'blue');
    log(`  Database: ${mongoose.connection.name}`, 'blue');
    log(`  Port: ${mongoose.connection.port}`, 'blue');
    
    // Test a simple operation
    section('Step 3: Testing Database Operations');
    const collections = await mongoose.connection.db.listCollections().toArray();
    log(`✓ Found ${collections.length} collections`, 'green');
    
    if (collections.length > 0) {
      log('  Collections:', 'blue');
      collections.forEach(col => {
        log(`    - ${col.name}`, 'blue');
      });
    }
    
    section('Diagnosis Complete');
    log('✓ All checks passed! Your MongoDB connection is working correctly.', 'green');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    log('❌ Connection failed', 'red');
    log(`  Error: ${error.message}`, 'red');
    
    section('Troubleshooting Steps');
    
    if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      log('Issue: Authentication Failed', 'yellow');
      log('\nPossible solutions:', 'yellow');
      log('1. Verify username and password in MONGODB_URI', 'yellow');
      log('2. Check MongoDB Atlas Database Access settings', 'yellow');
      log('3. For local MongoDB, try without authentication:', 'yellow');
      log('   MONGODB_URI=mongodb://localhost:27017/medcore-bd', 'yellow');
      
    } else if (error.message.includes('ECONNREFUSED')) {
      log('Issue: Connection Refused', 'yellow');
      log('\nPossible solutions:', 'yellow');
      log('1. MongoDB service is not running', 'yellow');
      log('   Windows: net start MongoDB', 'yellow');
      log('   Or: mongod --dbpath "C:\\data\\db"', 'yellow');
      log('2. Check if MongoDB is installed', 'yellow');
      log('   Download from: https://www.mongodb.com/try/download/community', 'yellow');
      
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      log('Issue: Cannot Resolve Hostname', 'yellow');
      log('\nPossible solutions:', 'yellow');
      log('1. Check your internet connection', 'yellow');
      log('2. Verify the MongoDB Atlas URL is correct', 'yellow');
      log('3. Check if your network blocks MongoDB Atlas', 'yellow');
      
    } else if (error.message.includes('IP') || error.message.includes('not authorized')) {
      log('Issue: IP Not Whitelisted', 'yellow');
      log('\nSolution:', 'yellow');
      log('1. Go to MongoDB Atlas → Network Access', 'yellow');
      log('2. Add your current IP address', 'yellow');
      log('3. Or add 0.0.0.0/0 for development (allows all IPs)', 'yellow');
      
    } else {
      log('Issue: Unknown Error', 'yellow');
      log('\nGeneral solutions:', 'yellow');
      log('1. Check MONGODB_URI format', 'yellow');
      log('2. Verify network connectivity', 'yellow');
      log('3. Check MongoDB server logs', 'yellow');
      log('4. Try using MongoDB Atlas (cloud) instead of local', 'yellow');
    }
    
    log('\nFor more help, see: health-care/backend/TROUBLESHOOTING.md', 'cyan');
    
    process.exit(1);
  }
}

// Run diagnostics
diagnose().catch(error => {
  log(`Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
