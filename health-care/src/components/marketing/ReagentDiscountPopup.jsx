// health-care/src/components/marketing/ReagentDiscountPopup.jsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { FaTimes, FaWhatsapp, FaFlask, FaStar } from 'react-icons/fa';
import { CONTACT } from '@/constants/api';
import GA4Tracker from '@/services/GA4Tracker';
import MetaPixelTracker from '@/services/MetaPixelTracker';
import { trackMarketingEvent } from '@/utils/marketingBeacon';

/**
 * ReagentDiscountPopup — promotional discount popup for Laboratory Reagents
 *
 * Triggers on:
 * - /reagent-store page
 * - /products/category/laboratory-reagents page
 * - Any individual product under Laboratory Reagents category
 *
 * Behavior:
 * - Shows once per browser session (sessionStorage)
 * - Displays 8% - 20% special discount offer
 * - WhatsApp CTA for discount discussion
 * - Hybrid design: brand colors + vibrant promo style
 */

const SESSION_KEY = 'mediport_reagent_popup_shown';

/**
 * Check if the current path should trigger the reagent popup
 */
function shouldShowOnPath(pathname, productCategory = null) {
  if (!pathname) return false;

  // Reagent Store page
  if (pathname === '/reagent-store') return true;

  // Laboratory Reagents category listing
  if (pathname === '/products/category/laboratory-reagents') return true;

  // Individual product page under Laboratory Reagents
  // We'll pass the product category from the page component if available
  if (pathname.startsWith('/products/') && productCategory === 'Laboratory Reagents') {
    return true;
  }

  return false;
}

export default function ReagentDiscountPopup({ productCategory = null }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const closeBtnRef = useRef(null);
  const shownRef = useRef(false);

  const show = useCallback(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    setVisible(true);

    // Analytics tracking
    GA4Tracker.trackEvent('reagent_discount_popup_shown', {
      page_path: pathname,
      campaign: 'reagent_promo_2026',
    });
    MetaPixelTracker.trackCustomEvent('ReagentDiscountPopupShown', {
      content_category: 'Laboratory Reagents',
    });
    trackMarketingEvent('reagent_discount_popup_shown', { pathname });

    // Move focus to close button for accessibility
    requestAnimationFrame(() => closeBtnRef.current?.focus());
  }, [pathname]);

  const close = useCallback(() => {
    setVisible(false);
    GA4Tracker.trackEvent('reagent_discount_popup_closed', {
      page_path: pathname,
    });
  }, [pathname]);

  const handleWhatsAppClick = useCallback(() => {
    GA4Tracker.trackEvent('reagent_discount_whatsapp_click', {
      page_path: pathname,
      campaign: 'reagent_promo_2026',
    });
    MetaPixelTracker.trackCustomEvent('ReagentDiscountWhatsAppClick', {
      content_category: 'Laboratory Reagents',
    });
    trackMarketingEvent('reagent_discount_whatsapp_click', { pathname });

    // Close popup after click
    setTimeout(close, 300);
  }, [pathname, close]);

  const handleShopNow = useCallback(() => {
    GA4Tracker.trackEvent('reagent_discount_shop_click', {
      page_path: pathname,
      campaign: 'reagent_promo_2026',
    });
    close();
  }, [pathname, close]);

  // Trigger logic — once per session, only on reagent-related pages
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already shown in this session
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      // sessionStorage unavailable — still allow the popup
    }

    // Function to check and show popup
    const checkAndShow = () => {
      // Extract product category from the page (set by ProductDetailPage)
      let detectedCategory = productCategory;
      if (!detectedCategory && pathname?.startsWith('/products/')) {
        // Try to get category from data attribute on main container
        const mainElement = document.querySelector('[data-product-category]');
        if (mainElement) {
          detectedCategory = mainElement.getAttribute('data-product-category');
          // Debug log (remove in production if needed)
          if (process.env.NODE_ENV === 'development') {
            console.log('[ReagentPopup] Category detected from DOM:', detectedCategory);
          }
        } else if (process.env.NODE_ENV === 'development') {
          console.log('[ReagentPopup] No category element found yet, will retry...');
        }
      }

      // Check if current path should trigger popup
      const shouldShow = shouldShowOnPath(pathname, detectedCategory);
      
      // Debug log
      if (process.env.NODE_ENV === 'development') {
        console.log('[ReagentPopup] Check:', {
          pathname,
          detectedCategory,
          shouldShow,
          sessionFlag: sessionStorage.getItem(SESSION_KEY),
        });
      }
      
      if (!shouldShow) return false;

      // Show popup after a short delay (better UX than immediate)
      const timer = setTimeout(() => {
        show();
        // Mark as shown in this session
        try {
          sessionStorage.setItem(SESSION_KEY, '1');
        } catch {
          // noop
        }
      }, 1500); // 1.5 second delay

      return timer;
    };

    // Initial check
    const timer = checkAndShow();
    
    // If on product page and category not detected yet, retry after DOM settles
    if (!timer && pathname?.startsWith('/products/') && !pathname.includes('/category/')) {
      const retryTimer = setTimeout(() => {
        checkAndShow();
      }, 500); // Retry after 500ms to allow ProductDetailPage to set data attribute
      return () => clearTimeout(retryTimer);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [pathname, productCategory, show]);

  // Escape key to close
  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, close]);

  if (!visible) return null;

  const waMessage = encodeURIComponent(
    `Hi MediportBD! I'm interested in the special 8%-20% discount on Laboratory Reagents. Can you provide more details about the offer?`
  );
  const waLink = `https://wa.me/${CONTACT.whatsapp}?text=${waMessage}`;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
      style={{
        zIndex: 1200,
        background: 'rgba(11, 37, 69, 0.75)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Special discount on laboratory reagents"
    >
      <div
        className="relative w-full my-auto bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeSlideUp"
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeBtnRef}
          onClick={close}
          aria-label="Close discount offer"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 shadow-md text-gray-700 hover:text-gray-900 flex items-center justify-center transition-all hover:scale-110"
        >
          <FaTimes size={16} />
        </button>

        {/* Decorative header background */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />

        {/* Content */}
        <div className="relative px-5 py-6 sm:px-6 sm:py-7">
          {/* Icon badge */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-brand-navy)] to-blue-900 flex items-center justify-center shadow-lg">
                <FaFlask size={30} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                <FaStar size={11} className="text-white" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-4">
            <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold uppercase tracking-wider mb-2 shadow-sm">
              🎉 Exclusive Offer
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-brand-navy)] mb-1.5 leading-tight">
              Special Discount on
              <br />
              <span className="font-bold text-orange-600">
                Laboratory Reagents
              </span>
            </h2>
            <p className="text-base sm:text-lg font-bold text-gray-900">
              Get <span className="text-2xl font-black text-orange-600">8% - 20%</span> <span className="text-gray-900">OFF</span>
            </p>
          </div>

          {/* Benefits grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {[
              { icon: '✓', text: 'HbA1c Kits' },
              { icon: '✓', text: 'CBC Reagents' },
              { icon: '✓', text: 'Biochemistry' },
              { icon: '✓', text: 'Immunology' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-[var(--color-brand-teal)] to-[var(--color-brand-teal-hover)] text-white flex items-center justify-center text-xs font-bold">
                  {item.icon}
                </span>
                <span className="text-xs font-semibold text-gray-800">{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2.5">
            {/* WhatsApp CTA - Primary */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--color-status-success)] to-green-700 hover:from-green-700 hover:to-[var(--color-status-success)] text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <FaWhatsapp size={20} />
              <span>Discuss Discount on WhatsApp</span>
            </a>

            {/* Shop Now - Secondary */}
            <button
              onClick={handleShopNow}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white hover:bg-gray-50 text-[var(--color-brand-navy)] font-semibold text-sm border-2 border-[var(--color-brand-navy)]/30 hover:border-[var(--color-brand-navy)]/50 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Continue Browsing</span>
              <span className="text-lg">→</span>
            </button>
          </div>

          {/* Fine print */}
          <p className="text-center text-xs text-gray-700 font-medium mt-3">
            Valid on all laboratory reagent products. Discount varies by product and quantity.
          </p>
        </div>
      </div>
    </div>
  );
}

// Export the shouldShowOnPath function for use in other components if needed
export { shouldShowOnPath };
