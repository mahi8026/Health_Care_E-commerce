'use client';

import { useState } from 'react';
import Image from 'next/image';
import { API, CONTACT, SOCIAL } from '@/constants/api';
import PreferredSourcesButton from '../seo/PreferredSourcesButton';
import PaymentTrustBadges from '../ui/PaymentTrustBadges';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) { setMessage('Please enter your email'); setMessageType('error'); return; }
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, source: 'footer' })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(data.message || 'Thank you for subscribing!');
        setMessageType('success');
        setEmail(''); setName(''); setShowNameInput(false);
      } else {
        setMessage(data.message || 'Failed to subscribe');
        setMessageType('error');
      }
    } catch {
      setMessage('Failed to subscribe. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const links = [
    {
      heading: 'Company',
      items: [
        { label: 'About Us', href: '/about' },
        { label: 'DGDA Compliance', href: '/dgda-info' },
        { label: 'Certifications', href: '/certifications' },
        { label: 'Careers', href: '/careers' },
        { label: 'News', href: '/news' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      heading: 'Products',
      items: [
        { label: 'Diagnostic Equipment', href: '/products/category/diagnostic-equipment' },
        { label: 'Surgical Instruments', href: '/products/category/surgical-instruments' },
        { label: 'Laboratory Reagents', href: '/reagent-store' },
        { label: 'Hospital Machines', href: '/products/category/hospital-machines' },
      ],
    },
    {
      heading: 'Guides',
      items: [
        { label: 'All Buying Guides', href: '/guides' },
        { label: 'Equipment Price Guide', href: '/equipment' },
        { label: 'Topic Hubs', href: '/topics' },
        { label: 'Medical Equipment Guide', href: '/guides/medical-equipment-bangladesh-guide' },
        { label: 'ECG Machine Prices', href: '/guides/ecg-machine-price-bangladesh-2026' },
        { label: 'BP Monitor Buying Guide', href: '/guides/bp-monitor-buying-guide-bangladesh' },
        { label: 'Comparisons', href: '/compare' },
      ],
    },
    {
      heading: 'B2B',
      items: [
        { label: 'Register B2B Account', href: '/register' },
        { label: 'Bulk Pricing', href: '/b2b' },
        { label: 'Credit Terms', href: '/b2b#credit' },
        { label: 'Request a Quote', href: '/quotes/request' },
      ],
    },
    {
      heading: 'Support',
      items: [
        { label: 'Help Centre', href: '/help' },
        { label: 'Track Order', href: '/track' },
        { label: 'Returns Policy', href: '/returns' },
        { label: 'Warranty', href: '/warranty' },
      ],
    },
  ];

  return (
    <footer className="bg-gradient-to-br from-brand-navy to-brand-navy-deep text-white pb-[calc(60px+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-6">

        {/* ── Desktop: Compact 5-column grid ── */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-6">
          {/* 5 link columns */}
          <nav aria-label="Footer navigation" className="contents">
            {links.map((col) => (
              <div key={col.heading}>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-brand-teal mb-2 font-[family-name:var(--font-plus-jakarta)]">
                  {col.heading}
                </h3>
                <ul className="space-y-1">
                  {col.items.slice(0, 4).map((item) => (
                    <li key={item.label}>
                      <a href={item.href} className="text-xs text-white/70 hover:text-white transition-colors">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* ── Tablet: Compact 3 columns ── */}
        <div className="hidden md:grid lg:hidden md:grid-cols-3 gap-4">
          {links.slice(0, 3).map((col) => (
            <div key={col.heading}>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-brand-teal mb-2 font-[family-name:var(--font-plus-jakarta)]">
                {col.heading}
              </h3>
              <ul className="space-y-1">
                {col.items.slice(0, 3).map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-xs text-white/70 hover:text-white transition-colors">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Mobile: Compact layout ── */}
        <div className="md:hidden space-y-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image
              src="/Mediport_Logo.png"
              alt="MediportBD"
              width={80}
              height={27}
              unoptimized
              style={{ width: '80px', height: '27px', objectFit: 'contain' }}
            />
            <PreferredSourcesButton theme="dark" />
          </div>
          {/* Compact 2-column links - only key items */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {links.map((col) => (
              <div key={col.heading}>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-brand-teal mb-1 font-[family-name:var(--font-plus-jakarta)]">
                  {col.heading}
                </h3>
                <ul className="space-y-0.5">
                  {col.items.slice(0, 3).map((item) => (
                    <li key={item.label}>
                      <a href={item.href} className="text-[11px] text-white/70 hover:text-white transition-colors">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar - ultra compact */}
      <div className="border-t border-white/20 mt-4">
        {/* Payment badges - compact */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
            <p className="text-[10px] text-white/70 font-medium">We Accept:</p>
            <PaymentTrustBadges size="sm" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2">
          {/* Desktop: Single compact row */}
          <div className="hidden lg:flex items-center justify-between gap-3 text-[10px]">
            <p className="text-white/50">© {currentYear} Mediport Bangladesh Ltd.</p>
            <div className="flex items-center gap-3 text-white/50">
              <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="hover:text-white/80 transition-colors">📱 {CONTACT.phone}</a>
              <a href={`mailto:${CONTACT.email}`} className="hover:text-white/80 transition-colors">
                ✉️ {CONTACT.email}</a>
              <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer"
                className="hover:text-white/80 transition-colors">📘 Facebook</a>
            </div>
            <div className="flex items-center gap-2">
              <a href="/privacy" className="text-white/50 hover:text-white/80 transition-colors">Privacy</a>
              <span className="text-white/30">·</span>
              <a href="/terms" className="text-white/50 hover:text-white/80 transition-colors">Terms</a>
              <span className="text-brand-teal font-medium border border-brand-teal px-1.5 py-0.5 rounded ml-1">DGDA</span>
              <span className="text-brand-teal font-medium border border-brand-teal px-1.5 py-0.5 rounded">ISO</span>
            </div>
          </div>

          {/* Tablet: Compact 2 rows */}
          <div className="hidden md:flex lg:hidden flex-col gap-1.5 text-[10px]">
            <div className="flex items-center justify-between">
              <p className="text-white/50">© {currentYear} Mediport Bangladesh Ltd.</p>
              <div className="flex items-center gap-1.5">
                <span className="text-brand-teal font-medium border border-brand-teal px-1.5 py-0.5 rounded">DGDA</span>
                <span className="text-brand-teal font-medium border border-brand-teal px-1.5 py-0.5 rounded">ISO</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-white/50">
              <div className="flex items-center gap-2">
                <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="hover:text-white/80 transition-colors">📱 {CONTACT.phone}</a>
                <a href={`mailto:${CONTACT.email}`} className="hover:text-white/80 transition-colors">
                  ✉️ {CONTACT.email}</a>
              </div>
              <div className="flex items-center gap-2">
                <a href="/privacy" className="hover:text-white/80 transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-white/80 transition-colors">Terms</a>
              </div>
            </div>
          </div>

          {/* Mobile: Ultra compact */}
          <div className="flex md:hidden flex-col gap-1 text-center text-[10px]">
            <p className="text-white/50">© {currentYear} Mediport BD</p>
            <div className="flex items-center justify-center gap-1.5">
              <a href="/privacy" className="text-white/50 hover:text-white/80 transition-colors">Privacy</a>
              <span className="text-white/30">·</span>
              <a href="/terms" className="text-white/50 hover:text-white/80 transition-colors">Terms</a>
              <span className="text-white/30">·</span>
              <span className="text-brand-teal font-medium border border-brand-teal px-1 py-0.5 rounded">DGDA</span>
              <span className="text-brand-teal font-medium border border-brand-teal px-1 py-0.5 rounded">ISO</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
