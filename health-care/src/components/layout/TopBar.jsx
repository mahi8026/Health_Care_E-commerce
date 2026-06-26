'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaTruck, FaSnowflake, FaTag, FaPhone, FaHeadset, FaShieldAlt } from 'react-icons/fa';
import { API } from '@/constants/api';

// Fallback announcements used before settings load
const DEFAULT_ANNOUNCEMENTS = [
  { icon: <FaTruck size={11} />, text: 'Free delivery on orders over ৳50,000 — Dhaka, Chittagong & Sylhet' },
  { icon: <FaSnowflake size={11} />, text: 'Cold chain delivery for temperature-sensitive reagents — door to door' },
  { icon: <FaTag size={11} />, text: 'B2B institutions get up to 10% bulk discount — Register today' },
];

function buildAnnouncements(settings) {
  if (!settings) return DEFAULT_ANNOUNCEMENTS;
  const threshold = settings.freeDeliveryThreshold
    ? `৳${settings.freeDeliveryThreshold.toLocaleString()}`
    : '৳50,000';
  const maxDiscount = settings.b2bMaxDiscount ?? 30;
  return [
    { icon: <FaTruck size={11} />, text: `Free delivery on orders over ${threshold} — Dhaka, Chittagong & Sylhet` },
    { icon: <FaSnowflake size={11} />, text: 'Cold chain delivery for temperature-sensitive reagents — door to door' },
    { icon: <FaTag size={11} />, text: `B2B institutions get up to ${maxDiscount}% bulk discount — Register today` },
  ];
}

export default function TopBar() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [settings, setSettings] = useState(null);
  const [contactPhone, setContactPhone] = useState('+8801646886795');

  // Fetch settings once on mount
  useEffect(() => {
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .then((data) => {
        const s = data.data || {};
        setSettings(s);
        if (s.contactPhone) setContactPhone(s.contactPhone);
      })
      .catch(() => {});
  }, []);

  const announcements = buildAnnouncements(settings);

  // Reset index if it's out of bounds after settings load
  useEffect(() => {
    if (index >= announcements.length) {
      setIndex(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcements.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % announcements.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  const { icon, text } = announcements[index] || announcements[0];

  return (
    <div className="site-topbar flex items-center justify-between px-4 md:px-6 text-[11px] select-none">
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
          href={`tel:${contactPhone.replace(/[\s\-]/g, '')}`}
          className="text-white/60 hover:text-white transition-colors whitespace-nowrap hidden md:flex items-center gap-1.5 font-medium"
        >
          <FaPhone size={10} />
          {contactPhone}
        </a>
      </div>
    </div>
  );
}
