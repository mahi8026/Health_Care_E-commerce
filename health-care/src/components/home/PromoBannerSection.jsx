'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

/**
 * PromoBannerSection Component - GoWell BD Actual Style
 * 
 * SINGLE full-width promotional hero banner
 * Placed individually between product sections
 * 
 * Features:
 * - Full-width hero-style banner (not 3-column grid)
 * - Large lifestyle/model image
 * - Text content overlay (left or right aligned)
 * - Call-to-action button
 * - Height: 350-400px
 */
export default function PromoBannerSection({ bannerId = 0 }) {
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

  // Get specific banner by ID or default to first
  const banner = banners[bannerId] || banners[0];
  if (!banner) return null;

  return (
    <section
      className="promo-banner-hero"
      style={{
        padding: '40px 20px',
        background: '#fff',
      }}
    >
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
      }}>
        {/* Single Full-Width Hero Banner */}
        <div
          onClick={() => handleBannerClick(banner)}
          className="promo-hero-card"
          style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            cursor: 'pointer',
            background: banner.bgColor || '#f8f9fa',
            height: '380px',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.01)';
            e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Background Image - Full Width */}
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
                style={{ objectFit: 'contain', objectPosition: banner.imagePosition || 'center' }}
                sizes="100vw"
                priority
                unoptimized
              />
            </div>
          )}

          {/* Content Overlay - Positioned Left or Right */}
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            padding: '48px',
            background: banner.overlay || `linear-gradient(${banner.textAlign === 'right' ? '-90deg' : '90deg'}, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.85) 40%, transparent 70%)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: banner.textAlign === 'right' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{ 
              maxWidth: '550px',
              textAlign: banner.textAlign === 'right' ? 'right' : 'left',
            }}>
              {/* Brand Logo */}
              {banner.logo && (
                <div style={{ marginBottom: '20px' }}>
                  <Image 
                    src={banner.logo} 
                    alt="Brand Logo" 
                    width={100}
                    height={40}
                    style={{ width: 'auto', height: '40px' }}
                  />
                </div>
              )}

              {/* Title */}
              <h2 style={{
                fontSize: banner.titleSize || '36px',
                fontWeight: 700,
                color: banner.titleColor || '#1F2937',
                marginBottom: '12px',
                lineHeight: 1.2,
              }}>
                {banner.title}
              </h2>

              {/* Subtitle */}
              {banner.subtitle && (
                <p style={{
                  fontSize: '18px',
                  color: banner.subtitleColor || '#6B7280',
                  marginBottom: '24px',
                  lineHeight: 1.6,
                }}>
                  {banner.subtitle}
                </p>
              )}

              {/* Feature List */}
              {banner.features && banner.features.length > 0 && (
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 28px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}>
                  {banner.features.map((feature, i) => (
                    <li key={i} style={{
                      fontSize: '15px',
                      color: banner.featureColor || '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      justifyContent: banner.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    }}>
                      <span style={{
                        color: 'var(--color-brand-teal)',
                        fontSize: '20px',
                        flexShrink: 0,
                      }}>✓</span>
                      <span>{feature}</span>
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
                    gap: '12px',
                    padding: '14px 32px',
                    background: banner.ctaBg || 'var(--color-brand-teal)',
                    color: banner.ctaColor || '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(13, 148, 136, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(13, 148, 136, 0.3)';
                  }}
                >
                  {banner.cta}
                  <span style={{ fontSize: '18px' }}>→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        /* Mobile: Reduce height and padding */}
        @media (max-width: 768px) {
          .promo-hero-card {
            height: 320px !important;
          }

          .promo-hero-card > div:last-child {
            padding: 32px 24px !important;
          }

          .promo-hero-card h2 {
            font-size: 24px !important;
          }

          .promo-hero-card p {
            font-size: 14px !important;
          }
        }

        /* Tablet */}
        @media (min-width: 769px) and (max-width: 1024px) {
          .promo-hero-card {
            height: 350px !important;
          }

          .promo-hero-card h2 {
            font-size: 28px !important;
          }
        }
      `}</style>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMOTIONAL BANNERS DATA - GoWell BD Actual Style (Full-Width Heroes)
// ══════════════════════════════════════════════════════════════════════════════

const PROMO_BANNERS = [
  {
    title: 'Air Pressure Portable Calf Massager',
    subtitle: 'Gentle air compression massage to relax tired & fatigued calf muscles',
    logo: null,
    features: [
      'Air Compression Massage',
      'Relieves Tired & Fatigued Calves',
      'Portable & Lightweight',
      'Easy-to-Use Controls'
    ],
    cta: 'Shop Now',
    website: null,
    link: '/products?search=massager',
    bgColor: '#FFFFFF',
    titleColor: '#003A70',
    subtitleColor: '#004C8C',
    featureColor: '#1E4976',
    ctaBg: '#DC2626',
    ctaColor: '#fff',
    image: '/AD%20Banner.png',
    imagePosition: 'center',
    textAlign: 'left',
    overlay: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 35%, transparent 65%)',
  },
  {
    title: 'Smart Fat Vibration Slimming Machine',
    subtitle: 'Fat Burning Vibration & Heating for Effective Body Contouring',
    logo: null,
    features: [
      '4-level vibration intensity modes',
      'Built-in heating function for enhanced fat burning',
      'Rechargeable battery with long runtime',
      'Portable and easy to use at home'
    ],
    cta: 'Shop Now',
    website: null,
    link: '/products?category=Physiotherapy & Rehabilitation&search=slimming',
    bgColor: '#FFE5E5',
    titleColor: '#7C2D12',
    subtitleColor: '#92400E',
    featureColor: '#451A03',
    ctaBg: '#DC2626',
    ctaColor: '#fff',
    image: null,
    imagePosition: 'right center',
    textAlign: 'left',
    overlay: 'linear-gradient(90deg, rgba(255,229,229,0.98) 0%, rgba(255,229,229,0.85) 45%, transparent 75%)',
  },
  {
    title: 'Premium Foldable Electric Foot Spa Massager',
    subtitle: 'Relaxation & Therapy with Red Light and Heating Massage',
    logo: null,
    features: [
      'Red light therapy for improved circulation',
      'Heated massage rollers for deep relaxation',
      'Foldable design for easy storage',
      'Digital temperature & timer control'
    ],
    cta: 'View Details',
    link: '/products?search=foot spa massager',
    bgColor: '#E0F2FE',
    titleColor: '#0C4A6E',
    subtitleColor: '#075985',
    featureColor: '#0369A1',
    ctaBg: '#0284C7',
    ctaColor: '#fff',
    image: null,
    imagePosition: 'left center',
    textAlign: 'right',
    overlay: 'linear-gradient(-90deg, rgba(224,242,254,0.98) 0%, rgba(224,242,254,0.85) 45%, transparent 75%)',
  },
];

