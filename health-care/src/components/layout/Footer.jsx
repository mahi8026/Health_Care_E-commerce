'use client';

import { useState } from 'react';
import Image from 'next/image';
import { API, CONTACT } from '@/constants/api';

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
    <footer className="bg-brand-navy text-white pb-[calc(60px+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">

        {/* ── Desktop: Single horizontal row with all columns ── */}
        <div className="hidden lg:grid lg:grid-cols-6 gap-8 items-start">

          {/* 5 link columns */}
          <nav aria-label="Footer navigation" className="contents">
            {links.map((col) => (
              <div key={col.heading}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-teal-light mb-4 font-[family-name:var(--font-plus-jakarta)]">
                  {col.heading}
                </h3>
                <ul className="space-y-3">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <a href={item.href} className="text-sm text-white/70 hover:text-white transition-colors">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* MediportBD column — logo + description + newsletter */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-36 h-10 flex-shrink-0">
                <Image
                  src="/Mediport_Logo.png"
                  alt="MediportBD"
                  fill
                  sizes="144px"
                  className="object-contain object-left"
                />
              </div>
            </div>
            <p className="text-sm text-white/70 mb-4 leading-relaxed">
              Bangladesh&apos;s trusted source for premium medical equipment, surgical instruments, and laboratory reagents.
            </p>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-teal-light mb-3 font-[family-name:var(--font-plus-jakarta)]">
              Newsletter
            </h3>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  disabled={loading}
                  aria-label="Email address for newsletter"
                  className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-brand-teal disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-brand-teal text-white text-sm font-medium rounded hover:bg-[var(--color-brand-teal-hover)] transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : 'Subscribe'}
                </button>
              </div>
              {!showNameInput && !message && (
                <button type="button" onClick={() => setShowNameInput(true)}
                  className="text-xs text-white/50 hover:text-white/80 transition-colors">
                  + Add your name (optional)
                </button>
              )}
              {showNameInput && (
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)" disabled={loading}
                  aria-label="Your name for newsletter"
                  className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-brand-teal disabled:opacity-50" />
              )}
              {message && (
                <div className={`text-xs p-2 rounded ${messageType === 'success' ? 'bg-brand-teal/20 text-brand-teal-light' : 'bg-danger/20 text-[#FCA5A5]'}`}>
                  {messageType === 'success' ? '✓' : '✗'} {message}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* ── Tablet: 3 columns ── */}
        <div className="hidden md:grid lg:hidden md:grid-cols-3 gap-6">
          {links.slice(0, 3).map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-teal-light mb-4 font-[family-name:var(--font-plus-jakarta)]">
                {col.heading}
              </h3>
              <ul className="space-y-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-sm text-white/70 hover:text-white transition-colors">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="hidden md:grid lg:hidden md:grid-cols-3 gap-6 mt-6">
          {links.slice(3).map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-teal-light mb-4 font-[family-name:var(--font-plus-jakarta)]">
                {col.heading}
              </h3>
              <ul className="space-y-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-sm text-white/70 hover:text-white transition-colors">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {/* Newsletter on tablet */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-36 h-10">
                <Image
                  src="/Mediport_Logo.png"
                  alt="MediportBD"
                  fill
                  sizes="144px"
                  className="object-contain object-left"
                />
              </div>
            </div>
            <p className="text-sm text-white/70 mb-4 leading-relaxed">
              Bangladesh&apos;s trusted source for premium medical equipment.
            </p>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-teal-light mb-3 font-[family-name:var(--font-plus-jakarta)]">
              Newsletter
            </h3>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  disabled={loading}
                  aria-label="Email address for newsletter"
                  className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-brand-teal disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-brand-teal text-white text-sm font-medium rounded hover:bg-[var(--color-brand-teal-hover)] transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : 'Subscribe'}
                </button>
              </div>
              {message && (
                <div className={`text-xs p-2 rounded ${messageType === 'success' ? 'bg-brand-teal/20 text-brand-teal-light' : 'bg-danger/20 text-[#FCA5A5]'}`}>
                  {messageType === 'success' ? '✓' : '✗'} {message}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* ── Mobile layout ── */}
        <div className="md:hidden space-y-6">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative w-36 h-10">
                <Image
                  src="/Mediport_Logo.png"
                  alt="MediportBD"
                  fill
                  sizes="144px"
                  className="object-contain object-left"
                />
              </div>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Bangladesh&apos;s trusted source for premium medical equipment, surgical instruments, and laboratory reagents.
            </p>
          </div>
          {/* Links 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            {links.map((col) => (
              <div key={col.heading}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-teal-light mb-3 font-[family-name:var(--font-plus-jakarta)]">
                  {col.heading}
                </h3>
                <ul className="space-y-2">
                  {col.items.map((item) => (
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
          {/* Newsletter */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-teal-light mb-3 font-[family-name:var(--font-plus-jakarta)]">Newsletter</h3>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email" disabled={loading}
                aria-label="Email address for newsletter"
                className="w-full px-3 py-3 text-sm bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-brand-teal" />
              <button type="submit" disabled={loading}
                className="w-full px-4 py-3 bg-brand-teal text-white text-sm font-medium rounded hover:bg-[var(--color-brand-teal-hover)] transition-colors disabled:opacity-50">
                {loading ? 'Subscribing...' : 'Subscribe'}
              </button>
              {message && (
                <div className={`text-xs p-2 rounded ${messageType === 'success' ? 'bg-brand-teal/20 text-brand-teal-light' : 'bg-danger/20 text-[#FCA5A5]'}`}>
                  {messageType === 'success' ? '✓' : '✗'} {message}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar with enhanced separator line */}
      <div className="border-t border-white/20 mt-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          {/* Desktop: Single row with all items */}
          <div className="hidden xl:flex items-center justify-between gap-4">
            <p className="text-xs text-white/50 whitespace-nowrap">
              © {currentYear} Mediport Bangladesh Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/50">
              <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="hover:text-white/80 transition-colors whitespace-nowrap">
                📱 {CONTACT.phone}
              </a>
              <a href={`mailto:${CONTACT.email}`}
                className="hover:text-white/80 transition-colors whitespace-nowrap">
                ✉️ {CONTACT.email}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <a href="/privacy" className="text-xs text-white/50 hover:text-white/80 transition-colors whitespace-nowrap">Privacy Policy</a>
              <a href="/terms" className="text-xs text-white/50 hover:text-white/80 transition-colors whitespace-nowrap">Terms of Service</a>
              <span className="text-xs text-brand-teal-light font-medium border border-brand-teal px-2 py-0.5 rounded whitespace-nowrap">DGDA Registered</span>
              <span className="text-xs text-brand-teal-light font-medium border border-brand-teal px-2 py-0.5 rounded whitespace-nowrap">ISO 13485</span>
            </div>
          </div>

          {/* Tablet: Two rows */}
          <div className="hidden sm:flex xl:hidden flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/50">
                © {currentYear} Mediport Bangladesh Ltd. All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-brand-teal-light font-medium border border-brand-teal px-2 py-0.5 rounded">DGDA Registered</span>
                <span className="text-xs text-brand-teal-light font-medium border border-brand-teal px-2 py-0.5 rounded">ISO 13485</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-white/50">
              <div className="flex items-center gap-3">
                <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="hover:text-white/80 transition-colors">
                  📱 {CONTACT.phone}
                </a>
                <a href={`mailto:${CONTACT.email}`}
                  className="hover:text-white/80 transition-colors">
                  ✉️ {CONTACT.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <a href="/privacy" className="hover:text-white/80 transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-white/80 transition-colors">Terms</a>
              </div>
            </div>
          </div>

          {/* Mobile: Three rows, centered */}
          <div className="flex sm:hidden flex-col gap-3 text-center">
            <p className="text-xs text-white/50">
              © {currentYear} Mediport Bangladesh Ltd.
            </p>
            <div className="flex flex-col gap-2 text-xs text-white/50">
              <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="hover:text-white/80 transition-colors">
                📱 {CONTACT.phone}
              </a>
              <a href={`mailto:${CONTACT.email}`}
                className="hover:text-white/80 transition-colors">
                ✉️ {CONTACT.email}
              </a>
            </div>
            <div className="flex items-center justify-center gap-2">
              <a href="/privacy" className="text-xs text-white/50 hover:text-white/80 transition-colors">Privacy</a>
              <span className="text-white/30">·</span>
              <a href="/terms" className="text-xs text-white/50 hover:text-white/80 transition-colors">Terms</a>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-brand-teal-light font-medium border border-brand-teal px-2 py-0.5 rounded">DGDA</span>
              <span className="text-xs text-brand-teal-light font-medium border border-brand-teal px-2 py-0.5 rounded">ISO 13485</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
