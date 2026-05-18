'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaTruck, FaSnowflake, FaTag, FaPhone, FaHeadset, FaShieldAlt } from 'react-icons/fa';

const ANNOUNCEMENTS = [
  {
    icon: <FaTruck size={11} />,
    text: 'Free delivery on orders over ৳50,000 — Dhaka, Chittagong & Sylhet',
  },
  {
    icon: <FaSnowflake size={11} />,
    text: 'Cold chain delivery for temperature-sensitive reagents — door to door',
  },
  {
    icon: <FaTag size={11} />,
    text: 'B2B institutions get up to 30% bulk discount — Register today',
  },
];

export default function TopBar() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ANNOUNCEMENTS.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const { icon, text } = ANNOUNCEMENTS[index];

  return (
    <div className="bg-[#0B2545] h-9 flex items-center justify-between px-4 md:px-6 text-[11px] select-none">
      {/* Rotating announcement */}
      <div
        className="flex items-center gap-2 min-w-0 flex-1"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="text-[#0E8A6E] flex-shrink-0">{icon}</span>
        <span className="text-white/75 truncate">{text}</span>
      </div>

      {/* Right links */}
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <Link
          href="/track"
          className="text-white/60 hover:text-white transition-colors whitespace-nowrap hidden sm:flex items-center gap-1.5"
        >
          <FaTruck size={10} />
          Track Order
        </Link>

        <span className="text-white/20 hidden sm:block">|</span>

        <Link
          href="/dgda-info"
          className="text-white/60 hover:text-white transition-colors whitespace-nowrap hidden md:flex items-center gap-1.5"
        >
          <FaShieldAlt size={10} />
          DGDA Info
        </Link>

        <span className="text-white/20 hidden md:block">|</span>

        <Link
          href="/support"
          className="text-white/60 hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <FaHeadset size={10} />
          Support
        </Link>

        <span className="text-white/20">|</span>

        <a
          href="tel:+8801800000000"
          className="text-white/60 hover:text-white transition-colors whitespace-nowrap hidden md:flex items-center gap-1.5 font-medium"
        >
          <FaPhone size={10} />
          +880 1800-MED
        </a>
      </div>
    </div>
  );
}
