'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

/**
 * AutoSlider Component - Inspired by GoWell BD
 * 
 * Features:
 * - Smooth auto-scrolling with configurable interval
 * - Manual navigation with prev/next arrows
 * - Pause on hover
 * - Responsive design (mobile: 2 items, tablet: 3 items, desktop: 4-6 items)
 * - Smooth scroll animation
 * - Touch/swipe support on mobile
 * 
 * @param {Object} props
 * @param {React.ReactNode[]} props.children - Array of items to display
 * @param {number} [props.autoPlayInterval=4000] - Auto-scroll interval in ms
 * @param {number} [props.itemsToShow=4] - Number of items visible on desktop
 * @param {number} [props.itemsToScroll=1] - Number of items to scroll per action
 * @param {string} [props.gap='16px'] - Gap between items
 * @param {boolean} [props.pauseOnHover=true] - Pause auto-scroll on hover
 * @param {boolean} [props.showArrows=true] - Show navigation arrows
 * @param {boolean} [props.loop=true] - Enable infinite loop
 */
export default function AutoSlider({
  children,
  autoPlayInterval = 4000,
  itemsToShow = 4,
  itemsToScroll = 1,
  gap = '16px',
  pauseOnHover = true,
  showArrows = true,
  loop = true,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const sliderRef = useRef(null);
  const autoPlayRef = useRef(null);

  const items = Array.isArray(children) ? children : [children];
  const totalItems = items.length;

  // Calculate how many items are visible based on viewport
  const getVisibleItems = useCallback(() => {
    if (typeof window === 'undefined') return itemsToShow;
    const width = window.innerWidth;
    if (width < 640) return 2; // Mobile
    if (width < 768) return 3; // Small tablet
    if (width < 1024) return 4; // Tablet
    if (width < 1280) return 5; // Small desktop
    return itemsToShow; // Large desktop (6)
  }, [itemsToShow]);

  const [visibleItems, setVisibleItems] = useState(getVisibleItems());

  // Update visible items on resize
  useEffect(() => {
    const handleResize = () => setVisibleItems(getVisibleItems());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getVisibleItems]);

  const maxIndex = Math.max(0, totalItems - visibleItems);

  // Navigate to specific index
  const goToIndex = useCallback((index) => {
    if (index < 0) {
      setCurrentIndex(loop ? maxIndex : 0);
    } else if (index > maxIndex) {
      setCurrentIndex(loop ? 0 : maxIndex);
    } else {
      setCurrentIndex(index);
    }
  }, [maxIndex, loop]);

  // Navigation handlers
  const goToNext = useCallback(() => {
    goToIndex(currentIndex + itemsToScroll);
  }, [currentIndex, itemsToScroll, goToIndex]);

  const goToPrev = useCallback(() => {
    goToIndex(currentIndex - itemsToScroll);
  }, [currentIndex, itemsToScroll, goToIndex]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlayInterval || totalItems <= visibleItems) return;

    const play = () => {
      if (!isHovered || !pauseOnHover) {
        goToNext();
      }
    };

    autoPlayRef.current = setInterval(play, autoPlayInterval);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlayInterval, isHovered, pauseOnHover, totalItems, visibleItems, goToNext]);

  // Touch handlers for mobile swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };

    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('keydown', handleKeyDown);
      return () => slider.removeEventListener('keydown', handleKeyDown);
    }
  }, [goToPrev, goToNext]);

  if (totalItems === 0) {
    return null;
  }

  const translateX = -(currentIndex * (100 / visibleItems));
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;

  return (
    <div 
      ref={sliderRef}
      className="auto-slider-container"
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
      role="region"
      aria-label="Auto-scrolling carousel"
    >
      {/* Slider Track */}
      <div
        className="auto-slider-track"
        style={{
          display: 'flex',
          transform: `translateX(${translateX}%)`,
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
        }}
      >
        {items.map((child, index) => (
          <div
            key={index}
            className="auto-slider-item"
            style={{
              flex: `0 0 calc(${100 / visibleItems}%)`,
              minWidth: 0,
              paddingRight: index < items.length - 1 ? gap : '0',
            }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && totalItems > visibleItems && (
        <>
          {/* Previous Button */}
          <button
            onClick={goToPrev}
            disabled={!loop && !canGoPrev}
            className="auto-slider-arrow auto-slider-arrow-prev"
            style={{
              position: 'absolute',
              left: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              border: '1px solid var(--color-border-primary)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.2s',
              opacity: (!loop && !canGoPrev) ? 0.3 : 0,
              pointerEvents: (!loop && !canGoPrev) ? 'none' : 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-brand-teal)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.color = 'var(--color-text-primary)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
            aria-label="Previous items"
          >
            <FaChevronLeft size={18} />
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            disabled={!loop && !canGoNext}
            className="auto-slider-arrow auto-slider-arrow-next"
            style={{
              position: 'absolute',
              right: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              border: '1px solid var(--color-border-primary)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.2s',
              opacity: (!loop && !canGoNext) ? 0.3 : 0,
              pointerEvents: (!loop && !canGoNext) ? 'none' : 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-brand-teal)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.color = 'var(--color-text-primary)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
            aria-label="Next items"
          >
            <FaChevronRight size={18} />
          </button>
        </>
      )}

      {/* Progress Dots (optional - shows on mobile) */}
      {totalItems > visibleItems && (
        <div
          className="auto-slider-dots"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '12px',
          }}
        >
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className="auto-slider-dot"
              style={{
                width: currentIndex === index ? '16px' : '6px',
                height: '6px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: currentIndex === index 
                  ? 'var(--color-brand-teal)' 
                  : '#D1D5DB',
                cursor: 'pointer',
                transition: 'all 0.3s',
                padding: 0,
              }}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={currentIndex === index ? 'true' : 'false'}
            />
          ))}
        </div>
      )}

      {/* Hover styles */}
      <style jsx>{`
        .auto-slider-container:hover .auto-slider-arrow {
          opacity: 1 !important;
        }
        
        @media (max-width: 640px) {
          .auto-slider-arrow {
            display: none !important;
          }
        }

        @media (min-width: 641px) {
          .auto-slider-dots {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
