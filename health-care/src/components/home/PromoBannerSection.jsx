'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

/**
 * PromoBannerSection Component - GoWell BD Professional Style
 * 
 * Large horizontal promotional banners placed between product sections
 * Features lifestyle images, Bengali text, feature lists
 * 
 * Layout: 3-column grid on desktop, horizontal scroll on mobile
 */
export default function PromoBannerSection() {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch promotional banners from settings or use fallback
    const fetchBanners = async () => {
      try {
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
        padding: '40px 0',
        background: '#fff',
      }}
    >
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 20px',
      }}>
        {/* 3-Column Grid on Desktop, Horizontal Scroll on Mobile */}
        <div 
          className="promo-banners-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}
        >
          {banners.map((banner, index) => (
            <div
              key={index}
              onClick={() => handleBannerClick(banner)}
              className="promo-banner-card"
              style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: 'pointer',
                background: banner.bgColor || '#f8f9fa',
                height: '420px',
                transition: 'all 0.3s ease',
                border: '1px solid #e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Background Image - Model/Lifestyle Photo */}
              {banner.image && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 1,
                }}>
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    style={{ objectFit: 'cover', objectPosition: banner.imagePosition || 'center' }}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority={index === 0}
                  />
                </div>
              )}

              {/* Content Overlay - Left Side for Text */}
              <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                padding: '28px',
                background: banner.overlay || 'linear-gradient(90deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.88) 45%, transparent 75%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                {/* Top: Brand Logo */}
                {banner.logo && (
                  <div style={{ marginBottom: '16px' }}>
                    <Image 
                      src={banner.logo} 
                      alt="Brand Logo" 
                      width={80}
                      height={32}
                      style={{ width: 'auto', height: '32px' }}
                    />
                  </div>
                )}

                {/* Middle: Title, Subtitle, Features */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '65%' }}>
                  {/* Title */}
                  <h3 style={{
                    fontSize: banner.titleSize || '20px',
                    fontWeight: 700,
                    color: banner.titleColor || '#1F2937',
                    marginBottom: '8px',
                    lineHeight: 1.3,
                  }}>
                    {banner.title}
                  </h3>

                  {/* Subtitle */}
                  {banner.subtitle && (
                    <p style={{
                      fontSize: '14px',
                      color: banner.subtitleColor || '#6B7280',
                      marginBottom: '16px',
                      lineHeight: 1.5,
                    }}>
                      {banner.subtitle}
                    </p>
                  )}

                  {/* Feature List with Check Icons */}
                  {banner.features && banner.features.length > 0 && (
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 auto 0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}>
                      {banner.features.map((feature, i) => (
                        <li key={i} style={{
                          fontSize: '13px',
                          color: banner.featureColor || '#374151',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                        }}>
                          <span style={{
                            color: 'var(--color-brand-teal)',
                            fontSize: '17px',
                            flexShrink: 0,
                            lineHeight: 1,
                          }}>✓</span>
                          <span style={{ paddingTop: '1px' }}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Bottom: Website Badge */}
                {banner.website && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 20px',
                    background: 'var(--color-brand-teal)',
                    borderRadius: '24px',
                    alignSelf: 'flex-start',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#fff',
                      display: 'inline-block',
                    }} />
                    <span style={{
                      fontSize: '14px',
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
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        /* Mobile: Horizontal Scroll */}
        @media (max-width: 768px) {
          .promo-banners-grid {
            display: flex !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            gap: 16px !important;
            padding-bottom: 16px !important;
          }

          .promo-banners-grid::-webkit-scrollbar {
            display: none;
          }

          .promo-banner-card {
            flex: 0 0 88% !important;
            scroll-snap-align: start !important;
            min-width: 300px !important;
            height: 380px !important;
          }
        }

        /* Tablet: 2 Columns */}
        @media (min-width: 769px) and (max-width: 1024px) {
          .promo-banners-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        /* Desktop: 3 Columns */}
        @media (min-width: 1025px) {
          .promo-banners-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMOTIONAL BANNERS DATA - GoWell BD Professional Style
// ══════════════════════════════════════════════════════════════════════════════

const PROMO_BANNERS = [
  {
    title: 'Smart Fat Vibration Slimming Machine',
    subtitle: 'Fat Burning Vibration & Heating',
    logo: null, // Can add brand logo here
    features: [
      '4-level intensity modes',
      'Built-in heating function',
      'Rechargeable battery',
      'Portable & lightweight'
    ],
    website: 'mediportbd.com',
    link: '/products?category=Physiotherapy & Rehabilitation&search=slimming',
    bgColor: '#FFF5F5',
    titleColor: '#7C2D12',
    subtitleColor: '#92400E',
    featureColor: '#451A03',
    image: null, // Add Cloudinary URL for woman using slimming machine
    imagePosition: 'right center',
    overlay: 'linear-gradient(90deg, rgba(255,245,245,0.98) 0%, rgba(255,245,245,0.85) 50%, transparent 100%)',
  },
  {
    title: 'Premium Foldable Electric Foot Spa Massager',
    subtitle: 'Folding Body, Red Light, Massage Rollers & Heating',
    logo: null,
    features: [
      'Red light therapy',
      'Heated massage rollers',
      'Foldable design',
      'Digital temperature control'
    ],
    website: 'mediportbd.com',
    link: '/products?search=foot spa massager',
    bgColor: '#F0F9FF',
    titleColor: '#0C4A6E',
    subtitleColor: '#075985',
    featureColor: '#0369A1',
    image: null, // Add Cloudinary URL for person using foot spa
    imagePosition: 'right bottom',
    overlay: 'linear-gradient(90deg, rgba(240,249,255,0.98) 0%, rgba(240,249,255,0.85) 50%, transparent 100%)',
  },
  {
    title: 'Double Head Alloy Shaver',
    subtitle: 'Smooth, Easy & Reliable Grooming',
    logo: null,
    features: [
      'Dual rotating heads',
      'Rechargeable battery',
      'Waterproof design',
      'Travel-friendly'
    ],
    website: 'mediportbd.com',
    link: '/products?search=shaver',
    bgColor: '#F5F5F5',
    titleColor: '#1F2937',
    subtitleColor: '#4B5563',
    featureColor: '#374151',
    image: null, // Add Cloudinary URL for shaver product
    imagePosition: 'right center',
    overlay: 'linear-gradient(90deg, rgba(245,245,245,0.98) 0%, rgba(245,245,245,0.85) 50%, transparent 100%)',
  },
];

