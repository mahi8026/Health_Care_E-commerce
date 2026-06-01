# Contact Widget Setup Guide

## 🚀 Quick Setup

### Step 1: Update WhatsApp Number

Edit `src/components/ui/LiveChatWidget.jsx` line 24:

```javascript
const whatsappNumber = '8801800000000'; // ← Replace with your number
```

**Format:** Country code + number (no + or spaces)

**Examples:**
- Bangladesh: `8801712345678` (880 + 10 digits)
- India: `919876543210` (91 + 10 digits)
- USA: `15551234567` (1 + 10 digits)

### Step 2: Update Facebook Page

Edit `src/components/ui/LiveChatWidget.jsx` line 25:

```javascript
const facebookPageId = 'medcorebd'; // ← Replace with your page username
```

**How to find your Facebook page username:**
1. Go to your Facebook page
2. Click "About" in left sidebar
3. Look for "Username" or "Page ID"
4. Copy the username (e.g., `medcorebd` from `facebook.com/medcorebd`)

### Step 3: Test It!

```bash
cd "c:\Projects\Health Care\health-care"
npm run dev
```

Open `http://localhost:3000` and:
1. Click the green chat button (bottom-right)
2. Click "WhatsApp" - should open WhatsApp with your number
3. Click "Messenger" - should open your Facebook page

## 📋 Configuration Checklist

- [ ] WhatsApp number updated
- [ ] Facebook page ID updated
- [ ] WhatsApp number tested (opens correctly)
- [ ] Messenger link tested (opens correct page)
- [ ] Pre-filled message is appropriate
- [ ] All buttons work on mobile
- [ ] All buttons work on desktop

## 🎨 Customization

### Change Pre-filled WhatsApp Message

Edit line 42 in `LiveChatWidget.jsx`:

```javascript
// Current
const message = encodeURIComponent('Hello, I need help with medical equipment.');

// For product inquiries
const message = encodeURIComponent('I want to inquire about a product.');

// For B2B
const message = encodeURIComponent('I am interested in B2B partnership.');

// For support
const message = encodeURIComponent('I need technical support.');
```

### Change Button Order

Want WhatsApp first? Edit the JSX order (around line 120):

```jsx
{/* WhatsApp first (most popular in Bangladesh) */}
<button onClick={handleOpenWhatsApp}>
  <FaWhatsapp size={22} />
  <span>WhatsApp</span>
</button>

<button onClick={handleOpenMessenger}>
  <FaFacebookMessenger size={20} />
  <span>Messenger</span>
</button>

<button onClick={handleOpenLiveChat}>
  <FaComments size={20} />
  <span>LiveChat</span>
</button>
```

### Add More Channels

Want to add Telegram or Viber?

```javascript
// Add at top with other constants
const telegramUsername = 'medcorebd';

// Add handler function
const handleOpenTelegram = () => {
  window.open(`https://t.me/${telegramUsername}`, '_blank');
  setShowContactOptions(false);
};

// Add button in JSX
<button onClick={handleOpenTelegram}>
  <FaTelegram size={20} />
  <span>Telegram</span>
</button>
```

## 🔍 Testing URLs

### Test WhatsApp Link
Open this URL in browser (replace with your number):
```
https://wa.me/8801800000000?text=Hello,%20I%20need%20help%20with%20medical%20equipment.
```

Should open WhatsApp with pre-filled message.

### Test Messenger Link
Open this URL in browser (replace with your page):
```
https://m.me/medcorebd
```

Should open Facebook Messenger with your page.

## ⚠️ Common Issues

### Issue: WhatsApp opens but wrong number
**Fix:** Check number format - must be country code + number, no spaces or +

### Issue: Messenger says "Page not found"
**Fix:** Verify Facebook page username is correct and page is published

### Issue: Buttons don't work on mobile
**Fix:** Check if popup blockers are enabled - may need to allow popups

### Issue: Pre-filled message has weird characters
**Fix:** Use `encodeURIComponent()` to properly encode the message

## 📱 Mobile App Detection

The widget automatically detects if WhatsApp/Messenger apps are installed:

**iOS/Android:**
- If app installed → Opens in app
- If app not installed → Opens web version

**Desktop:**
- WhatsApp → Opens WhatsApp Web
- Messenger → Opens Messenger Web

## 🎯 Recommended Settings for Bangladesh

```javascript
// Most popular in Bangladesh
const whatsappNumber = '8801712345678'; // Your actual number
const facebookPageId = 'medcorebd'; // Your actual page

// Pre-filled message in Bengali (optional)
const message = encodeURIComponent('হ্যালো, আমার মেডিকেল ইকুইপমেন্ট সম্পর্কে সাহায্য দরকার।');
```

## 📊 Analytics (Optional)

Track which channel users prefer:

```javascript
const handleOpenWhatsApp = () => {
  // Track with Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'contact_channel_selected', {
      channel: 'whatsapp'
    });
  }
  
  const message = encodeURIComponent('Hello, I need help with medical equipment.');
  window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  setShowContactOptions(false);
};
```

## 🚀 Go Live Checklist

Before deploying to production:

- [ ] Real WhatsApp number configured (not example)
- [ ] Real Facebook page ID configured (not example)
- [ ] Tested WhatsApp link on mobile
- [ ] Tested Messenger link on mobile
- [ ] Tested all buttons on desktop
- [ ] Pre-filled message is professional
- [ ] Message is in appropriate language
- [ ] Team is ready to respond on all channels
- [ ] Response time expectations are set

## 📞 Contact Information Template

Keep this handy for quick reference:

```javascript
// MedCore BD Contact Information
const contacts = {
  whatsapp: '8801800000000',        // Replace with actual
  facebook: 'medcorebd',            // Replace with actual
  telegram: 'medcorebd',            // Optional
  phone: '+880 1800-000000',        // For display
  email: 'info@medcorebd.com',      // For display
};
```

## 🎉 You're All Set!

Your multi-channel contact widget is ready to help customers reach you on their preferred platform!

**Next Steps:**
1. Update the contact details above
2. Test all buttons
3. Deploy to production
4. Monitor which channels are most popular
5. Ensure team responds promptly on all channels

---

**Need Help?** Check `MULTI-CHANNEL-CONTACT-WIDGET.md` for detailed documentation.
