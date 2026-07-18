#!/usr/bin/env node
/**
 * Delete ALL Orders Script
 * 
 * ⚠️ WARNING: This script deletes ALL orders from the database permanently.
 * This operation CANNOT be undone.
 * 
 * Features:
 * - Restores product stock for non-cancelled orders
 * - Handles size variants correctly
 * - Provides detailed progress reporting
 * 
 * Usage:
 *   node delete-all-orders.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Product = require('./src/models/Product');

/**
 * Restore product stock for an order
 */
async function restoreStockForOrder(order) {
  const orderLabel = order.orderNumber || order.orderId || order._id;
  
  for (const item of order.items) {
    try {
      const product = await Product.findById(item.product);
      
      if (!product) {
        console.log(`    ⚠️  Product ${item.product} not found, skipping stock restoration`);
        continue;
      }

      const qty = item.qty || item.quantity || 1;

      // Check if order has size variant
      if (item.variant?.size) {
        // Restore size-specific stock
        if (product.variants?.sizes) {
          const sizeIndex = product.variants.sizes.findIndex(s => s.name === item.variant.size);
          
          if (sizeIndex !== -1) {
            product.variants.sizes[sizeIndex].stock += qty;
            console.log(`    ✅ Restored ${qty} units to ${product.name} (Size: ${item.variant.size})`);
          }
        }
      }
      
      // Restore main product stock
      product.stock += qty;
      await product.save();
      
    } catch (error) {
      console.error(`    ❌ Failed to restore stock for product ${item.product}: ${error.message}`);
    }
  }
}

/**
 * Main deletion function
 */
async function deleteAllOrders() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medcore';
    console.log('Connecting to MongoDB...');
    console.log(`URI: ${mongoUri.replace(/\/\/.*@/, '//***@')}\n`);
    
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB\n');
    
    // Get count of all orders
    const totalCount = await Order.countDocuments({});
    
    if (totalCount === 0) {
      console.log('✅ No orders found in database. Nothing to delete.\n');
      return;
    }
    
    console.log(`${'='.repeat(80)}`);
    console.log(`⚠️  WARNING: DELETING ALL ${totalCount} ORDERS FROM DATABASE`);
    console.log(`${'='.repeat(80)}\n`);
    
    // Get all orders in batches for processing
    const batchSize = 50;
    let processedCount = 0;
    let deletedCount = 0;
    let errorCount = 0;
    let stockRestoredCount = 0;
    
    console.log('Starting deletion process...\n');
    
    while (processedCount < totalCount) {
      const orders = await Order.find({})
        .skip(processedCount)
        .limit(batchSize)
        .select('orderNumber orderId status items user totalAmount total createdAt')
        .lean();
      
      for (const order of orders) {
        processedCount++;
        const orderLabel = order.orderNumber || order.orderId || order._id;
        
        try {
          console.log(`[${processedCount}/${totalCount}] Processing: ${orderLabel}`);
          console.log(`  Status: ${order.status} | Amount: ৳${order.totalAmount || order.total || 0} | Items: ${order.items?.length || 0}`);
          
          // Restore stock if not cancelled
          if (order.status !== 'cancelled' && order.items && order.items.length > 0) {
            console.log(`  Restoring stock...`);
            
            // Re-fetch order with populated product details for stock restoration
            const fullOrder = await Order.findById(order._id);
            if (fullOrder) {
              await restoreStockForOrder(fullOrder);
              stockRestoredCount++;
            }
          } else {
            console.log(`  Skipping stock restoration (status: ${order.status})`);
          }
          
          // Delete the order
          await Order.findByIdAndDelete(order._id);
          deletedCount++;
          console.log(`  ✅ Deleted\n`);
          
        } catch (error) {
          console.error(`  ❌ Error: ${error.message}\n`);
          errorCount++;
        }
      }
      
      // Break if no more orders
      if (orders.length === 0) break;
    }
    
    // Final summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 DELETION SUMMARY');
    console.log(`${'='.repeat(80)}`);
    console.log(`Total orders found: ${totalCount}`);
    console.log(`✅ Successfully deleted: ${deletedCount}`);
    console.log(`📦 Stock restored for: ${stockRestoredCount} orders`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`${'='.repeat(80)}\n`);
    
    // Verify deletion
    const remainingCount = await Order.countDocuments({});
    console.log(`Verification: ${remainingCount} orders remaining in database`);
    
    if (remainingCount === 0) {
      console.log('✅ All orders successfully deleted!\n');
    } else {
      console.log(`⚠️  Warning: ${remainingCount} orders still remain in database\n`);
    }
    
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Warning prompt
console.log('\n' + '='.repeat(80));
console.log('⚠️  DELETE ALL ORDERS - FINAL WARNING');
console.log('='.repeat(80));
console.log('This script will permanently delete ALL orders from the database.');
console.log('This operation CANNOT be undone.');
console.log('Stock will be restored for non-cancelled orders.');
console.log('='.repeat(80));
console.log('\nStarting in 3 seconds...\n');

// 3 second delay before execution
setTimeout(() => {
  deleteAllOrders()
    .then(() => {
      console.log('✅ Order deletion process completed\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error(`❌ Unexpected error: ${error.message}`);
      process.exit(1);
    });
}, 3000);
