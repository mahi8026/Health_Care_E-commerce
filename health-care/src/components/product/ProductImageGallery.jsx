"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

/**
 * Redesigned Product Image Gallery Component
 * Features: Main image with zoom, thumbnail strip, certification badges, wishlist button
 */
export default function ProductImageGallery({ 
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
  const [isZoomed, setIsZoomed] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  const activeImage = images[activeIndex] || null;
  const inWishlist = isInWishlist(product._id || product.id);

  const badgeColors = {
    'CE': 'bg-[#3B82F6] text-white',
    'CE Certified': 'bg-[#3B82F6] text-white',
    'FDA': 'bg-[#10B981] text-white',
    'DGDA': 'bg-[#0E8A6E] text-white',
    'ISO': 'bg-[#F59E0B] text-white',
    'Bestseller': 'bg-[#FAEEDA] text-[#633806]',
    'New arrival': 'bg-[#E1F5EE] text-[#085041]',
    'Sale': 'bg-[#E24B4A] text-white',
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

  const handleZoomClick = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="mb-6">
      {/* Mobile: Full width image */}
      <div className="md:hidden">
        <div
          className="bg-surface-subtle rounded-[16px] flex items-center justify-center h-[300px] relative overflow-hidden transition-transform duration-200 hover:scale-[1.02]"
          data-hero-priority={heroPriority ? 'true' : undefined}
        >
          {activeImage ? (
            <>
              <Image
                src={activeImage.url}
                alt={activeImage.alt || product.name}
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-contain p-4"
                onClick={handleZoomClick}
                priority={heroPriority}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement?.nextElementSibling) {
                    e.currentTarget.parentElement.nextElementSibling.style.display = 'flex';
                  }
                }}
              />
              <div className="hidden absolute inset-0 items-center justify-center text-[80px] text-[#D1D5DB]">
                🏥
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-[80px] text-[#D1D5DB]">
              🏥
            </div>
          )}

          {/* Certification Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-[6px] max-w-[50%]">
            {badges.map((badge, idx) => (
              <span 
                key={idx} 
                className={`text-[10px] px-[10px] py-[4px] rounded-full font-semibold shadow-sm ${badgeColors[badge] || 'bg-[#E6F1FB] text-[#0C447C]'}`}
              >
                {badge}
              </span>
            ))}
          </div>

          {/* Wishlist Button - Top Right */}
          <button
            onClick={handleToggleWishlist}
            disabled={togglingWishlist}
            className="absolute top-3 right-3 w-[36px] h-[36px] rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {togglingWishlist ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill={inWishlist ? '#E24B4A' : 'none'} stroke={inWishlist ? '#E24B4A' : '#6B7280'} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
            )}
          </button>

          {/* Zoom Button - Bottom Right */}
          <button 
            onClick={handleZoomClick}
            className="absolute bottom-3 right-3 w-[36px] h-[36px] rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform"
            aria-label="Zoom image"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </div>

        {/* Thumbnail dots indicator */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  activeIndex === idx ? 'bg-[#0E8A6E] w-6' : 'bg-[#E5E7EB] w-2'
                }`}
                aria-label={`View image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Main Image with Thumbnails */}
      <div className="hidden md:block">
        {/* Main Image */}
        <div
          className="bg-surface-subtle rounded-[16px] flex items-center justify-center h-[420px] relative overflow-hidden mb-4 group cursor-zoom-in"
          data-hero-priority={heroPriority ? 'true' : undefined}
          onClick={handleZoomClick}
        >
          {activeImage ? (
            <>
              <Image
                src={activeImage.url}
                alt={activeImage.alt || product.name}
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-contain p-6"
                priority={heroPriority}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement?.nextElementSibling) {
                    e.currentTarget.parentElement.nextElementSibling.style.display = 'flex';
                  }
                }}
              />
              <div className="hidden absolute inset-0 items-center justify-center text-[100px] text-[#D1D5DB]">
                🏥
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-[100px] text-[#D1D5DB]">
              🏥
            </div>
          )}

          {/* Certification Badges - Top Left */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-[40%]">
            {badges.map((badge, idx) => (
              <span 
                key={idx} 
                className={`text-[11px] px-3 py-[5px] rounded-full font-semibold shadow-md ${badgeColors[badge] || 'bg-[#E6F1FB] text-[#0C447C]'}`}
              >
                {badge}
              </span>
            ))}
          </div>

          {/* Wishlist Button - Top Right */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleWishlist();
            }}
            disabled={togglingWishlist}
            className="absolute top-4 right-4 w-[40px] h-[40px] rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {togglingWishlist ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill={inWishlist ? '#E24B4A' : 'none'} stroke={inWishlist ? '#E24B4A' : '#6B7280'} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
            )}
          </button>

          {/* Zoom Button - Bottom Right */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleZoomClick();
            }}
            className="absolute bottom-4 right-4 w-[40px] h-[40px] rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
            aria-label="Zoom image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </div>

        {/* Thumbnail Strip */}
        <div className="flex gap-3 overflow-x-auto pb-2" style={{WebkitOverflowScrolling: 'touch'}}>
          {images.length > 0 ? images.map((img, idx) => (
            <button
              key={img.publicId || idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden transition-all ${
                activeIndex === idx
                  ? 'ring-2 ring-[#0E8A6E] ring-offset-2'
                  : 'ring-1 ring-[#E5E7EB] hover:ring-[#0B2545]'
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt || `${product.name} view ${idx + 1}`}
                fill
                sizes="64px"
                className="object-cover bg-surface-subtle"
              />
            </button>
          )) : (
            [0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-16 h-16 rounded-lg flex-shrink-0 bg-surface-subtle flex items-center justify-center text-[20px] cursor-pointer transition-all ${
                  i === 0 ? 'ring-2 ring-[#0E8A6E] ring-offset-2' : 'ring-1 ring-[#E5E7EB]'
                }`}
              >
                🏥
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isZoomed && activeImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-[9999] flex items-center justify-center p-4"
          onClick={handleZoomClick}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
            onClick={handleZoomClick}
            aria-label="Close zoom"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div className="relative w-full h-full max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={activeImage.url}
              alt={activeImage.alt || product.name}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
