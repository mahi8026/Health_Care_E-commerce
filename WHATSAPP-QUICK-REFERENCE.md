# WhatsApp Automation - Quick Reference Card

## 🚀 Quick Start (3 Steps)

```bash
# 1. Add to .env
WHATSAPP_PROVIDER=mock
WHATSAPP_BUSINESS_PHONE=8801800000000

# 2. Test installation
cd health-care/backend
node test-whatsapp.js

# 3. Start server
npm run dev
```

## 📁 File Locations

```
backend/src/
├── models/
│   ├── WhatsAppConversation.js    # Conversation tracking
│   └── WhatsAppMessage.js         # Message storage
├── services/
│   ├── whatsappService.js         # API integration
│   └── whatsappBot.js             # Bot logic
├── controllers/
│   └── whatsappController.js      # Request handlers
└── routes/
    └── whatsappRoutes.js          # API endpoints
```

## 🔌 API Endpoints

### Public
```
GET  /api/whatsapp/webhook          # Webhook verification
POST /api/whatsapp/webhook          # Receive messages
```

### Admin (Require Auth)
```
POST /api/whatsapp/send             # Send message
POST /api/whatsapp/test             # Test connection
GET  /api/whatsapp/conversations    # List conversations
GET  /api/whatsapp/conversations/:id # Get conversation
PUT  /api/whatsapp/conversations/:id/assign # Assign agent
PUT  /api/whatsapp/conversations/:id/status # Update status
POST /api/whatsapp/conversations/:id/notes  # Add note
GET  /api/whatsapp/analytics        # Get analytics
```

## 🤖 Bot Intents

| Intent | Keywords | Action |
|--------|----------|--------|
| greeting | hi, hello, hey, salam | Show welcome menu |
| order_status | order, track, status | Track order by number |
| product_inquiry | product, price, stock | Search products |
| quote_request | quote, bulk, b2b | Collect quote details |
| support | help, support, problem | Route to support |
| human | agent, person, human | Transfer to agent |

## 💬 Send Message (Code)

```javascript
const whatsappBot = require('../services/whatsappBot');

// Order confirmation
await whatsappBot.sendOrderConfirmation(order, user);

// Status update
await whatsappBot.sendOrderStatusUpdate(order, user, 'shipped');

// Quote ready
await whatsappBot.sendQuoteReady(quote, user);
```

## 🔧 Environment Variables

### Development (Mock)
```bash
WHATSAPP_PROVIDER=mock
WHATSAPP_BUSINESS_PHONE=8801800000000
```

### Production (Meta)
```bash
WHATSAPP_PROVIDER=meta
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_BUSINESS_PHONE=8801800000000
```

### Production (Twilio)
```bash
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
WHATSAPP_BUSINESS_PHONE=8801800000000
```

## 🧪 Testing

### Run Test Script
```bash
node test-whatsapp.js
```

### Test API (cURL)
```bash
# Send message
curl -X POST http://localhost:5000/api/whatsapp/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"8801712345678","text":"Hello!"}'

# Get conversations
curl http://localhost:5000/api/whatsapp/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get analytics
curl http://localhost:5000/api/whatsapp/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Database Schema

### WhatsAppConversation
```javascript
{
  phoneNumber: "8801712345678",
  conversationId: "wa_8801712345678_1234567890",
  status: "active" | "resolved" | "pending" | "escalated" | "closed",
  category: "product_inquiry" | "order_status" | "quote_request" | ...,
  isBot: true,
  botStage: "greeting" | "menu" | "product_search" | ...,
  assignedTo: ObjectId,
  relatedOrder: ObjectId,
  messageCount: 15,
  lastMessageAt: Date
}
```

### WhatsAppMessage
```javascript
{
  messageId: "wamid.xxx",
  conversationId: "wa_8801712345678_1234567890",
  from: "8801712345678",
  to: "8801800000000",
  direction: "inbound" | "outbound",
  type: "text" | "image" | "button" | ...,
  content: { text: "Hello" },
  status: "sent" | "delivered" | "read" | "failed",
  isBot: true,
  sentAt: Date
}
```

## 🎯 Common Tasks

### Add New Bot Intent
1. Edit `services/whatsappBot.js`
2. Add keywords to `intents` object
3. Create handler function
4. Add case in `processMessage()`

### Customize Bot Message
Edit handler functions in `services/whatsappBot.js`:
- `handleGreeting()`
- `handleOrderStatus()`
- `handleProductInquiry()`
- `handleQuoteRequest()`
- `handleSupport()`

### Integrate with Order System
```javascript
// In orderController.js
const whatsappBot = require('../services/whatsappBot');

// After order creation
if (user.phone) {
  await whatsappBot.sendOrderConfirmation(order, user);
}

// After status update
if (user.phone) {
  await whatsappBot.sendOrderStatusUpdate(order, user, newStatus);
}
```

## 🐛 Troubleshooting

### Webhook Not Working
```bash
# Check webhook URL is public
# Verify SSL certificate
# Check webhook subscription in Meta/Twilio
# Review server logs
tail -f logs/combined.log | grep WhatsApp
```

### Messages Not Sending
```bash
# Verify credentials in .env
# Check phone number format (8801712345678)
# Ensure templates approved (Meta)
# Check API rate limits
```

### Bot Not Responding
```bash
# Check conversation.isBot === true
# Verify intent detection
# Review bot logs
# Test with simple messages
```

## 📚 Documentation

- **Setup Guide**: `WHATSAPP-SETUP-GUIDE.md`
- **Full README**: `WHATSAPP-AUTOMATION-README.md`
- **Summary**: `WHATSAPP-SYSTEM-SUMMARY.md`
- **Env Template**: `backend/.env.whatsapp.example`

## 🔗 Useful Links

- [Meta WhatsApp Docs](https://developers.facebook.com/docs/whatsapp)
- [Twilio WhatsApp Docs](https://www.twilio.com/docs/whatsapp)
- [Meta Business Manager](https://business.facebook.com/)
- [Twilio Console](https://console.twilio.com/)

## 📞 Support

- **Email**: dev@medcorebd.com
- **Logs**: `logs/combined.log`
- **Test Script**: `node test-whatsapp.js`

---

**Quick Tip**: Start with mock mode (`WHATSAPP_PROVIDER=mock`) to test without API credentials!
