import { renderHook, waitFor } from '@testing-library/react';
import { useRecaptcha } from '../useRecaptcha';

describe('useRecaptcha', () => {
  let mockGrecaptcha;
  let scriptElement;

  beforeEach(() => {
    // Mock grecaptcha
    mockGrecaptcha = {
      ready: jest.fn((callback) => callback()),
      execute: jest.fn().mockResolvedValue('mock-token-123'),
    };

    // Mock document.head.appendChild to capture script
    const originalAppendChild = document.head.appendChild;
    jest.spyOn(document.head, 'appendChild').mockImplementation((element) => {
      if (element.tagName === 'SCRIPT' && element.src.includes('recaptcha')) {
        scriptElement = element;
        // Simulate script load
        setTimeout(() => {
          window.grecaptcha = mockGrecaptcha;
          element.onload && element.onload();
        }, 0);
      }
      return originalAppendChild.call(document.head, element);
    });

    // Clean up window.grecaptcha
    delete window.grecaptcha;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.grecaptcha;
    if (scriptElement && scriptElement.parentNode) {
      scriptElement.parentNode.removeChild(scriptElement);
    }
  });

  it('should load reCAPTCHA script with site key', async () => {
    const siteKey = 'test-site-key';
    renderHook(() => useRecaptcha(siteKey));

    await waitFor(() => {
      expect(document.head.appendChild).toHaveBeenCalled();
    });

    expect(scriptElement).toBeDefined();
    expect(scriptElement.src).toContain(`render=${siteKey}`);
  });

  it('should warn if site key is not provided', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    renderHook(() => useRecaptcha(null));

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[reCAPTCHA] Site key not provided'
    );

    consoleWarnSpy.mockRestore();
  });

  it('should execute reCAPTCHA and return token', async () => {
    const siteKey = 'test-site-key';
    window.grecaptcha = mockGrecaptcha;

    const { result } = renderHook(() => useRecaptcha(siteKey));

    await waitFor(() => {
      expect(result.current.executeRecaptcha).toBeDefined();
    });

    const token = await result.current.executeRecaptcha('register');
    expect(token).toBe('mock-token-123');
    expect(mockGrecaptcha.execute).toHaveBeenCalledWith(siteKey, {
      action: 'register',
    });
  });

  it('should return null if reCAPTCHA is not ready', async () => {
    const siteKey = 'test-site-key';
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const { result } = renderHook(() => useRecaptcha(siteKey));

    // Try to execute before ready
    const token = await result.current.executeRecaptcha('register');
    expect(token).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[reCAPTCHA] reCAPTCHA not ready'
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle execution errors gracefully', async () => {
    const siteKey = 'test-site-key';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock grecaptcha with error
    mockGrecaptcha.execute = jest
      .fn()
      .mockRejectedValue(new Error('reCAPTCHA error'));
    window.grecaptcha = mockGrecaptcha;

    const { result } = renderHook(() => useRecaptcha(siteKey));

    // Wait for ready
    await waitFor(() => {
      expect(result.current.executeRecaptcha).toBeDefined();
    });

    const token = await result.current.executeRecaptcha('register');
    expect(token).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should not load script multiple times', () => {
    const siteKey = 'test-site-key';
    const { rerender } = renderHook(() => useRecaptcha(siteKey));

    const callCount = document.head.appendChild.mock.calls.filter((call) =>
      call[0].src?.includes('recaptcha')
    ).length;

    rerender();

    const callCountAfter = document.head.appendChild.mock.calls.filter((call) =>
      call[0].src?.includes('recaptcha')
    ).length;

    expect(callCountAfter).toBe(callCount);
  });
});
