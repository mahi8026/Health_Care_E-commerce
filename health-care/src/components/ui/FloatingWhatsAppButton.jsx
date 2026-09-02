'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { FaWhatsapp, FaTimes } from 'react-icons/fa';
import { CONTACT } from '@/constants/api';
import ChatButton from '@/components/chat/ChatButton';

// Lazy-load the full chat widget only when opened
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), { ssr: false, loading: () => null });

/**
 * Unified floating action button group — WhatsApp + Live Chat.
 * Both buttons live inside one fixed container so they never overlap.
 */
export default function FloatingWhatsAppButton() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Attention bounce on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 1000);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const getWhatsAppMessage = () => {
    const base = 'Hello MediportBD! ';
    if (pathname?.includes('/products/')) {
      const name = pathname.split('/').pop();
      return encodeURIComponent(`${base}I'm viewing a product (${name}) and need assistance.`);
    }
    if (pathname === '/cart')     return encodeURIComponent(`${base}I need help with my cart.`);
    if (pathname === '/checkout') return encodeURIComponent(`${base}I need help with checkout.`);
    if (pathname?.includes('/orders')) return encodeURIComponent(`${base}I need help with my order.`);
    if (pathname === '/b2b')      return encodeURIComponent(`${base}I'm interested in B2B services.`);
    return encodeURIComponent(`${base}I need assistance.`);
  };

  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${CONTACT.whatsapp}?text=${getWhatsAppMessage()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'whatsapp_click', { page_path: pathname, event_category: 'engagement' });
    }
  };

  const handleChatToggle = () => {
    setChatOpen(o => !o);
    if (!chatOpen) setUnreadCount(0);
  };

  return (
    <>
      {/* Single fixed container — both buttons stacked, right side */}
      <div
        className="fixed bottom-[96px] right-3 md:bottom-8 md:right-5 z-dropdown flex flex-col items-end gap-3"
        style={{ pointerEvents: 'none' }}
      >
        {/* Tooltip (desktop hover) */}
        {showTooltip && (
          <div
            className="animate-fadeSlideUp bg-white rounded-2xl shadow-lg p-4 border border-[var(--color-border-primary)]"
            style={{ pointerEvents: 'auto', width: 220 }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-[var(--color-text-primary)] text-sm mb-1">Need Help?</h4>
                <p className="text-xs text-[var(--color-text-secondary)]">Chat with us on WhatsApp</p>
              </div>
              <button
                onClick={() => setShowTooltip(false)}
                className="text-[var(--color-text-secondary)] transition-colors"
                aria-label="Close tooltip"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="space-y-1.5 text-xs text-[var(--color-text-primary)] mb-3">
              {['Quick product inquiries', 'Order tracking & support', 'B2B bulk pricing'].map(t => (
                <div key={t} className="flex items-center gap-2">
                  <span className="text-[var(--color-status-success)]">✓</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleWhatsAppClick}
              className="w-full py-2 px-4 bg-[var(--color-status-success-tint)] rounded-xl font-semibold text-sm transition-all hover:shadow-lg"
              style={{ pointerEvents: 'auto' }}
            >
              Start Chat
            </button>
          </div>
        )}

        {/* Live Chat button */}
        {!chatOpen && (
          <div style={{ pointerEvents: 'auto' }}>
            <ChatButton onClick={handleChatToggle} unreadCount={unreadCount} />
          </div>
        )}

        {/* WhatsApp button */}
        <button
          onClick={handleWhatsAppClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`group relative w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-[var(--color-status-success)] to-[var(--color-status-success)] rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 ${bounce ? 'animate-bounce' : ''}`}
          aria-label="Chat on WhatsApp"
          style={{ pointerEvents: 'auto' }}
        >
          <span className="absolute inset-0 rounded-full bg-[var(--color-status-success-tint)] animate-ping opacity-20"></span>
          <FaWhatsapp size={20} className="text-white relative z-10 group-hover:scale-110 transition-transform" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-success border-2 border-white rounded-full animate-pulse"></span>
          <span className="hidden md:block absolute right-14 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
            Chat on WhatsApp
            <span className="absolute top-1/2 -translate-y-1/2 right-[-8px] w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-gray-900"></span>
          </span>
        </button>
      </div>

      {/* Chat widget — rendered outside the group so it can take full screen on mobile */}
      {chatOpen && <ChatWidget onClose={handleChatToggle} />}
    </>
  );
}
