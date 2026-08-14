'use client';

import { useState, useEffect } from 'react';

/**
 * BraveBrowserWarning Component
 * 
 * Detects Brave browser and shows a warning to disable Shields
 * if API requests are failing.
 */
export default function BraveBrowserWarning() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkBrave = async () => {
      // Check if running in browser
      if (typeof window === 'undefined') return;

      // Check if user already dismissed
      const wasDismissed = localStorage.getItem('brave-warning-dismissed');
      if (wasDismissed) {
        setDismissed(true);
        return;
      }

      // Detect Brave browser
      if (navigator.brave && await navigator.brave.isBrave()) {
        setShow(true);
      }
    };

    checkBrave();
  }, []);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('brave-warning-dismissed', 'true');
  };

  if (!show || dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        maxWidth: '400px',
        background: '#fff',
        border: '2px solid #FB542B',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        padding: '20px',
        zIndex: 9999,
        animation: 'slideIn 0.3s ease-out',
      }}
      role="alert"
      aria-live="polite"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Brave Icon */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#FB542B',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '20px',
          fontWeight: 'bold',
        }}>
          🦁
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#1F2937',
            marginBottom: '8px',
          }}>
            Brave Browser Detected
          </h3>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '1.5',
            marginBottom: '12px',
          }}>
            If products aren&apos;t loading, please <strong>disable Brave Shields</strong> for this site:
          </p>
          <ol style={{
            margin: 0,
            paddingLeft: '20px',
            fontSize: '13px',
            color: '#6B7280',
            lineHeight: '1.6',
            marginBottom: '12px',
          }}>
            <li>Click the <strong>🦁 Brave icon</strong> in the address bar</li>
            <li>Toggle <strong>&quot;Shields Down&quot;</strong></li>
            <li>Refresh the page</li>
          </ol>
          <button
            onClick={handleDismiss}
            style={{
              padding: '6px 16px',
              background: '#F3F4F6',
              border: 'none',
              borderRadius: '6px',
              color: '#1F2937',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
          >
            Got it
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#F3F4F6',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            fontSize: '14px',
            color: '#6B7280',
          }}
          aria-label="Dismiss warning"
        >
          ✕
        </button>
      </div>

      {/* Animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          div[role="alert"] {
            right: 10px !important;
            left: 10px !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
}
