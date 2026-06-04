'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaBolt, FaFire, FaArrowRight, FaClock } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { API } from '@/constants/api';
import { getProductCardImage } from '@/utils/cloudinary';

// ══════════════════════════════════════════════════════════════════════════════
// COUNTDOWN TIMER - TimeBlock component defined outside to avoid recreation
// ══════════════════════════════════════════════════════════════════════════════

const TimeBlock = ({ value, label }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '8px 12px',
    borderRadius: 10,
    minWidth: 60,
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  }}>
    <div style={{
      fontSize: 22,
      fontWeight: 900,
      color: '#E11D48',
      lineHeight: 1,
      fontFamily: 'monospace',
    }}>
      {String(value).padStart(2, '0')}
    </div>
    <div style={{
      fontSize: 9,
      color: '#64748B',
      fontWeight: 600,
      marginTop: 3,
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
        color: '#fff',
        fontSize: 12,
        fontWeight: 700,
      }}>
        <FaClock style={{ fontSize: 14 }} />
        <span>Ends In:</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <TimeBlock value={timeLeft.hours} label="Hours" />
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, alignSelf: 'center' }}>:</div>
        <TimeBlock value={timeLeft.minutes} label="Mins" />
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, alignSelf: 'center' }}>:</div>
        <TimeBlock value={timeLeft.seconds} label="Secs" />
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
  const stockLimit = item.stockLimit;
  const soldCount = item.soldCount || 0;
  const stockRemaining = stockLimit ? stockLimit - soldCount : null;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        border: '2px solid #FEE2E2',
        cursor: 'pointer',
        transition: 'all 0.3s',
        minWidth: 220,
        maxWidth: 240,
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(225, 29, 72, 0.2)';
        e.currentTarget.style.borderColor = '#E11D48';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#FEE2E2';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 160, background: '#F8FAFC' }}>
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
          top: 8,
          left: 8,
          background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 900,
          padding: '6px 10px',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(225, 29, 72, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <FaBolt style={{ fontSize: 10 }} />
          <span>{discountPct}% OFF</span>
        </div>

        {stockRemaining !== null && stockRemaining <= 10 && (
          <div style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: '#F59E0B',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: 6,
          }}>
            {stockRemaining} left
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 12 }}>
        {brandName && (
          <div style={{
            fontSize: 10,
            color: '#E11D48',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 4,
          }}>
            {brandName}
          </div>
        )}
        
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.3,
          marginBottom: 8,
          color: '#1F2937',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 34,
        }}>
          {product.name}
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontSize: 18,
              fontWeight: 900,
              color: '#E11D48',
            }}>
              ৳{finalPrice.toLocaleString()}
            </span>
            <span style={{
              fontSize: 12,
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
            background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Add to Cart
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
  const [currentDealIndex, setCurrentDealIndex] = useState(0);

  const fetchFlashDeals = useCallback(async () => {
    try {
      setLoading(true);
      // Add cache-busting parameter to force fresh data
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
        // Debug: Log first product's image data
        const firstDeal = data.data.flashDeals[0];
        if (firstDeal?.products?.[0]) {
          const firstProduct = firstDeal.products[0].product;
          console.log('🖼️ Flash Deal Product Image Debug:', {
            productName: firstProduct?.name,
            images: firstProduct?.images,
            firstImage: firstProduct?.images?.[0]
          });
        }
        console.log('📦 All Products in Flash Deal:', firstDeal?.products?.map(p => p.product?.name));
        setFlashDeals(data.data.flashDeals);
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

  useEffect(() => {
    if (flashDeals.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentDealIndex(prev => (prev + 1) % flashDeals.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [flashDeals.length]);

  if (loading) {
    return (
      <section style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #3B82F6 100%)',
        padding: '60px 24px',
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

  const currentDeal = flashDeals[currentDealIndex];

  return (
    <section style={{
      background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #3B82F6 100%)',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: -80,
        right: -80,
        width: 250,
        height: 250,
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 3s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -60,
        left: -60,
        width: 200,
        height: 200,
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 4s ease-in-out infinite',
      }} />

      <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 6,
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                padding: 10,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FaFire style={{ fontSize: 22, color: '#fff' }} />
              </div>
              <h2 style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#fff',
                margin: 0,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
                🔥 Flash Deals
              </h2>
            </div>
            <p style={{
              fontSize: 14,
              color: '#CBD5E1',
              margin: 0,
              fontWeight: 500,
            }}>
              {currentDeal.description}
            </p>
          </div>

          <CountdownTimer endTime={currentDeal.endTime} />
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
            gap: 16,
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

        {flashDeals.length > 1 && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => {
                router.push('/flash-deals');
              }}
              style={{
                background: '#fff',
                color: '#E11D48',
                border: 'none',
                borderRadius: 10,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span>View All Flash Deals</span>
              <FaArrowRight />
            </button>
            <div style={{
              fontSize: 12,
              color: '#94A3B8',
              marginTop: 10,
              fontWeight: 600,
            }}>
              {flashDeals.length} Active Deal{flashDeals.length > 1 ? 's' : ''} Available
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        section::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
