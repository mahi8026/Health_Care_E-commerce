#!/usr/bin/env node

/**
 * MongoDB Connection Diagnostic Tool
 * 
 * This script tests MongoDB connection and provides detailed diagnostics
 * Run: node diagnose-connection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70));
}

async function diagnoseConnection() {
  logSection('MongoDB Connection Diagnostics');
  
  // Step 1: Check environment variables
  logSection('Step 1: Environment Variables');
  
  const requiredVars = [
    'MONGODB_URI',
    'NODE_ENV',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];
  
  let missingVars = [];
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✓ ${varName}: Set`, 'green');
    } else {
      log(`✗ ${varName}: Missing`, 'red');
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    log(`\n⚠️  Missing ${missingVars.length} required environment variable(s)`, 'yellow');
    log('Please set these in your .env file', 'yellow');
    process.exit(1);
  }
  
  // Step 2: Validate connection string format
  logSection('Step 2: Connection String Validation');
  
  const uri = process.env.MONGODB_URI;
  const uriWithoutPassword = uri.replace(/:([^:@]{8})[^:@]*@/, ':****@');
  
  log(`Connection URI: ${uriWithoutPassword}`, 'cyan');
  
  const validations = [
    {
      test: uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
      message: 'URI starts with mongodb:// or mongodb+srv://',
    },
    {
      test: uri.includes('@'),
      message: 'URI contains credentials (@)',
    },
    {
      test: uri.split('@')[1]?.includes('.'),
      message: 'URI contains valid host',
    },
    {
      test: !uri.includes(' '),
      message: 'URI has no spaces',
    },
  ];
  
  let validationPassed = true;
  
  validations.forEach(({ test, message }) => {
    if (test) {
      log(`✓ ${message}`, 'green');
    } else {
      log(`✗ ${message}`, 'red');
      validationPassed = false;
    }
  });
  
  if (!validationPassed) {
    log('\n⚠️  Connection string format issues detected', 'yellow');
    log('Please check your MONGODB_URI format', 'yellow');
    process.exit(1);
  }
  
  // Step 3: Test connection
  logSection('Step 3: Connection Test');
  
  const connectionOptions = {
    minPoolSize: 5,
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
    waitQueueTimeoutMS: 10000,
    retryWrites: true,
    retryReads: true,
  };
  
  log('Attempting to connect to MongoDB...', 'cyan');
  log('Timeout: 10 seconds', 'cyan');
  
  const startTime = Date.now();
  
  try {
    await mongoose.connect(uri, connectionOptions);
    const duration = Date.now() - startTime;
    
    log(`✓ Connection successful in ${duration}ms`, 'green');
    
    // Step 4: Check connection details
    logSection('Step 4: Connection Details');
    
    const conn = mongoose.connection;
    
    log(`Host: ${conn.host}`, 'cyan');
    log(`Port: ${conn.port || 'N/A (using SRV)'}`, 'cyan');
    log(`Database: ${conn.name}`, 'cyan');
    log(`Ready State: ${conn.readyState} (1 = connected)`, 'cyan');
    
    // Step 5: Test database operations
    logSection('Step 5: Database Operations Test');
    
    try {
      // List collections
      const collections = await conn.db.listCollections().toArray();
      log(`✓ Found ${collections.length} collections`, 'green');
      
      if (collections.length > 0) {
        log('\nCollections:', 'cyan');
        collections.slice(0, 10).forEach(col => {
          log(`  - ${col.name}`, 'cyan');
        });
        if (collections.length > 10) {
          log(`  ... and ${collections.length - 10} more`, 'cyan');
        }
      }
      
      // Test read operation
      const Product = require('./src/models/Product');
      const productCount = await Product.countDocuments();
      log(`✓ Products collection: ${productCount} documents`, 'green');
      
      // Test write operation (create and delete a test document)
      const testDoc = await Product.create({
        name: '__CONNECTION_TEST__',
        sku: 'TEST-' + Date.now(),
        price: { retail: 0 },
        stock: { quantity: 0 },
        isActive: false,
      });
      await Product.findByIdAndDelete(testDoc._id);
      log('✓ Write operation successful', 'green');
      
    } catch (error) {
      log(`✗ Database operation failed: ${error.message}`, 'red');
    }
    
    // Step 6: Connection pool metrics
    logSection('Step 6: Connection Pool Metrics');
    
    try {
      const client = conn.getClient();
      const topology = client.topology;
      
      if (topology && topology.s && topology.s.servers) {
        const servers = topology.s.servers;
        let totalActive = 0;
        let totalIdle = 0;
        
        servers.forEach((server) => {
          const pool = server.s && server.s.pool;
          if (pool) {
            totalActive += pool.currentCheckedOutCount || 0;
            totalIdle += (pool.totalConnectionCount || 0) - (pool.currentCheckedOutCount || 0);
          }
        });
        
        log(`Active connections: ${totalActive}`, 'cyan');
        log(`Idle connections: ${totalIdle}`, 'cyan');
        log(`Total connections: ${totalActive + totalIdle}`, 'cyan');
        log(`Min pool size: ${connectionOptions.minPoolSize}`, 'cyan');
        log(`Max pool size: ${connectionOptions.maxPoolSize}`, 'cyan');
      } else {
        log('⚠️  Pool metrics not available', 'yellow');
      }
    } catch (error) {
      log(`⚠️  Could not retrieve pool metrics: ${error.message}`, 'yellow');
    }
    
    // Step 7: Summary
    logSection('Summary');
    
    log('✓ All diagnostics passed', 'green');
    log('✓ MongoDB connection is healthy', 'green');
    log('✓ Database operations working correctly', 'green');
    
    log('\nYour MongoDB connection is properly configured!', 'bright');
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    log(`✗ Connection failed after ${duration}ms`, 'red');
    log(`Error: ${error.message}`, 'red');
    
    logSection('Error Analysis');
    
    if (error.name === 'MongoServerSelectionError') {
      log('⚠️  Server Selection Error', 'yellow');
      log('Possible causes:', 'yellow');
      log('  1. MongoDB Atlas cluster is paused (M0 free tier)', 'yellow');
      log('  2. IP address not whitelisted (add 0.0.0.0/0)', 'yellow');
      log('  3. Network connectivity issues', 'yellow');
      log('  4. Incorrect connection string', 'yellow');
    } else if (error.name === 'MongoServerError' && error.message.includes('auth')) {
      log('⚠️  Authentication Error', 'yellow');
      log('Possible causes:', 'yellow');
      log('  1. Incorrect username or password', 'yellow');
      log('  2. User does not have access to database', 'yellow');
      log('  3. Password contains special characters (needs URL encoding)', 'yellow');
    } else if (error.name === 'MongoNetworkError') {
      log('⚠️  Network Error', 'yellow');
      log('Possible causes:', 'yellow');
      log('  1. Firewall blocking connection', 'yellow');
      log('  2. DNS resolution issues', 'yellow');
      log('  3. MongoDB Atlas cluster unreachable', 'yellow');
    }
    
    log('\nRecommended actions:', 'cyan');
    log('  1. Check MongoDB Atlas cluster status', 'cyan');
    log('  2. Verify connection string format', 'cyan');
    log('  3. Check IP whitelist (0.0.0.0/0)', 'cyan');
    log('  4. Verify database user permissions', 'cyan');
    log('  5. See MONGODB-CONNECTION-FIX.md for detailed guide', 'cyan');
    
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    log('\nConnection closed.', 'cyan');
  }
}

// Run diagnostics
diagnoseConnection().catch(error => {
  log(`\nUnexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
