'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaTruck, FaSnowflake, FaTag, FaPhone, FaHeadset, FaShieldAlt } from 'react-icons/fa';
import { API } from '@/constants/api';
import { fetchCached } from '@/utils/api';

// Fallback announcements used before settings load
const DEFAULT_ANNOUNCEMENTS = [
  { 
    icon: <FaTruck size={11} />, 
    text: 'Free delivery on orders over ৳50,000 — Dhaka, Chittagong & Sylhet',
    shortText: 'Free delivery over ৳50,000'
  },
  { 
    icon: <FaSnowflake size={11} />, 
    text: 'Cold chain delivery for temperature-sensitive reagents — door to door',
    shortText: 'Cold chain delivery available'
  },
  { 
    icon: <FaTag size={11} />, 
    text: 'B2B institutions get up to 10% bulk discount — Register today',
    shortText: 'B2B bulk discount up to 10%'
  },
];

function buildAnnouncements(settings) {
  if (!settings) return DEFAULT_ANNOUNCEMENTS;
  const threshold = settings.freeDeliveryThreshold
    ? `৳${settings.freeDeliveryThreshold.toLocaleString()}`
    : '৳50,000';
  const maxDiscount = settings.b2bMaxDiscount ?? 30;
  return [
    { 
      icon: <FaTruck size={11} />, 
      text: `Free delivery on orders over ${threshold} — Dhaka, Chittagong & Sylhet`,
      shortText: `Free delivery over ${threshold}`
    },
    { 
      icon: <FaSnowflake size={11} />, 
      text: 'Cold chain delivery for temperature-sensitive reagents — door to door',
      shortText: 'Cold chain delivery available'
    },
    { 
      icon: <FaTag size={11} />, 
      text: `B2B institutions get up to ${maxDiscount}% bulk discount — Register today`,
      shortText: `B2B bulk discount up to ${maxDiscount}%`
    },
  ];
}

export default function TopBar() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [settings, setSettings] = useState(null);
  const [contactPhone, setContactPhone] = useState('+8801646886795');

  // Fetch settings once on mount — shared cache dedupes with Header/HomePage
  useEffect(() => {
    fetchCached(`${API}/settings`)
      .then((data) => {
        const s = data.data || {};
        setSettings(s);
        if (s.contactPhone) setContactPhone(s.contactPhone);
      })
      .catch(() => { if (process.env.NODE_ENV !== 'production') console.warn('Failed to fetch settings'); });
  }, []);

  const announcements = buildAnnouncements(settings);

  // Ensure index stays within bounds
  const safeIndex = index >= announcements.length ? 0 : index;

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

  const { icon, text, shortText } = announcements[safeIndex] || announcements[0];

  return (
    <div className="site-topbar flex items-center justify-between px-3 sm:px-4 md:px-6 text-xs sm:text-xs select-none py-1.5 sm:py-0">
      {/* Rotating announcement */}
      <div
        className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="text-brand-teal flex-shrink-0">{icon}</span>
        <span className="text-white/90 truncate leading-tight hidden sm:inline">{text}</span>
        <span className="text-white/90 truncate leading-tight sm:hidden">{shortText || text}</span>
      </div>

      {/* Right links */}
      <div className="flex items-center gap-4 sm:gap-3 flex-shrink-0 ml-2 sm:ml-4">
        {/* Track Order - Always visible, icon only on mobile.
            prefetch={false}: these utility routes don't justify pulling their
            JS chunks during the homepage's critical load window. */}
        <Link
          href="/track"
          prefetch={false}
          className="text-white/80 hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5 py-2 -my-2"
          title="Track Order"
        >
          <FaTruck size={18} className="sm:hidden flex-shrink-0" />
          <FaTruck size={11} className="hidden sm:inline" />
          <span className="hidden md:inline">Track Order</span>
        </Link>

        <span className="text-white/20 hidden xs:block">|</span>

        {/* DGDA Info - Hidden on mobile */}
        <Link
          href="/dgda-info"
          prefetch={false}
          className="text-white/80 hover:text-white transition-colors whitespace-nowrap hidden md:flex items-center gap-1.5"
          title="DGDA Info"
        >
          <FaShieldAlt size={10} />
          <span className="hidden lg:inline">DGDA Info</span>
        </Link>

        <span className="text-white/20 hidden md:block">|</span>

        {/* Phone Number - Always visible, icon only on mobile */}
        <a
          href={`tel:${contactPhone.replace(/[\s\-]/g, '')}`}
          className="text-white/80 hover:text-white transition-colors whitespace-nowrap flex items-center gap-1 sm:gap-1.5 font-medium py-2 -my-2"
          title={`Call ${contactPhone}`}
        >
          <FaPhone size={18} className="sm:hidden flex-shrink-0" />
          <FaPhone size={10} className="hidden sm:inline" />
          <span className="hidden sm:inline text-xs">{contactPhone}</span>
        </a>
      </div>
    </div>
  );
}
