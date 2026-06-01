# WhatsApp Manager - Quick Reference Card

## 🚀 Access
**URL**: `/admin/whatsapp`  
**Menu**: Admin Panel → 💬 WhatsApp  
**Permissions**: Admin, Manager, Support roles

## 📋 Main Views

### 1️⃣ Conversation List (`/admin/whatsapp`)
```
┌─────────────────────────────────────────┐
│ 🔍 Search | 📊 Status ▼ | 📁 Category ▼│
├─────────────────────────────────────────┤
│ 👤 Customer | Category | Status | Time │
└─────────────────────────────────────────┘
```
- **Search**: Phone or name
- **Filter**: Status (5 options) + Category (11 options)
- **Sort**: Most recent first
- **Pagination**: 20 per page
- **Refresh**: Auto (30s)

### 2️⃣ Conversation Detail (`/admin/whatsapp/[id]`)
```
┌─────────────────────────────────────────┐
│ ← Back | Customer Name | Status Badge  │
├─────────────────────────────────────────┤
│ Message Thread                          │
│ (Inbound ← | Outbound →)               │
├─────────────────────────────────────────┤
│ Type message... | [Send]                │
└─────────────────────────────────────────┘
```
- **Messages**: Chronological, auto-scroll
- **Send**: Enter or click button
- **Refresh**: Auto (10s)
- **Sidebar**: Status, Category, Notes, Customer Info

### 3️⃣ Analytics (`/admin/whatsapp/analytics`)
```
┌─────────────────────────────────────────┐
│ Date Range: Last 7 Days ▼              │
├─────────────────────────────────────────┤
│ 💬 Total | 📨 Messages | ⏱️ Time | 🤖 Bot│
├─────────────────────────────────────────┤
│ Charts: Status | Direction | Categories│
└─────────────────────────────────────────┘
```
- **KPIs**: Total, Messages, Response Time, Bot
- **Charts**: Status, Direction, Bot vs Human, Categories
- **Filters**: Today, 7d, 30d, All, Custom

## 🎯 Quick Actions

| Action | How To |
|--------|--------|
| **View Conversations** | Click WhatsApp in sidebar |
| **Search Customer** | Type phone/name in search box |
| **Filter by Status** | Select from Status dropdown |
| **Open Conversation** | Click any row in list |
| **Send Message** | Type + Enter (or click Send) |
| **Change Status** | Select from Status dropdown in sidebar |
| **Change Category** | Select from Category dropdown |
| **Add Note** | Click "+ Add Note" in sidebar |
| **View Analytics** | Click "📊 Analytics" button |

## 📊 Status Options

| Status | Color | When to Use |
|--------|-------|-------------|
| 🟢 **Active** | Green | Ongoing conversation |
| 🔵 **Resolved** | Blue | Issue resolved |
| 🟡 **Pending** | Yellow | Waiting for info/action |
| 🔴 **Escalated** | Red | Needs manager attention |
| ⚫ **Closed** | Gray | Conversation ended |

## 📁 Category Options

1. **Product Inquiry** - Questions about products
2. **Order Status** - Order tracking/updates
3. **Quote Request** - Price quotes
4. **Complaint** - Customer complaints
5. **Support** - Technical support
6. **General** - General inquiries
7. **B2B Inquiry** - Business inquiries
8. **Payment Issue** - Payment problems
9. **Delivery Issue** - Delivery problems
10. **Return Request** - Return/refund requests
11. **Other** - Miscellaneous

## 💬 Message Status Icons

| Icon | Status | Meaning |
|------|--------|---------|
| 🕐 | Queued | Sent to API |
| ✓ | Sent | WhatsApp received |
| ✓✓ | Delivered | Customer received |
| ✓✓ (blue) | Read | Customer opened |
| ❌ | Failed | Send failed |

## 🔑 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Enter** | Send message |
| **Shift+Enter** | New line in message |
| **Esc** | Close modal/cancel |

## 📱 Mobile Tips

- **Hamburger Menu** (☰): Access sidebar
- **Swipe**: Scroll messages
- **Tap**: Open conversation
- **Landscape**: Better message view
- **Touch Targets**: 44x44px minimum

## 🔔 Auto-Refresh Intervals

| View | Interval |
|------|----------|
| Conversation List | 30 seconds |
| Conversation Detail | 10 seconds |
| Analytics | Manual only |

## 🎨 Color Coding

| Element | Color | Hex |
|---------|-------|-----|
| Primary Action | Blue | #3B82F6 |
| Success/Active | Green | #10B981 |
| Warning/Pending | Yellow | #F59E0B |
| Danger/Escalated | Red | #EF4444 |
| Neutral/Closed | Gray | #6B7280 |

## 🌐 Bengali Support

✅ **Supported**:
- Message input
- Message display
- Customer names
- Search

❌ **Not Supported**:
- UI labels (English only)
- System messages

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Can't see conversations | Check admin role, refresh page |
| Message won't send | Check text not empty, retry |
| Not updating | Check internet, wait for auto-refresh |
| Bengali not showing | Check browser UTF-8 support |

## 📞 Support Contacts

| Issue Type | Contact |
|------------|---------|
| Technical | support@medcorebd.com |
| Bug Report | bugs@medcorebd.com |
| Feature Request | features@medcorebd.com |
| Security | security@medcorebd.com |
| Phone | +8801800000000 |

## 📚 Documentation Links

- **Full Implementation**: `/WHATSAPP-MANAGER-IMPLEMENTATION.md`
- **User Guide**: `/WHATSAPP-MANAGER-USER-GUIDE.md`
- **Requirements**: `.kiro/specs/admin-whatsapp-manager/requirements.md`
- **API Docs**: `/docs/api/whatsapp`

## ⚡ Performance Tips

1. **Use Filters**: Narrow down conversations before searching
2. **Close Unused Tabs**: Reduce polling load
3. **Clear Filters**: Reset when done to see all conversations
4. **Mobile Data**: Use Wi-Fi for better performance
5. **Browser**: Chrome recommended for best experience

## 🔒 Security Reminders

- ✅ Log out when leaving workstation
- ✅ Don't share customer info externally
- ✅ Don't screenshot sensitive data
- ✅ Follow company privacy policies
- ✅ Report suspicious activity immediately

## 📈 Best Practices

### Response Time
- **Target**: < 15 minutes during business hours
- **Use Pending**: If research needed
- **Add Notes**: Document follow-ups

### Status Management
- **Update Promptly**: Keep status current
- **Use Escalated**: For urgent issues
- **Close When Done**: Mark resolved conversations

### Category Selection
- **Be Specific**: Choose most relevant category
- **Consistent**: Use same categories for similar issues
- **Analytics**: Proper categorization helps reporting

### Internal Notes
- **Document Context**: Important details
- **Record Promises**: What you told customer
- **Follow-ups**: What needs to be done
- **Include IDs**: Order/quote numbers

---

**Version**: 1.0.0  
**Last Updated**: May 28, 2026  
**Print**: Keep this card handy for quick reference!
