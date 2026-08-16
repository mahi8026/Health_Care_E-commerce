'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/hooks/useT';
import { API } from '@/constants/api';
import { fetchWithRetry } from '@/utils/api';
import AutoSlider from '@/components/ui/AutoSlider';
import BestSellingCard from '@/components/product/BestSellingCard';
import { ProductCardSkeleton } from '@/components/ui/Spinner';

/**
 * BestSellingSection Component
 * 
 * Displays top-selling products in an auto-scrolling carousel with ranking badges.
 * Features responsive design, loading states, and error handling.
 */
export default function BestSellingSection() {
  const router = useRouter();
  const t = useT();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch best-selling products
  useEffect(() => {
    const fetchBestSelling = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchWithRetry(
          `${API}/products?sortBy=topSelling&limit=20`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const { success, data } = await response.json();

        if (success) {
          // Handle different response formats
          const productList = Array.isArray(data) 
            ? data 
            : (data?.products || data?.data || []);
          
          setProducts(Array.isArray(productList) ? productList : []);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('[BestSellingSection] Failed to fetch products:', err);
        setError(err.message);
        
        // Try fallback to featured products
        try {
          const fallbackResponse = await fetchWithRetry(
            `${API}/products?isFeatured=true&limit=20`,
            { credentials: 'include' }
          );
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            const fallbackProducts = Array.isArray(fallbackData.data)
              ? fallbackData.data
              : (fallbackData.data?.products || []);
            
            setProducts(Array.isArray(fallbackProducts) ? fallbackProducts : []);
            setError(null);
          }
        } catch (fallbackErr) {
          console.error('[BestSellingSection] Fallback also failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBestSelling();
  }, [retryCount]);

  // Handler for retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Handler for "See All" button
  const handleSeeAll = () => {
    router.push('/products?sort=topSelling');
  };

  // Don't render if no products and not loading
  if (!loading && products.length === 0 && !error) {
    return null;
  }

  return (
    <section
      className="best-selling-section"
      aria-labelledby="best-selling-title"
      style={{
        padding: '24px 0',
        background: '#fff',
      }}
    >
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 20px',
      }}>
        {/* Section Header */}
        <div
          className="section-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div className="header-left">
            <p style={{
              fontSize: '11px',
              color: 'var(--color-brand-teal)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}>
              {t('home.mostPopular') || 'Most Popular'}
            </p>
            <h2
              id="best-selling-title"
              style={{
                fontFamily: 'Lora, serif',
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--color-brand-navy)',
                marginBottom: '8px',
                margin: 0,
              }}
            >
              {t('home.bestSellingItems') || 'Best Selling Items'}
            </h2>
            <div style={{
              width: '60px',
              height: '4px',
              background: 'var(--color-brand-teal)',
              borderRadius: '2px',
            }} />
          </div>

          {!loading && products.length > 0 && (
            <button
              onClick={handleSeeAll}
              style={{
                padding: '10px 24px',
                background: 'transparent',
                border: '2px solid var(--color-brand-teal)',
                borderRadius: '8px',
                color: 'var(--color-brand-teal)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-brand-teal)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-brand-teal)';
              }}
              aria-label="See all best selling products"
            >
              See All Products →
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <AutoSlider
            itemsToShow={6}
            itemsToScroll={2}
            gap="12px"
            autoPlayInterval={0}
            showArrows={false}
          >
            {[...Array(12)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </AutoSlider>
        )}

        {/* Error State */}
        {error && !loading && products.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '32px',
            }}>
              ⚠️
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1F2937',
              marginBottom: '8px',
            }}>
              Unable to Load Best Sellers
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              marginBottom: '16px',
            }}>
              {error}
            </p>
            <button
              onClick={handleRetry}
              style={{
                padding: '8px 24px',
                background: 'var(--color-brand-teal)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Products Slider */}
        {!loading && products.length > 0 && (
          <div>
            <AutoSlider
              itemsToShow={6}
              itemsToScroll={2}
              gap="12px"
              autoPlayInterval={5000}
              pauseOnHover={true}
              showArrows={true}
              loop={true}
            >
              {products.map((product, index) => (
                <BestSellingCard
                  key={product._id}
                  product={product}
                  rank={index + 1}
                />
              ))}
            </AutoSlider>

            {/* Product Count */}
            <div style={{
              textAlign: 'center',
              marginTop: '24px',
              fontSize: '13px',
              color: '#6B7280',
            }}>
              Showing {products.length} best selling products
            </div>
            
            {/* Note: Pagination dots have been removed for cleaner mobile experience */}
          </div>
        )}
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        @media (max-width: 640px) {
          .best-selling-section {
            padding: 24px 0 !important;
          }

          .section-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .section-header button {
            width: 100%;
          }

          .section-header h2 {
            font-size: 24px !important;
          }
        }

        @media (min-width: 641px) and (max-width: 1023px) {
          .best-selling-section {
            padding: 32px 0 !important;
          }

          .section-header h2 {
            font-size: 28px !important;
          }
        }
      `}</style>
    </section>
  );
}
