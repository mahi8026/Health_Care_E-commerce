#!/usr/bin/env node
/**
 * List Orders Script
 * 
 * Lists all orders in the database with their details
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const logger = require('./src/utils/logger');

async function listOrders() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Mediport';
    logger.info(`Connecting to MongoDB...`);
    
    await mongoose.connect(mongoUri);
    
    logger.info('✅ Connected to MongoDB\n');
    
    // Get all orders
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .select('orderNumber orderId status totalAmount total paymentMethod user items createdAt')
      .lean();
    
    logger.info(`Found ${orders.length} orders:\n`);
    logger.info(`${'='.repeat(100)}`);
    
    for (const order of orders) {
      logger.info(`Order Number: ${order.orderNumber || order.orderId || 'N/A'}`);
      logger.info(`  ID: ${order._id}`);
      logger.info(`  Status: ${order.status}`);
      logger.info(`  Amount: ৳${order.totalAmount || order.total || 0}`);
      logger.info(`  Payment: ${order.paymentMethod}`);
      logger.info(`  Items: ${order.items?.length || 0}`);
      logger.info(`  User: ${order.user}`);
      logger.info(`  Created: ${order.createdAt}`);
      logger.info(`${'-'.repeat(100)}`);
    }
    
    logger.info(`\nTotal orders: ${orders.length}`);
    
  } catch (error) {
    logger.error(`❌ Error: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);
  } finally {
    await mongoose.connection.close();
    logger.info('\nDatabase connection closed');
  }
}

listOrders()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
