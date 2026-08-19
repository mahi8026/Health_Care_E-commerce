'use client';

import { useState, useEffect } from 'react';
import { FiDownload, FiX, FiSmartphone } from 'react-icons/fi';

/**
 * InstallPWA Component
 * 
 * Prompts users to install the MediportBD app on their device.
 * - Shows install banner when app is installable
 * - Handles iOS-specific install instructions (Safari share menu)
 * - Dismissible with localStorage persistence
 * - Auto-hides after installation
 */
export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA (standalone mode)
    const isInStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(isInStandaloneMode);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
     
    setIsIOS(isIOSDevice);

    // Check if user dismissed prompt in last 7 days
    const dismissedDate = localStorage.getItem('pwa-prompt-dismissed');
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const wasDismissedRecently = dismissedDate && parseInt(dismissedDate) > sevenDaysAgo;

    // Don't show if already installed or dismissed recently
    if (isInStandaloneMode || wasDismissedRecently) {
      return;
    }

    // Android/Chrome: listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS: show manual install instructions if not standalone
    if (isIOSDevice && !isInStandaloneMode && !wasDismissedRecently) {
      // Wait 5 seconds before showing iOS prompt
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle install button click (Android/Chrome)
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      // PWA installed
    } else {
      // PWA installation declined
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  // Handle dismiss button
  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  // Don't render if not showing prompt or already installed
  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-[76px] left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:max-w-md z-dropdown animate-slide-up">
      <div className="bg-white rounded-2xl shadow-lg border border-[var(--color-border-primary)] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-[var(--color-status-success)] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <FiSmartphone className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Install MediportBD</h3>
              <p className="text-blue-100 text-xs">Get the app experience</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors p-1"
            aria-label="Dismiss install prompt"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {isIOS ? (
            // iOS Install Instructions
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-text-primary)]">
                Install this app on your iPhone for quick access and offline features.
              </p>
              <ol className="text-xs text-[var(--color-text-secondary)] space-y-2 pl-4">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-700 font-semibold rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                  <span>Tap the <strong>Share</strong> button in Safari (box with arrow)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-700 font-semibold rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                  <span>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-700 font-semibold rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                  <span>Tap <strong>&quot;Add&quot;</strong> in the top-right corner</span>
                </li>
              </ol>
              <button
                onClick={handleDismiss}
                className="w-full bg-[var(--color-background-tertiary)] hover:bg-[var(--color-background-muted)] text-[var(--color-text-primary)] font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
              >
                Got it
              </button>
            </div>
          ) : (
            // Android/Chrome Install
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-[var(--color-text-primary)] font-medium">
                  Quick access from your home screen
                </p>
                <ul className="text-xs text-[var(--color-text-secondary)] space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--color-status-success)]">✓</span>
                    <span>Works offline</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--color-status-success)]">✓</span>
                    <span>Faster loading</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--color-status-success)]">✓</span>
                    <span>Push notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--color-status-success)]">✓</span>
                    <span>Native app feel</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 min-h-[44px] px-4 rounded-lg text-sm transition-colors"
                >
                  <FiDownload className="text-base" />
                  Install App
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 min-h-[44px] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-tertiary)] rounded-lg text-sm font-medium transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
