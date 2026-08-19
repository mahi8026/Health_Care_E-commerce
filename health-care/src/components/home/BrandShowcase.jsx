'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/constants/api';

const FALLBACK_BRANDS = [
  { name: 'Siemens Healthineers', desc: 'Diagnostic Equipment', color: '#009999' },
  { name: 'GE Healthcare', desc: 'Imaging & Monitoring', color: '#0066CC' },
  { name: 'Roche Diagnostics', desc: 'Laboratory Solutions', color: '#0066B3' },
  { name: 'Abbott', desc: 'Point of Care Testing', color: '#00B3E3' },
  { name: 'Mindray', desc: 'Patient Monitoring', color: '#0066CC' },
  { name: 'Beckman Coulter', desc: 'Lab Automation', color: '#006DB6' },
  { name: 'Sysmex', desc: 'Hematology Systems', color: '#E60012' },
  { name: 'Bio-Rad', desc: 'Clinical Diagnostics', color: '#0073B1' },
  { name: 'Olympus', desc: 'Surgical Equipment', color: '#0068B3' },
  { name: 'Philips Healthcare', desc: 'Medical Technology', color: '#0077B5' },
  { name: 'Medtronic', desc: 'Medical Devices', color: '#004B87' },
  { name: 'Stryker', desc: 'Orthopedic Implants', color: '#F58025' },
];

export default function BrandShowcase() {
  const router = useRouter();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch(`${API}/manufacturers?limit=12&sortBy=popularity`);
        const data = await response.json();
        const brandList = data.data?.manufacturers || data.manufacturers || [];
        setBrands(brandList.length > 0 ? brandList : FALLBACK_BRANDS);
      } catch (error) {
        console.error('Failed to fetch brands:', error);
        setBrands(FALLBACK_BRANDS);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  const handleBrandClick = (brand) => {
    const slug = brand.slug;
    if (slug) {
      router.push(`/brands/${slug}`);
    } else {
      router.push(`/products?brand=${encodeURIComponent(brand.name)}`);
    }
  };

  if (loading) {
    return (
      <section style={{ padding: '80px 24px 60px', background: '#FAFBFC' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="text-center mb-12">
            <div style={{ width: 200, height: 32, background: 'var(--color-background-muted)', margin: '0 auto 12px', borderRadius: 8 }} className="skeleton" />
            <div style={{ width: 400, height: 20, background: 'var(--color-background-muted)', margin: '0 auto', borderRadius: 6 }} className="skeleton" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{ height: 120, background: '#fff', border: '1px solid var(--color-border-primary)', borderRadius: 12 }} className="skeleton" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: '50px 24px 40px', background: '#FAFBFC' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header - More Compact */}
        <div className="text-center" style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-brand-teal)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            GLOBAL PARTNERSHIPS
          </p>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, color: 'var(--color-brand-navy)', marginBottom: 8, fontFamily: 'var(--font-lora), serif' }}>
            Trusted Global Brands
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', maxWidth: 600, margin: '0 auto', lineHeight: 1.5 }}>
            Partnering with world-leading manufacturers to deliver certified medical equipment
          </p>
        </div>

        {/* Brand Grid - More Compact */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 28,
          }}
        >
          {brands.map((brand, idx) => {
            const brandName = typeof brand === 'string' ? brand : brand.name;
            const brandLogo = typeof brand === 'object' ? brand.logo : null;
            const brandDesc = typeof brand === 'object' ? brand.description || brand.desc : null;
            const brandColor = typeof brand === 'object' ? brand.color : 'var(--color-brand-teal)';

            return (
              <div
                key={idx}
                onClick={() => handleBrandClick(brand)}
                style={{
                  background: '#fff',
                  border: '2px solid var(--color-border-primary)',
                  borderRadius: 10,
                  padding: '18px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  minHeight: 100,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                className="brand-card"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = brandColor || 'var(--color-brand-teal)';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${brandColor || 'var(--color-brand-teal)'}20`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-primary)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Brand Logo or Name */}
                {brandLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brandLogo}
                    alt={`${brandName} — Medical equipment supplier Bangladesh`}
                    style={{ maxHeight: 36, maxWidth: '85%', objectFit: 'contain', filter: 'grayscale(100%)', transition: 'filter 0.3s' }}
                    onMouseEnter={(e) => e.currentTarget.style.filter = 'grayscale(0%)'}
                    onMouseLeave={(e) => e.currentTarget.style.filter = 'grayscale(100%)'}
                  />
                ) : (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    {/* Brand initial/icon */}
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${brandColor || 'var(--color-brand-teal)'}15, ${brandColor || 'var(--color-brand-teal)'}05)`,
                        border: `2px solid ${brandColor || 'var(--color-brand-teal)'}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px',
                        fontSize: 'var(--text-base)',
                        fontWeight: 600,
                        color: brandColor || 'var(--color-brand-teal)',
                      }}
                    >
                      {brandName.charAt(0)}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--color-brand-navy)',
                        textAlign: 'center',
                        lineHeight: 1.2,
                      }}
                    >
                      {brandName}
                    </div>
                  </div>
                )}
                
                {/* Description - Smaller */}
                {brandDesc && (
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-tertiary)',
                      textAlign: 'center',
                      fontWeight: 500,
                      marginTop: 2,
                    }}
                  >
                    {brandDesc}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA - Smaller */}
        <div className="text-center">
          <button
            onClick={() => router.push('/products')}
            style={{
              padding: '10px 28px',
              background: 'var(--color-brand-teal)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(14, 138, 110, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-brand-teal-hover)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 138, 110, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-brand-teal)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(14, 138, 110, 0.2)';
            }}
          >
            View All Products →
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @media (max-width: 768px) {
          .brand-card {
            min-height: 90px !important;
            padding: 14px 10px !important;
          }
        }
      `}</style>
    </section>
  );
}
