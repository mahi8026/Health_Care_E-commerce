'use client';

import PromoBannerSection from './PromoBannerSection';

/**
 * ProductGridWithPromoBanners - GoWell BD Style Layout
 * 
 * DESKTOP LAYOUT:
 * ┌──────────────┬────────────────────────────────┐
 * │              │  Product  Product  Product     │
 * │  Promo       │  Product  Product  Product     │
 * │  Banner 1    │  Product  Product  Product     │
 * │              │                                 │
 * ├──────────────┤  Product  Product  Product     │
 * │              │  Product  Product  Product     │
 * │  Promo       │  Product  Product  Product     │
 * │  Banner 2    │                                 │
 * │              │                                 │
 * └──────────────┴────────────────────────────────┘
 * 
 * MOBILE: Banners scroll horizontally above product grid
 */
export default function ProductGridWithPromoBanners({ children, className = '' }) {
  return (
    <div 
      className={`product-grid-with-banners ${className}`}
      style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 20px',
      }}
    >
      {/* Desktop: Split layout with banners on left */}
      <div 
        className="split-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* LEFT: Promotional Banners Column (sticky) */}
        <aside 
          className="promo-banners-column"
          style={{
            position: 'sticky',
            top: '80px', // Adjust based on your header height
          }}
        >
          <PromoBannerSection />
        </aside>

        {/* RIGHT: Products Grid */}
        <div className="products-grid-column">
          {children}
        </div>
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        /* Mobile: Banners above products, no split */}
        @media (max-width: 1024px) {
          .split-layout {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
          }

          .promo-banners-column {
            position: static !important;
            margin-bottom: 24px;
          }
        }

        /* Tablet: Still single column but wider */}
        @media (min-width: 769px) and (max-width: 1024px) {
          .split-layout {
            grid-template-columns: 1fr !important;
          }
        }

        /* Desktop: Show split layout */}
        @media (min-width: 1025px) {
          .split-layout {
            grid-template-columns: 320px 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
