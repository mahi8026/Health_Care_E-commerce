'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaBolt, FaArrowLeft } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { API } from '@/constants/api';
import { getProductCardImage } from '@/utils/cloudinary';

// TimeBlock component defined outside to avoid recreation
const TimeBlock = ({ value, label }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '8px 12px',
    borderRadius: 8,
    minWidth: 60,
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  }}>
    <div style={{
      fontSize: 24,
      fontWeight: 800,
      color: '#E11D48',
      lineHeight: 1,
      fontFamily: 'monospace',
    }}>
      {String(value).padStart(2, '0')}
    </div>
    <div style={{
      fontSize: 10,
      color: '#64748B',
      fontWeight: 600,
      marginTop: 4,
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
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>:</div>
      <TimeBlock value={timeLeft.minutes} label="Min" />
      <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>:</div>
      <TimeBlock value={timeLeft.seconds} label="Sec" />
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
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #FEE2E2',
        cursor: 'pointer',
        transition: 'all 0.3s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
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
      <div style={{ position: 'relative', height: 200, background: '#F8FAFC', flexShrink: 0 }}>
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
            fontSize: 60,
            color: '#CBD5E1',
          }}>
            🏥
          </div>
        )}
        
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 800,
          padding: '6px 10px',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(225, 29, 72, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <FaBolt style={{ fontSize: 11 }} />
          <span>{discountPct}% OFF</span>
        </div>

        {stockRemaining !== null && stockRemaining <= 10 && (
          <div style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: '#F59E0B',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            padding: '6px 10px',
            borderRadius: 6,
          }}>
            Only {stockRemaining} left!
          </div>
        )}
      </div>

      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {brandName && (
          <div style={{
            fontSize: 11,
            color: '#E11D48',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 6,
          }}>
            {brandName}
          </div>
        )}
        
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.3,
          marginBottom: 12,
          color: '#1F2937',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 36,
        }}>
          {product.name}
        </div>

        <div style={{ marginBottom: 12, marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#E11D48' }}>
              ৳{finalPrice.toLocaleString()}
            </span>
            <span style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'line-through' }}>
              ৳{originalPrice.toLocaleString()}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
            Save ৳{(originalPrice - finalPrice).toLocaleString()}
          </div>
        </div>

        {stockLimit && (
          <div style={{ marginBottom: 12 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#64748B',
              marginBottom: 6,
              fontWeight: 600,
            }}>
              <span>Sold: {soldCount}</span>
              <span>Left: {stockRemaining}</span>
            </div>
            <div style={{
              width: '100%',
              height: 6,
              background: '#E5E7EB',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(stockPercentage, 100)}%`,
                height: '100%',
                background: stockPercentage > 80 ? '#EF4444' : '#F59E0B',
                transition: 'width 0.3s',
                borderRadius: 3,
              }} />
            </div>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart({ ...product, price: finalPrice }, 1);
          }}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(225, 29, 72, 0.4)';
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
            fontSize: 48,
            marginBottom: 16,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            🔥
          </div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Loading Flash Deals...</div>
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
        padding: '0 20px',
      }}>
        <div style={{ textAlign: 'center', color: '#fff', maxWidth: 500 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
          <h2 style={{
            fontSize: 26,
            fontWeight: 800,
            marginBottom: 10,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}>
            No Active Flash Deals
          </h2>
          <p style={{ fontSize: 14, color: '#CBD5E1', marginBottom: 24, lineHeight: 1.5 }}>
            There are no flash deals available at the moment. Check back soon for amazing offers!
          </p>
          <button
            onClick={() => router.push('/')}
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
        <section style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {flashDeals.map((deal, dealIndex) => (
              <div key={deal._id} style={{
                marginBottom: dealIndex < flashDeals.length - 1 ? 48 : 0,
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                  borderRadius: 16,
                  padding: '20px 24px',
                  marginBottom: 24,
                  color: '#fff',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 20,
                  }}>
                    <div style={{ flex: 1, minWidth: 250 }}>
                      <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: 6,
                        opacity: 0.9,
                      }}>
                        {deal.badge?.text || 'FLASH DEAL'}
                      </div>
                      <h2 style={{
                        fontSize: 24,
                        fontWeight: 900,
                        margin: '0 0 6px 0',
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                      }}>
                        {deal.title}
                      </h2>
                      <p style={{
                        fontSize: 14,
                        margin: 0,
                        opacity: 0.9,
                        lineHeight: 1.4,
                      }}>
                        {deal.description}
                      </p>
                    </div>
                    
                    <CountdownTimer endTime={deal.endTime} />
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 20,
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
