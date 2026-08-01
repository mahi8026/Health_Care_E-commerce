'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

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

  const close = () => setVisible(false);

  const saveRedirect = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirect_after_login', window.location.pathname);
    }
  };

  const goToLogin = () => { saveRedirect(); close(); router.push('/login'); };
  const goToRegister = () => { saveRedirect(); close(); router.push('/register'); };

  return (
    <Modal isOpen={visible} onClose={close} size="sm">
      {/* Illustration area */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-brand-navy) 0%, #1a3a6b 100%)',
        padding: '32px 32px 28px',
        textAlign: 'center',
        position: 'relative',
        borderRadius: '16px 16px 0 0',
        margin: '-16px -24px 20px',
      }}>
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

        <h2 style={{ color: '#fff', fontSize: 'var(--text-xl)', fontWeight: 600, margin: '0 0 6px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Login to Continue
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'var(--text-sm)', margin: 0, lineHeight: 1.5 }}>
          You need an account to add items to your cart and place orders.
        </p>
      </div>

      {/* Content */}
      <div>
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
            <span style={{ fontSize: 'var(--text-base)' }}>🛒</span>
            <p style={{
              margin: 0, fontSize: 'var(--text-xs)', color: '#9F1239', fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              &ldquo;{productName}&rdquo; will be added after login
            </p>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button variant="primary" size="lg" fullWidth onClick={goToLogin}>
            Log In
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={goToRegister}>
            Create an Account
          </Button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: '16px 0 0' }}>
          Your cart will be saved and ready after you sign in.
        </p>
      </div>
    </Modal>
  );
}
