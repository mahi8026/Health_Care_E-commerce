import { useState } from 'react';

/**
 * @param {Object} props
 * @param {Array}   props.images        - Array of image objects {url, publicId, isPrimary, alt}
 * @param {Object}  props.product       - Product object with name
 * @param {Array}   props.badges        - Array of badge label strings
 * @param {boolean} [props.heroPriority=false] - When true, the main (hero)
 *   image is loaded with priority={true} on next/image instances, disabling
 *   lazy loading and triggering a <link rel="preload"> (Requirement 2.4).
 */
export default function ProductGallery({ images = [], product = {}, badges = [], heroPriority = false }) {
  const [activeIndex, setActiveIndex] = useState(
    images.findIndex(img => img.isPrimary) >= 0 ? images.findIndex(img => img.isPrimary) : 0
  );

  const activeImage = images[activeIndex] || null;

  const badgeStyles = {
    'Bestseller': 'bg-[#FAEEDA] text-[#633806]',
    'CE Certified': 'bg-[#EEEDFE] text-[#3C3489]',
    'New arrival': 'bg-[#E1F5EE] text-[#085041]',
    'Sale': 'bg-[#E6F1FB] text-[#0C447C]',
    'CE': 'bg-[#EEEDFE] text-[#3C3489]',
    'FDA': 'bg-[#E1F5EE] text-[#085041]',
    'ISO': 'bg-[#FAEEDA] text-[#633806]',
    'DGDA': 'bg-[#E6F1FB] text-[#0C447C]',
  };

  return (
    <div className="grid grid-cols-[64px_1fr] gap-[10px] mb-5">
      {/* Thumbnails column */}
      <div className="flex flex-col gap-2">
        {images.length > 0 ? images.map((img, idx) => (
          <div
            key={img.publicId || idx}
            onClick={() => setActiveIndex(idx)}
            className={`w-16 h-16 rounded-lg border-[0.5px] ${
              activeIndex === idx
                ? 'border-[#0B2545] border-[1.5px]'
                : 'border-[var(--color-border-tertiary)]'
            } bg-[var(--color-background-secondary)] overflow-hidden cursor-pointer flex-shrink-0`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt || `${product.name} view ${idx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )) : (
          // No images — show 4 placeholder thumbnails
          [0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-16 h-16 rounded-lg border-[0.5px] ${
                i === 0 ? 'border-[#0B2545] border-[1.5px]' : 'border-[var(--color-border-tertiary)]'
              } bg-[var(--color-background-secondary)] flex items-center justify-center text-[20px] cursor-pointer flex-shrink-0`}
            >
              🏥
            </div>
          ))
        )}
      </div>

      {/* Main Image */}
      <div
        className="bg-[var(--color-background-secondary)] rounded-[10px] border-[0.5px] border-[var(--color-border-tertiary)] flex items-center justify-center h-[320px] relative overflow-hidden"
        data-hero-priority={heroPriority ? 'true' : undefined}
      >
        {activeImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.url}
              alt={activeImage.alt || product.name}
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }
              }}
            />
            {/* Fallback for broken image */}
            <div className="hidden absolute inset-0 items-center justify-center text-[80px] text-[#D1D5DB]">
              🏥
            </div>
          </>
        ) : (
          /* Fallback when no images */
          <div className="flex items-center justify-center w-full h-full text-[80px] text-[#D1D5DB]">
            🏥
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-[6px]">
          {badges.map((badge, idx) => (
            <span key={idx} className={`text-[9px] px-2 py-[3px] rounded font-medium ${badgeStyles[badge] || 'bg-[#E6F1FB] text-[#0C447C]'}`}>
              {badge}
            </span>
          ))}
        </div>

        {/* Zoom Button */}
        <button className="absolute top-3 right-3 w-[30px] h-[30px] rounded-[7px] bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] flex items-center justify-center cursor-pointer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
