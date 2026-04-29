'use client';

import { useState } from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, source: 'footer' })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message || 'Thank you for subscribing!');
        setMessageType('success');
        setEmail('');
        setName('');
        setShowNameInput(false);
      } else {
        setMessage(data.message || 'Failed to subscribe');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to subscribe. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const links = [
    {
      heading: 'Company',
      items: [
        { label: 'About Us', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'News', href: '/news' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      heading: 'Products',
      items: [
        { label: 'Diagnostic Equipment', href: '/search?category=Diagnostic+Equipment' },
        { label: 'Surgical Instruments', href: '/search?category=Surgical+Instruments' },
        { label: 'Laboratory Reagents', href: '/search?category=Laboratory+Reagents' },
        { label: 'Hospital Machines', href: '/search?category=Hospital+Machines' },
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
      {/* Main footer content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.5fr] gap-8">
          {/* Link columns */}
          {links.map((col) => (
            <div key={col.heading}>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[#4DDBB8] mb-4 font-[family-name:var(--font-plus-jakarta)]">
                {col.heading}
              </h4>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-[12px] text-white/70 hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Brand column with Newsletter */}
          <div>
            <div className="font-[family-name:var(--font-lora)] text-[24px] font-semibold mb-2">
              MedCore<span className="text-[#0E8A6E]">BD</span>
            </div>
            <p className="text-[12px] text-white/70 mb-4 leading-relaxed">
              Bangladesh's trusted source for premium medical equipment, surgical instruments, and laboratory reagents.
            </p>

            {/* Newsletter Subscribe */}
            <div className="mb-4">
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
                    className="px-4 py-2 bg-[#0E8A6E] text-white text-[12px] font-medium rounded hover:bg-[#0a6b56] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '...' : 'Subscribe'}
                  </button>
                </div>
                
                {!showNameInput && !message && (
                  <button
                    type="button"
                    onClick={() => setShowNameInput(true)}
                    className="text-[10px] text-white/50 hover:text-white/80 transition-colors"
                  >
                    + Add your name (optional)
                  </button>
                )}

                {showNameInput && (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name (optional)"
                    disabled={loading}
                    className="w-full px-3 py-2 text-[12px] bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-[#0E8A6E] disabled:opacity-50"
                  />
                )}

                {message && (
                  <div className={`text-[11px] p-2 rounded ${
                    messageType === 'success' 
                      ? 'bg-[#0E8A6E]/20 text-[#4DDBB8]' 
                      : 'bg-[#E24B4A]/20 text-[#FCA5A5]'
                  }`}>
                    {messageType === 'success' ? '✓' : '✗'} {message}
                  </div>
                )}
              </form>
            </div>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap mb-4">
              <span className="text-[10px] px-2 py-1 rounded border border-[#0E8A6E] text-[#4DDBB8] font-medium">
                DGDA Registered
              </span>
              <span className="text-[10px] px-2 py-1 rounded border border-[#0E8A6E] text-[#4DDBB8] font-medium">
                ISO 13485
              </span>
            </div>

            {/* Contact */}
            <div className="space-y-1">
              <a
                href="https://wa.me/8801700000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[12px] text-white/70 hover:text-white transition-colors"
              >
                <span>📱</span>
                <span>+880 1700-000000 (WhatsApp)</span>
              </a>
              <a
                href="mailto:info@medcorebd.com"
                className="flex items-center gap-2 text-[12px] text-white/70 hover:text-white transition-colors"
              >
                <span>✉️</span>
                <span>info@medcorebd.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-white/50">
            © {currentYear} MedCore Bangladesh Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="text-[11px] text-white/50 hover:text-white/80 transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-[11px] text-white/50 hover:text-white/80 transition-colors">
              Terms of Service
            </a>
            <span className="text-[11px] text-[#4DDBB8] font-medium">DGDA Registered</span>
            <span className="text-[11px] text-[#4DDBB8] font-medium">ISO 13485</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
