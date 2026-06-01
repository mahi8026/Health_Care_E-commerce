# Meta WhatsApp Business API - Complete Setup Guide

## 🎯 Goal
Set up Meta WhatsApp Cloud API to send **real WhatsApp messages** to your customers for order confirmations, status updates, and support.

---

## 📋 Prerequisites

- ✅ Facebook account
- ✅ Business phone number (8801646886795)
- ✅ Valid business email
- ✅ Business documents (for verification)
- ✅ Your backend server running

---

## 🚀 Step-by-Step Setup

### Step 1: Create Meta Developer Account

1. **Go to**: [Meta for Developers](https://developers.facebook.com/)
2. **Click**: "Get Started" or "My Apps"
3. **Log in**: With your Facebook account
4. **Accept**: Developer terms and conditions

✅ **You now have a Meta Developer account!**

---

### Step 2: Create a New App

1. **Click**: "Create App" button
2. **Select**: "Business" as app type
3. **Click**: "Next"

**App Details:**
- **App Name**: `MedCore BD WhatsApp`
- **App Contact Email**: `mahimrahman07@gmail.com`
- **Business Account**: Create new or select existing

4. **Click**: "Create App"
5. **Complete**: Security check (if prompted)

✅ **Your app is created!**

---

### Step 3: Add WhatsApp Product

1. **In your app dashboard**, find "WhatsApp" in the products list
2. **Click**: "Set up" on the WhatsApp card
3. **Wait**: For WhatsApp to be added to your app

✅ **WhatsApp product added!**

---

### Step 4: Get Your Credentials

#### A. Get Phone Number ID

1. **Go to**: WhatsApp > API Setup (in left sidebar)
2. **Find**: "Phone number ID" section
3. **Copy**: The Phone Number ID (looks like: `123456789012345`)

**Save this**: You'll need it for `.env`

#### B. Get Access Token

1. **In the same page**, find "Temporary access token"
2. **Click**: "Copy" button
3. **⚠️ Important**: This is temporary (24 hours)

**For now**: Use temporary token for testing
**Later**: We'll create a permanent token

✅ **Credentials obtained!**

---

### Step 5: Configure Your Backend

1. **Open**: `health-care/backend/.env`
2. **Update** these lines:

```env
# Change from mock to meta
WHATSAPP_PROVIDER=meta

# Add your credentials
WHATSAPP_ACCESS_TOKEN=your_temporary_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_API_VERSION=v18.0

# Create a secure random string for webhook verification
WHATSAPP_VERIFY_TOKEN=medcore_secure_verify_token_2024

# Your business phone (already set)
WHATSAPP_BUSINESS_PHONE=8801646886795
```

3. **Save** the file

✅ **Backend configured!**

---

### Step 6: Test Sending a Message

1. **In Meta Dashboard**, find "Send and receive messages" section
2. **You'll see**: A test phone number (yours or Meta's test number)
3. **Click**: "Send message" button
4. **Check**: Your WhatsApp for test message

**Or test via your backend:**

```bash
# Restart your server first
cd health-care/backend
npm run dev
```

Then place an order in your store!

✅ **If you receive a WhatsApp message, it's working!**

---

### Step 7: Add Your Phone Number (Production)

The test number only works for you. To send to customers:

1. **Go to**: WhatsApp > API Setup
2. **Click**: "Add phone number"
3. **Enter**: Your business phone `+880 1646886795`
4. **Verify**: Via SMS code
5. **Complete**: Phone number setup

**⚠️ Note**: You can only use a phone number that's not already on WhatsApp Business App

✅ **Your business number is added!**

---

### Step 8: Create Permanent Access Token

Temporary tokens expire in 24 hours. Create a permanent one:

1. **Go to**: Settings > Basic (in left sidebar)
2. **Scroll to**: "App Secret"
3. **Click**: "Show" and copy it

**Then:**

1. **Go to**: WhatsApp > API Setup
2. **Click**: "Generate permanent token" or use System User method

**System User Method (Recommended):**

1. **Go to**: [Meta Business Settings](https://business.facebook.com/settings)
2. **Click**: "Users" > "System Users"
3. **Click**: "Add" to create system user
4. **Name**: `MedCore WhatsApp Bot`
5. **Role**: Admin
6. **Click**: "Create System User"
7. **Click**: "Generate New Token"
8. **Select**: Your app
9. **Permissions**: Select `whatsapp_business_messaging`, `whatsapp_business_management`
10. **Click**: "Generate Token"
11. **Copy**: The permanent token

**Update `.env`:**
```env
WHATSAPP_ACCESS_TOKEN=your_permanent_token_here
```

✅ **Permanent token created!**

---

### Step 9: Set Up Webhook (For Receiving Messages)

This allows customers to reply to your messages.

#### A. Get Your Webhook URL

Your webhook URL will be:
```
https://your-domain.com/api/whatsapp/webhook
```

**For local testing**, use [ngrok](https://ngrok.com/):
```bash
# Install ngrok
# Download from https://ngrok.com/download

# Run ngrok
ngrok http 5001

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

Your webhook URL becomes:
```
https://abc123.ngrok.io/api/whatsapp/webhook
```

#### B. Configure Webhook in Meta

1. **Go to**: WhatsApp > Configuration (in left sidebar)
2. **Click**: "Edit" in Webhook section
3. **Enter**:
   - **Callback URL**: `https://your-domain.com/api/whatsapp/webhook`
   - **Verify Token**: `medcore_secure_verify_token_2024` (same as in `.env`)
4. **Click**: "Verify and Save"

**If verification succeeds**: ✅ Webhook is configured!

**If it fails**: Check that:
- Your server is running
- The URL is accessible
- The verify token matches

#### C. Subscribe to Webhook Events

1. **In the same page**, find "Webhook fields"
2. **Subscribe to**:
   - ✅ `messages` (receive customer messages)
   - ✅ `message_status` (delivery status)
3. **Click**: "Save"

✅ **Webhook configured!**

---

### Step 10: Create Message Templates

Meta requires pre-approved templates for certain messages.

1. **Go to**: WhatsApp > Message Templates
2. **Click**: "Create Template"

#### Template 1: Order Confirmation

**Name**: `order_confirmation`
**Category**: Transactional
**Language**: English

**Message**:
```
Your order {{1}} has been confirmed!

Total: ৳{{2}}
Items: {{3}}

Track your order: {{4}}

Thank you for shopping with MedCore BD!
```

**Variables**:
1. Order number
2. Total amount
3. Item count
4. Tracking URL

**Click**: "Submit"

#### Template 2: Order Status Update

**Name**: `order_status_update`
**Category**: Transactional
**Language**: English

**Message**:
```
Order Update: {{1}}

Your order status: {{2}}

{{3}}

Track: {{4}}
```

**Variables**:
1. Order number
2. Status
3. Additional info
4. Tracking URL

**Click**: "Submit"

**⏳ Wait**: Templates need Meta approval (usually 1-24 hours)

✅ **Templates submitted!**

---

### Step 11: Business Verification (Required for Production)

To send messages to any customer (not just test numbers), you need business verification.

1. **Go to**: [Meta Business Settings](https://business.facebook.com/settings)
2. **Click**: "Security Center" > "Business Verification"
3. **Click**: "Start Verification"

**Required Documents**:
- Business registration certificate
- Tax ID
- Business address proof
- Phone bill or utility bill

**Upload** documents and **submit**

**⏳ Wait**: Verification takes 1-3 business days

✅ **Verification submitted!**

---

## 🧪 Testing Your Setup

### Test 1: Send Message from Dashboard

1. **Go to**: WhatsApp > API Setup
2. **Find**: "Send and receive messages"
3. **Click**: "Send message"
4. **Check**: Your WhatsApp

### Test 2: Place an Order

1. **Go to**: Your store (localhost:3000)
2. **Add product** to cart
3. **Complete checkout**
4. **Check**: Your WhatsApp for order confirmation

### Test 3: Update Order Status

1. **Go to**: Admin panel
2. **Find**: Recent order
3. **Change status** to "Shipped"
4. **Check**: Your WhatsApp for status update

---

## 🔧 Troubleshooting

### Issue 1: Webhook Verification Failed

**Check**:
- Server is running
- URL is publicly accessible (use ngrok for local)
- Verify token matches exactly
- No trailing slash in URL

**Test webhook manually**:
```bash
curl "http://localhost:5001/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=medcore_secure_verify_token_2024&hub.challenge=test123"

# Should return: test123
```

### Issue 2: Messages Not Sending

**Check**:
- Access token is valid (not expired)
- Phone Number ID is correct
- Recipient number is in correct format
- You're not rate limited

**Check logs**:
```bash
tail -f logs/combined.log | grep WhatsApp
```

### Issue 3: Template Not Approved

**Common reasons**:
- Template contains promotional content
- Variables not properly formatted
- Template too long
- Doesn't follow Meta guidelines

**Fix**: Edit template and resubmit

### Issue 4: Can't Send to Customer Numbers

**Reason**: Business not verified

**Solution**: 
- Complete business verification
- Or use test numbers during development

---

## 📊 Rate Limits

### Free Tier (Unverified Business)
- **1,000 conversations/month**
- **Conversations with 10 unique customers**
- **Test numbers only**

### Verified Business
- **1,000 free conversations/month**
- **Unlimited customers**
- **Pay for additional conversations**

**Pricing**: ~$0.005 - $0.09 per conversation (varies by country)

---

## 🎯 Production Checklist

Before going live:

- [ ] Business verification completed
- [ ] Permanent access token created
- [ ] Production webhook configured (HTTPS)
- [ ] Message templates approved
- [ ] Phone number verified
- [ ] Tested with real orders
- [ ] Rate limits understood
- [ ] Monitoring set up
- [ ] Team trained

---

## 📚 Useful Links

- **Meta Developer Console**: https://developers.facebook.com/apps
- **Business Manager**: https://business.facebook.com/
- **WhatsApp API Docs**: https://developers.facebook.com/docs/whatsapp
- **Message Templates**: https://developers.facebook.com/docs/whatsapp/message-templates
- **Pricing**: https://developers.facebook.com/docs/whatsapp/pricing

---

## 🆘 Need Help?

### Meta Support
- **Documentation**: https://developers.facebook.com/docs/whatsapp
- **Community**: https://developers.facebook.com/community
- **Support**: https://developers.facebook.com/support

### Your Backend
- **Logs**: `tail -f logs/combined.log | grep WhatsApp`
- **Test**: `node test-whatsapp-integration.js`
- **Docs**: See `WHATSAPP-SETUP-GUIDE.md`

---

## ✅ Success!

Once everything is set up, your customers will receive:
- ✅ Instant order confirmations
- ✅ Real-time status updates
- ✅ Quote notifications
- ✅ Ability to reply and get support

**Your WhatsApp automation is ready for production!** 🎉
