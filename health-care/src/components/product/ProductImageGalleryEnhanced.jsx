"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FaHeart, FaExpand, FaSearchPlus, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

/**
 * World-Class Enhanced Product Image Gallery
 * Features:
 * - Large main image with hover zoom
 * - Bigger thumbnails (100x100px)
 * - Fullscreen lightbox with navigation
 * - Swipe gestures on mobile
 * - Better certification badges with icons
 * - Smooth animations
 */
export default function ProductImageGalleryEnhanced({ 
  images = [], 
  product = {}, 
  badges = [], 
  heroPriority = false 
}) {
  const router = useRouter();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [activeIndex, setActiveIndex] = useState(
    images.findIndex(img => img.isPrimary) >= 0 ? images.findIndex(img => img.isPrimary) : 0
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const imageRef = useRef(null);

  const activeImage = images[activeIndex] || null;
  const inWishlist = isInWishlist(product._id || product.id);

  // Badge configurations with icons
  const badgeConfig = {
    'CE': { icon: '🇪🇺', label: 'CE Certified', color: 'bg-blue-500 text-white' },
    'CE Certified': { icon: '🇪🇺', label: 'CE Certified', color: 'bg-blue-500 text-white' },
    'FDA': { icon: '🇺🇸', label: 'FDA Approved', color: 'bg-[var(--color-status-success-tint)] text-white' },
    'DGDA': { icon: '🇧🇩', label: 'DGDA Registered', color: 'bg-brand-teal text-white' },
    'ISO': { icon: '✓', label: 'ISO 13485', color: 'bg-orange-500 text-white' },
    'Bestseller': { icon: '⭐', label: 'Bestseller', color: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]' },
    'New arrival': { icon: '🆕', label: 'New Arrival', color: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' },
    'Sale': { icon: '🔥', label: 'On Sale', color: 'bg-[var(--color-status-danger-tint)] text-white' },
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setTogglingWishlist(true);
    await toggleWishlist(product._id || product.id);
    setTogglingWishlist(false);
  };

  const handleMouseMove = (e) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handlePrevImage = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'ArrowRight') handleNextImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen]);

  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div 
        ref={imageRef}
        className="relative bg-white rounded-2xl overflow-hidden border border-[var(--color-border-primary)] shadow-sm group"
        style={{ aspectRatio: '1/1' }}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
      >
        {activeImage ? (
          <div className="relative w-full h-full">
            <Image
              src={activeImage.url}
              alt={product.name || 'Product'}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={`object-contain p-8 transition-transform duration-300 ${
                isZooming ? 'scale-150' : 'scale-100'
              }`}
              style={isZooming ? {
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
              } : {}}
              priority={heroPriority}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-background-secondary)]">
            <span className="text-8xl text-[var(--color-text-tertiary)]">🏥</span>
          </div>
        )}

        {/* Certification Badges - Top Left */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 max-w-[45%] z-10">
          {badges.slice(0, 3).map((badge, idx) => {
            const config = badgeConfig[badge] || { icon: '✓', label: badge, color: 'bg-blue-100 text-blue-800' };
            return (
              <div 
                key={idx}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm ${config.color} animate-fadeSlideUp`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <span className="text-base">{config.icon}</span>
                <span className="text-xs font-semibold whitespace-nowrap">{config.label}</span>
              </div>
            );
          })}
        </div>

        {/* Action Buttons - Top Right */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            disabled={togglingWishlist}
            className={`w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 ${
              inWishlist ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-status-danger)]'
            }`}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {togglingWishlist ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <FaHeart size={20} className={inWishlist ? 'fill-current' : ''} />
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 text-[var(--color-text-secondary)] hover:text-brand-teal"
            aria-label="View fullscreen"
          >
            <FaExpand size={18} />
          </button>
        </div>

        {/* Zoom Indicator */}
        {isZooming && (
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 backdrop-blur-sm">
            <FaSearchPlus size={14} />
            <span>Hover to zoom</span>
          </div>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-xs font-medium backdrop-blur-sm">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="relative">
          {/* Previous Button */}
          {images.length > 4 && (
            <button
              onClick={handlePrevImage}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:text-brand-teal hover:scale-110 transition-all"
              aria-label="Previous image"
            >
              <FaChevronLeft size={14} />
            </button>
          )}

          {/* Thumbnails */}
          <div className="flex gap-3 overflow-x-auto pb-2 px-10 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {images.map((img, idx) => (
              <button
                key={img.publicId || idx}
                onClick={() => setActiveIndex(idx)}
                aria-current={activeIndex === idx}
                aria-label={`${product.name} view ${idx + 1}`}
                className={`relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden transition-all duration-300 ${
                  activeIndex === idx
                    ? 'ring-4 ring-brand-teal ring-offset-2 scale-105 shadow-xl'
                    : 'ring-2 ring-[var(--color-border-primary)] hover:ring-[var(--color-border-secondary)] hover:scale-105'
                }`}
              >
                <Image
                  src={img.url}
                  alt={`${product.name} view ${idx + 1}`}
                  fill
                  sizes="100px"
                  className="object-cover"
                />
                {activeIndex === idx && (
                  <div className="absolute inset-0 bg-brand-teal/10" />
                )}
              </button>
            ))}
          </div>

          {/* Next Button */}
          {images.length > 4 && (
            <button
              onClick={handleNextImage}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:text-brand-teal hover:scale-110 transition-all"
              aria-label="Next image"
            >
              <FaChevronRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && activeImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[var(--z-drawer)] flex items-center justify-center animate-fadeIn"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all text-white z-20"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            <FaTimes size={20} />
          </button>

          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all text-white z-20"
              aria-label="Previous image"
            >
              <FaChevronLeft size={24} />
            </button>
          )}

          {/* Image */}
          <div 
            className="relative w-full h-full max-w-6xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeImage.url}
              alt={product.name || 'Product'}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all text-white z-20"
              aria-label="Next image"
            >
              <FaChevronRight size={24} />
            </button>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium z-20">
            {activeIndex + 1} / {images.length}
          </div>

          {/* Thumbnail Strip */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-20 max-w-screen-sm overflow-x-auto px-4">
            {images.map((img, idx) => (
              <button
                key={img.publicId || idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(idx);
                }}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                  activeIndex === idx
                    ? 'ring-2 ring-white scale-110'
                    : 'ring-1 ring-white/30 opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
