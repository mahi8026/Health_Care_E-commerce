/**
 * Seed script: Creates sample WhatsApp conversations and messages for testing
 * Run from backend directory: node scripts/seedWhatsApp.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const WhatsAppConversation = require('../src/models/WhatsAppConversation');
const WhatsAppMessage = require('../src/models/WhatsAppMessage');
const User = require('../src/models/User');

const MONGODB_URI = process.env.MONGODB_URI;

const sampleConversations = [
  {
    phoneNumber: '8801711234567',
    customerName: 'Dr. Rahman Ahmed',
    conversationId: 'conv_001_test',
    status: 'active',
    category: 'product_inquiry',
    isBot: false,
    messageCount: 5,
    lastMessageAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
    tags: ['vip', 'hospital'],
  },
  {
    phoneNumber: '8801812345678',
    customerName: 'Fatema Begum',
    conversationId: 'conv_002_test',
    status: 'pending',
    category: 'order_status',
    isBot: true,
    messageCount: 3,
    lastMessageAt: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
    tags: [],
  },
  {
    phoneNumber: '8801912345678',
    customerName: 'Dhaka Medical Center',
    conversationId: 'conv_003_test',
    status: 'active',
    category: 'b2b_inquiry',
    isBot: false,
    messageCount: 8,
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    tags: ['b2b', 'bulk-order'],
  },
  {
    phoneNumber: '8801611234567',
    customerName: 'Karim Hossain',
    conversationId: 'conv_004_test',
    status: 'resolved',
    category: 'complaint',
    isBot: false,
    messageCount: 12,
    lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    resolvedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    tags: ['resolved'],
  },
  {
    phoneNumber: '8801511234567',
    customerName: 'Chittagong Lab Services',
    conversationId: 'conv_005_test',
    status: 'escalated',
    category: 'quote_request',
    isBot: false,
    messageCount: 6,
    lastMessageAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    tags: ['urgent', 'reagent'],
  },
  {
    phoneNumber: '8801311234567',
    customerName: 'Nasrin Akter',
    conversationId: 'conv_006_test',
    status: 'active',
    category: 'support',
    isBot: true,
    messageCount: 2,
    lastMessageAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
    tags: [],
  },
  {
    phoneNumber: '8801411234567',
    customerName: 'Popular Diagnostic Centre',
    conversationId: 'conv_007_test',
    status: 'closed',
    category: 'delivery_issue',
    isBot: false,
    messageCount: 9,
    lastMessageAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    closedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    tags: [],
  },
  {
    phoneNumber: '8801711987654',
    customerName: 'Dr. Sumaiya Islam',
    conversationId: 'conv_008_test',
    status: 'active',
    category: 'payment_issue',
    isBot: false,
    messageCount: 4,
    lastMessageAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    tags: ['payment'],
  },
];

// Helper to build a message object matching the WhatsAppMessage schema
function makeMsg(id, convId, direction, text, opts = {}) {
  const phone = convId.replace('conv_', '').replace('_test', '');
  const businessPhone = '8801646886795';
  return {
    messageId: `msg_${id}_test`,
    conversationId: convId,
    from: direction === 'inbound' ? `880${phone}` : businessPhone,
    to: direction === 'inbound' ? businessPhone : `880${phone}`,
    direction,
    type: 'text',
    content: { text },
    status: opts.status || 'read',
    isBot: opts.isBot || false,
    createdAt: opts.createdAt || new Date(),
  };
}

const sampleMessages = [
  // conv_001 - Product Inquiry
  makeMsg('001a', 'conv_001_test', 'inbound',  'Hello, I need information about ECG machines', { status: 'read', createdAt: new Date(Date.now() - 60 * 60 * 1000) }),
  makeMsg('001b', 'conv_001_test', 'outbound', 'Hello Dr. Rahman! We have excellent ECG machines from Mindray and GE. Which brand are you interested in?', { status: 'read', createdAt: new Date(Date.now() - 55 * 60 * 1000) }),
  makeMsg('001c', 'conv_001_test', 'inbound',  'I am looking for a 12-lead ECG machine for my clinic', { status: 'read', createdAt: new Date(Date.now() - 50 * 60 * 1000) }),
  makeMsg('001d', 'conv_001_test', 'outbound', 'We have the Mindray BeneHeart R12 at 85,000 BDT and GE MAC 2000 at 1,20,000 BDT. Both include free installation in Dhaka.', { status: 'read', createdAt: new Date(Date.now() - 45 * 60 * 1000) }),
  makeMsg('001e', 'conv_001_test', 'inbound',  'Can I get a formal quotation for the Mindray?', { status: 'delivered', createdAt: new Date(Date.now() - 10 * 60 * 1000) }),

  // conv_002 - Order Status
  makeMsg('002a', 'conv_002_test', 'inbound',  'Hi, what is the status of my order #ORD-2024-001234?', { status: 'read', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }),
  makeMsg('002b', 'conv_002_test', 'outbound', 'Hello! I am MedCore Bot. Let me check your order status. Please wait...', { status: 'read', isBot: true, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000) }),
  makeMsg('002c', 'conv_002_test', 'outbound', 'Your order #ORD-2024-001234 is currently In Transit. Expected delivery: Tomorrow by 5 PM.', { status: 'delivered', isBot: true, createdAt: new Date(Date.now() - 45 * 60 * 1000) }),

  // conv_003 - B2B Inquiry
  makeMsg('003a', 'conv_003_test', 'inbound',  'We are Dhaka Medical Center. We need to purchase lab equipment in bulk.', { status: 'read', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) }),
  makeMsg('003b', 'conv_003_test', 'outbound', 'Welcome to MedCore BD! We offer special B2B pricing with 15-30% discount for bulk orders. What equipment do you need?', { status: 'read', createdAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000) }),
  makeMsg('003c', 'conv_003_test', 'inbound',  'We need 5 hematology analyzers and 3 biochemistry analyzers', { status: 'read', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) }),
  makeMsg('003d', 'conv_003_test', 'outbound', 'Excellent! For that quantity, you qualify for our Platinum B2B tier with 25% discount and 60-day credit terms. I will prepare a detailed quotation.', { status: 'read', createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000) }),
  makeMsg('003e', 'conv_003_test', 'inbound',  'Please also include installation and training costs', { status: 'read', createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) }),
  makeMsg('003f', 'conv_003_test', 'outbound', 'Of course! Installation and 2-day staff training are included free of charge for orders above 5,00,000 BDT.', { status: 'read', createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000) }),
  makeMsg('003g', 'conv_003_test', 'inbound',  'Great, please send the quotation to our procurement email', { status: 'delivered', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }),
  makeMsg('003h', 'conv_003_test', 'outbound', 'I will send the formal quotation within 2 hours. Can you share your procurement email address?', { status: 'read', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }),
];

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find an admin user to use as assignedTo
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log(`👤 Found admin user: ${adminUser.name} (${adminUser.email})`);
      // Assign some conversations to the admin
      sampleConversations[0].assignedTo = adminUser._id;
      sampleConversations[2].assignedTo = adminUser._id;
      sampleConversations[4].assignedTo = adminUser._id;
    } else {
      console.log('⚠️  No admin user found — conversations will be unassigned');
    }

    // Remove existing test conversations
    const existingIds = sampleConversations.map(c => c.conversationId);
    const deletedConvs = await WhatsAppConversation.deleteMany({ conversationId: { $in: existingIds } });
    const deletedMsgs = await WhatsAppMessage.deleteMany({ conversationId: { $in: existingIds } });
    console.log(`🗑️  Removed ${deletedConvs.deletedCount} existing test conversations and ${deletedMsgs.deletedCount} messages`);

    // Insert conversations
    const conversations = await WhatsAppConversation.insertMany(sampleConversations);
    console.log(`✅ Created ${conversations.length} sample conversations`);

    // Insert messages
    const messages = await WhatsAppMessage.insertMany(sampleMessages);
    console.log(`✅ Created ${messages.length} sample messages`);

    console.log('\n📊 Summary:');
    console.log(`   Active conversations: ${sampleConversations.filter(c => c.status === 'active').length}`);
    console.log(`   Pending: ${sampleConversations.filter(c => c.status === 'pending').length}`);
    console.log(`   Escalated: ${sampleConversations.filter(c => c.status === 'escalated').length}`);
    console.log(`   Resolved: ${sampleConversations.filter(c => c.status === 'resolved').length}`);
    console.log(`   Closed: ${sampleConversations.filter(c => c.status === 'closed').length}`);
    console.log('\n✅ WhatsApp seed data created successfully!');
    console.log('   Visit http://localhost:3000/admin/whatsapp to see the conversations');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error — some conversations may already exist');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
