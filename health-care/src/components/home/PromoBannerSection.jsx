'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaArrowRight } from 'react-icons/fa';

/**
 * PromoBannerSection Component - GoWell BD Style
 * 
 * Displays promotional banners integrated with product grid
 * LEFT COLUMN: 2 large stacked promotional banners (50% height each)
 * RIGHT COLUMNS: Regular product grid
 * 
 * Layout:
 * - Desktop: 1 promo column (300px) + product grid
 * - Tablet: Full-width banners above products
 * - Mobile: Horizontal scroll banners
 */
export default function PromoBannerSection({ children }) {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch promotional banners from settings or use fallback
    const fetchBanners = async () => {
      try {
        // You can add API call here to fetch dynamic banners
        // For now, using static promotional content
        setBanners(PROMO_BANNERS);
      } catch (error) {
        console.error('[PromoBannerSection] Failed to load banners:', error);
        setBanners(PROMO_BANNERS);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const handleBannerClick = (banner) => {
    if (banner.link) {
      router.push(banner.link);
    }
  };

  if (loading || banners.length === 0) {
    return null;
  }

  return (
    <section
      className="promo-banner-section"
      style={{
        padding: '0',
        background: '#fff',
      }}
    >
      {/* Desktop: Banners stacked vertically in left column */}
      <div 
        className="promo-banners-desktop"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {banners.slice(0, 2).map((banner, index) => (
          <div
            key={index}
            onClick={() => handleBannerClick(banner)}
            className="promo-banner-card"
            style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: banner.bgColor || '#f8f9fa',
              height: '400px',
              transition: 'all 0.3s ease',
              border: '1px solid #e5e7eb',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Background/Model Image */}
            {banner.image && (
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
              }}>
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  style={{ objectFit: 'cover', objectPosition: banner.imagePosition || 'center' }}
                  sizes="400px"
                  priority={index === 0}
                />
              </div>
            )}

            {/* Content Overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              padding: '24px',
              background: banner.overlay || 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 50%, transparent 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              {/* Top Content */}
              <div>
                {/* Brand Logo */}
                {banner.logo && (
                  <div style={{
                    marginBottom: '16px',
                  }}>
                    <img 
                      src={banner.logo} 
                      alt="Brand" 
                      style={{ height: '32px', width: 'auto' }}
                    />
                  </div>
                )}

                {/* Title */}
                <h3 style={{
                  fontSize: banner.titleSize || '22px',
                  fontWeight: 700,
                  color: banner.titleColor || '#1F2937',
                  marginBottom: '8px',
                  lineHeight: 1.3,
                  maxWidth: '70%',
                }}>
                  {banner.title}
                </h3>

                {/* Subtitle */}
                {banner.subtitle && (
                  <p style={{
                    fontSize: '14px',
                    color: banner.subtitleColor || '#6B7280',
                    marginBottom: '12px',
                    lineHeight: 1.5,
                    maxWidth: '70%',
                  }}>
                    {banner.subtitle}
                  </p>
                )}

                {/* Feature List with Icons */}
                {banner.features && banner.features.length > 0 && (
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 16px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    maxWidth: '70%',
                  }}>
                    {banner.features.map((feature, i) => (
                      <li key={i} style={{
                        fontSize: '13px',
                        color: banner.featureColor || '#374151',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                      }}>
                        <span style={{
                          color: 'var(--color-brand-teal)',
                          fontSize: '16px',
                          flexShrink: 0,
                          marginTop: '1px',
                        }}>✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Bottom: Website URL */}
              {banner.website && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'var(--color-brand-teal)',
                  borderRadius: '20px',
                  alignSelf: 'flex-start',
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#fff',
                  }} />
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#fff',
                  }}>
                    {banner.website}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .promo-banners-desktop {
            flex-direction: row !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            gap: 12px !important;
            padding: 0 20px 16px !important;
            margin-bottom: 24px !important;
          }

          .promo-banners-desktop::-webkit-scrollbar {
            display: none;
          }

          .promo-banner-card {
            flex: 0 0 90% !important;
            scroll-snap-align: start !important;
            min-width: 300px !important;
            height: 350px !important;
          }
        }

        @media (min-width: 769px) {
          .promo-banner-section {
            margin-bottom: 40px;
          }
        }
      `}</style>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMOTIONAL BANNERS DATA - GoWell BD Style
// ══════════════════════════════════════════════════════════════════════════════

const PROMO_BANNERS = [
  {
    title: 'মার্চ মাসে নিন বিশেষ ইনফ্রারেড থেরাপি',
    subtitle: 'যন্ত্রণামুক্ত সুস্থ জীবনের প্রথম ধাপ',
    logo: null, // Add GoWell logo URL here
    features: [
      'Drug Processing-এর ঘাতে',
      'Adjustable Stand & Angle',
      'Heat & Light Mode',
      'Perfect Head & Muscle Relaxation'
    ],
    website: 'gowellbd.com',
    link: '/products?category=Physiotherapy & Rehabilitation',
    bgColor: '#FFF5F5',
    titleColor: '#7C2D12',
    subtitleColor: '#92400E',
    featureColor: '#451A03',
    image: '/images/promo/infrared-lamp-lady.jpg', // Woman with infrared lamp
    imagePosition: 'right center',
    overlay: 'linear-gradient(90deg, rgba(255,245,245,0.98) 0%, rgba(255,245,245,0.85) 50%, transparent 100%)',
  },
  {
    title: 'Plastic Medicine Box',
    subtitle: 'আপনার প্রয়োজন বাড়িতে থাকুক',
    logo: null,
    features: [
      'Small & Pocket Fit',
      'Secure Snap Lock',
      'Travel Friendly'
    ],
    website: 'gowellbd.com',
    link: '/products?search=medicine box',
    bgColor: '#F0F9FF',
    titleColor: '#0C4A6E',
    subtitleColor: '#075985',
    featureColor: '#0369A1',
    image: '/images/promo/medicine-box-model.jpg', // Woman showing medicine box
    imagePosition: 'right bottom',
    overlay: 'linear-gradient(90deg, rgba(240,249,255,0.98) 0%, rgba(240,249,255,0.85) 50%, transparent 100%)',
  },
];

