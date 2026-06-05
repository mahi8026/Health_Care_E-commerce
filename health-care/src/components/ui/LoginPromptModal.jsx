'use client';

/**
 * LoginPromptModal
 * Shows when a guest user tries to add a product to cart.
 * Triggered via a custom 'require-login-for-cart' window event.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes, FaShoppingCart, FaUser, FaLock } from 'react-icons/fa';

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

  const goToLogin = () => {
    close();
    // Save current path so we can redirect back after login
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirect_after_login', window.location.pathname);
    }
    router.push('/login');
  };

  const goToRegister = () => {
    close();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirect_after_login', window.location.pathname);
    }
    router.push('/register');
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={close}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-red-400" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <FaShoppingCart className="text-red-500 text-lg" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">Sign in required</h2>
              <p className="text-xs text-gray-500">Please log in to add items to your cart</p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {productName && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs text-red-700 font-medium truncate">
                🛒 &ldquo;{productName}&rdquo; will be added after login
              </p>
            </div>
          )}

          <div className="space-y-2.5">
            <button
              onClick={goToLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <FaLock size={13} />
              Log In
            </button>
            <button
              onClick={goToRegister}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-xl transition-colors"
            >
              <FaUser size={13} />
              Create an Account
            </button>
          </div>
        </div>

        <div className="px-6 pb-5 text-center">
          <p className="text-xs text-gray-400">
            Your cart items will be saved and ready after you log in.
          </p>
        </div>
      </div>
    </div>
  );
}
