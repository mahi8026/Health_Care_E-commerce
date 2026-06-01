# WhatsApp Automation System - Setup Guide

## Overview

Complete WhatsApp Business API integration for MedCore BD with automated bot responses, conversation management, and human handoff capabilities.

## Features

### ✅ Automated Bot Features
- **Greeting & Menu**: Welcome messages with quick action buttons
- **Order Tracking**: Automatic order status lookup by order number
- **Product Search**: Search products and get instant results
- **Quote Requests**: Collect quote requirements and forward to sales team
- **Support Tickets**: Route support requests to appropriate agents
- **Human Handoff**: Seamless transfer to human agents when needed

### ✅ Admin Features
- **Conversation Management**: View and manage all WhatsApp conversations
- **Message History**: Complete message logs with timestamps
- **Agent Assignment**: Assign conversations to specific team members
- **Notes & Tags**: Add internal notes and categorize conversations
- **Analytics Dashboard**: Track conversation metrics and bot performance
- **Manual Messaging**: Send messages directly from admin panel

### ✅ Automated Notifications
- Order confirmations
- Order status updates
- Quote ready notifications
- Delivery updates
- Payment confirmations

## Architecture

```
┌─────────────────┐
│   Customer      │
│   WhatsApp      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  WhatsApp Business API                  │
│  (Meta Cloud API or Twilio)             │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Webhook Handler                        │
│  /api/whatsapp/webhook                  │
└────────┬────────────────────────────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ WhatsApp     │ │ WhatsApp │ │ WhatsApp     │
│ Service      │ │ Bot      │ │ Controller   │
└──────────────┘ └──────────┘ └──────────────┘
         │              │              │
         └──────────────┴──────────────┘
                        │
                        ▼
         ┌──────────────────────────┐
         │  MongoDB Collections     │
         │  - WhatsAppConversation  │
         │  - WhatsAppMessage       │
         └──────────────────────────┘
```

## Setup Instructions

### Option 1: Meta WhatsApp Cloud API (Recommended for Production)

#### Step 1: Create Meta Business Account

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or use existing app
3. Add "WhatsApp" product to your app
4. Complete business verification (required for production)

#### Step 2: Get API Credentials

1. In WhatsApp > API Setup:
   - Copy **Phone Number ID**
   - Copy **WhatsApp Business Account ID**
   - Generate **Permanent Access Token**

2. Set up webhook:
   - Webhook URL: `https://your-domain.com/api/whatsapp/webhook`
   - Verify Token: Create a secure random string
   - Subscribe to: `messages`, `message_status`

#### Step 3: Configure Environment Variables

Add to `backend/.env`:

```bash
# WhatsApp Configuration
WHATSAPP_PROVIDER=meta
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_PHONE=8801800000000
WHATSAPP_VERIFY_TOKEN=your_secure_verify_token
WHATSAPP_API_VERSION=v18.0
```

#### Step 4: Create Message Templates

In Meta Business Manager > WhatsApp > Message Templates, create:

1. **Order Confirmation Template**
   - Name: `order_confirmation`
   - Category: Transactional
   - Language: English

2. **Order Status Template**
   - Name: `order_status_update`
   - Category: Transactional
   - Language: English

3. **Quote Ready Template**
   - Name: `quote_ready`
   - Category: Transactional
   - Language: English

### Option 2: Twilio WhatsApp API (Good for Testing)

#### Step 1: Create Twilio Account

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get free trial credit ($15)
3. Activate WhatsApp Sandbox for testing

#### Step 2: Get Credentials

1. From Twilio Console:
   - Copy **Account SID**
   - Copy **Auth Token**
   - Copy **WhatsApp Sandbox Number** (e.g., `whatsapp:+14155238886`)

2. Configure Sandbox:
   - Webhook URL: `https://your-domain.com/api/whatsapp/webhook`
   - Method: POST

#### Step 3: Configure Environment Variables

Add to `backend/.env`:

```bash
# WhatsApp Configuration (Twilio)
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
WHATSAPP_BUSINESS_PHONE=8801800000000
```

### Option 3: Mock Mode (Development)

For local development without external API:

```bash
# WhatsApp Configuration (Mock)
WHATSAPP_PROVIDER=mock
WHATSAPP_BUSINESS_PHONE=8801800000000
```

Messages will be logged to console instead of sent.

## Backend Integration

### Step 1: Register Routes

Add to `backend/src/server.js`:

```javascript
// WhatsApp routes
const whatsappRoutes = require('./routes/whatsappRoutes');
app.use('/api/whatsapp', whatsappRoutes);
```

### Step 2: Integrate with Order System

Update `backend/src/controllers/orderController.js`:

```javascript
const whatsappBot = require('../services/whatsappBot');

// After order creation
exports.createOrder = async (req, res) => {
  // ... existing order creation code ...
  
  // Send WhatsApp confirmation
  if (user.phone) {
    await whatsappBot.sendOrderConfirmation(order, user);
  }
  
  // ... rest of code ...
};

// After status update
exports.updateOrderStatus = async (req, res) => {
  // ... existing status update code ...
  
  // Send WhatsApp notification
  if (user.phone) {
    await whatsappBot.sendOrderStatusUpdate(order, user, newStatus);
  }
  
  // ... rest of code ...
};
```

### Step 3: Integrate with Quote System

Update `backend/src/controllers/quoteController.js`:

```javascript
const whatsappBot = require('../services/whatsappBot');

// After quote approval
exports.approveQuote = async (req, res) => {
  // ... existing approval code ...
  
  // Send WhatsApp notification
  if (user.phone) {
    await whatsappBot.sendQuoteReady(quote, user);
  }
  
  // ... rest of code ...
};
```

## Testing

### Test Webhook Verification

```bash
curl "https://your-domain.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test123"
```

Expected response: `test123`

### Test Sending Message (Admin)

```bash
curl -X POST https://your-domain.com/api/whatsapp/send \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "8801712345678",
    "text": "Hello from MedCore BD!"
  }'
```

### Test Bot Responses

Send these messages to your WhatsApp Business number:

1. **Greeting**: `Hi` or `Hello`
2. **Order Tracking**: `Track order ORD-12345`
3. **Product Search**: `ECG machine price`
4. **Quote Request**: `I need a quote`
5. **Support**: `I need help`
6. **Human Agent**: `Talk to a person`

## API Endpoints

### Public Endpoints

- `GET /api/whatsapp/webhook` - Webhook verification
- `POST /api/whatsapp/webhook` - Receive messages

### Admin Endpoints (Require Authentication)

- `POST /api/whatsapp/send` - Send message
- `POST /api/whatsapp/test` - Test connection
- `GET /api/whatsapp/conversations` - List conversations
- `GET /api/whatsapp/conversations/:id` - Get conversation details
- `PUT /api/whatsapp/conversations/:id/assign` - Assign to agent
- `PUT /api/whatsapp/conversations/:id/status` - Update status
- `POST /api/whatsapp/conversations/:id/notes` - Add note
- `GET /api/whatsapp/analytics` - Get analytics

## Database Schema

### WhatsAppConversation

```javascript
{
  phoneNumber: String,
  customerName: String,
  user: ObjectId (ref: User),
  conversationId: String (unique),
  status: 'active' | 'resolved' | 'pending' | 'escalated' | 'closed',
  category: 'product_inquiry' | 'order_status' | 'quote_request' | ...,
  isBot: Boolean,
  botStage: String,
  context: Map,
  assignedTo: ObjectId (ref: User),
  relatedOrder: ObjectId (ref: Order),
  relatedQuote: ObjectId (ref: Quote),
  messageCount: Number,
  lastMessageAt: Date,
  tags: [String],
  notes: [{ text, addedBy, addedAt }]
}
```

### WhatsAppMessage

```javascript
{
  messageId: String (unique),
  conversationId: String,
  from: String,
  to: String,
  direction: 'inbound' | 'outbound',
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | ...,
  content: {
    text: String,
    mediaUrl: String,
    buttonId: String,
    ...
  },
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed',
  isBot: Boolean,
  botIntent: String,
  sentBy: ObjectId (ref: User),
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date
}
```

## Bot Conversation Flows

### 1. Order Tracking Flow

```
Customer: "Track my order"
Bot: "Please provide your order number (e.g., ORD-12345)"
Customer: "ORD-12345"
Bot: [Shows order status with details]
```

### 2. Product Search Flow

```
Customer: "ECG machine"
Bot: [Shows list of ECG machines with prices]
Customer: "1" (selects first product)
Bot: [Shows detailed product info]
```

### 3. Quote Request Flow

```
Customer: "I need a quote"
Bot: "Please provide: 1) Product name 2) Quantity 3) Organization"
Customer: [Provides details]
Bot: "Quote request submitted. Our team will respond within 24 hours."
```

### 4. Human Handoff Flow

```
Customer: "Talk to a person"
Bot: "Connecting you to our team. Please wait..."
[Conversation assigned to available agent]
Agent: [Takes over conversation]
```

## Best Practices

### 1. Message Templates

- Use approved templates for transactional messages
- Keep messages under 160 characters when possible
- Include clear call-to-action links
- Add emojis for better engagement

### 2. Response Time

- Bot responds instantly
- Human agents should respond within 15 minutes during business hours
- Set auto-reply for after-hours messages

### 3. Conversation Management

- Assign conversations based on category
- Add notes for context when transferring
- Close resolved conversations to keep inbox clean
- Review analytics weekly to improve bot responses

### 4. Privacy & Compliance

- Never share customer data in messages
- Get consent before sending promotional messages
- Respect opt-out requests immediately
- Store messages securely with encryption

## Monitoring & Analytics

### Key Metrics to Track

1. **Response Rate**: % of messages answered by bot
2. **Resolution Rate**: % of conversations resolved without human
3. **Average Response Time**: Time to first response
4. **Conversation Volume**: Messages per day/week
5. **Bot Accuracy**: % of correct intent detection
6. **Handoff Rate**: % of conversations escalated to humans

### View Analytics

```bash
GET /api/whatsapp/analytics?startDate=2024-01-01&endDate=2024-01-31
```

## Troubleshooting

### Webhook Not Receiving Messages

1. Check webhook URL is publicly accessible
2. Verify SSL certificate is valid
3. Check webhook subscription in Meta/Twilio dashboard
4. Review server logs for errors

### Messages Not Sending

1. Verify API credentials are correct
2. Check phone number format (must include country code)
3. Ensure message templates are approved (Meta)
4. Check API rate limits

### Bot Not Responding

1. Check bot intent detection logic
2. Verify conversation status (should be `isBot: true`)
3. Review bot logs for errors
4. Test with simple messages first

## Production Checklist

- [ ] Business verification completed (Meta)
- [ ] Message templates approved
- [ ] Webhook URL configured with HTTPS
- [ ] Environment variables set correctly
- [ ] Database indexes created
- [ ] Monitoring and logging enabled
- [ ] Rate limiting configured
- [ ] Backup strategy in place
- [ ] Team trained on admin panel
- [ ] Customer support SOP documented

## Support

For issues or questions:
- Email: dev@medcorebd.com
- Documentation: https://developers.facebook.com/docs/whatsapp
- Twilio Docs: https://www.twilio.com/docs/whatsapp

## License

Proprietary - MedCore BD © 2024
