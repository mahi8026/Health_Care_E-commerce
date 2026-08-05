'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaArrowRight } from 'react-icons/fa';

/**
 * PromoBannerSection Component
 * 
 * Displays large promotional banners for featured products/categories
 * Similar to GoWell BD's promotional banner style
 * 
 * Features:
 * - 3-column grid on desktop
 * - Horizontal scroll on mobile
 * - Eye-catching lifestyle images
 * - Product highlights with icons/text
 * - Call-to-action buttons
 */
export default function PromoBannerSection() {
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
        padding: '40px 0',
        background: '#fff',
      }}
    >
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 20px',
      }}>
        {/* Desktop: 3-column grid, Mobile: Horizontal scroll */}
        <div 
          className="promo-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
                height: '280px',
                transition: 'all 0.3s ease',
                border: '1px solid #e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Background Image */}
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
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* Overlay for text readability */}
                  {banner.overlay && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: banner.overlay,
                    }} />
                  )}
                </div>
              )}

              {/* Content */}
              <div style={{
                position: 'relative',
                zIndex: 2,
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: banner.contentAlign || 'space-between',
              }}>
                {/* Brand/Category Tag */}
                {banner.tag && (
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-brand-teal)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    alignSelf: 'flex-start',
                    marginBottom: '12px',
                  }}>
                    {banner.tag}
                  </div>
                )}

                {/* Title */}
                <h3 style={{
                  fontSize: banner.titleSize || '22px',
                  fontWeight: 700,
                  color: banner.titleColor || '#1F2937',
                  marginBottom: '8px',
                  lineHeight: 1.3,
                }}>
                  {banner.title}
                </h3>

                {/* Subtitle/Description */}
                {banner.subtitle && (
                  <p style={{
                    fontSize: '13px',
                    color: banner.subtitleColor || '#6B7280',
                    marginBottom: '16px',
                    lineHeight: 1.5,
                  }}>
                    {banner.subtitle}
                  </p>
                )}

                {/* Feature List */}
                {banner.features && banner.features.length > 0 && (
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 16px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}>
                    {banner.features.map((feature, i) => (
                      <li key={i} style={{
                        fontSize: '12px',
                        color: banner.featureColor || '#4B5563',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span style={{
                          color: 'var(--color-brand-teal)',
                          fontSize: '16px',
                        }}>✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA Button */}
                {banner.cta && (
                  <button
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      background: banner.ctaBg || 'var(--color-brand-teal)',
                      color: banner.ctaColor || '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      alignSelf: 'flex-start',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.background = 'var(--color-brand-teal-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.background = banner.ctaBg || 'var(--color-brand-teal)';
                    }}
                  >
                    {banner.cta}
                    <FaArrowRight size={12} />
                  </button>
                )}

                {/* Price Badge (optional) */}
                {banner.price && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: '#EF4444',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                  }}>
                    {banner.price}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .promo-grid {
            display: flex !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            gap: 16px !important;
            padding-bottom: 8px !important;
          }

          .promo-grid::-webkit-scrollbar {
            display: none;
          }

          .promo-banner-card {
            flex: 0 0 85% !important;
            scroll-snap-align: start !important;
            min-width: 280px !important;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .promo-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (min-width: 1025px) {
          .promo-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMOTIONAL BANNERS DATA
// ══════════════════════════════════════════════════════════════════════════════

const PROMO_BANNERS = [
  {
    title: 'Digital Blood Pressure Monitors',
    subtitle: 'Accurate readings at home with automatic inflation',
    tag: 'TRENDING',
    features: [
      'Automatic inflation',
      'Irregular heartbeat detection',
      'Memory for 2 users',
      'WHO blood pressure classification'
    ],
    cta: 'Shop Now',
    link: '/products?category=Diagnostic Equipment&search=blood pressure',
    bgColor: '#E0F2FE',
    titleColor: '#0C4A6E',
    image: null, // Can add lifestyle image URL here
    contentAlign: 'flex-start',
  },
  {
    title: 'Laboratory Reagents',
    subtitle: 'Clinical chemistry & hematology reagents for diagnostics',
    tag: 'HOT DEAL',
    features: [
      'HbA1c testing kits',
      'CBC reagents',
      'Liver function tests',
      'Cold chain delivery'
    ],
    cta: 'View Catalog',
    link: '/reagent-store',
    bgColor: '#F3E8FF',
    titleColor: '#581C87',
    contentAlign: 'flex-start',
  },
  {
    title: 'Orthopedic Support',
    subtitle: 'Compression & therapeutic supports for rehabilitation',
    tag: 'BEST SELLER',
    features: [
      'Knee & ankle support',
      'Back & lumbar belts',
      'Cervical pillows',
      'Breathable materials'
    ],
    cta: 'Explore',
    link: '/products?category=Orthopedic Supports',
    bgColor: '#FEF3C7',
    titleColor: '#78350F',
    contentAlign: 'flex-start',
  },
];
