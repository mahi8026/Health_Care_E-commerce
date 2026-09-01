'use client';

import { FaComments } from 'react-icons/fa';
import { useState, useEffect } from 'react';

export default function ChatButton({ onClick, unreadCount = 0 }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    (async () => {
      if (unreadCount > 0) {
        setPulse(true);
        const timer = setTimeout(() => setPulse(false), 1000);
        return () => clearTimeout(timer);
      }
    })();
  }, [unreadCount]);

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-[124px] right-3 md:bottom-[66px] md:right-5 z-dropdown bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-md hover:shadow-xl transition-all duration-300 hover:scale-110 ${
        pulse ? 'animate-pulse' : ''
      }`}
      aria-label="Open chat"
    >
      <FaComments className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-[var(--color-status-danger-tint)] text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
