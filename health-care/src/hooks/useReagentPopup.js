// health-care/src/hooks/useReagentPopup.js
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Custom hook to manage reagent popup visibility based on current route
 *
 * This hook detects when the user is on:
 * 1. Reagent Store page (/reagent-store)
 * 2. Laboratory Reagents category page (/products/category/laboratory-reagents)
 * 3. Individual Laboratory Reagent product pages
 *
 * For product pages, it attempts to extract category information from the
 * page's data attributes or meta tags (set by the product detail page).
 *
 * Returns: { shouldShow: boolean, productCategory: string|null }
 */
export function useReagentPopup() {
  const pathname = usePathname();
  const [productCategory, setProductCategory] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // For product detail pages, try to extract category from meta tags
    // The ProductDetailPage can set this via a data attribute or meta tag
    if (pathname?.startsWith('/products/') && !pathname.includes('/category/')) {
      // Delay to avoid setState in effect body
      const timer = setTimeout(() => {
        // Check for data attribute on body or a specific element
        const categoryMeta = document.querySelector('meta[name="product:category"]');
        if (categoryMeta) {
          const category = categoryMeta.getAttribute('content');
          setProductCategory(category);
          return;
        }
        
        // Fallback: check for a data attribute on the main element
        const mainElement = document.querySelector('main[data-product-category]');
        if (mainElement) {
          setProductCategory(mainElement.getAttribute('data-product-category'));
        }
      }, 0);
      
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setProductCategory(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Determine if popup should show based on pathname
  const shouldShow =
    pathname === '/reagent-store' ||
    pathname === '/products/category/laboratory-reagents' ||
    (pathname?.startsWith('/products/') && productCategory === 'Laboratory Reagents');

  return {
    shouldShow,
    productCategory,
  };
}
