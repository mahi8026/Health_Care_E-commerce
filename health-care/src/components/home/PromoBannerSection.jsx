'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

/**
 * PromoBannerSection Component - Dynamic promotional banners from admin panel
 * 
 * SINGLE full-width promotional hero banner
 * Fetches banner data from /api/settings endpoint
 * Falls back to default banners if none configured
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
    // Fetch promotional banners from settings
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/settings`);
        const data = await res.json();
        
        console.log('[PromoBannerSection] Fetched settings:', data);
        console.log('[PromoBannerSection] promoBanners:', data.data?.promoBanners);
        
        if (data.success && data.data?.promoBanners && data.data.promoBanners.length > 0) {
          // Filter only active banners
          const activeBanners = data.data.promoBanners.filter(b => b.isActive);
          console.log('[PromoBannerSection] Active banners:', activeBanners);
          
          if (activeBanners.length > 0) {
            setBanners(activeBanners);
          } else {
            console.log('[PromoBannerSection] No active banners, using defaults');
            setBanners(PROMO_BANNERS);
          }
        } else {
          console.log('[PromoBannerSection] No promoBanners in response, using defaults');
          setBanners(PROMO_BANNERS);
        }
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
    if (banner.linkUrl || banner.link) {
      router.push(banner.linkUrl || banner.link);
    }
  };

  if (loading || banners.length === 0) {
    return null;
  }

  // Get specific banner by ID or default to first
  const banner = banners[bannerId] || banners[0];
  if (!banner) return null;
  
  // Map API fields to component fields for compatibility
  const bannerData = {
    ...banner,
    image: banner.imageUrl || banner.image,
    link: banner.linkUrl || banner.link,
  };

  return (
    <section
      className="promo-banner-hero"
      style={{
        padding: '0',
        background: '#fff',
      }}
    >
      <div style={{
        width: '100%',
        margin: '0 auto',
      }}>
        {/* Single Full-Width Hero Banner */}
        <div
          onClick={() => handleBannerClick(bannerData)}
          className="promo-hero-card"
          style={{
            position: 'relative',
            borderRadius: '0',
            overflow: 'hidden',
            cursor: 'pointer',
            background: bannerData.bgColor || '#f8f9fa',
            height: '500px',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.005)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Background Image - Full Width */}
          {bannerData.image && (
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
            }}>
              <Image
                src={bannerData.image}
                alt={bannerData.title || bannerData.altText || 'Promotional Banner'}
                fill
                style={{ objectFit: 'contain', objectPosition: 'center' }}
                sizes="100vw"
                priority
                unoptimized
              />
            </div>
          )}

          {/* Content Overlay - Only show if there's content */}
          {(bannerData.subtitle || bannerData.features || bannerData.cta || bannerData.logo) && (
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              padding: '48px',
              background: bannerData.overlay || `linear-gradient(${bannerData.textAlign === 'right' ? '-90deg' : '90deg'}, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.85) 40%, transparent 70%)`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: bannerData.textAlign === 'right' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{ 
                maxWidth: '550px',
                textAlign: bannerData.textAlign === 'right' ? 'right' : 'left',
              }}>
                {/* Brand Logo */}
                {bannerData.logo && (
                  <div style={{ marginBottom: '20px' }}>
                    <Image 
                      src={bannerData.logo} 
                      alt="Brand Logo" 
                      width={100}
                      height={40}
                      style={{ width: 'auto', height: '40px' }}
                    />
                  </div>
                )}

                {/* Title */}
                {bannerData.title && (
                  <h2 style={{
                    fontSize: bannerData.titleSize || '36px',
                    fontWeight: 700,
                    color: bannerData.titleColor || '#1F2937',
                    marginBottom: '12px',
                    lineHeight: 1.2,
                  }}>
                    {bannerData.title}
                  </h2>
                )}

                {/* Subtitle */}
                {bannerData.subtitle && (
                  <p style={{
                    fontSize: '18px',
                    color: bannerData.subtitleColor || '#6B7280',
                    marginBottom: '24px',
                    lineHeight: 1.6,
                  }}>
                    {bannerData.subtitle}
                  </p>
                )}

                {/* Feature List */}
                {bannerData.features && bannerData.features.length > 0 && (
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 28px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}>
                    {bannerData.features.map((feature, i) => (
                      <li key={i} style={{
                        fontSize: '15px',
                        color: bannerData.featureColor || '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        justifyContent: bannerData.textAlign === 'right' ? 'flex-end' : 'flex-start',
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
                {bannerData.cta && (
                  <button
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 32px',
                      background: bannerData.ctaBg || 'var(--color-brand-teal)',
                      color: bannerData.ctaColor || '#fff',
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
                    {bannerData.cta}
                    <span style={{ fontSize: '18px' }}>→</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        /* Mobile: Reduce height */}
        @media (max-width: 768px) {
          .promo-hero-card {
            height: 350px !important;
          }
        }

        /* Tablet */}
        @media (min-width: 769px) and (max-width: 1024px) {
          .promo-hero-card {
            height: 400px !important;
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
    title: null,
    subtitle: null,
    logo: null,
    features: null,
    cta: null,
    website: null,
    link: '/products?search=massager',
    bgColor: '#FFFFFF',
    image: '/AD%20Banner.png',
    imagePosition: 'center',
    textAlign: 'left',
    overlay: null,
  },
  {
    title: null,
    subtitle: null,
    logo: null,
    features: null,
    cta: null,
    website: null,
    link: '/products?category=Physiotherapy & Rehabilitation&search=slimming',
    bgColor: '#FFE5E5',
    image: null,
    imagePosition: 'right center',
    textAlign: 'left',
    overlay: null,
  },
  {
    title: null,
    subtitle: null,
    logo: null,
    features: null,
    cta: null,
    link: '/products?search=foot spa massager',
    bgColor: '#E0F2FE',
    image: null,
    imagePosition: 'left center',
    textAlign: 'right',
    overlay: null,
  },
];

