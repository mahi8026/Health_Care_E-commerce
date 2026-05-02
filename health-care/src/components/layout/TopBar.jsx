'use client';

import { useState, useEffect } from 'react';
import { FaTruck, FaSnowflake, FaTag } from 'react-icons/fa';

const ANNOUNCEMENTS = [
  { icon: <FaTruck />, text: 'Free delivery on orders over ৳50,000 — Dhaka, Chittagong & Sylhet' },
  { icon: <FaSnowflake />, text: 'Cold chain delivery for temperature-sensitive reagents — door to door' },
  { icon: <FaTag />, text: 'B2B institutions get up to 30% bulk discount — Register today' },
];

export default function TopBar() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % ANNOUNCEMENTS.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0B2545] text-white/80 text-[11px] min-h-[32px] px-6 py-2 flex justify-between items-center flex-nowrap overflow-hidden">
      <div
        className="flex items-center gap-2 flex-shrink min-w-0"
        style={{
          transition: 'opacity 0.3s ease',
          opacity: visible ? 1 : 0,
        }}
      >
        <span className="text-white/90 flex-shrink-0 flex items-center">{ANNOUNCEMENTS[index].icon}</span>
        <span className="truncate">{ANNOUNCEMENTS[index].text}</span>
      </div>
      <div className="flex items-center gap-0 flex-shrink-0 ml-4">
        <a href="/track" className="hover:text-white transition-colors whitespace-nowrap">Track Order</a>
        <span className="mx-2 opacity-40">·</span>
        <a href="/about" className="hover:text-white transition-colors whitespace-nowrap">DGDA Info</a>
        <span className="mx-2 opacity-40">·</span>
        <a href="/help" className="hover:text-white transition-colors whitespace-nowrap">Support</a>
        <span className="mx-2 opacity-40">·</span>
        <a href="tel:+8801800000000" className="hover:text-white transition-colors whitespace-nowrap">+880 1800-MED</a>
      </div>
    </div>
  );
}
