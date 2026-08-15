// health-care/src/services/__tests__/GA4Tracker.integration.test.js
/**
 * Integration tests for GA4Tracker user identification
 * These tests verify the actual implementation behavior
 */

// Mock react-ga4 before importing GA4Tracker
jest.mock('react-ga4', () => ({
  initialize: jest.fn(),
  send: jest.fn(),
  event: jest.fn(),
  set: jest.fn(),
}));

import GA4Tracker from '../GA4Tracker';
import ReactGA from 'react-ga4';

// react-ga4 is now lazy-loaded via dynamic import, so tracking calls queue
// behind the init promise. Flush the microtask/macrotask queue before
// asserting on the mocked SDK.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('GA4Tracker - User Identification Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    GA4Tracker.isInitialized = false;
    GA4Tracker._initPromise = null;
    
    // Suppress console output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  describe('Complete user authentication flow', () => {
    it('should handle complete login -> track events -> logout flow', async () => {
      // Step 1: Initialize GA4
      GA4Tracker.initialize('G-TEST123');

      // Step 2: User logs in - set user ID
      const userId = 'user_12345';
      GA4Tracker.setUserId(userId);

      // Step 3: Track some events (these should include user_id automatically)
      GA4Tracker.trackPageView('/dashboard', 'Dashboard');

      // Step 4: Track e-commerce event
      const product = {
        _id: 'prod_123',
        name: 'Test Product',
        price: 100,
        category: 'Health'
      };
      GA4Tracker.trackViewItem(product);

      // Step 5: User logs out - clear user ID
      GA4Tracker.clearUserId();

      // Step 6: Track page view after logout (should not include user_id)
      GA4Tracker.trackPageView('/home', 'Home');

      await flush();

      expect(GA4Tracker.isInitialized).toBe(true);
      expect(ReactGA.initialize).toHaveBeenCalledWith('G-TEST123', expect.any(Object));
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: userId });
      expect(ReactGA.send).toHaveBeenCalledWith(
        expect.objectContaining({
          hitType: 'pageview',
          page: '/dashboard',
          title: 'Dashboard',
        })
      );
      expect(ReactGA.event).toHaveBeenCalledWith('view_item', expect.any(Object));
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: null });

      // Verify the sequence of calls
      expect(ReactGA.set).toHaveBeenCalledTimes(2); // setUserId + clearUserId
      expect(ReactGA.send).toHaveBeenCalledTimes(2); // 2 page views
      expect(ReactGA.event).toHaveBeenCalledTimes(1); // 1 product view
    });

    it('should handle user switching accounts', async () => {
      // Initialize
      GA4Tracker.initialize('G-TEST123');

      // First user logs in
      GA4Tracker.setUserId('user_1');

      // Track some activity
      GA4Tracker.trackPageView('/products', 'Products');

      // First user logs out
      GA4Tracker.clearUserId();

      // Second user logs in (without page reload)
      GA4Tracker.setUserId('user_2');

      // Track activity for second user
      GA4Tracker.trackPageView('/dashboard', 'Dashboard');

      await flush();

      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: 'user_1' });
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: null });
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: 'user_2' });

      // Verify all calls were made correctly
      expect(ReactGA.set).toHaveBeenCalledTimes(3);
      expect(ReactGA.send).toHaveBeenCalledTimes(2);
    });

    it('should handle B2B user with credit tracking', async () => {
      // Initialize
      GA4Tracker.initialize('G-TEST123');

      // B2B user logs in
      const b2bUserId = 'b2b_user_789';
      GA4Tracker.setUserId(b2bUserId);

      // Track B2B specific events
      GA4Tracker.trackQuotationRequest({
        id: 'quote_123',
        total: 5000,
        items: [{ id: 'item1' }, { id: 'item2' }]
      });

      GA4Tracker.trackCreditUsage(1000, 4000);

      // User logs out
      GA4Tracker.clearUserId();

      await flush();

      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: b2bUserId });
      expect(ReactGA.event).toHaveBeenCalledWith('quotation_request', expect.any(Object));
      expect(ReactGA.event).toHaveBeenCalledWith('credit_usage', expect.any(Object));
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: null });
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle setting user ID before initialization gracefully', async () => {
      // Try to set user ID without initialization
      GA4Tracker.setUserId('user_123');
      
      await flush();
      
      // Should not call ReactGA.set
      expect(ReactGA.set).not.toHaveBeenCalled();
    });

    it('should handle clearing user ID before initialization gracefully', async () => {
      // Try to clear user ID without initialization
      GA4Tracker.clearUserId();
      
      await flush();
      
      // Should not call ReactGA.set
      expect(ReactGA.set).not.toHaveBeenCalled();
    });

    it('should handle multiple setUserId calls without clearing', async () => {
      GA4Tracker.initialize('G-TEST123');

      // Set user ID multiple times (e.g., user profile updates)
      GA4Tracker.setUserId('user_v1');
      GA4Tracker.setUserId('user_v2');
      GA4Tracker.setUserId('user_v3');

      await flush();

      // All calls should go through
      expect(ReactGA.set).toHaveBeenCalledTimes(3);
      expect(ReactGA.set).toHaveBeenLastCalledWith({ user_id: 'user_v3' });
    });

    it('should handle special characters in user ID', async () => {
      GA4Tracker.initialize('G-TEST123');

      // Test with various user ID formats
      const specialUserIds = [
        'user@example.com',
        'user-123-abc',
        'user_with_underscores',
        '550e8400-e29b-41d4-a716-446655440000', // UUID
        'user.name.123',
      ];

      specialUserIds.forEach(userId => {
        GA4Tracker.setUserId(userId);
      });

      await flush();

      specialUserIds.forEach(userId => {
        expect(ReactGA.set).toHaveBeenCalledWith({ user_id: userId });
      });
    });
  });

  describe('Requirement 1.3 validation', () => {
    it('validates: WHEN a user is authenticated, THE GA4_Tracker SHALL include user_id in the event parameters', async () => {
      // Initialize tracker
      GA4Tracker.initialize('G-TEST123');

      // Authenticate user
      const authenticatedUserId = 'authenticated_user_456';
      GA4Tracker.setUserId(authenticatedUserId);

      // Track events - user_id will be automatically included by GA4
      GA4Tracker.trackPageView('/products', 'Products');
      GA4Tracker.trackSearch('medicine', 10);

      await flush();

      // Verify user_id was set
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: authenticatedUserId });

      // Verify events were tracked (user_id is included automatically by GA4)
      expect(ReactGA.send).toHaveBeenCalled();
      expect(ReactGA.event).toHaveBeenCalled();
    });

    it('validates: User ID should be cleared on logout', async () => {
      // Initialize and set user ID
      GA4Tracker.initialize('G-TEST123');
      GA4Tracker.setUserId('user_123');

      // Logout - clear user ID
      GA4Tracker.clearUserId();

      // Subsequent events should not include user_id
      GA4Tracker.trackPageView('/home', 'Home');

      await flush();

      // Verify user_id was cleared
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: null });

      // Verify page view was tracked
      expect(ReactGA.send).toHaveBeenCalled();
    });
  });
});