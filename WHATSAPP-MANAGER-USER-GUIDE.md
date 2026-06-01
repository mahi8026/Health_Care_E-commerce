# Admin WhatsApp Conversation Manager - User Guide

## 🚀 Quick Start

### Accessing the WhatsApp Manager

1. **Log in** to your admin account at `/admin`
2. Look for the **💬 WhatsApp** menu item in the sidebar
3. Click to open the WhatsApp Conversation Manager

## 📋 Main Features

### 1. Conversation List

**What you'll see:**
- List of all customer WhatsApp conversations
- Customer name and phone number
- Conversation status (active, resolved, pending, escalated, closed)
- Category (product inquiry, order status, quote request, etc.)
- Number of messages
- Last message time
- Assigned agent (if any)

**How to use:**
- **Search**: Type phone number or customer name in the search box
- **Filter by Status**: Select from dropdown (All Status, Active, Resolved, etc.)
- **Filter by Category**: Select from dropdown (All Categories, Product Inquiry, etc.)
- **Clear Filters**: Click "Clear Filters" to reset
- **View Details**: Click any conversation row to open details

**Desktop View:**
```
┌─────────────────────────────────────────────────────────────┐
│ WhatsApp Conversations                    📊 Analytics      │
├─────────────────────────────────────────────────────────────┤
│ Search...          │ All Status ▼  │ All Categories ▼      │
├─────────────────────────────────────────────────────────────┤
│ Customer    │ Category │ Status │ Messages │ Last Message  │
├─────────────────────────────────────────────────────────────┤
│ 👤 John Doe │ Product  │ Active │    5     │ 2h ago        │
│ 📞 +880...  │ Inquiry  │ 🟢     │          │               │
├─────────────────────────────────────────────────────────────┤
│ 👤 Jane     │ Order    │ Resolved│   12    │ 1d ago        │
│ 📞 +880...  │ Status   │ 🔵     │          │               │
└─────────────────────────────────────────────────────────────┘
```

**Mobile View:**
```
┌───────────────────────┐
│ 💬 WhatsApp          │
├───────────────────────┤
│ 🔍 Search...         │
│ 📊 All Status ▼      │
│ 📁 All Categories ▼  │
├───────────────────────┤
│ 👤 John Doe          │
│ 📞 +880...           │
│ Product Inquiry • 5  │
│ 🟢 Active • 2h ago   │
├───────────────────────┤
│ 👤 Jane Smith        │
│ 📞 +880...           │
│ Order Status • 12    │
│ 🔵 Resolved • 1d ago │
└───────────────────────┘
```

### 2. Conversation Detail

**What you'll see:**
- Complete message history
- Customer information
- Conversation metadata
- Message input field
- Status and category controls
- Internal notes section

**Message Thread:**
```
┌─────────────────────────────────────────────┐
│ ← Back    John Doe (+880...)    🟢 Active   │
├─────────────────────────────────────────────┤
│                                             │
│  Customer: Hello, I need ECG machine       │
│  10:30 AM                                   │
│                                             │
│                    You: Hi! We have several │
│                    models available. ✓✓     │
│                    10:32 AM                 │
│                                             │
│  Customer: What's the price?               │
│  10:35 AM                                   │
│                                             │
├─────────────────────────────────────────────┤
│ Type your message...              [Send]    │
└─────────────────────────────────────────────┘
```

**How to send messages:**
1. Type your message in the input field at the bottom
2. Press **Enter** to send (or **Shift+Enter** for new line)
3. Click **Send** button
4. Message appears immediately with status indicator:
   - 🕐 Queued
   - ✓ Sent
   - ✓✓ Delivered
   - ✓✓ (blue) Read
   - ❌ Failed

**Bengali Support:**
- Type Bengali text directly in the message field
- All Bengali characters display correctly
- Customer messages in Bengali render properly

### 3. Sidebar Controls

**Status Management:**
```
┌─────────────────────┐
│ Status ▼            │
│ • Active            │
│ • Resolved          │
│ • Pending           │
│ • Escalated         │
│ • Closed            │
└─────────────────────┘
```

**Category Management:**
```
┌─────────────────────┐
│ Category ▼          │
│ • Product Inquiry   │
│ • Order Status      │
│ • Quote Request     │
│ • Complaint         │
│ • Support           │
│ • General           │
│ • B2B Inquiry       │
│ • Payment Issue     │
│ • Delivery Issue    │
│ • Return Request    │
│ • Other             │
└─────────────────────┘
```

**Customer Details:**
```
┌─────────────────────┐
│ Customer Details    │
├─────────────────────┤
│ Name: John Doe      │
│ Email: john@...     │
│ Phone: +880...      │
└─────────────────────┘
```

**Related Order:**
```
┌─────────────────────┐
│ Related Order       │
├─────────────────────┤
│ Order: #ORD-12345   │
│ Status: Processing  │
│ [View Order →]      │
└─────────────────────┘
```

**Internal Notes:**
```
┌─────────────────────┐
│ Internal Notes      │
│              + Add  │
├─────────────────────┤
│ 📝 Customer wants   │
│    bulk discount    │
│    - Admin (2h ago) │
└─────────────────────┘
```

### 4. Analytics Dashboard

**Access:** Click **📊 Analytics** button in the header

**What you'll see:**

**KPI Cards:**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 💬 Total     │ 📨 Total     │ ⏱️ Avg       │ 🤖 Bot       │
│ Conversations│ Messages     │ Response Time│ Conversations│
│ 1,234        │ 5,678        │ 15m          │ 456          │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Charts:**
- **Conversations by Status**: Bar chart showing active, resolved, pending, etc.
- **Messages by Direction**: Inbound vs Outbound
- **Bot vs Human**: Automated vs Manual conversations
- **Top Categories**: Most common inquiry types

**Date Range Filters:**
- Today
- Last 7 Days
- Last 30 Days
- All Time
- Custom Range (select start and end dates)

## 🎯 Common Tasks

### Task 1: Respond to a New Inquiry

1. Go to WhatsApp Manager
2. Look for conversations with "Active" status
3. Click the conversation
4. Read the message history
5. Type your response
6. Press Enter to send
7. Change status to "Resolved" when done

### Task 2: Follow Up on Pending Conversations

1. Filter by Status: "Pending"
2. Review each conversation
3. Send follow-up messages
4. Update status as needed

### Task 3: Handle Escalated Issues

1. Filter by Status: "Escalated"
2. Review the conversation and internal notes
3. Take appropriate action
4. Add internal note documenting resolution
5. Change status to "Resolved"

### Task 4: Add Internal Notes

1. Open conversation detail
2. Click "+ Add Note" in the sidebar
3. Type your note (visible only to admins)
4. Click "Add Note"
5. Note appears with your name and timestamp

### Task 5: Track Performance

1. Click "📊 Analytics" button
2. Select date range (e.g., "Last 7 Days")
3. Review KPI cards:
   - Total conversations handled
   - Average response time
   - Bot vs human ratio
4. Check category breakdown to identify trends

### Task 6: Search for Specific Customer

1. Type phone number or name in search box
2. Results filter automatically
3. Click conversation to view details

## 💡 Tips & Best Practices

### Response Time
- Aim to respond within 15 minutes during business hours
- Use status "Pending" if you need to research before responding
- Add internal notes if you need to follow up later

### Status Management
- **Active**: Ongoing conversation, awaiting response
- **Pending**: Waiting for information or action
- **Escalated**: Requires manager attention
- **Resolved**: Issue resolved, customer satisfied
- **Closed**: Conversation ended, no further action needed

### Category Selection
- Choose the most specific category
- Use "General" only if no other category fits
- Proper categorization helps with analytics

### Internal Notes
- Document important context
- Note any promises made to customer
- Record follow-up actions needed
- Include relevant order/quote numbers

### Bengali Communication
- Type Bengali directly in the message field
- Use formal Bengali for professional communication
- Keep messages clear and concise

## 🔔 Notifications & Updates

### Real-Time Updates
- Conversation list refreshes every 30 seconds
- Conversation detail refreshes every 10 seconds
- New messages appear automatically
- No need to manually refresh

### Message Status
- **Queued** (🕐): Message sent to WhatsApp API
- **Sent** (✓): WhatsApp received the message
- **Delivered** (✓✓): Customer's phone received it
- **Read** (✓✓ blue): Customer opened the message
- **Failed** (❌): Message failed to send (hover for error)

## 📱 Mobile Usage

### Accessing on Mobile
1. Open admin panel on mobile browser
2. Tap hamburger menu (☰) to open sidebar
3. Tap "💬 WhatsApp"

### Mobile Features
- Touch-friendly buttons (44x44px minimum)
- Swipe to scroll messages
- Tap to open conversations
- Filters collapse into dropdowns
- Sidebar content stacks below messages

### Mobile Tips
- Use landscape mode for better message view
- Tap and hold to copy message text
- Use device keyboard for Bengali input

## ❓ Troubleshooting

### "Failed to load conversations"
- Check your internet connection
- Click "Retry" button
- Refresh the page
- Contact IT if issue persists

### "Failed to send message"
- Check message content (not empty)
- Verify customer phone number is valid
- Check backend WhatsApp API status
- Try again in a few seconds

### Messages not updating
- Check if polling is active (should auto-refresh)
- Manually refresh the page
- Check browser console for errors

### Can't see Bengali text
- Ensure browser supports UTF-8 encoding
- Check if Bengali font is installed
- Try a different browser (Chrome recommended)

## 🔒 Security & Privacy

### Access Control
- Only admin users can access WhatsApp Manager
- All conversations are encrypted in transit
- Internal notes are never visible to customers

### Data Protection
- Customer phone numbers are protected
- Message history is stored securely
- No data is shared with third parties

### Best Practices
- Don't share customer information externally
- Log out when leaving your workstation
- Don't screenshot sensitive conversations
- Follow company privacy policies

## 📞 Support

### Need Help?
- Contact IT Support: support@medcorebd.com
- Phone: +8801800000000
- Internal Slack: #admin-support

### Report Issues
- Bug reports: bugs@medcorebd.com
- Feature requests: features@medcorebd.com
- Security concerns: security@medcorebd.com

## 🎓 Training Resources

### Video Tutorials
- WhatsApp Manager Overview (5 min)
- Responding to Customers (10 min)
- Using Analytics (8 min)
- Mobile Usage Guide (6 min)

### Documentation
- API Documentation: /docs/api/whatsapp
- Admin Manual: /docs/admin-guide
- FAQ: /docs/faq

---

**Last Updated**: May 28, 2026
**Version**: 1.0.0
**Maintained by**: MedCore BD IT Team
