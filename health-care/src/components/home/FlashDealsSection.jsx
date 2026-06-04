'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaBolt, FaArrowRight, FaClock } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { API } from '@/constants/api';
import { getProductCardImage } from '@/utils/cloudinary';

// ══════════════════════════════════════════════════════════════════════════════
// COUNTDOWN TIMER - TimeBlock component defined outside to avoid recreation
// ══════════════════════════════════════════════════════════════════════════════

const TimeBlock = ({ value, label }) => (
  <div style={{
    background: 'rgba(96, 165, 250, 0.15)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(96, 165, 250, 0.3)',
    padding: '8px 14px',
    borderRadius: 8,
    minWidth: 65,
    textAlign: 'center',
  }}>
    <div style={{
      fontSize: 24,
      fontWeight: 900,
      color: '#60A5FA',
      lineHeight: 1,
      fontFamily: 'monospace',
    }}>
      {String(value).padStart(2, '0')}
    </div>
    <div style={{
      fontSize: 10,
      color: '#93C5FD',
      fontWeight: 600,
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {label}
    </div>
  </div>
);

const CountdownTimer = memo(function CountdownTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    // Initialize with calculated time
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const difference = end - now;

    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      hours: Math.floor(difference / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        clearInterval(timer);
        window.dispatchEvent(new Event('flashDealExpired'));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        color: '#93C5FD',
        fontSize: 12,
        fontWeight: 700,
      }}>
        <span>Ends in:</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <TimeBlock value={timeLeft.hours} label="HR" />
        <div style={{ color: '#60A5FA', fontSize: 20, fontWeight: 700, alignSelf: 'center' }}>:</div>
        <TimeBlock value={timeLeft.minutes} label="MIN" />
        <div style={{ color: '#60A5FA', fontSize: 20, fontWeight: 700, alignSelf: 'center' }}>:</div>
        <TimeBlock value={timeLeft.seconds} label="SEC" />
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCT CARD COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

const FlashDealProductCard = memo(function FlashDealProductCard({ item, onClick }) {
  const { addToCart } = useCart();
  const product = item.product;
  
  if (!product) return null;

  const imgRaw = product.images?.[0];
  const img = typeof imgRaw === 'string' ? imgRaw : imgRaw?.url;
  
  // Handle both Cloudinary URLs and plain URLs
  let optimizedImg = null;
  if (img) {
    if (img.includes('res.cloudinary.com') || img.includes('cloudinary.com')) {
      optimizedImg = getProductCardImage(img);
    } else {
      // For non-Cloudinary URLs, use as-is
      optimizedImg = img;
    }
  }
  
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  
  const originalPrice = product.price || 0;
  const finalPrice = item.finalPrice || 0;
  const discountPct = item.discountPercentage || 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s',
        minWidth: 240,
        maxWidth: 260,
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 180, background: '#F8FAFC' }}>
        {optimizedImg ? (
          <Image
            src={optimizedImg}
            alt={`${product.name}${brandName ? ` — ${brandName}` : ''} — Flash Deal Price ৳${finalPrice.toLocaleString()} Bangladesh`}
            fill
            style={{ objectFit: 'cover' }}
            unoptimized={!optimizedImg.includes('res.cloudinary.com')}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="image-fallback"
          style={{
            display: optimizedImg ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            fontSize: 48,
            color: '#CBD5E1',
          }}>
          🏥
        </div>
        
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: '#EF4444',
          color: '#fff',
          fontSize: 12,
          fontWeight: 900,
          padding: '6px 12px',
          borderRadius: 6,
        }}>
          -{discountPct}%
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 14 }}>
        {brandName && (
          <div style={{
            fontSize: 11,
            color: '#0E8A6E',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6,
          }}>
            {brandName}
          </div>
        )}
        
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.4,
          marginBottom: 10,
          color: '#1F2937',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 36,
        }}>
          {product.name}
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{
              fontSize: 19,
              fontWeight: 900,
              color: '#0B2545',
            }}>
              ৳{finalPrice.toLocaleString()}
            </span>
            <span style={{
              fontSize: 13,
              color: '#9CA3AF',
              textDecoration: 'line-through',
            }}>
              ৳{originalPrice.toLocaleString()}
            </span>
          </div>
          <div style={{
            fontSize: 11,
            color: '#059669',
            fontWeight: 600,
          }}>
            Save ৳{(originalPrice - finalPrice).toLocaleString()}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product, 1);
          }}
          style={{
            width: '100%',
            background: '#0E8A6E',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '11px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#0B7558';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#0E8A6E';
          }}
        >
          + Add to Cart
        </button>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// MAIN FLASH DEALS SECTION COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function FlashDealsSection() {
  const router = useRouter();
  const [flashDeals, setFlashDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFlashDeals = useCallback(async () => {
    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      const response = await fetch(`${API}/flash-deals/active?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      
      if (data.success && data.data?.flashDeals?.length > 0) {
        console.log('✅ Flash Deals Loaded:', data.data.flashDeals.length, 'deal(s)');
        // Only use the FIRST active deal for homepage
        setFlashDeals([data.data.flashDeals[0]]);
      } else {
        console.warn('⚠️ No active flash deals found');
        setFlashDeals([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch flash deals:', error);
      setFlashDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlashDeals();

    const handleDealExpired = () => {
      fetchFlashDeals();
    };
    window.addEventListener('flashDealExpired', handleDealExpired);

    return () => {
      window.removeEventListener('flashDealExpired', handleDealExpired);
    };
  }, [fetchFlashDeals]);

  if (loading) {
    return (
      <section style={{
        background: 'linear-gradient(135deg, #0F2847 0%, #1A3A5C 50%, #2C5282 100%)',
        padding: '48px 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Loading Flash Deals...</div>
        </div>
      </section>
    );
  }

  if (flashDeals.length === 0) {
    return null;
  }

  const currentDeal = flashDeals[0];

  return (
    <section style={{
      background: 'linear-gradient(135deg, #0F2847 0%, #1A3A5C 50%, #2C5282 100%)',
      padding: '48px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <div style={{
              fontSize: 11,
              color: '#F59E0B',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                background: '#EF4444',
                animation: 'pulse-dot 1.5s ease-in-out infinite',
              }} />
              FLASH DEALS
            </div>
            <h2 style={{
              fontSize: 32,
              fontWeight: 900,
              color: '#fff',
              margin: 0,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>
              Deal of the Day
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <CountdownTimer endTime={currentDeal.endTime} />
            <button
              onClick={() => router.push('/flash-deals')}
              style={{
                background: 'transparent',
                color: '#60A5FA',
                border: '1px solid #3B82F6',
                borderRadius: 8,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.borderColor = '#60A5FA';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#3B82F6';
              }}
            >
              <span>See all deals</span>
              <FaArrowRight style={{ fontSize: 11 }} />
            </button>
          </div>
        </div>

        <div style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          <div style={{
            display: 'flex',
            gap: 20,
            paddingBottom: 6,
          }}>
            {currentDeal.products.map((item, index) => (
              <FlashDealProductCard
                key={item.product?._id || index}
                item={item}
                onClick={() => {
                  if (item.product?._id) {
                    router.push(`/products/${item.product._id}`);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        section::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
