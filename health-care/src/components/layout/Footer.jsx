'use client';

import { useState } from 'react';
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
        { label: 'About Us', href: '/dgda-info' },
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
      heading: 'B2B',
      items: [
        { label: 'Register B2B Account', href: '/register' },
        { label: 'Bulk Pricing', href: '/b2b' },
        { label: 'Credit Terms', href: '/b2b#credit' },
        { label: 'Request a Quote', href: '/b2b#quote' },
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
    <footer className="bg-[#0B2545] text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">

        {/* ── Desktop: 5-column grid ── */}
        <div className="hidden md:grid md:grid-cols-[1fr_1fr_1fr_1fr_1.5fr] gap-8 items-start">

          {/* 4 link columns */}
          <nav aria-label="Footer navigation" className="contents">
            {links.map((col) => (
              <div key={col.heading}>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#4DDBB8] mb-4 font-[family-name:var(--font-plus-jakarta)]">
                  {col.heading}
                </h4>
                <ul className="space-y-3">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <a href={item.href} className="text-[12px] text-white/70 hover:text-white transition-colors">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* MedCoreBD column — only logo + description + newsletter */}
          <div>
            <div className="font-[family-name:var(--font-lora)] text-[22px] font-semibold mb-2">
              MedCore<span className="text-[#0E8A6E]">BD</span>
            </div>
            <p className="text-[12px] text-white/70 mb-4 leading-relaxed">
              Bangladesh&apos;s trusted source for premium medical equipment, surgical instruments, and laboratory reagents.
            </p>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#4DDBB8] mb-2 font-[family-name:var(--font-plus-jakarta)]">
              Newsletter
            </h4>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-[12px] bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-[#0E8A6E] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#0E8A6E] text-white text-[12px] font-medium rounded hover:bg-[#0a6b56] transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : 'Subscribe'}
                </button>
              </div>
              {!showNameInput && !message && (
                <button type="button" onClick={() => setShowNameInput(true)}
                  className="text-[10px] text-white/50 hover:text-white/80 transition-colors">
                  + Add your name (optional)
                </button>
              )}
              {showNameInput && (
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)" disabled={loading}
                  className="w-full px-3 py-2 text-[12px] bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-[#0E8A6E] disabled:opacity-50" />
              )}
              {message && (
                <div className={`text-[11px] p-2 rounded ${messageType === 'success' ? 'bg-[#0E8A6E]/20 text-[#4DDBB8]' : 'bg-[#E24B4A]/20 text-[#FCA5A5]'}`}>
                  {messageType === 'success' ? '✓' : '✗'} {message}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* ── Mobile layout ── */}
        <div className="md:hidden space-y-8">
          {/* Logo */}
          <div>
            <div className="font-[family-name:var(--font-lora)] text-[24px] font-semibold mb-1">
              MedCore<span className="text-[#0E8A6E]">BD</span>
            </div>
            <p className="text-[12px] text-white/70 leading-relaxed">
              Bangladesh&apos;s trusted source for premium medical equipment, surgical instruments, and laboratory reagents.
            </p>
          </div>
          {/* Links 2x2 */}
          <div className="grid grid-cols-2 gap-6">
            {links.map((col) => (
              <div key={col.heading}>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#4DDBB8] mb-3 font-[family-name:var(--font-plus-jakarta)]">
                  {col.heading}
                </h4>
                <ul className="space-y-2">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <a href={item.href} className="text-[12px] text-white/70 hover:text-white transition-colors">
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
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#4DDBB8] mb-3 font-[family-name:var(--font-plus-jakarta)]">Newsletter</h4>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email" disabled={loading}
                className="w-full px-3 py-3 text-[14px] bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-[#0E8A6E]" />
              <button type="submit" disabled={loading}
                className="w-full px-4 py-3 bg-[#0E8A6E] text-white text-[13px] font-medium rounded hover:bg-[#0a6b56] transition-colors disabled:opacity-50">
                {loading ? 'Subscribing...' : 'Subscribe'}
              </button>
              {message && (
                <div className={`text-[11px] p-2 rounded ${messageType === 'success' ? 'bg-[#0E8A6E]/20 text-[#4DDBB8]' : 'bg-[#E24B4A]/20 text-[#FCA5A5]'}`}>
                  {messageType === 'success' ? '✓' : '✗'} {message}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          {/* Desktop: Single row with all items */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <p className="text-[11px] text-white/50 whitespace-nowrap">
              © {currentYear} MedCore Bangladesh Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-white/50">
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
              <a href="/privacy" className="text-[11px] text-white/50 hover:text-white/80 transition-colors whitespace-nowrap">Privacy Policy</a>
              <a href="/terms" className="text-[11px] text-white/50 hover:text-white/80 transition-colors whitespace-nowrap">Terms of Service</a>
              <span className="text-[10px] text-[#4DDBB8] font-medium border border-[#0E8A6E] px-2 py-0.5 rounded whitespace-nowrap">DGDA Registered</span>
              <span className="text-[10px] text-[#4DDBB8] font-medium border border-[#0E8A6E] px-2 py-0.5 rounded whitespace-nowrap">ISO 13485</span>
            </div>
          </div>

          {/* Tablet: Two rows */}
          <div className="hidden sm:flex md:hidden flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-white/50">
                © {currentYear} MedCore Bangladesh Ltd. All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#4DDBB8] font-medium border border-[#0E8A6E] px-2 py-0.5 rounded">DGDA Registered</span>
                <span className="text-[10px] text-[#4DDBB8] font-medium border border-[#0E8A6E] px-2 py-0.5 rounded">ISO 13485</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/50">
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
            <p className="text-[10px] text-white/50">
              © {currentYear} MedCore Bangladesh Ltd.
            </p>
            <div className="flex flex-col gap-2 text-[11px] text-white/50">
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
              <a href="/privacy" className="text-[10px] text-white/50 hover:text-white/80 transition-colors">Privacy</a>
              <span className="text-white/30">·</span>
              <a href="/terms" className="text-[10px] text-white/50 hover:text-white/80 transition-colors">Terms</a>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] text-[#4DDBB8] font-medium border border-[#0E8A6E] px-2 py-0.5 rounded">DGDA</span>
              <span className="text-[10px] text-[#4DDBB8] font-medium border border-[#0E8A6E] px-2 py-0.5 rounded">ISO 13485</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
