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
    <div className="bg-[#0B2545] text-white/80 text-[11px] px-6 py-[6px] flex justify-between items-center">
      <span
        className="flex items-center gap-2"
        style={{
          transition: 'opacity 0.3s ease',
          opacity: visible ? 1 : 0,
        }}
      >
        <span className="text-white/90">{ANNOUNCEMENTS[index].icon}</span>
        {ANNOUNCEMENTS[index].text}
      </span>
      <span className="flex items-center gap-0">
        <a href="/track" className="hover:text-white transition-colors">Track Order</a>
        <span className="mx-2 opacity-40">·</span>
        <a href="/about" className="hover:text-white transition-colors">DGDA Info</a>
        <span className="mx-2 opacity-40">·</span>
        <a href="/help" className="hover:text-white transition-colors">Support</a>
        <span className="mx-2 opacity-40">·</span>
        <a href="tel:+8801800000000" className="hover:text-white transition-colors">+880 1800-MED</a>
      </span>
    </div>
  );
}
