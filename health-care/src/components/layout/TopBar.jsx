'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
    <div className="bg-[#0B2545] text-white/80 text-[11px] w-full px-3 sm:px-4 md:px-6 flex justify-between items-center flex-nowrap" style={{ height: '36px', lineHeight: '36px' }}>
      <div
        className="flex items-center gap-1 sm:gap-2 flex-shrink min-w-0"
        style={{
          transition: 'opacity 0.3s ease',
          opacity: visible ? 1 : 0,
        }}
      >
        <span className="text-white/90 flex-shrink-0 flex items-center text-xs sm:text-sm">{ANNOUNCEMENTS[index].icon}</span>
        <span className="truncate text-[10px] sm:text-[11px]">{ANNOUNCEMENTS[index].text}</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0 ml-2 sm:ml-4">
        <Link href="/track" className="hover:text-white transition-colors whitespace-nowrap hidden sm:inline">Track Order</Link>
        <Link href="/about" className="hover:text-white transition-colors whitespace-nowrap hidden md:inline">DGDA Info</Link>
        <Link href="/help" className="hover:text-white transition-colors whitespace-nowrap">Support</Link>
        <a href="tel:+8801800000000" className="hover:text-white transition-colors whitespace-nowrap hidden sm:inline">+880 1800-MED</a>
      </div>
    </div>
  );
}
