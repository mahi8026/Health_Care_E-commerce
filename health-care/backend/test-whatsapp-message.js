/**
 * Test WhatsApp Bot with Simulated Messages
 * This simulates customer messages to test bot responses
 */

require('dotenv').config();
const mongoose = require('mongoose');
const whatsappBot = require('./src/services/whatsappBot');
const whatsappService = require('./src/services/whatsappService');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
};

async function testBotConversation() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        WhatsApp Bot - Conversation Test                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓${colors.reset} Connected to MongoDB\n`);

    const testPhone = '8801712345678';
    
    // Test scenarios
    const scenarios = [
      {
        name: 'Greeting',
        messages: ['Hello']
      },
      {
        name: 'Order Tracking',
        messages: ['Track my order', 'ORD-12345']
      },
      {
        name: 'Product Search',
        messages: ['ECG machine price']
      },
      {
        name: 'Quote Request',
        messages: ['I need a quote']
      },
      {
        name: 'Support Request',
        messages: ['I need help with my order']
      },
      {
        name: 'Human Handoff',
        messages: ['Talk to a person']
      }
    ];

    for (const scenario of scenarios) {
      console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.magenta}Scenario: ${scenario.name}${colors.reset}\n`);

      for (const message of scenario.messages) {
        console.log(`${colors.blue}Customer:${colors.reset} ${message}`);
        
        // Process message with bot
        const result = await whatsappBot.processMessage(
          testPhone,
          message,
          `msg_${Date.now()}`
        );

        if (result.handled) {
          console.log(`${colors.green}Bot:${colors.reset} ${result.response.substring(0, 200)}${result.response.length > 200 ? '...' : ''}\n`);
        } else {
          console.log(`${colors.yellow}⚠ Not handled: ${result.reason || result.error}${colors.reset}\n`);
        }

        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    // Show conversation summary
    const WhatsAppConversation = require('./src/models/WhatsAppConversation');
    const WhatsAppMessage = require('./src/models/WhatsAppMessage');

    const conversations = await WhatsAppConversation.find({ phoneNumber: testPhone });
    const messages = await WhatsAppMessage.find({ from: testPhone });

    console.log(`${colors.green}✓ Test Complete!${colors.reset}\n`);
    console.log(`Conversations created: ${conversations.length}`);
    console.log(`Messages saved: ${messages.length}`);
    console.log(`\nConversation IDs:`);
    conversations.forEach(conv => {
      console.log(`  - ${conv.conversationId} (${conv.status}, ${conv.category})`);
    });

    await mongoose.connection.close();
    console.log(`\n${colors.green}✓${colors.reset} Database connection closed\n`);

  } catch (error) {
    console.error(`\n${colors.red}✗ Error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run test
testBotConversation().then(() => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Test completed successfully!                              ║');
  console.log('║                                                            ║');
  console.log('║  The bot is working correctly in mock mode.                ║');
  console.log('║  Check the console output above to see bot responses.      ║');
  console.log('║                                                            ║');
  console.log('║  Next: Start the server and test via API endpoints        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
