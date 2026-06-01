# WhatsApp Automation System for MedCore BD

## 🎯 Overview

Complete WhatsApp Business API integration with intelligent bot automation, conversation management, and seamless human handoff for MedCore BD's medical equipment e-commerce platform.

## ✨ Key Features

### 🤖 Intelligent Bot Automation
- **Smart Intent Detection**: Automatically understands customer queries (greetings, orders, products, quotes, support)
- **Context-Aware Responses**: Maintains conversation context across multiple messages
- **Multi-Stage Conversations**: Guides customers through complex workflows
- **Instant Responses**: 24/7 automated responses for common queries

### 📦 Order Management
- **Order Tracking**: Customers can track orders by simply sending order number
- **Status Updates**: Automatic notifications for order confirmations, shipping, delivery
- **Real-time Information**: Instant access to order details, tracking numbers, delivery status

### 🛍️ Product Discovery
- **Smart Search**: Natural language product search with instant results
- **Product Details**: Price, availability, specifications sent directly to WhatsApp
- **Category Browsing**: Easy navigation through product categories
- **Stock Alerts**: Real-time stock availability information

### 💼 B2B Features
- **Quote Requests**: Automated quote collection and processing
- **Bulk Inquiries**: Handle large order inquiries efficiently
- **Account Management**: B2B customer support and account queries
- **Custom Pricing**: Route pricing inquiries to sales team

### 👥 Human Handoff
- **Seamless Transfer**: Smooth transition from bot to human agent
- **Context Preservation**: Full conversation history available to agents
- **Smart Routing**: Assign conversations based on category and expertise
- **Agent Dashboard**: Manage multiple conversations from admin panel

### 📊 Analytics & Insights
- **Conversation Metrics**: Track volume, resolution rate, response time
- **Bot Performance**: Monitor intent detection accuracy and success rate
- **Customer Insights**: Understand common queries and pain points
- **Team Performance**: Agent response times and resolution rates

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Customer WhatsApp                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          WhatsApp Business API (Meta/Twilio)                │
│  • Message Delivery                                          │
│  • Status Updates                                            │
│  • Media Handling                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Webhook Handler                            │
│  POST /api/whatsapp/webhook                                  │
│  • Verify signature                                          │
│  • Parse payload                                             │
│  • Route to processor                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  WhatsApp    │ │  WhatsApp    │ │  WhatsApp    │
│  Service     │ │  Bot         │ │  Controller  │
│              │ │              │ │              │
│ • Send msgs  │ │ • Detect     │ │ • Manage     │
│ • Templates  │ │   intent     │ │   convos     │
│ • Media      │ │ • Generate   │ │ • Assign     │
│ • Status     │ │   responses  │ │   agents     │
└──────────────┘ └──────────────┘ └──────────────┘
         │               │               │
         └───────────────┴───────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
│  • WhatsAppConversation (conversations)                      │
│  • WhatsAppMessage (message history)                         │
│  • User (customer data)                                      │
│  • Order (order data)                                        │
│  • Product (product catalog)                                 │
└─────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
backend/src/
├── models/
│   ├── WhatsAppConversation.js    # Conversation tracking
│   └── WhatsAppMessage.js         # Message storage
├── services/
│   ├── whatsappService.js         # API integration (Meta/Twilio)
│   └── whatsappBot.js             # Bot logic & automation
├── controllers/
│   └── whatsappController.js      # Request handlers
└── routes/
    └── whatsappRoutes.js          # API endpoints
```

## 🚀 Quick Start

### 1. Install Dependencies

All required dependencies are already in `package.json`:
- `axios` - HTTP client for API calls
- `mongoose` - MongoDB ODM
- `express` - Web framework

```bash
cd health-care/backend
npm install
```

### 2. Configure Environment

Copy WhatsApp variables to your `.env` file:

```bash
# For development (mock mode)
WHATSAPP_PROVIDER=mock
WHATSAPP_BUSINESS_PHONE=8801800000000

# For production (Meta Cloud API)
WHATSAPP_PROVIDER=meta
WHATSAPP_ACCESS_TOKEN=your_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_id_here
WHATSAPP_VERIFY_TOKEN=your_verify_token_here
WHATSAPP_BUSINESS_PHONE=8801800000000
```

See `.env.whatsapp.example` for all configuration options.

### 3. Start Server

```bash
npm run dev
```

The WhatsApp webhook will be available at:
- Local: `http://localhost:5000/api/whatsapp/webhook`
- Production: `https://your-domain.com/api/whatsapp/webhook`

### 4. Test the System

#### Test in Mock Mode (No API Required)

```bash
# Send test message via API
curl -X POST http://localhost:5000/api/whatsapp/send \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "8801712345678",
    "text": "Hello from MedCore BD!"
  }'
```

Messages will be logged to console in mock mode.

#### Test with Real WhatsApp

1. Set up Meta Cloud API or Twilio (see WHATSAPP-SETUP-GUIDE.md)
2. Configure webhook URL in Meta/Twilio dashboard
3. Send message to your WhatsApp Business number
4. Bot will respond automatically

## 📱 Bot Conversation Examples

### Example 1: Order Tracking

```
Customer: Hi
Bot: 👋 Welcome to MedCore BD!
     I'm your virtual assistant. How can I help you today?
     
     Quick Options:
     1️⃣ Track my order
     2️⃣ Browse products
     3️⃣ Request a quote
     4️⃣ Get support
     5️⃣ Talk to a human agent

Customer: 1
Bot: 📦 Order Tracking
     Please provide your order number (e.g., ORD-12345)

Customer: ORD-12345
Bot: ✅ Order Status: ORD-12345
     
     Status: SHIPPED
     Total: ৳45,000
     Items: 3 item(s)
     Ordered: 15/01/2024
     Tracking: TRK-789456
     
     🚚 Your order is on the way!
     Track online: https://medcorebd.com/track/ORD-12345
```

### Example 2: Product Search

```
Customer: ECG machine price
Bot: 🔍 Found 3 product(s) for "ECG machine":
     
     1. Siemens ECG 12-Lead CardioStat Pro
        Brand: Siemens
        Price: ৳450,000
        ✅ In Stock
        View: https://medcorebd.com/products/...
     
     2. GE MAC 600 ECG Machine
        Brand: GE Healthcare
        Price: ৳380,000
        ✅ In Stock
        View: https://medcorebd.com/products/...
     
     💬 Reply with product number for details or "quote" to request a quotation.
```

### Example 3: Quote Request

```
Customer: I need a quote
Bot: 📋 Request a Quote
     
     To get a customized quote, please provide:
     1. Product name(s) or category
     2. Quantity needed
     3. Your organization name
     4. Delivery location
     
     Or submit online: https://medcorebd.com/b2b

Customer: 10 ECG machines for Dhaka Medical College
Bot: Thank you! I've forwarded your quote request to our sales team.
     They'll contact you within 24 hours with a detailed quotation.
     
     Reference: QR-2024-001
     📞 Urgent? Call: +8801800000000
```

### Example 4: Human Handoff

```
Customer: I have a complaint about my order
Bot: 🆘 Customer Support
     
     I understand you have a concern. Let me connect you with our support team.
     Please describe your issue briefly.

Customer: My order arrived damaged
Bot: 👤 Connecting to Human Agent
     
     I'm transferring you to one of our team members. They'll respond shortly.
     ⏰ Response time: 5-15 minutes during business hours

[Agent takes over]
Agent: Hello! I'm Sarah from MedCore BD support. I'm sorry to hear about the damaged order.
       Can you please share your order number and photos of the damage?
```

## 🔌 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/whatsapp/webhook` | Webhook verification (Meta) |
| POST | `/api/whatsapp/webhook` | Receive messages |

### Admin Endpoints (Require Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/whatsapp/send` | Send message manually |
| POST | `/api/whatsapp/test` | Test connection |
| GET | `/api/whatsapp/conversations` | List all conversations |
| GET | `/api/whatsapp/conversations/:id` | Get conversation details |
| PUT | `/api/whatsapp/conversations/:id/assign` | Assign to agent |
| PUT | `/api/whatsapp/conversations/:id/status` | Update status |
| POST | `/api/whatsapp/conversations/:id/notes` | Add internal note |
| GET | `/api/whatsapp/analytics` | Get analytics data |

## 🎨 Frontend Integration (Coming Soon)

### Admin Dashboard Components

```
/admin/whatsapp/
├── conversations/          # List all conversations
├── conversations/:id       # Conversation detail view
├── analytics              # Analytics dashboard
└── settings               # WhatsApp configuration
```

### Features to Build:
- [ ] Real-time conversation list with filters
- [ ] Chat interface for agents to respond
- [ ] Conversation assignment UI
- [ ] Analytics charts and metrics
- [ ] Template message builder
- [ ] Bulk messaging tool
- [ ] Customer profile integration

## 📊 Database Schema

### WhatsAppConversation

```javascript
{
  _id: ObjectId,
  phoneNumber: "8801712345678",
  customerName: "John Doe",
  user: ObjectId (ref: User),
  conversationId: "wa_8801712345678_1234567890",
  status: "active" | "resolved" | "pending" | "escalated" | "closed",
  category: "product_inquiry" | "order_status" | "quote_request" | ...,
  isBot: true,
  botStage: "greeting" | "menu" | "product_search" | ...,
  context: Map { lastIntent: "order_status", ... },
  assignedTo: ObjectId (ref: User),
  relatedOrder: ObjectId (ref: Order),
  relatedQuote: ObjectId (ref: Quote),
  messageCount: 15,
  lastMessageAt: Date,
  tags: ["urgent", "b2b"],
  notes: [{ text: "Customer prefers email", addedBy: ObjectId, addedAt: Date }],
  createdAt: Date,
  updatedAt: Date
}
```

### WhatsAppMessage

```javascript
{
  _id: ObjectId,
  messageId: "wamid.xxx",
  conversationId: "wa_8801712345678_1234567890",
  from: "8801712345678",
  to: "8801800000000",
  direction: "inbound" | "outbound",
  type: "text" | "image" | "document" | "button" | ...,
  content: {
    text: "Hello, I need help",
    mediaUrl: "https://...",
    buttonId: "btn_track_order"
  },
  status: "sent" | "delivered" | "read" | "failed",
  isBot: true,
  botIntent: "greeting",
  sentBy: ObjectId (ref: User),
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  createdAt: Date
}
```

## 🔧 Configuration Options

### Bot Behavior

```javascript
// In whatsappBot.js
intents: {
  greeting: ['hi', 'hello', 'hey', 'assalamu alaikum'],
  order_status: ['order', 'track', 'tracking', 'status'],
  product_inquiry: ['product', 'price', 'available', 'stock'],
  quote_request: ['quote', 'quotation', 'bulk', 'b2b'],
  support: ['help', 'support', 'problem', 'issue'],
  human: ['agent', 'human', 'person', 'talk to someone']
}
```

### Message Templates

Customize bot responses in `whatsappBot.js`:
- Greeting messages
- Menu options
- Error messages
- Success confirmations
- Handoff messages

### Business Rules

Configure in environment variables:
- Auto-handoff threshold
- Business hours
- Rate limits
- Notification preferences

## 📈 Analytics & Metrics

### Key Performance Indicators

1. **Conversation Volume**
   - Total conversations
   - New conversations per day
   - Active vs resolved

2. **Bot Performance**
   - Intent detection accuracy
   - Resolution rate (% resolved by bot)
   - Average conversation length

3. **Response Time**
   - Bot response time (instant)
   - Human agent response time
   - Time to resolution

4. **Customer Satisfaction**
   - Handoff rate (lower is better)
   - Repeat conversations
   - Escalation rate

5. **Business Impact**
   - Orders tracked via WhatsApp
   - Quotes requested
   - Products searched
   - Support tickets created

### View Analytics

```bash
GET /api/whatsapp/analytics?startDate=2024-01-01&endDate=2024-01-31
```

Response:
```json
{
  "success": true,
  "analytics": {
    "totalConversations": 1250,
    "byStatus": [
      { "_id": "resolved", "count": 850 },
      { "_id": "active", "count": 300 },
      { "_id": "escalated", "count": 100 }
    ],
    "byCategory": [
      { "_id": "order_status", "count": 500 },
      { "_id": "product_inquiry", "count": 400 },
      { "_id": "quote_request", "count": 200 }
    ],
    "botVsHuman": [
      { "_id": true, "count": 950 },
      { "_id": false, "count": 300 }
    ],
    "totalMessages": 5600,
    "avgResponseTime": 45
  }
}
```

## 🔐 Security Best Practices

1. **Webhook Verification**
   - Verify webhook signatures from Meta/Twilio
   - Use secure verify token
   - Validate payload structure

2. **Data Protection**
   - Encrypt sensitive customer data
   - Mask phone numbers in logs
   - Comply with GDPR/data protection laws

3. **Rate Limiting**
   - Limit messages per conversation
   - Prevent spam and abuse
   - Monitor for unusual patterns

4. **Access Control**
   - Role-based access for admin panel
   - Audit logs for all actions
   - Secure API endpoints

## 🐛 Troubleshooting

### Common Issues

**1. Webhook not receiving messages**
- Check webhook URL is publicly accessible
- Verify SSL certificate is valid
- Check webhook subscription in Meta/Twilio dashboard
- Review server logs for errors

**2. Messages not sending**
- Verify API credentials
- Check phone number format (must include country code)
- Ensure message templates are approved (Meta)
- Check API rate limits

**3. Bot not responding**
- Check bot intent detection logic
- Verify conversation status (`isBot: true`)
- Review bot logs for errors
- Test with simple messages first

**4. Database connection issues**
- Check MongoDB connection string
- Verify database is running
- Check network connectivity
- Review database logs

### Debug Mode

Enable detailed logging:

```bash
WHATSAPP_LOG_LEVEL=debug
```

View logs:
```bash
tail -f logs/combined.log | grep WhatsApp
```

## 🚀 Deployment

### Production Checklist

- [ ] Business verification completed (Meta)
- [ ] Message templates approved
- [ ] Webhook URL configured with HTTPS
- [ ] Environment variables set
- [ ] Database indexes created
- [ ] Monitoring enabled
- [ ] Rate limiting configured
- [ ] Backup strategy in place
- [ ] Team trained on admin panel
- [ ] Customer support SOP documented

### Deployment Steps

1. **Deploy Backend**
   ```bash
   cd health-care/backend
   npm run build  # if applicable
   npm start
   ```

2. **Configure Webhook**
   - Update webhook URL in Meta/Twilio dashboard
   - Test webhook verification
   - Subscribe to message events

3. **Test in Production**
   - Send test message
   - Verify bot responses
   - Check database logging
   - Monitor error logs

4. **Monitor Performance**
   - Set up alerts for errors
   - Monitor response times
   - Track conversation volume
   - Review analytics daily

## 📚 Additional Resources

- [Meta WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp)
- [WHATSAPP-SETUP-GUIDE.md](./WHATSAPP-SETUP-GUIDE.md) - Detailed setup instructions
- [.env.whatsapp.example](./health-care/backend/.env.whatsapp.example) - Configuration template

## 🤝 Support

For issues or questions:
- **Email**: dev@medcorebd.com
- **Documentation**: See WHATSAPP-SETUP-GUIDE.md
- **Logs**: Check `logs/combined.log` for errors

## 📝 License

Proprietary - MedCore BD © 2024

---

**Built with ❤️ for MedCore BD**
