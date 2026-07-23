/**
 * Manual script to resend order confirmation email
 * Run this to resend email to torrentbd61@gmail.com for order MC-260702-8191
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const User = require('./src/models/User');
const { sendOrderConfirmation } = require('./src/utils/emailService');

const ORDER_NUMBER = 'MC-260702-8191';
const CUSTOMER_EMAIL = 'torrentbd61@gmail.com';

async function resendEmail() {
  try {
    console.log('\n🚀 Starting email resend process...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find the order
    console.log(`🔍 Finding order: ${ORDER_NUMBER}`);
    const order = await Order.findOne({ orderNumber: ORDER_NUMBER })
      .populate('user')
      .populate('items.product');
    
    if (!order) {
      console.error(`❌ Order ${ORDER_NUMBER} not found`);
      process.exit(1);
    }
    
    console.log(`✅ Found order: ${order.orderNumber}`);
    console.log(`   Customer: ${order.user.name} (${order.user.email})`);
    console.log(`   Total: ৳${order.totalAmount.toLocaleString()}`);
    console.log(`   Items: ${order.items.length} products`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Payment: ${order.paymentMethod} (${order.paymentStatus})\n`);
    
    // Verify customer email
    if (order.user.email !== CUSTOMER_EMAIL) {
      console.warn(`⚠️  Warning: Order customer email (${order.user.email}) doesn't match expected (${CUSTOMER_EMAIL})`);
      console.log('   Proceeding anyway...\n');
    }
    
    // Send confirmation email
    console.log(`📧 Sending confirmation email to ${order.user.email}...`);
    await sendOrderConfirmation(order, order.user);
    
    console.log('✅ Order confirmation email sent successfully!\n');
    console.log('📬 Email Details:');
    console.log(`   To: ${order.user.email}`);
    console.log(`   Subject: ✓ Order Confirmed — ${order.orderNumber}`);
    console.log(`   From: ${process.env.SMTP_FROM || process.env.SMTP_USER}`);
    console.log(`   SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}\n`);
    
    console.log('✨ Done! The customer should receive the email shortly.\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

// Run the script
resendEmail();
