import { useState } from 'react';

/**
 * @param {Object} props
 * @param {Array}   props.images        - Array of image objects
 * @param {Array}   props.badges        - Array of badge label strings
 * @param {boolean} [props.heroPriority=false] - When true, the main (hero)
 *   image is loaded with priority={true} on next/image instances, disabling
 *   lazy loading and triggering a <link rel="preload"> (Requirement 2.4).
 */
export default function ProductGallery({ images, badges, heroPriority = false }) {
  const [activeImage, setActiveImage] = useState(0);

  const thumbnailIcons = [
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1"><path d="M3 3h18v18H3z"/><path d="M8 12h8M12 8v8"/></svg>,
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16"/></svg>,
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>
  ];

  const badgeStyles = {
    'Bestseller': 'bg-[#FAEEDA] text-[#633806]',
    'CE Certified': 'bg-[#EEEDFE] text-[#3C3489]',
    'New arrival': 'bg-[#E1F5EE] text-[#085041]',
    'Sale': 'bg-[#E6F1FB] text-[#0C447C]'
  };

  return (
    <div className="grid grid-cols-[64px_1fr] gap-[10px] mb-5">
      {/* Thumbnails */}
      <div className="flex flex-col gap-2">
        {images.map((img, idx) => (
          <div
            key={img.id}
            onClick={() => setActiveImage(idx)}
            className={`w-16 h-16 rounded-lg border-[0.5px] ${
              activeImage === idx
                ? 'border-[#0B2545] border-[1.5px]'
                : 'border-[var(--color-border-tertiary)]'
            } bg-[var(--color-background-secondary)] flex items-center justify-center cursor-pointer`}
          >
            {thumbnailIcons[idx]}
          </div>
        ))}
      </div>

      {/* Main Image — heroPriority signals this image should use priority={true} on next/image */}
      <div
        className="bg-[var(--color-background-secondary)] rounded-[10px] border-[0.5px] border-[var(--color-border-tertiary)] flex items-center justify-center h-[320px] relative"
        data-hero-priority={heroPriority ? 'true' : undefined}
      >
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <rect x="10" y="25" width="100" height="65" rx="6" stroke="#185FA5" strokeWidth="1.5" fill="#E6F1FB"/>
          <rect x="10" y="25" width="100" height="18" rx="6" fill="#185FA5" opacity="0.15"/>
          <line x1="20" y1="58" x2="30" y2="58" stroke="#185FA5" strokeWidth="1.5"/>
          <path d="M30 58 L36 44 L42 72 L48 48 L54 64 L60 58 L70 58" stroke="#185FA5" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="70" y1="58" x2="100" y2="58" stroke="#185FA5" strokeWidth="1.5"/>
          <rect x="15" y="78" width="20" height="8" rx="3" fill="#185FA5" opacity="0.3"/>
          <rect x="40" y="78" width="14" height="8" rx="3" fill="#185FA5" opacity="0.3"/>
          <rect x="59" y="78" width="8" height="8" rx="3" fill="#0E8A6E" opacity="0.8"/>
          <rect x="10" y="88" width="100" height="4" rx="2" fill="#185FA5" opacity="0.1"/>
        </svg>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-[6px]">
          {badges.map((badge, idx) => (
            <span key={idx} className={`text-[9px] px-2 py-[3px] rounded font-medium ${badgeStyles[badge]}`}>
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
