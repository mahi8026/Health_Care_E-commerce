'use client';

import { useState, useEffect } from 'react';
import { FaTruck, FaSnowflake, FaTag } from 'react-icons/fa';

/**
 * AnnouncementBar Component
 * 
 * Displays rotating promotional announcements with icons.
 * Automatically cycles through announcements every 4 seconds.
 * 
 * @param {Object} settings - Site settings for dynamic announcements
 */
export default function AnnouncementBar({ settings }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Build announcements dynamically from settings
  const announcements = buildAnnouncements(settings);

  // Auto-rotate announcements every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  return (
    <div className="bg-gradient-to-r from-brand-teal to-brand-teal text-white py-2 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          {announcements[activeIndex].icon}
          <span className="animate-fadeIn">{announcements[activeIndex].text}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Build announcements array from settings
 */
function buildAnnouncements(settings) {
  const threshold = settings?.freeDeliveryThreshold
    ? `৳${settings.freeDeliveryThreshold.toLocaleString()}`
    : '৳50,000';
  const maxDiscount = settings?.b2bMaxDiscount ?? 30;
  
  return [
    { 
      icon: <FaTruck className="text-lg" />, 
      text: `Free delivery on orders over ${threshold} — Dhaka, Chittagong & Sylhet` 
    },
    { 
      icon: <FaSnowflake className="text-lg" />, 
      text: 'Cold chain delivery available for temperature-sensitive reagents' 
    },
    { 
      icon: <FaTag className="text-lg" />, 
      text: `B2B institutions get up to ${maxDiscount}% bulk discount — Register today` 
    },
  ];
}
