'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPromptModal() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [productName, setProductName] = useState('');

  useEffect(() => {
    const handler = (e) => {
      setProductName(e.detail?.productName || '');
      setVisible(true);
    };
    window.addEventListener('require-login-for-cart', handler);
    return () => window.removeEventListener('require-login-for-cart', handler);
  }, []);

  if (!visible) return null;

  const close = () => setVisible(false);

  const saveRedirect = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirect_after_login', window.location.pathname);
    }
  };

  const goToLogin = () => { saveRedirect(); close(); router.push('/login'); };
  const goToRegister = () => { saveRedirect(); close(); router.push('/register'); };

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '400px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          animation: 'modalIn 0.2s ease',
        }}
      >
        {/* Illustration area */}
        <div style={{
          background: 'linear-gradient(135deg, #0B2545 0%, #1a3a6b 100%)',
          padding: '32px 32px 28px',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* Close button */}
          <button
            onClick={close}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(255,255,255,0.12)',
              border: 'none', borderRadius: '50%',
              width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff', fontSize: 16,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            ×
          </button>

          {/* Cart icon */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #E11D48, #BE123C)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(225,29,72,0.4)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>

          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 6px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Login to Continue
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            You need an account to add items to your cart and place orders.
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px 28px' }}>
          {/* Product hint */}
          {productName && (
            <div style={{
              background: '#FFF7F7',
              border: '1px solid #FEE2E2',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>🛒</span>
              <p style={{
                margin: 0, fontSize: 12, color: '#9F1239', fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                &ldquo;{productName}&rdquo; will be added after login
              </p>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={goToLogin}
              style={{
                width: '100%', padding: '13px',
                background: 'linear-gradient(135deg, #E11D48, #BE123C)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                transition: 'opacity 0.2s, transform 0.15s',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Log In
            </button>

            <button
              onClick={goToRegister}
              style={{
                width: '100%', padding: '13px',
                background: '#F8FAFC',
                color: '#1E293B', border: '1.5px solid #E2E8F0', borderRadius: 12,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
              Create an Account
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', margin: '16px 0 0' }}>
            Your cart will be saved and ready after you sign in.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
