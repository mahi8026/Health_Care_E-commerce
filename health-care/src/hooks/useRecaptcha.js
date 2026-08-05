import { useEffect, useCallback, useState } from 'react';

/**
 * Custom hook for Google reCAPTCHA v3 integration
 * @param {String} siteKey - reCAPTCHA site key from environment
 * @returns {Object} { executeRecaptcha, ready }
 */
export function useRecaptcha(siteKey) {
  const [ready, setReady] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!siteKey) {
      console.warn('[reCAPTCHA] Site key not provided');
      return;
    }

    console.log('[reCAPTCHA] Initializing with site key:', siteKey ? 'present' : 'missing');

    if (scriptLoaded) return;

    // Check if reCAPTCHA is already loaded
    if (window.grecaptcha && window.grecaptcha.ready) {
      window.grecaptcha.ready(() => {
        setReady(true);
      });
      return;
    }

    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('[reCAPTCHA] Script loaded successfully');
      setScriptLoaded(true);
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          console.log('[reCAPTCHA] Ready!');
          setReady(true);
        });
      }
    };

    script.onerror = () => {
      console.error('[reCAPTCHA] Failed to load reCAPTCHA script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [siteKey, scriptLoaded]);

  /**
   * Execute reCAPTCHA and get token
   * @param {String} action - Action name (e.g., 'register', 'login')
   * @returns {Promise<String|null>} reCAPTCHA token or null on error
   */
  const executeRecaptcha = useCallback(
    async (action) => {
      if (!siteKey) {
        console.warn('[reCAPTCHA] Site key not configured');
        return null;
      }

      if (!ready || !window.grecaptcha) {
        console.warn('[reCAPTCHA] reCAPTCHA not ready. Ready:', ready, 'grecaptcha:', !!window.grecaptcha);
        return null;
      }

      try {
        console.log('[reCAPTCHA] Executing reCAPTCHA for action:', action);
        const token = await window.grecaptcha.execute(siteKey, { action });
        console.log('[reCAPTCHA] Token received:', token ? 'yes' : 'no');
        return token;
      } catch (error) {
        console.error('[reCAPTCHA] Error executing reCAPTCHA:', error);
        return null;
      }
    },
    [siteKey, ready]
  );

  return {
    executeRecaptcha,
    ready
  };
}
