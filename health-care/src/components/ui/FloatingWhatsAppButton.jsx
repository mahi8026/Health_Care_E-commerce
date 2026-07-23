'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FaWhatsapp, FaTimes } from 'react-icons/fa';
import { CONTACT } from '@/constants/api';

/**
 * Floating WhatsApp Button
 * Features:
 * - Always visible for customer support
 * - Pre-filled messages based on current page
 * - Expandable info tooltip
 * - Smooth animations
 * - Mobile optimized
 */
export default function FloatingWhatsAppButton() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(false);
  const [bounce, setBounce] = useState(false);

  // Bounce animation on mount to catch attention
  useEffect(() => {
    const timer = setTimeout(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 1000);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Generate context-aware WhatsApp message
  const getWhatsAppMessage = () => {
    const baseMessage = "Hello MediportBD! ";
    
    // Check if on product page
    if (pathname?.includes('/products/')) {
      const productName = pathname.split('/').pop();
      return encodeURIComponent(
        `${baseMessage}I'm viewing a product (${productName}) and need assistance.`
      );
    }
    
    // Check if on specific pages
    if (pathname === '/cart') {
      return encodeURIComponent(`${baseMessage}I need help with my cart.`);
    }
    
    if (pathname === '/checkout') {
      return encodeURIComponent(`${baseMessage}I need help with checkout.`);
    }
    
    if (pathname?.includes('/orders')) {
      return encodeURIComponent(`${baseMessage}I need help with my order.`);
    }
    
    if (pathname === '/b2b') {
      return encodeURIComponent(`${baseMessage}I'm interested in B2B services.`);
    }
    
    // Default message
    return encodeURIComponent(`${baseMessage}I need assistance.`);
  };

  const handleClick = () => {
    const message = getWhatsAppMessage();
    const whatsappURL = `https://wa.me/${CONTACT.whatsapp}?text=${message}`;
    window.open(whatsappURL, '_blank', 'noopener,noreferrer');
    
    // Track analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'whatsapp_click', {
        page_path: pathname,
        event_category: 'engagement',
        event_label: 'Floating WhatsApp Button'
      });
    }
  };

  return (
    <div className="fixed bottom-24 left-4 md:bottom-6 md:right-6 md:left-auto z-[900] flex flex-col items-start md:items-end gap-3">
      {/* Tooltip */}
      {showTooltip && (
        <div className="animate-fadeSlideUp bg-white rounded-2xl shadow-2xl p-4 max-w-xs border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">Need Help?</h4>
              <p className="text-xs text-gray-600">Chat with us on WhatsApp</p>
            </div>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close tooltip"
            >
              <FaTimes size={14} />
            </button>
          </div>
          
          <div className="space-y-2 text-xs text-gray-700 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Quick product inquiries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Order tracking & support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>B2B bulk pricing</span>
            </div>
          </div>
          
          <button
            onClick={handleClick}
            className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm transition-all hover:shadow-lg"
          >
            Start Chat
          </button>
        </div>
      )}

      {/* Main WhatsApp Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`group relative w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-green-500/50 hover:scale-110 transition-all duration-300 ${
          bounce ? 'animate-bounce' : ''
        }`}
        aria-label="Chat on WhatsApp"
      >
        {/* Pulsing ring effect */}
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20"></span>
        
        {/* WhatsApp icon */}
        <FaWhatsapp 
          size={28} 
          className="text-white relative z-10 group-hover:scale-110 transition-transform" 
        />
        
        {/* Online indicator */}
        <span className="absolute top-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></span>
        
        {/* Hover text - desktop only */}
        <span className="hidden md:block absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
          Chat on WhatsApp
          <span className="absolute top-1/2 -translate-y-1/2 right-[-8px] w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-gray-900"></span>
        </span>
      </button>
    </div>
  );
}
