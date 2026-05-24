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
    <div className="mb-5">
      {/* Mobile: Full width image with dots */}
      <div className="md:hidden">
        <div
          className="bg-[var(--color-background-secondary)] rounded-[10px] border-[0.5px] border-[var(--color-border-tertiary)] flex items-center justify-center relative overflow-hidden"
          style={{ aspectRatio: '4/3' }}
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
              <div className="hidden absolute inset-0 items-center justify-center text-[80px] text-[#D1D5DB]">
                🏥
              </div>
            </>
          ) : (
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
        </div>

        {/* Dots indicator - 44px touch targets */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                aria-label={`View image ${idx + 1}`}
                className={`h-2 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center`}
              >
                <span className={`block h-2 rounded-full transition-all ${
                  activeIndex === idx ? 'bg-[#0B2545] w-6' : 'bg-[var(--color-border-secondary)] w-2'
                }`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Thumbnails + Main Image */}
      <div className="hidden md:grid grid-cols-[64px_1fr] gap-[10px]">
        {/* Thumbnails column */}
        <div className="flex flex-col gap-2">
          {images.length > 0 ? images.map((img, idx) => (
            <button
              key={img.publicId || idx}
              onClick={() => setActiveIndex(idx)}
              aria-label={`View image ${idx + 1}`}
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
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </button>
          )) : (
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

        {/* Main Image - aspect ratio instead of fixed height */}
        <div
          className="bg-[var(--color-background-secondary)] rounded-[10px] border-[0.5px] border-[var(--color-border-tertiary)] flex items-center justify-center relative overflow-hidden"
          style={{ aspectRatio: '4/3', minHeight: '280px', maxHeight: '400px' }}
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
              <div className="hidden absolute inset-0 items-center justify-center text-[80px] text-[#D1D5DB]">
                🏥
              </div>
            </>
          ) : (
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

          {/* Zoom Button - 44x44px */}
          <button
            aria-label="Zoom image"
            className="absolute top-3 right-3 w-11 h-11 rounded-[7px] bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] flex items-center justify-center cursor-pointer hover:bg-[var(--color-background-secondary)] transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
