/**
 * Test Delay Utility
 * 
 * Adds an artificial delay to make loading states visible.
 * This helps verify that loading components are working correctly.
 * 
 * Control via NEXT_PUBLIC_ENABLE_TEST_DELAYS environment variable or TEST_DELAYS_ENABLED flag.
 * 
 * @param {number} ms - Milliseconds to delay (default: 1500ms)
 * @returns {Promise<void>}
 * 
 * @example
 * import { testDelay } from '@/utils/testDelay';
 * 
 * const fetchData = async () => {
 *   setLoading(true);
 *   await testDelay(); // Delays if enabled
 *   const data = await fetch('/api/data');
 *   setLoading(false);
 * };
 */

/**
 * Enable/disable test delays globally
 * Set to false to disable all test delays
 * Can also be controlled via NEXT_PUBLIC_ENABLE_TEST_DELAYS=true in .env
 */
export const TEST_DELAYS_ENABLED = true;

export const testDelay = (ms = 1500) => {
  // Check environment variable first, then flag
  const envEnabled = process.env.NEXT_PUBLIC_ENABLE_TEST_DELAYS === 'true';
  const isEnabled = envEnabled || (TEST_DELAYS_ENABLED && process.env.NODE_ENV === 'development');
  
  if (isEnabled) {
    console.log(`[testDelay] Delaying ${ms}ms to show loading state`);
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  return Promise.resolve();
};

/**
 * Conditional test delay - only runs if TEST_DELAYS_ENABLED is true
 */
export const conditionalDelay = (ms = 1500) => {
  if (TEST_DELAYS_ENABLED) {
    return testDelay(ms);
  }
  return Promise.resolve();
};
