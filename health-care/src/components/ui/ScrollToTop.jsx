'use client';

import { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa';
import GA4Tracker from '@/services/GA4Tracker';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 300);
      ticking = false;
    };
    
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(toggleVisibility);
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  const scrollToTop = () => {
    GA4Tracker.trackEvent('scroll_to_top_click', { scroll_position: window.pageYOffset });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`scroll-top-btn ${isVisible ? 'scroll-top-btn--visible' : ''}`}
    >
      <FaArrowUp size={16} />
    </button>
  );
}
