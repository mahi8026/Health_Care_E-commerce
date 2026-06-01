# Widget Positioning Guide

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│                         HEADER                               │
│  [Logo] [Products ▼] [Reagent] [Track]  [🔍] [❤] [🛒] [👤] │
└─────────────────────────────────────────────────────────────┘
                                                    ┌──────────┐
                                                    │ 🛒 Cart  │ ← Floating Cart Button
                                                    │ 3 items  │   (Top-right, z-40)
                                                    │ ৳12,500  │
                                                    └──────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                     PAGE CONTENT                              │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                                                    ┌─────┐
                                                    │  ↑  │ ← Scroll to Top
                                                    └─────┘   (Bottom-right, z-30)
                                                              (Appears after 300px scroll)
                                                    
                                                    ┌─────┐
                                                    │ 💬  │ ← Live Chat Widget
                                                    │ ●   │   (Bottom-right, z-40)
                                                    └─────┘   (Green pulse = online)

┌─────────────────────────────────────────────────────────────┐
│                         FOOTER                               │
└─────────────────────────────────────────────────────────────┘
```

## Cart Sidebar (When Open)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  [Backdrop Overlay - 50% black with blur]                    │
│                                                               │
│                                                               │
│                                    ┌──────────────────────┐  │
│                                    │ 🛒 Shopping Cart  ✕  │  │
│                                    ├──────────────────────┤  │
│                                    │ Add ৳4,000 more to   │  │
│                                    │ unlock free delivery │  │
│                                    │ [████████░░░░] 80%   │  │
│                                    ├──────────────────────┤  │
│                                    │                      │  │
│                                    │ [📦] Product 1       │  │
│                                    │      ৳5,000          │  │
│                                    │      [- 2 +] [✕]     │  │
│                                    │                      │  │
│                                    │ [📦] Product 2       │  │
│                                    │      ৳7,500          │  │
│                                    │      [- 1 +] [✕]     │  │
│                                    │                      │  │
│                                    ├──────────────────────┤  │
│                                    │ Subtotal (3 items)   │  │
│                                    │           ৳12,500    │  │
│                                    │                      │  │
│                                    │ [Proceed to Checkout]│  │
│                                    │ [View Full Cart]     │  │
│                                    └──────────────────────┘  │
│                                    ← 400px max width         │
└─────────────────────────────────────────────────────────────┘
```

## Live Chat Widget (When Open)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                                                               │
│                                                               │
│                                                               │
│                                    ┌──────────────────────┐  │
│                                    │ 💬 মেসেজ করুন    ✕  │  │
│                                    │ ● Typically replies  │  │
│                                    │   in 5 minutes       │  │
│                                    ├──────────────────────┤  │
│                                    │                      │  │
│                                    │ [Bot] আসসালামু      │  │
│                                    │ আলাইকুম, স্বাগতম!  │  │
│                                    │ 2:30 PM              │  │
│                                    │                      │  │
│                                    │         [User] Hello │  │
│                                    │         2:31 PM      │  │
│                                    │                      │  │
│                                    ├──────────────────────┤  │
│                                    │ [Type message...] 📤 │  │
│                                    │ Powered by REVE Chat │  │
│                                    └──────────────────────┘  │
│                                    ← 380px width             │
│                                    ← 500px height            │
└─────────────────────────────────────────────────────────────┘
```

## Z-Index Hierarchy

```
z-[1001]: Cart Sidebar, Chat Window (modals - highest)
z-[1000]: Backdrop Overlays
z-[950]:  Floating Cart Button, Chat Button (above header)
z-[940]:  Scroll to Top Button (above header)
z-[900]:  Header (--z-header from globals.css)
z-[700]:  Dropdowns, Tooltips (--z-dropdown)
z-[500]:  Bottom Navigation (--z-bottom-nav)
z-[0]:    Page Content
```

## Responsive Breakpoints

### Desktop (≥768px)
```
┌─────────────────────────────────────────────────────────────┐
│ Header                                          [Cart Button]│
│                                                               │
│                     Content                                   │
│                                                               │
│                                                    [Scroll ↑] │
│                                                    [Chat 💬]  │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────────────┐
│ Header        [Cart Btn] │
│                          │
│                          │
│       Content            │
│                          │
│                          │
│                          │
│               [Scroll ↑] │
│               [Chat 💬]  │
└──────────────────────────┘
```

## Positioning CSS

```css
/* Floating Cart Button */
.floating-cart {
  position: fixed;
  top: 120px;       /* Below header + buffer */
  right: 24px;
  z-index: 950;     /* Above header (900) */
}

/* Cart Sidebar */
.cart-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 100%;
  max-width: 400px;
  z-index: 1001;    /* Above backdrop */
}

/* Cart Sidebar Backdrop */
.cart-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;    /* Above all content */
}

/* Live Chat Button */
.chat-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 950;     /* Above header */
}

/* Chat Window */
.chat-window {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 90vw;
  max-width: 380px;
  height: 500px;
  z-index: 1001;    /* Above backdrop */
}

/* Scroll to Top */
.scroll-top {
  position: fixed;
  bottom: 96px;     /* Above chat button */
  right: 24px;
  z-index: 940;     /* Above header, below other widgets */
}
```

## Interaction Flow

### Cart Flow
```
User clicks product "Add to Cart"
    ↓
Floating Cart Button updates (bounce animation)
    ↓
User clicks Floating Cart Button
    ↓
Cart Sidebar slides in from right
    ↓
User reviews items, adjusts quantity
    ↓
User clicks "Proceed to Checkout" OR "View Full Cart"
    ↓
Sidebar closes, navigates to checkout/cart page
```

### Chat Flow
```
User clicks Chat Button (💬)
    ↓
Chat Window opens with greeting
    ↓
User types message and clicks send
    ↓
Message appears in chat history
    ↓
Bot responds after 1 second delay
    ↓
User can continue conversation or close
```

### Scroll Flow
```
User scrolls down page > 300px
    ↓
Scroll to Top button fades in
    ↓
User clicks button
    ↓
Page smoothly scrolls to top
    ↓
Button fades out when at top
```

## Color Coding

```
🟠 Orange (#FF6B35 - #FF8C42)
   - Floating Cart Button
   - Chat Button
   - Scroll to Top Button
   - Primary CTAs

🟢 Green (#0E8A6E)
   - Free delivery progress
   - Success states
   - Online indicator

⚫ Dark (#0B2545)
   - Text
   - Secondary buttons

⚪ White (#FFFFFF)
   - Backgrounds
   - Sidebar panels

🔴 Red (#E24B4A)
   - Remove actions
   - Error states
```

## Animation Timing

```
Sidebar slide:     300ms ease-in-out
Button hover:      200ms ease
Bounce animation:  500ms ease
Fade in/out:       300ms ease
Scroll smooth:     Smooth (browser default)
```

## Touch Targets (Mobile)

All interactive elements meet 44x44px minimum:
- ✅ Cart quantity buttons: 44x44px
- ✅ Remove buttons: 44x44px tap area
- ✅ Chat send button: 44x44px
- ✅ Close buttons: 44x44px
- ✅ Floating buttons: 56x56px

## Accessibility Landmarks

```html
<!-- Cart Sidebar -->
<div role="dialog" aria-modal="true" aria-labelledby="cart-sidebar-title">
  <h2 id="cart-sidebar-title">Shopping Cart</h2>
  ...
</div>

<!-- Chat Window -->
<div role="dialog" aria-modal="true" aria-labelledby="chat-title">
  <h3 id="chat-title">মেসেজ করুন</h3>
  ...
</div>

<!-- Buttons -->
<button aria-label="Shopping cart with 3 items">...</button>
<button aria-label="Open live chat">...</button>
<button aria-label="Scroll to top">...</button>
```

---

**Quick Reference:**
- Floating Cart: Top-right, always visible when cart has items
- Cart Sidebar: Slides from right, 400px max width
- Chat Widget: Bottom-right, 380x500px window
- Scroll Button: Bottom-right, appears after 300px scroll
- All widgets: Orange gradient theme, smooth animations
