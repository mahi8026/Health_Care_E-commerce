# WhatsApp Notifications - Troubleshooting Guide

## ✅ Issue Resolved: Phone Number Added

### Problem
You placed an order but didn't receive a WhatsApp notification.

### Root Cause
Your user account didn't have a phone number, so the WhatsApp notification was skipped.

```javascript
// In orderController.js
if (user.phone) {  // ❌ This was false - no phone number
  await whatsappBot.sendOrderConfirmation(order, user);
}
```

### Solution Applied ✅
Phone number **8801646886795** has been added to your account (mahimrahman07@gmail.com).

---

## 🧪 Test Again

### Step 1: Place a New Order
1. Go to your store
2. Add a product to cart
3. Complete checkout
4. Submit order

### Step 2: Check Server Logs
```bash
# Watch logs in real-time
tail -f logs/combined.log | grep WhatsApp
```

You should see:
```
[WhatsApp] Initialized with provider: mock
[WhatsAppBot] Order confirmation sent to 8801646886795
```

### Step 3: Check Mock Output
Since you're in **mock mode**, messages are logged to console, not sent to real WhatsApp.

You'll see a box like this in the logs:
```
╔════════════════════════════════════════════════════════════════╗
║                📱 MOCK WHATSAPP (Not Sent)                     ║
╠════════════════════════════════════════════════════════════════╣
║ To:      8801646886795                                     ║
║ Type:    text                                              ║
║ Message: ✅ *Order Confirmed!*                              ║
║          Thank you for your order, Mahi M Rahman!          ║
║          Order Number: ORD-12345                           ║
║          Total Amount: ৳3,600                              ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 📱 Why You're Not Getting Real WhatsApp Messages

You're currently in **MOCK MODE**:
```env
WHATSAPP_PROVIDER=mock
```

### Mock Mode Behavior
- ✅ All code runs correctly
- ✅ Messages are logged to console
- ✅ Messages saved to database
- ❌ No actual WhatsApp messages sent
- ❌ No API calls to Meta/Twilio

### This is Perfect for Testing!
Mock mode lets you:
- Test the integration without API credentials
- See exactly what messages would be sent
- Verify the logic works correctly
- Develop and debug safely

---

## 🚀 To Get Real WhatsApp Messages

### Option 1: Meta WhatsApp Cloud API (Recommended)

**Steps:**
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create app and add WhatsApp product
3. Get Phone Number ID and Access Token
4. Update `.env`:
   ```env
   WHATSAPP_PROVIDER=meta
   WHATSAPP_ACCESS_TOKEN=your_token_here
   WHATSAPP_PHONE_NUMBER_ID=your_phone_id_here
   WHATSAPP_VERIFY_TOKEN=create_random_string
   ```
5. Configure webhook: `https://your-domain.com/api/whatsapp/webhook`
6. Restart server

**See**: `WHATSAPP-SETUP-GUIDE.md` for detailed instructions

### Option 2: Twilio WhatsApp API

**Steps:**
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get $15 free credit
3. Use WhatsApp Sandbox for testing
4. Update `.env`:
   ```env
   WHATSAPP_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```
5. Restart server

---

## 🔍 How to Verify It's Working

### 1. Check User Has Phone Number

**Via Database:**
```javascript
// In MongoDB
db.users.findOne({ email: "mahimrahman07@gmail.com" }, { phone: 1, name: 1 })

// Should show:
{
  "_id": ObjectId("..."),
  "name": "Mahi M Rahman",
  "phone": "8801646886795"
}
```

**Via API:**
```bash
curl http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Check Server Logs

**Watch logs:**
```bash
# Windows PowerShell
Get-Content logs\combined.log -Wait -Tail 50 | Select-String "WhatsApp"

# Or use the running server terminal
# Look for WhatsApp-related messages
```

**What to look for:**
```
✅ Good signs:
[WhatsApp] Initialized with provider: mock
[WhatsAppBot] Order confirmation sent to 8801646886795
[WhatsApp] New conversation created: wa_8801646886795_...

❌ Bad signs:
[createOrder] WhatsApp failed: ...
Error: ...
```

### 3. Check Database

**Check messages saved:**
```javascript
// In MongoDB
db.whatsappmessages.find({ to: "8801646886795" }).sort({ createdAt: -1 }).limit(5)
```

**Check conversations:**
```javascript
db.whatsappconversations.find({ phoneNumber: "8801646886795" })
```

---

## 🐛 Common Issues & Solutions

### Issue 1: User Has No Phone Number
**Symptom**: No WhatsApp logs, no messages sent
**Solution**: Run `node add-phone-to-user.js`

### Issue 2: WhatsApp Service Not Initialized
**Symptom**: Error "whatsappBot is not defined"
**Solution**: Restart server to load WhatsApp routes

### Issue 3: Messages Not Saved to Database
**Symptom**: Logs show message sent, but not in database
**Solution**: Check MongoDB connection, verify models loaded

### Issue 4: Wrong Phone Format
**Symptom**: Messages sent but to wrong number
**Solution**: Phone should be `8801646886795` (no + or spaces)

### Issue 5: Provider Not Configured
**Symptom**: Error about missing credentials
**Solution**: Check `.env` has `WHATSAPP_PROVIDER=mock`

---

## 📊 Verify Integration

### Test Script
```bash
cd health-care/backend
node test-whatsapp-integration.js
```

This will:
- ✅ Test order confirmation
- ✅ Test status updates
- ✅ Test quote notifications
- ✅ Show mock messages
- ✅ Verify database saves

### Manual Test
1. **Place order** in your store
2. **Check logs** for WhatsApp message
3. **Check database** for saved message
4. **Update order status** in admin
5. **Check logs** for status update message

---

## 📝 What Happens in Mock Mode

### Order Created
```
1. User places order
2. orderController.createOrder() runs
3. Checks if user.phone exists ✅
4. Calls whatsappBot.sendOrderConfirmation()
5. whatsappService.sendMessage() called
6. Provider is 'mock' → sendMockMessage()
7. Message logged to console ✅
8. Message saved to database ✅
9. Returns success ✅
```

### Order Status Updated
```
1. Admin updates order status
2. orderController.updateOrderStatus() runs
3. Checks if status is in ['confirmed', 'shipped', 'delivered', 'cancelled']
4. Populates user data
5. Checks if user.phone exists ✅
6. Calls whatsappBot.sendOrderStatusUpdate()
7. Message logged to console ✅
8. Message saved to database ✅
```

---

## 🎯 Next Steps

### 1. Test Now ✅
Place another order and check the logs!

### 2. Verify Logs
```bash
# Watch server logs
tail -f logs/combined.log | grep WhatsApp
```

### 3. Check Database
```bash
# Connect to MongoDB
mongo
use medcore-bd
db.whatsappmessages.find().sort({createdAt:-1}).limit(5).pretty()
```

### 4. When Ready for Production
- Set up Meta WhatsApp Cloud API
- Update `.env` with real credentials
- Configure webhook
- Test with real phone number
- Deploy!

---

## 📞 Support

### Quick Checks
```bash
# 1. Check user phone
node add-phone-to-user.js mahimrahman07@gmail.com

# 2. Test integration
node test-whatsapp-integration.js

# 3. Check logs
tail -f logs/combined.log | grep WhatsApp
```

### Documentation
- **Setup Guide**: `WHATSAPP-SETUP-GUIDE.md`
- **Integration Guide**: `WHATSAPP-INTEGRATION-COMPLETE.md`
- **Quick Reference**: `WHATSAPP-QUICK-REFERENCE.md`

---

## ✅ Summary

**Problem**: No phone number → No WhatsApp notification
**Solution**: Phone number added → Notifications will work now
**Status**: ✅ Ready to test again!

**Try placing another order now!** 🎉

---

**Note**: You're in mock mode, so messages are logged to console, not sent to real WhatsApp. This is perfect for testing! When you're ready for production, follow the setup guide to configure real WhatsApp API.
