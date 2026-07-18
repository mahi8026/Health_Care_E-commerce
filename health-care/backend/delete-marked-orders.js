#!/usr/bin/env node
/**
 * Delete Marked Orders Script
 * 
 * Interactive script to delete specific orders by order number or MongoDB ID
 * 
 * Usage:
 *   node delete-marked-orders.js
 *   
 * Or specify order numbers/IDs:
 *   node delete-marked-orders.js ORD-1777538439561-861 69f315870bf2953768ebe6e9
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Product = require('./src/models/Product');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Restore product stock before deleting order
 */
async function restoreStockForOrder(order) {
  console.log(`\nRestoring stock for order: ${order.orderNumber}`);
  
  for (const item of order.items) {
    try {
      const product = await Product.findById(item.product);
      
      if (!product) {
        console.log(`  ⚠️  Product ${item.product} not found, skipping stock restoration`);
        continue;
      }

      const qty = item.qty || item.quantity || 1;

      // Check if order has size variant
      if (item.variant?.size) {
        // Restore size-specific stock
        const sizeIndex = product.variants?.sizes?.findIndex(s => s.name === item.variant.size);
        
        if (sizeIndex !== -1) {
          product.variants.sizes[sizeIndex].stock += qty;
          console.log(`  ✅ Restored ${qty} units to ${product.name} (Size: ${item.variant.size})`);
        }
      }
      
      // Restore main product stock
      product.stock += qty;
      await product.save();
      
      console.log(`  ✅ Stock restored for ${product.name}: +${qty} units (Total stock: ${product.stock})`);
    } catch (error) {
      console.error(`  ❌ Failed to restore stock for product ${item.product}: ${error.message}`);
    }
  }
}

/**
 * Delete a single order
 */
async function deleteOrder(identifier) {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Processing: ${identifier}`);
    console.log('='.repeat(80));
    
    // Try to find by order number first, then by MongoDB ID
    let order;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      order = await Order.findById(identifier).populate('items.product', 'name sku');
    }
    
    if (!order) {
      order = await Order.findOne({ orderNumber: identifier }).populate('items.product', 'name sku');
    }
    
    if (!order) {
      order = await Order.findOne({ orderId: identifier }).populate('items.product', 'name sku');
    }
    
    if (!order) {
      console.log(`⚠️  Order not found: ${identifier}`);
      return { success: false, reason: 'not_found' };
    }
    
    // Display order details
    console.log(`\nOrder Details:`);
    console.log(`  Order Number: ${order.orderNumber || order.orderId}`);
    console.log(`  MongoDB ID: ${order._id}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Payment Status: ${order.paymentStatus || 'N/A'}`);
    console.log(`  Amount: ৳${order.totalAmount || order.total || 0}`);
    console.log(`  Payment Method: ${order.paymentMethod}`);
    console.log(`  Items: ${order.items?.length || 0}`);
    
    if (order.items && order.items.length > 0) {
      console.log(`\n  Products:`);
      order.items.forEach((item, idx) => {
        console.log(`    ${idx + 1}. ${item.name || 'Unknown'} - Qty: ${item.qty || item.quantity || 1} - ৳${item.price}`);
        if (item.variant?.size) {
          console.log(`       Size: ${item.variant.size}`);
        }
      });
    }
    
    console.log(`  User ID: ${order.user}`);
    console.log(`  Created: ${new Date(order.createdAt).toLocaleString('en-BD')}`);
    
    // Restore stock if order was not already cancelled
    if (order.status !== 'cancelled') {
      console.log(`\n⚠️  Order status is "${order.status}" - will restore stock`);
      await restoreStockForOrder(order);
    } else {
      console.log(`\n✅ Order was already cancelled - stock already restored`);
    }
    
    // Delete the order
    await Order.findByIdAndDelete(order._id);
    console.log(`\n✅ Successfully deleted order: ${order.orderNumber || order.orderId}`);
    
    return { success: true, orderNumber: order.orderNumber || order.orderId };
    
  } catch (error) {
    console.error(`❌ Error processing ${identifier}: ${error.message}`);
    return { success: false, reason: 'error', error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medcore';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB\n');
    
    // Get identifiers from command line or prompt
    let identifiers = process.argv.slice(2);
    
    if (identifiers.length === 0) {
      console.log('No order numbers provided as arguments.');
      console.log('\nSearching for active orders (placed, confirmed, processing)...\n');
      
      const activeOrders = await Order.find({
        status: { $in: ['placed', 'confirmed', 'processing', 'shipped', 'pending'] }
      })
        .sort({ createdAt: -1 })
        .select('orderNumber orderId status totalAmount total paymentStatus createdAt')
        .lean();
      
      if (activeOrders.length === 0) {
        console.log('✅ No active orders found in database.');
        rl.close();
        return;
      }
      
      console.log(`Found ${activeOrders.length} active order(s):\n`);
      activeOrders.forEach((order, idx) => {
        console.log(`${idx + 1}. ${order.orderNumber || order.orderId} - Status: ${order.status} - ৳${order.totalAmount || order.total} - ${new Date(order.createdAt).toLocaleDateString()}`);
      });
      
      const answer = await question('\nEnter order numbers or IDs to delete (comma-separated), or type "all" to delete all active orders: ');
      
      if (answer.toLowerCase() === 'all') {
        identifiers = activeOrders.map(o => o.orderNumber || o.orderId);
      } else {
        identifiers = answer.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
      
      if (identifiers.length === 0) {
        console.log('\n❌ No orders specified. Exiting...');
        rl.close();
        return;
      }
      
      const confirmAnswer = await question(`\n⚠️  WARNING: You are about to permanently delete ${identifiers.length} order(s). This cannot be undone.\nType "YES" to confirm: `);
      
      if (confirmAnswer !== 'YES') {
        console.log('\n❌ Operation cancelled.');
        rl.close();
        return;
      }
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`⚠️  DELETING ${identifiers.length} ORDER(S)`);
    console.log('='.repeat(80));
    
    let deletedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    for (const identifier of identifiers) {
      const result = await deleteOrder(identifier);
      
      if (result.success) {
        deletedCount++;
      } else if (result.reason === 'not_found') {
        notFoundCount++;
      } else {
        errorCount++;
      }
    }
    
    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 DELETION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total orders processed: ${identifiers.length}`);
    console.log(`✅ Successfully deleted: ${deletedCount}`);
    console.log(`⚠️  Not found: ${notFoundCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(80));
    
    rl.close();
    
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    rl.close();
    process.exit(1);
  }
}

// Run the deletion process
main()
  .then(() => {
    mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('✅ Order deletion process completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error(`❌ Unexpected error: ${error.message}`);
    mongoose.connection.close();
    process.exit(1);
  });
