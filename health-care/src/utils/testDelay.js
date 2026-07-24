/**
 * Test Delay Utility
 * 
 * Adds an artificial delay in DEVELOPMENT mode only to make loading states visible.
 * This helps verify that loading components are working correctly.
 * 
 * In production, this returns immediately with no delay.
 * 
 * @param {number} ms - Milliseconds to delay (default: 1500ms)
 * @returns {Promise<void>}
 * 
 * @example
 * import { testDelay } from '@/utils/testDelay';
 * 
 * const fetchData = async () => {
 *   setLoading(true);
 *   await testDelay(); // Only delays in development
 *   const data = await fetch('/api/data');
 *   setLoading(false);
 * };
 */
export const testDelay = (ms = 1500) => {
  if (process.env.NODE_ENV === 'development') {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  return Promise.resolve();
};

/**
 * Enable/disable test delays globally
 * Set to false to disable all test delays
 */
export const TEST_DELAYS_ENABLED = true;

/**
 * Conditional test delay - only runs if TEST_DELAYS_ENABLED is true
 */
export const conditionalDelay = (ms = 1500) => {
  if (TEST_DELAYS_ENABLED) {
    return testDelay(ms);
  }
  return Promise.resolve();
};
