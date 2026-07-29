/**
 * Accessibility Fixes for Third-Party Widgets
 * 
 * This script fixes ARIA violations in third-party widgets (like Google Sign-In)
 * that we don't control but need to use.
 * 
 * Known Issues Fixed:
 * 1. Google Account Chooser - Uses aria-hidden="true" on parent but has focusable descendants
 */

/**
 * Fix Google Account Chooser aria-hidden violation
 * 
 * Google's account chooser widget violates ARIA spec by having aria-hidden="true"
 * on a parent element while containing focusable descendants.
 * 
 * This function finds those elements and either:
 * - Removes aria-hidden from the parent, OR
 * - Makes all focusable descendants non-focusable (tabindex="-1")
 */
function fixGoogleAccountChooser() {
  try {
    // Find all elements with aria-hidden="true"
    const hiddenElements = document.querySelectorAll('[aria-hidden="true"]');
    
    hiddenElements.forEach((el) => {
      // Find focusable elements within aria-hidden parents
      const focusableElements = el.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        // Check if this is a Google widget (contains specific classes or attributes)
        const isGoogleWidget = 
          el.classList.contains('wuMMb') || 
          el.hasAttribute('jscontroller') ||
          el.hasAttribute('jsaction') ||
          el.querySelector('[jscontroller], [jsaction]');
        
        if (isGoogleWidget) {
          // Option 1: Make all focusable descendants non-focusable
          focusableElements.forEach((focusable) => {
            focusable.setAttribute('tabindex', '-1');
            focusable.setAttribute('aria-hidden', 'true');
          });
          
          // Add inert if supported (prevents all interactions)
          if ('inert' in el) {
            el.inert = true;
          }
          
          if (process.env.NODE_ENV === 'development') console.info('[A11Y] Fixed Google widget aria-hidden violation');
        }
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.warn('[A11Y] Error fixing Google account chooser:', error);
  }
}

/**
 * Fix all third-party accessibility violations
 */
export function fixThirdPartyA11yIssues() {
  // Run immediately
  fixGoogleAccountChooser();
  
  // Run again after DOM changes (Google widgets load async)
  const observer = new MutationObserver(() => {
    fixGoogleAccountChooser();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  // Cleanup after 10 seconds (Google widgets should be loaded by then)
  setTimeout(() => {
    observer.disconnect();
  }, 10000);
}

/**
 * Initialize accessibility fixes on page load
 */
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixThirdPartyA11yIssues);
  } else {
    // DOM already loaded
    fixThirdPartyA11yIssues();
  }
}
