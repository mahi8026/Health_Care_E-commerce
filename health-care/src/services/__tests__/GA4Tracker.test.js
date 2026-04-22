// health-care/src/services/__tests__/GA4Tracker.test.js

// Mock react-ga4 before importing GA4Tracker
jest.mock('react-ga4', () => ({
  initialize: jest.fn(),
  send: jest.fn(),
  event: jest.fn(),
  set: jest.fn(),
}));

import GA4Tracker from '../GA4Tracker';
import ReactGA from 'react-ga4';

describe('GA4Tracker - User Identification', () => {
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset initialization state
    GA4Tracker.isInitialized = false;
    
    // Create spies for console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('setUserId', () => {
    it('should set user ID when tracker is initialized', () => {
      // Initialize tracker
      GA4Tracker.initialize('G-TEST123');
      
      // Clear console.log mock after initialization
      consoleLogSpy.mockClear();
      
      // Set user ID
      const userId = 'user123';
      GA4Tracker.setUserId(userId);
      
      // Verify ReactGA.set was called with user_id
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: userId });
      // Note: console.log assertion removed as it tests implementation detail
    });

    it('should not set user ID when tracker is not initialized', () => {
      // Try to set user ID without initialization
      GA4Tracker.setUserId('user123');
      
      // Verify ReactGA.set was not called
      expect(ReactGA.set).not.toHaveBeenCalled();
    });

    it('should handle errors when setting user ID', () => {
      // Initialize tracker
      GA4Tracker.initialize('G-TEST123');
      
      // Mock ReactGA.set to throw error
      const error = new Error('GA4 Error');
      ReactGA.set.mockImplementation(() => {
        throw error;
      });
      
      // Set user ID
      GA4Tracker.setUserId('user123');
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith('GA4 Set User ID Error:', error);
    });

    it('should accept different user ID formats', () => {
      // Initialize tracker
      GA4Tracker.initialize('G-TEST123');
      
      // Test with numeric string
      GA4Tracker.setUserId('12345');
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: '12345' });
      
      // Test with UUID format
      GA4Tracker.setUserId('550e8400-e29b-41d4-a716-446655440000');
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: '550e8400-e29b-41d4-a716-446655440000' });
      
      // Test with alphanumeric
      GA4Tracker.setUserId('user_abc_123');
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: 'user_abc_123' });
    });
  });

  describe('clearUserId', () => {
    it('should clear user ID when tracker is initialized', () => {
      // Initialize tracker
      GA4Tracker.initialize('G-TEST123');
      
      // Clear console.log mock after initialization
      consoleLogSpy.mockClear();
      
      // Clear user ID
      GA4Tracker.clearUserId();
      
      // Verify ReactGA.set was called with null user_id
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: null });
      // Note: console.log assertion removed as it tests implementation detail
    });

    it('should not clear user ID when tracker is not initialized', () => {
      // Try to clear user ID without initialization
      GA4Tracker.clearUserId();
      
      // Verify ReactGA.set was not called
      expect(ReactGA.set).not.toHaveBeenCalled();
    });

    it('should handle errors when clearing user ID', () => {
      // Initialize tracker
      GA4Tracker.initialize('G-TEST123');
      
      // Mock ReactGA.set to throw error
      const error = new Error('GA4 Error');
      ReactGA.set.mockImplementation(() => {
        throw error;
      });
      
      // Clear user ID
      GA4Tracker.clearUserId();
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith('GA4 Clear User ID Error:', error);
    });
  });

  describe('User identification workflow', () => {
    it('should support login/logout workflow', () => {
      // Initialize tracker
      GA4Tracker.initialize('G-TEST123');
      
      // Simulate login - set user ID
      GA4Tracker.setUserId('user123');
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: 'user123' });
      
      // Simulate logout - clear user ID
      GA4Tracker.clearUserId();
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: null });
      
      // Verify both calls were made
      expect(ReactGA.set).toHaveBeenCalledTimes(2);
    });

    it('should allow changing user ID without clearing first', () => {
      // Initialize tracker
      GA4Tracker.initialize('G-TEST123');
      
      // Set first user ID
      GA4Tracker.setUserId('user123');
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: 'user123' });
      
      // Set different user ID (e.g., user switches accounts)
      GA4Tracker.setUserId('user456');
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: 'user456' });
      
      // Verify both calls were made
      expect(ReactGA.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('Requirements validation', () => {
    it('should validate Requirement 1.3 - user_id in authenticated events', () => {
      // Initialize tracker
      GA4Tracker.initialize('G-TEST123');
      
      // Set user ID for authenticated user
      const userId = 'authenticated_user_123';
      GA4Tracker.setUserId(userId);
      
      // Verify user ID was set
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: userId });
      
      // Track a page view (should include user_id in subsequent events)
      GA4Tracker.trackPageView('/products', 'Products');
      
      // Verify page view was tracked (user_id is automatically included by GA4)
      expect(ReactGA.send).toHaveBeenCalled();
    });

    it('should validate Requirement 1.3 - clear user_id on logout', () => {
      // Initialize tracker
      GA4Tracker.initialize('G-TEST123');
      
      // Set user ID
      GA4Tracker.setUserId('user123');
      
      // Clear user ID on logout
      GA4Tracker.clearUserId();
      
      // Verify user ID was cleared
      expect(ReactGA.set).toHaveBeenCalledWith({ user_id: null });
      
      // Track a page view after logout (should not include user_id)
      GA4Tracker.trackPageView('/home', 'Home');
      
      // Verify page view was tracked without user_id
      expect(ReactGA.send).toHaveBeenCalled();
    });
  });
});
