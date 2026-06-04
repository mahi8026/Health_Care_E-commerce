'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaBolt, FaFire, FaClock, FaArrowLeft } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { API } from '@/constants/api';
import { getProductCardImage } from '@/utils/cloudinary';

// TimeBlock component defined outside to avoid recreation
const TimeBlock = ({ value, label }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '16px 20px',
    borderRadius: 16,
    minWidth: 90,
    textAlign: 'center',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
  }}>
    <div style={{
      fontSize: 36,
      fontWeight: 900,
      color: '#E11D48',
      lineHeight: 1,
      fontFamily: 'monospace',
    }}>
      {String(value).padStart(2, '0')}
    </div>
    <div style={{
      fontSize: 12,
      color: '#64748B',
      fontWeight: 600,
      marginTop: 6,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {label}
    </div>
  </div>
);

function CountdownTimer({ endTime }) {
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
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <div style={{ color: '#fff', fontSize: 32, fontWeight: 700, alignSelf: 'center' }}>:</div>
      <TimeBlock value={timeLeft.minutes} label="Minutes" />
      <div style={{ color: '#fff', fontSize: 32, fontWeight: 700, alignSelf: 'center' }}>:</div>
      <TimeBlock value={timeLeft.seconds} label="Seconds" />
    </div>
  );
}

function FlashDealProductCard({ item, onClick }) {
  const { addToCart } = useCart();
  const product = item.product;
  
  if (!product) return null;

  const imgRaw = product.images?.[0];
  const img = typeof imgRaw === 'string' ? imgRaw : imgRaw?.url;
  const optimizedImg = img ? getProductCardImage(img) : null;
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  
  const originalPrice = product.price || 0;
  const finalPrice = item.finalPrice || 0;
  const discountPct = item.discountPercentage || 0;
  const stockLimit = item.stockLimit;
  const soldCount = item.soldCount || 0;
  const stockRemaining = stockLimit ? stockLimit - soldCount : null;
  const stockPercentage = stockLimit ? ((soldCount / stockLimit) * 100) : 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '2px solid #FEE2E2',
        cursor: 'pointer',
        transition: 'all 0.3s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(225, 29, 72, 0.25)';
        e.currentTarget.style.borderColor = '#E11D48';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#FEE2E2';
      }}
    >
      <div style={{ position: 'relative', height: 240, background: '#F8FAFC' }}>
        {optimizedImg ? (
          <Image
            src={optimizedImg}
            alt={`${product.name}${brandName ? ` — ${brandName}` : ''} — Flash Deal ৳${finalPrice.toLocaleString()} Bangladesh`}
            fill
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            fontSize: 80,
            color: '#CBD5E1',
          }}>
            🏥
          </div>
        )}
        
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
          color: '#fff',
          fontSize: 16,
          fontWeight: 900,
          padding: '10px 16px',
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(225, 29, 72, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <FaBolt style={{ fontSize: 14 }} />
          <span>{discountPct}% OFF</span>
        </div>

        {stockRemaining !== null && stockRemaining <= 10 && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: '#F59E0B',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            padding: '8px 12px',
            borderRadius: 10,
          }}>
            Only {stockRemaining} left!
          </div>
        )}
      </div>

      <div style={{ padding: 20 }}>
        {brandName && (
          <div style={{
            fontSize: 12,
            color: '#E11D48',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 8,
          }}>
            {brandName}
          </div>
        )}
        
        <div style={{
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.4,
          marginBottom: 16,
          color: '#1F2937',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 44,
        }}>
          {product.name}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#E11D48' }}>
              ৳{finalPrice.toLocaleString()}
            </span>
            <span style={{ fontSize: 16, color: '#9CA3AF', textDecoration: 'line-through' }}>
              ৳{originalPrice.toLocaleString()}
            </span>
          </div>
          <div style={{ fontSize: 14, color: '#059669', fontWeight: 600 }}>
            You save ৳{(originalPrice - finalPrice).toLocaleString()}
          </div>
        </div>

        {stockLimit && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#64748B',
              marginBottom: 8,
              fontWeight: 600,
            }}>
              <span>Sold: {soldCount}</span>
              <span>Available: {stockRemaining}</span>
            </div>
            <div style={{
              width: '100%',
              height: 8,
              background: '#E5E7EB',
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(stockPercentage, 100)}%`,
                height: '100%',
                background: stockPercentage > 80 ? '#EF4444' : '#F59E0B',
                transition: 'width 0.3s',
                borderRadius: 4,
              }} />
            </div>
          </div>
        )}

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
            borderRadius: 12,
            padding: '14px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(225, 29, 72, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default function FlashDealsPageClient() {
  const router = useRouter();
  const [flashDeals, setFlashDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFlashDeals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/flash-deals/active`);
      const data = await response.json();
      
      if (data.success && data.data?.flashDeals?.length > 0) {
        setFlashDeals(data.data.flashDeals);
      } else {
        setFlashDeals([]);
      }
    } catch (error) {
      console.error('Failed to fetch flash deals:', error);
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
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #3B82F6 100%)',
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{
            fontSize: 64,
            marginBottom: 20,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            🔥
          </div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>Loading Flash Deals...</div>
        </div>
      </div>
    );
  }

  if (flashDeals.length === 0) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #3B82F6 100%)',
        padding: '0 24px',
      }}>
        <div style={{ textAlign: 'center', color: '#fff', maxWidth: 500 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>😔</div>
          <h2 style={{
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 12,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}>
            No Active Flash Deals
          </h2>
          <p style={{ fontSize: 16, color: '#CBD5E1', marginBottom: 32 }}>
            There are no flash deals available at the moment. Check back soon for amazing offers!
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              background: '#fff',
              color: '#E11D48',
              border: 'none',
              borderRadius: 12,
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FaArrowLeft />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <section style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #3B82F6 100%)',
        padding: '80px 24px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 3s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 350,
          height: 350,
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 4s ease-in-out infinite',
        }} />

        <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 10,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 32,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <FaArrowLeft />
            <span>Back to Home</span>
          </button>

          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginBottom: 16,
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                padding: 16,
                borderRadius: 16,
                display: 'flex',
              }}>
                <FaFire style={{ fontSize: 40, color: '#fff' }} />
              </div>
              <h1 style={{
                fontSize: 'clamp(32px, 5vw, 56px)',
                fontWeight: 900,
                color: '#fff',
                margin: 0,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
                🔥 Flash Deals
              </h1>
            </div>
            <p style={{
              fontSize: 18,
              color: '#CBD5E1',
              maxWidth: 600,
              margin: '0 auto 32px',
              fontWeight: 500,
            }}>
              Limited time offers on premium medical equipment and supplies. Grab them before they&apos;re gone!
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '12px 24px',
              borderRadius: 12,
              color: '#FEE2E2',
            }}>
              <FaClock style={{ fontSize: 20 }} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>
                {flashDeals.length} Active Deal{flashDeals.length > 1 ? 's' : ''} Available
              </span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {flashDeals.map((deal, dealIndex) => (
            <div key={deal._id} style={{
              marginBottom: dealIndex < flashDeals.length - 1 ? 80 : 0,
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                borderRadius: 20,
                padding: '32px',
                marginBottom: 32,
                color: '#fff',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 24,
                }}>
                  <div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: 8,
                      opacity: 0.9,
                    }}>
                      {deal.badge?.text || 'FLASH DEAL'}
                    </div>
                    <h2 style={{
                      fontSize: 32,
                      fontWeight: 900,
                      margin: '0 0 8px 0',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}>
                      {deal.title}
                    </h2>
                    <p style={{
                      fontSize: 16,
                      margin: 0,
                      opacity: 0.9,
                    }}>
                      {deal.description}
                    </p>
                  </div>
                  
                  <CountdownTimer endTime={deal.endTime} />
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 24,
              }}>
                {deal.products.map((item, index) => (
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
          ))}
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
