#!/usr/bin/env node
/**
 * Delete Orders Script
 * 
 * Permanently deletes specified orders from the database.
 * USE WITH CAUTION - This operation cannot be undone.
 * 
 * Usage:
 *   node delete-orders.js ORD-00017 ORD-00016 ORD-00018 ORD-177753843956l-841
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Product = require('./src/models/Product');
const logger = require('./src/utils/logger');

// List of order numbers to delete (from the screenshots)
const ORDER_NUMBERS_TO_DELETE = [
  'ORD-00017',
  'ORD-00016', 
  'ORD-00018',
  'ORD-177753843956l-841'
];

/**
 * Restore product stock before deleting order
 */
async function restoreStockForOrder(order) {
  logger.info(`Restoring stock for order: ${order.orderNumber}`);
  
  for (const item of order.items) {
    try {
      const product = await Product.findById(item.product);
      
      if (!product) {
        logger.warn(`Product ${item.product} not found, skipping stock restoration`);
        continue;
      }

      // Check if order has size variant
      if (item.variant?.size) {
        // Restore size-specific stock
        const sizeIndex = product.variants.sizes.findIndex(s => s.name === item.variant.size);
        
        if (sizeIndex !== -1) {
          product.variants.sizes[sizeIndex].stock += item.qty || item.quantity || 1;
          logger.info(`Restored ${item.qty || item.quantity || 1} units to ${product.name} (Size: ${item.variant.size})`);
        }
      }
      
      // Restore main product stock
      product.stock += item.qty || item.quantity || 1;
      await product.save();
      
      logger.info(`✅ Stock restored for ${product.name}: +${item.qty || item.quantity || 1} units`);
    } catch (error) {
      logger.error(`❌ Failed to restore stock for product ${item.product}: ${error.message}`);
    }
  }
}

/**
 * Delete orders and restore stock
 */
async function deleteOrders() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Mediport';
    logger.info(`Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***@')}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info('✅ Connected to MongoDB');
    logger.info(`\n${'='.repeat(60)}`);
    logger.info('⚠️  ORDER DELETION PROCESS STARTED');
    logger.info(`${'='.repeat(60)}\n`);
    
    // Get order numbers from command line args or use default list
    const orderNumbers = process.argv.slice(2).length > 0 
      ? process.argv.slice(2) 
      : ORDER_NUMBERS_TO_DELETE;
    
    logger.info(`Orders to delete: ${orderNumbers.join(', ')}\n`);
    
    let deletedCount = 0;
    let notFoundCount = 0;
    let errors = 0;

    for (const orderNumber of orderNumbers) {
      try {
        logger.info(`\n--- Processing: ${orderNumber} ---`);
        
        // Find the order
        const order = await Order.findOne({ orderNumber }).populate('items.product', 'name sku');
        
        if (!order) {
          logger.warn(`⚠️  Order not found: ${orderNumber}`);
          notFoundCount++;
          continue;
        }
        
        logger.info(`Found order: ${orderNumber}`);
        logger.info(`  Status: ${order.status}`);
        logger.info(`  Items: ${order.items.length}`);
        logger.info(`  Total: ৳${order.totalAmount || order.total}`);
        logger.info(`  Customer ID: ${order.user}`);
        
        // Restore stock if order was not cancelled
        if (order.status !== 'cancelled') {
          await restoreStockForOrder(order);
        } else {
          logger.info('Order was already cancelled, skipping stock restoration');
        }
        
        // Delete the order
        await Order.findByIdAndDelete(order._id);
        logger.info(`✅ Successfully deleted order: ${orderNumber}`);
        deletedCount++;
        
      } catch (error) {
        logger.error(`❌ Error processing ${orderNumber}: ${error.message}`);
        logger.error(`Stack trace: ${error.stack}`);
        errors++;
      }
    }
    
    // Summary
    logger.info(`\n${'='.repeat(60)}`);
    logger.info('📊 DELETION SUMMARY');
    logger.info(`${'='.repeat(60)}`);
    logger.info(`Total orders processed: ${orderNumbers.length}`);
    logger.info(`✅ Successfully deleted: ${deletedCount}`);
    logger.info(`⚠️  Not found: ${notFoundCount}`);
    logger.info(`❌ Errors: ${errors}`);
    logger.info(`${'='.repeat(60)}\n`);
    
  } catch (error) {
    logger.error(`❌ Fatal error: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Run the deletion process
deleteOrders()
  .then(() => {
    logger.info('✅ Order deletion process completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
  });
