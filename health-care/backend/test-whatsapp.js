/**
 * WhatsApp System Test Script
 * Run this to verify WhatsApp automation is properly installed
 * 
 * Usage: node test-whatsapp.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`)
};

async function testWhatsAppSystem() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     WhatsApp Automation System - Installation Test        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let allTestsPassed = true;

  // Test 1: Check environment variables
  log.section('1. Checking Environment Variables');
  const requiredEnvVars = {
    'WHATSAPP_PROVIDER': process.env.WHATSAPP_PROVIDER,
    'WHATSAPP_BUSINESS_PHONE': process.env.WHATSAPP_BUSINESS_PHONE,
    'MONGODB_URI': process.env.MONGODB_URI
  };

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (value) {
      log.success(`${key} is set`);
    } else {
      log.error(`${key} is missing`);
      allTestsPassed = false;
    }
  }

  // Check provider-specific variables
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';
  log.info(`Provider: ${provider}`);

  if (provider === 'meta' || provider === 'cloud') {
    if (process.env.WHATSAPP_ACCESS_TOKEN) {
      log.success('WHATSAPP_ACCESS_TOKEN is set');
    } else {
      log.warning('WHATSAPP_ACCESS_TOKEN is missing (required for Meta Cloud API)');
    }
    if (process.env.WHATSAPP_PHONE_NUMBER_ID) {
      log.success('WHATSAPP_PHONE_NUMBER_ID is set');
    } else {
      log.warning('WHATSAPP_PHONE_NUMBER_ID is missing (required for Meta Cloud API)');
    }
  } else if (provider === 'twilio') {
    if (process.env.TWILIO_ACCOUNT_SID) {
      log.success('TWILIO_ACCOUNT_SID is set');
    } else {
      log.warning('TWILIO_ACCOUNT_SID is missing (required for Twilio)');
    }
    if (process.env.TWILIO_AUTH_TOKEN) {
      log.success('TWILIO_AUTH_TOKEN is set');
    } else {
      log.warning('TWILIO_AUTH_TOKEN is missing (required for Twilio)');
    }
  } else {
    log.info('Using mock provider (no API credentials needed)');
  }

  // Test 2: Check file structure
  log.section('2. Checking File Structure');
  const fs = require('fs');
  const path = require('path');

  const requiredFiles = [
    'src/models/WhatsAppConversation.js',
    'src/models/WhatsAppMessage.js',
    'src/services/whatsappService.js',
    'src/services/whatsappBot.js',
    'src/controllers/whatsappController.js',
    'src/routes/whatsappRoutes.js'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      log.success(`${file} exists`);
    } else {
      log.error(`${file} is missing`);
      allTestsPassed = false;
    }
  }

  // Test 3: Check models can be loaded
  log.section('3. Testing Model Loading');
  try {
    const WhatsAppConversation = require('./src/models/WhatsAppConversation');
    log.success('WhatsAppConversation model loaded');
    
    const WhatsAppMessage = require('./src/models/WhatsAppMessage');
    log.success('WhatsAppMessage model loaded');
  } catch (error) {
    log.error(`Model loading failed: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 4: Check services can be loaded
  log.section('4. Testing Service Loading');
  try {
    const whatsappService = require('./src/services/whatsappService');
    log.success('WhatsApp service loaded');
    log.info(`Service provider: ${whatsappService.provider || 'unknown'}`);
    
    const whatsappBot = require('./src/services/whatsappBot');
    log.success('WhatsApp bot loaded');
    log.info(`Bot intents configured: ${Object.keys(whatsappBot.intents || {}).length}`);
  } catch (error) {
    log.error(`Service loading failed: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 5: Check controller can be loaded
  log.section('5. Testing Controller Loading');
  try {
    const whatsappController = require('./src/controllers/whatsappController');
    log.success('WhatsApp controller loaded');
    
    const methods = [
      'verifyWebhook',
      'handleWebhook',
      'sendMessage',
      'getConversations',
      'getConversation',
      'assignConversation',
      'updateConversationStatus',
      'addNote',
      'getAnalytics',
      'testConnection'
    ];
    
    for (const method of methods) {
      if (typeof whatsappController[method] === 'function') {
        log.success(`Controller method: ${method}`);
      } else {
        log.error(`Controller method missing: ${method}`);
        allTestsPassed = false;
      }
    }
  } catch (error) {
    log.error(`Controller loading failed: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 6: Check routes can be loaded
  log.section('6. Testing Routes Loading');
  try {
    const whatsappRoutes = require('./src/routes/whatsappRoutes');
    log.success('WhatsApp routes loaded');
  } catch (error) {
    log.error(`Routes loading failed: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 7: Test database connection
  log.section('7. Testing Database Connection');
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    log.success('MongoDB connected successfully');

    // Test if models are registered
    const models = mongoose.modelNames();
    if (models.includes('WhatsAppConversation')) {
      log.success('WhatsAppConversation model registered');
    } else {
      log.warning('WhatsAppConversation model not registered yet');
    }
    if (models.includes('WhatsAppMessage')) {
      log.success('WhatsAppMessage model registered');
    } else {
      log.warning('WhatsAppMessage model not registered yet');
    }

    await mongoose.connection.close();
    log.success('MongoDB connection closed');
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 8: Test phone number formatting
  log.section('8. Testing Phone Number Formatting');
  try {
    const whatsappService = require('./src/services/whatsappService');
    
    const testNumbers = [
      { input: '01712345678', expected: '8801712345678' },
      { input: '+8801712345678', expected: '8801712345678' },
      { input: '8801712345678', expected: '8801712345678' },
      { input: '1712345678', expected: '8801712345678' }
    ];

    for (const test of testNumbers) {
      const result = whatsappService.formatPhoneNumber(test.input);
      if (result === test.expected) {
        log.success(`Format ${test.input} → ${result}`);
      } else {
        log.error(`Format ${test.input} → ${result} (expected ${test.expected})`);
        allTestsPassed = false;
      }
    }
  } catch (error) {
    log.error(`Phone formatting test failed: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 9: Test bot intent detection
  log.section('9. Testing Bot Intent Detection');
  try {
    const whatsappBot = require('./src/services/whatsappBot');
    
    const testMessages = [
      { text: 'Hello', expected: 'greeting' },
      { text: 'Track my order', expected: 'order_status' },
      { text: 'ECG machine price', expected: 'product_inquiry' },
      { text: 'I need a quote', expected: 'quote_request' },
      { text: 'I need help', expected: 'support' },
      { text: 'Talk to a person', expected: 'human' }
    ];

    for (const test of testMessages) {
      const intent = whatsappBot.detectIntent(test.text);
      if (intent === test.expected) {
        log.success(`"${test.text}" → ${intent}`);
      } else {
        log.warning(`"${test.text}" → ${intent} (expected ${test.expected})`);
      }
    }
  } catch (error) {
    log.error(`Intent detection test failed: ${error.message}`);
    allTestsPassed = false;
  }

  // Final summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  if (allTestsPassed) {
    console.log(`║  ${colors.green}✓ All Tests Passed!${colors.reset}                                      ║`);
    console.log('║                                                            ║');
    console.log('║  WhatsApp automation system is properly installed.        ║');
    console.log('║                                                            ║');
    console.log('║  Next steps:                                               ║');
    console.log('║  1. Configure your WhatsApp provider (Meta/Twilio)        ║');
    console.log('║  2. Set up webhook URL in provider dashboard               ║');
    console.log('║  3. Start the server: npm run dev                          ║');
    console.log('║  4. Test with real WhatsApp messages                       ║');
    console.log('║                                                            ║');
    console.log('║  Documentation: WHATSAPP-SETUP-GUIDE.md                    ║');
  } else {
    console.log(`║  ${colors.red}✗ Some Tests Failed${colors.reset}                                     ║`);
    console.log('║                                                            ║');
    console.log('║  Please fix the errors above and run this test again.     ║');
    console.log('║                                                            ║');
    console.log('║  For help, see: WHATSAPP-SETUP-GUIDE.md                    ║');
  }
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  process.exit(allTestsPassed ? 0 : 1);
}

// Run tests
testWhatsAppSystem().catch(error => {
  console.error(`\n${colors.red}Fatal error:${colors.reset}`, error.message);
  process.exit(1);
});
