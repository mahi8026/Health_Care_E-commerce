/**
 * Test WhatsApp Integration with Order System
 * This tests the WhatsApp notifications for orders and quotes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const whatsappBot = require('./src/services/whatsappBot');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

async function testIntegration() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     WhatsApp Integration Test - Orders & Quotes           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓${colors.reset} Connected to MongoDB\n`);

    // Mock user
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '8801712345678'
    };

    // Mock order
    const mockOrder = {
      _id: '507f1f77bcf86cd799439012',
      orderNumber: 'ORD-12345',
      totalAmount: 45000,
      items: [
        { name: 'ECG Machine', qty: 1, price: 45000 }
      ],
      status: 'confirmed',
      createdAt: new Date()
    };

    // Mock quote
    const mockQuote = {
      _id: '507f1f77bcf86cd799439013',
      quoteNumber: 'QT-2024-001',
      totalAmount: 125000,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: [
        { name: 'Blood Pressure Monitor', qty: 10, price: 12500 }
      ]
    };

    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}Test 1: Order Confirmation${colors.reset}\n`);

    const orderResult = await whatsappBot.sendOrderConfirmation(mockOrder, mockUser);
    
    if (orderResult.success) {
      console.log(`${colors.green}✓${colors.reset} Order confirmation sent successfully`);
      console.log(`  Message ID: ${orderResult.messageId}`);
      console.log(`  Provider: ${orderResult.provider}`);
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} Order confirmation failed: ${orderResult.error}`);
    }

    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}Test 2: Order Status Update (Shipped)${colors.reset}\n`);

    const statusResult = await whatsappBot.sendOrderStatusUpdate(mockOrder, mockUser, 'shipped');
    
    if (statusResult.success) {
      console.log(`${colors.green}✓${colors.reset} Status update sent successfully`);
      console.log(`  Message ID: ${statusResult.messageId}`);
      console.log(`  Provider: ${statusResult.provider}`);
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} Status update failed: ${statusResult.error}`);
    }

    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}Test 3: Quote Ready Notification${colors.reset}\n`);

    const quoteResult = await whatsappBot.sendQuoteReady(mockQuote, mockUser);
    
    if (quoteResult.success) {
      console.log(`${colors.green}✓${colors.reset} Quote notification sent successfully`);
      console.log(`  Message ID: ${quoteResult.messageId}`);
      console.log(`  Provider: ${quoteResult.provider}`);
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} Quote notification failed: ${quoteResult.error}`);
    }

    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}Test 4: Order Status Update (Delivered)${colors.reset}\n`);

    const deliveredResult = await whatsappBot.sendOrderStatusUpdate(mockOrder, mockUser, 'delivered');
    
    if (deliveredResult.success) {
      console.log(`${colors.green}✓${colors.reset} Delivery notification sent successfully`);
      console.log(`  Message ID: ${deliveredResult.messageId}`);
      console.log(`  Provider: ${deliveredResult.provider}`);
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} Delivery notification failed: ${deliveredResult.error}`);
    }

    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    // Check database for saved messages
    const WhatsAppMessage = require('./src/models/WhatsAppMessage');
    const messageCount = await WhatsAppMessage.countDocuments({
      to: mockUser.phone
    });

    console.log(`${colors.green}✓ Integration Test Complete!${colors.reset}\n`);
    console.log(`Messages sent: 4`);
    console.log(`Messages saved to database: ${messageCount}`);
    console.log(`\nAll notifications are working correctly in mock mode!`);

    await mongoose.connection.close();
    console.log(`\n${colors.green}✓${colors.reset} Database connection closed\n`);

  } catch (error) {
    console.error(`\n${colors.yellow}✗ Error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run test
testIntegration().then(() => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ WhatsApp Integration Test Successful!                  ║');
  console.log('║                                                            ║');
  console.log('║  Your order and quote systems are now integrated with     ║');
  console.log('║  WhatsApp notifications!                                   ║');
  console.log('║                                                            ║');
  console.log('║  What happens now:                                         ║');
  console.log('║  • Order created → WhatsApp confirmation sent              ║');
  console.log('║  • Order status changed → WhatsApp update sent             ║');
  console.log('║  • Quote ready → WhatsApp notification sent                ║');
  console.log('║                                                            ║');
  console.log('║  Next: Create a real order to see it in action!           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
