# Z-Index Fix for Floating Widgets

## Problem

The floating cart button and other widgets were getting hidden behind:
- Hero banner images
- Page content
- Other elements with higher z-index

**Root Cause:** Widgets were using low z-index values (z-40, z-50) while the header uses z-index: 900.

## Solution

Updated all widget z-index values to be above the header and page content:

### New Z-Index Hierarchy

```
z-[1001]: Cart Sidebar, Chat Window (highest - modals)
z-[1000]: Backdrop overlays
z-[950]:  Floating Cart Button, Chat Button (above header)
z-[940]:  Scroll to Top Button (above header)
z-[900]:  Header (--z-header from globals.css)
z-[700]:  Dropdowns (--z-dropdown)
z-[500]:  Bottom Navigation
z-[0]:    Page Content
```

### Changes Made

#### 1. FloatingCartButton.jsx
```jsx
// Before
className="fixed top-20 right-4 md:right-6 z-40"

// After
className="fixed top-[120px] right-4 md:right-6 z-[950]"
```

**Changes:**
- `top-20` (80px) → `top-[120px]` - Moved down to clear header completely
- `z-40` → `z-[950]` - Above header (z-900)

#### 2. CartSidebar.jsx
```jsx
// Before
Backdrop: z-50
Sidebar: z-50

// After
Backdrop: z-[1000]
Sidebar: z-[1001]
```

**Changes:**
- Backdrop: `z-50` → `z-[1000]` - Above all page content
- Sidebar: `z-50` → `z-[1001]` - Above backdrop

#### 3. LiveChatWidget.jsx
```jsx
// Before
Chat Button: z-40
Chat Window: z-50
Backdrop: z-40

// After
Chat Button: z-[950]
Chat Window: z-[1001]
Backdrop: z-[1000]
```

**Changes:**
- Chat Button: `z-40` → `z-[950]` - Above header
- Chat Window: `z-50` → `z-[1001]` - Above backdrop
- Backdrop: `z-40` → `z-[1000]` - Above page content

#### 4. ScrollToTop.jsx
```jsx
// Before
className="fixed bottom-24 right-6 z-30"

// After
className="fixed bottom-24 right-6 z-[940]"
```

**Changes:**
- `z-30` → `z-[940]` - Above header but below other widgets

## Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    HEADER (z-900)                            │
└─────────────────────────────────────────────────────────────┘
                                                    ┌──────────┐
                                                    │ 🛒 Cart  │ z-[950]
                                                    │ 3 items  │ (Above header)
                                                    │ ৳12,500  │
                                                    └──────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                  HERO BANNER (z-0 to z-1)                    │
│                  [Banner image fully visible]                │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                     PAGE CONTENT (z-0)                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                                                    ┌─────┐
                                                    │  ↑  │ z-[940]
                                                    └─────┘
                                                    ┌─────┐
                                                    │ 💬  │ z-[950]
                                                    └─────┘
```

## When Cart Sidebar Opens

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  [BACKDROP OVERLAY - z-[1000]]                               │
│  (Covers everything including header)                        │
│                                                               │
│                                    ┌──────────────────────┐  │
│                                    │                      │  │
│                                    │   CART SIDEBAR       │  │
│                                    │   z-[1001]           │  │
│                                    │   (Highest layer)    │  │
│                                    │                      │  │
│                                    └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Testing Checklist

- [x] Floating cart button visible on homepage with hero banner
- [x] Floating cart button doesn't get cut off by banner images
- [x] Cart sidebar opens above all content
- [x] Chat button visible at all times
- [x] Chat window opens above all content
- [x] Scroll to top button visible when scrolling
- [x] All widgets stack correctly when multiple are visible
- [x] No z-index conflicts with header
- [x] No z-index conflicts with dropdowns
- [x] Mobile backdrop overlays work correctly

## Why These Specific Values?

### z-[950] for Floating Buttons
- Above header (z-900)
- Below modals (z-1000+)
- Allows header dropdowns (z-700) to appear below
- Ensures buttons are always clickable

### z-[1000] for Backdrops
- Above all page content
- Above header
- Below modal content (z-1001)
- Creates proper focus trap

### z-[1001] for Modals (Sidebar, Chat Window)
- Highest layer
- Above backdrop
- Above all other content
- Ensures modal is always on top

### z-[940] for Scroll Button
- Above header (z-900)
- Below other floating buttons (z-950)
- Prevents overlap with cart/chat buttons
- Still visible above page content

## Position Adjustment

### Floating Cart Button Top Position

**Before:** `top-20` (80px)
**After:** `top-[120px]` (120px)

**Reason:**
- Header height: ~62px (--site-header-height)
- Top bar height: ~32px (--site-topbar-height)
- Total header area: ~94px
- Added 26px buffer for safety
- Result: 120px ensures button is below header completely

**Visual:**
```
┌─────────────────────────────────┐
│  Top Bar (32px)                 │
├─────────────────────────────────┤
│  Header (62px)                  │
└─────────────────────────────────┘
  ↓ 26px buffer
  ┌──────────┐
  │ 🛒 Cart  │ ← Floating Cart (starts at 120px)
  └──────────┘
```

## Browser Compatibility

All z-index values use Tailwind's arbitrary value syntax `z-[value]`:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

## Performance Impact

**None.** Z-index is a CSS property that doesn't affect:
- Rendering performance
- JavaScript execution
- Bundle size
- Page load time

## Future Considerations

If you add more floating elements, use this hierarchy:

```
z-[1100+]: Critical alerts, system notifications
z-[1001]:  Modals, dialogs, sidebars
z-[1000]:  Modal backdrops
z-[950]:   Floating action buttons (cart, chat)
z-[940]:   Secondary floating buttons (scroll)
z-[900]:   Header/navigation
z-[700]:   Dropdowns, tooltips
z-[500]:   Bottom navigation
z-[0]:     Page content
```

## Troubleshooting

### Widget still hidden?
1. Check if parent element has `z-index` set
2. Verify parent doesn't have `overflow: hidden`
3. Check if parent has `position: relative` creating new stacking context
4. Use browser DevTools to inspect computed z-index

### Widget appears behind header?
1. Verify header z-index is still 900 (check globals.css)
2. Ensure widget z-index is 950+
3. Check if widget has `position: fixed`

### Backdrop not covering header?
1. Verify backdrop z-index is 1000+
2. Ensure backdrop has `position: fixed`
3. Check backdrop has `inset-0` (covers full viewport)

## Related Files

- `src/components/ui/FloatingCartButton.jsx`
- `src/components/ui/CartSidebar.jsx`
- `src/components/ui/LiveChatWidget.jsx`
- `src/components/ui/ScrollToTop.jsx`
- `src/app/globals.css` (z-index variables)

---

**Issue:** Floating widgets hidden behind hero banner
**Fix:** Increased z-index values to be above header (900+)
**Status:** ✅ Resolved
**Date:** May 26, 2026
