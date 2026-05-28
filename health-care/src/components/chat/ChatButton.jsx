'use client';

import { FaComments } from 'react-icons/fa';
import { useState, useEffect } from 'react';

export default function ChatButton({ onClick, unreadCount = 0 }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (unreadCount > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-24 right-6 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
        pulse ? 'animate-pulse' : ''
      }`}
      aria-label="Open chat"
    >
      <FaComments className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
