# Multi-Channel Contact Widget

## 🎯 Overview

Enhanced the LiveChat widget to include **3 contact channels** with functional buttons:
1. **LiveChat** - In-app chat widget
2. **Facebook Messenger** - Opens Facebook Messenger
3. **WhatsApp** - Opens WhatsApp chat

## ✨ Features

### Contact Options Modal

When users click the green chat button, they see:

```
┌──────────────────────────────────────┐
│ Hi there! 👋                      ✕  │
│ Let us know if we can help you       │
│ with anything at all.                │
├──────────────────────────────────────┤
│                                      │
│ ┌──────────────────────────────┐   │
│ │ 💬  LiveChat                 │   │ ← Opens in-app chat
│ └──────────────────────────────┘   │
│                                      │
│ ┌──────────────────────────────┐   │
│ │ 📱  Messenger                │   │ ← Opens Facebook Messenger
│ └──────────────────────────────┘   │
│                                      │
│ ┌──────────────────────────────┐   │
│ │ 📞  WhatsApp                 │   │ ← Opens WhatsApp
│ └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

### Button Actions

#### 1. LiveChat Button (Green)
- **Action:** Opens in-app chat window
- **Color:** Green gradient (#10B981 → #059669)
- **Icon:** Chat bubble
- **Features:**
  - Bengali greeting
  - Real-time messaging
  - Message history
  - Simulated bot responses

#### 2. Messenger Button (Blue)
- **Action:** Opens Facebook Messenger in new tab
- **URL:** `https://m.me/{facebookPageId}`
- **Color:** Facebook blue (#0084FF)
- **Icon:** Facebook Messenger logo
- **Requires:** Facebook page username configured

#### 3. WhatsApp Button (Green)
- **Action:** Opens WhatsApp chat in new tab
- **URL:** `https://wa.me/{whatsappNumber}?text={message}`
- **Color:** WhatsApp green (#25D366)
- **Icon:** WhatsApp logo
- **Pre-filled message:** "Hello, I need help with medical equipment."

## 🔧 Configuration

### Update Contact Details

Edit `src/components/ui/LiveChatWidget.jsx`:

```javascript
// Line 24-25
const whatsappNumber = '8801800000000'; // Replace with actual number
const facebookPageId = 'medcorebd'; // Replace with actual Facebook page
```

### WhatsApp Number Format
- **Format:** Country code + number (no + or spaces)
- **Example:** `8801800000000` for Bangladesh
- **Bangladesh code:** 880
- **Full format:** 880 + 10-digit mobile number

### Facebook Page ID
- **Format:** Facebook page username (not full URL)
- **Example:** `medcorebd` (from facebook.com/medcorebd)
- **How to find:** Go to your Facebook page → About → Username

## 🎨 Design Changes

### Color Scheme Update

**Before:** Orange gradient (#FF6B35 → #FF8C42)
**After:** Green gradient (#10B981 → #059669)

**Reason:** Green is more universally associated with:
- ✅ Chat/messaging (WhatsApp, WeChat)
- ✅ Help/support
- ✅ Availability/online status
- ✅ Healthcare (medical cross)

### Button Sizes
- **Main chat button:** 64x64px (larger for better visibility)
- **Contact option buttons:** Full width with 48px height
- **Icons:** 20-22px for good visibility

### Visual Hierarchy
1. **LiveChat** - Primary (green gradient, most prominent)
2. **Messenger** - Secondary (white with blue icon)
3. **WhatsApp** - Secondary (white with green icon)

## 📱 User Flow

### Flow 1: LiveChat
```
User clicks green chat button
    ↓
Contact options modal opens
    ↓
User clicks "LiveChat" button
    ↓
In-app chat window opens
    ↓
User sees Bengali greeting
    ↓
User types and sends message
    ↓
Bot responds in Bengali
```

### Flow 2: Facebook Messenger
```
User clicks green chat button
    ↓
Contact options modal opens
    ↓
User clicks "Messenger" button
    ↓
New tab opens with Facebook Messenger
    ↓
User continues conversation on Facebook
```

### Flow 3: WhatsApp
```
User clicks green chat button
    ↓
Contact options modal opens
    ↓
User clicks "WhatsApp" button
    ↓
New tab opens with WhatsApp Web/App
    ↓
Pre-filled message: "Hello, I need help with medical equipment."
    ↓
User can edit and send message
```

## 🔄 State Management

### States Used
```javascript
const [isOpen, setIsOpen] = useState(false);              // LiveChat window
const [showContactOptions, setShowContactOptions] = useState(false); // Options modal
const [message, setMessage] = useState('');               // Chat input
const [messages, setMessages] = useState([...]);          // Chat history
```

### State Transitions
- **Initial:** All closed
- **Click main button:** `showContactOptions = true`
- **Click LiveChat:** `showContactOptions = false`, `isOpen = true`
- **Click Messenger/WhatsApp:** `showContactOptions = false`, opens external link
- **Click close:** All states reset to false

## 🌐 External Links

### WhatsApp Link Format
```
https://wa.me/{number}?text={encodedMessage}
```

**Example:**
```javascript
const message = encodeURIComponent('Hello, I need help with medical equipment.');
window.open(`https://wa.me/8801800000000?text=${message}`, '_blank');
```

### Facebook Messenger Link Format
```
https://m.me/{pageUsername}
```

**Example:**
```javascript
window.open('https://m.me/medcorebd', '_blank');
```

## ✅ Features Checklist

- [x] Multi-channel contact options
- [x] Functional LiveChat button
- [x] Functional Messenger button (opens Facebook)
- [x] Functional WhatsApp button (opens WhatsApp)
- [x] Pre-filled WhatsApp message
- [x] Smooth animations (scale-in effect)
- [x] Mobile responsive
- [x] Backdrop overlay on mobile
- [x] Body scroll lock when open
- [x] Close button on modal
- [x] Hover effects on all buttons
- [x] Proper z-index stacking
- [x] Accessibility labels

## 🎯 Benefits

### For Users
1. **Choice:** Pick their preferred communication channel
2. **Convenience:** Use familiar apps (WhatsApp, Messenger)
3. **Flexibility:** Switch between channels easily
4. **Speed:** Quick access to support

### For Business
1. **Reach:** Meet customers on their preferred platform
2. **Engagement:** Higher response rates with multiple channels
3. **Efficiency:** Distribute support load across channels
4. **Data:** Track which channels are most popular

## 📊 Expected Usage

Based on Bangladesh market:
- **WhatsApp:** 60-70% (most popular in Bangladesh)
- **Facebook Messenger:** 20-30% (second most popular)
- **LiveChat:** 10-20% (for quick questions)

## 🔧 Customization Options

### Change Button Order
Edit the order in the JSX:
```jsx
{/* Put WhatsApp first if it's most popular */}
<button onClick={handleOpenWhatsApp}>WhatsApp</button>
<button onClick={handleOpenMessenger}>Messenger</button>
<button onClick={handleOpenLiveChat}>LiveChat</button>
```

### Add More Channels
Add Telegram, Viber, or other channels:
```jsx
const handleOpenTelegram = () => {
  window.open('https://t.me/medcorebd', '_blank');
  setShowContactOptions(false);
};

<button onClick={handleOpenTelegram}>
  <FaTelegram size={20} />
  <span>Telegram</span>
</button>
```

### Change Pre-filled Messages
Customize WhatsApp message:
```javascript
// For product inquiries
const message = encodeURIComponent('I want to inquire about a product.');

// For B2B customers
const message = encodeURIComponent('I am interested in B2B partnership.');

// For support
const message = encodeURIComponent('I need technical support.');
```

## 🐛 Troubleshooting

### WhatsApp not opening?
1. Check number format (no + or spaces)
2. Verify country code is correct (880 for Bangladesh)
3. Test URL manually: `https://wa.me/8801800000000`

### Messenger not opening?
1. Verify Facebook page username
2. Check page is published (not draft)
3. Test URL manually: `https://m.me/medcorebd`

### Modal not closing?
1. Check backdrop click handler
2. Verify close button onClick
3. Check state management logic

## 📱 Mobile Behavior

### iOS
- WhatsApp opens in WhatsApp app (if installed)
- Messenger opens in Messenger app (if installed)
- Falls back to web version if app not installed

### Android
- Same behavior as iOS
- Android intent system handles app selection
- User can choose default app

### Desktop
- WhatsApp opens WhatsApp Web
- Messenger opens Messenger Web
- Both require login if not already logged in

## 🔐 Privacy & Security

### Data Handling
- ✅ No user data stored
- ✅ No tracking of external conversations
- ✅ Links open in new tab (secure)
- ✅ No third-party scripts loaded

### User Consent
- Users explicitly click to open external apps
- Pre-filled messages are visible before sending
- Users can edit messages before sending

## 📚 Related Files

- `src/components/ui/LiveChatWidget.jsx` - Main component
- `FLOATING-WIDGETS-IMPLEMENTATION.md` - Original implementation
- `BRANDING-UPDATE.md` - MedCore BD branding

## 🚀 Testing

### Test Checklist
- [ ] Click main chat button - options modal opens
- [ ] Click LiveChat - in-app chat opens
- [ ] Click Messenger - Facebook Messenger opens in new tab
- [ ] Click WhatsApp - WhatsApp opens with pre-filled message
- [ ] Click close button - modal closes
- [ ] Click backdrop (mobile) - modal closes
- [ ] Test on mobile - all buttons work
- [ ] Test on desktop - all buttons work
- [ ] Verify WhatsApp number is correct
- [ ] Verify Facebook page ID is correct

### Manual Testing
```bash
cd "c:\Projects\Health Care\health-care"
npm run dev
```

Then:
1. Open `http://localhost:3000`
2. Click green chat button (bottom-right)
3. Verify "Hi there! 👋" modal appears
4. Click each button and verify:
   - LiveChat opens in-app chat
   - Messenger opens Facebook (new tab)
   - WhatsApp opens WhatsApp (new tab)

## 🎉 Summary

**Before:** Single chat button → Opens in-app chat only

**After:** Multi-channel button → Choose from:
- ✅ LiveChat (in-app)
- ✅ Facebook Messenger (external)
- ✅ WhatsApp (external)

**Result:** Users can contact you on their preferred platform, increasing engagement and response rates!

---

**Status:** ✅ Implemented
**Date:** May 26, 2026
**Version:** 2.0.0
