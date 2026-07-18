#!/usr/bin/env node
/**
 * List Active Orders Script
 * 
 * Lists orders with status: placed, confirmed, processing, shipped
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');

async function listActiveOrders() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medcore';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB\n');
    
    // Get orders with specific statuses
    const orders = await Order.find({
      status: { $in: ['placed', 'confirmed', 'processing', 'shipped', 'pending'] }
    })
      .sort({ createdAt: -1 })
      .select('orderNumber orderId status totalAmount total paymentMethod paymentStatus user items createdAt')
      .lean();
    
    console.log(`Found ${orders.length} active/placed/confirmed orders:\n`);
    console.log('='.repeat(100));
    
    for (const order of orders) {
      console.log(`Order Number: ${order.orderNumber || order.orderId || 'N/A'}`);
      console.log(`  ID: ${order._id}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Payment Status: ${order.paymentStatus || 'N/A'}`);
      console.log(`  Amount: ৳${order.totalAmount || order.total || 0}`);
      console.log(`  Payment Method: ${order.paymentMethod}`);
      console.log(`  Items: ${order.items?.length || 0}`);
      console.log(`  User: ${order.user}`);
      console.log(`  Created: ${new Date(order.createdAt).toLocaleDateString('en-BD')}`);
      console.log('-'.repeat(100));
    }
    
    console.log(`\nTotal active orders: ${orders.length}`);
    
    // Show orders by status
    console.log('\n' + '='.repeat(100));
    console.log('BREAKDOWN BY STATUS:');
    console.log('='.repeat(100));
    const statuses = ['placed', 'confirmed', 'processing', 'shipped', 'pending'];
    for (const status of statuses) {
      const count = orders.filter(o => o.status === status).length;
      if (count > 0) {
        console.log(`${status.toUpperCase()}: ${count}`);
        orders.filter(o => o.status === status).forEach(o => {
          console.log(`  - ${o.orderNumber || o.orderId} (৳${o.totalAmount || o.total})`);
        });
      }
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

listActiveOrders()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
