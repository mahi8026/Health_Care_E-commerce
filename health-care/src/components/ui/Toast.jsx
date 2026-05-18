'use client';

import { useState, useEffect } from 'react';

export default function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const types = {
    success: {
      bg: 'bg-[#D1FAE5]',
      text: 'text-[#065F46]',
      icon: '✓'
    },
    error: {
      bg: 'bg-[#FEE2E2]',
      text: 'text-[#991B1B]',
      icon: '✕'
    },
    warning: {
      bg: 'bg-[#FEF3C7]',
      text: 'text-[#92400E]',
      icon: '⚠'
    },
    info: {
      bg: 'bg-[#DBEAFE]',
      text: 'text-[#1E40AF]',
      icon: 'ℹ'
    }
  };

  const config = types[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className={`${config.bg} ${config.text} rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-md`}>
        <span className="text-[18px]">{config.icon}</span>
        <p className="flex-1 text-[12px] font-medium font-[family-name:var(--font-plus-jakarta)]">
          {message}
        </p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Toast container component for managing multiple toasts — max 3 visible
export function ToastContainer({ toasts, removeToast }) {
  const MAX_VISIBLE = 3;
  const visibleToasts = toasts.slice(-MAX_VISIBLE);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2" role="region" aria-label="Notifications">
      {visibleToasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
