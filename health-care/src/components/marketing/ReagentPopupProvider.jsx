// health-care/src/components/marketing/ReagentPopupProvider.jsx
'use client';

import { usePathname } from 'next/navigation';
import ReagentDiscountPopup from './ReagentDiscountPopup';

/**
 * ReagentPopupProvider — Global provider for the reagent discount popup
 *
 * This component monitors route changes and conditionally renders the
 * ReagentDiscountPopup when the user navigates to reagent-related pages.
 *
 * The popup itself handles:
 * - Session-based display logic (once per session)
 * - Route detection
 * - Analytics tracking
 * - Accessibility features
 *
 * Mounted in the root layout to work across all pages.
 */
export default function ReagentPopupProvider() {
  const pathname = usePathname();

  // Skip rendering on admin, checkout, and other excluded pages
  const skipPrefixes = [
    '/admin',
    '/checkout',
    '/cart',
    '/login',
    '/register',
    '/account',
    '/b2b',
    '/track',
    '/orders',
  ];

  const shouldSkip = skipPrefixes.some(
    (prefix) => pathname === prefix || pathname?.startsWith(prefix + '/')
  );

  if (shouldSkip) return null;

  // The ReagentDiscountPopup component handles its own visibility logic
  // based on the current pathname and session storage
  return <ReagentDiscountPopup />;
}
