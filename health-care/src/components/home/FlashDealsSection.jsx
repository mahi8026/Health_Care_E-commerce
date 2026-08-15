'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { API } from '@/constants/api';
import { getProductCardImage } from '@/utils/cloudinary';

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCT CARD COMPONENT (matches existing ProductCard style)
// ══════════════════════════════════════════════════════════════════════════════

const FlashDealProductCard = memo(function FlashDealProductCard({ item, onClick }) {
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

  return (
    <div onClick={() => onClick?.(product._id)} className="group"
      style={{ background: '#fff', borderRadius: 14, overflow: 'hidden',
        border: '1px solid var(--color-border-primary)', cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(11,37,69,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>

      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'var(--color-background-secondary)', overflow: 'hidden', flexShrink: 0 }}>
        {optimizedImg ? (
          <Image
            src={optimizedImg}
            alt={`${product.name}${brandName ? ` — ${brandName}` : ''} — Price ৳${finalPrice > 0 ? finalPrice.toLocaleString() : 'on request'} Bangladesh`}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
            className="flash-deal-img"
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 52, color: '#CBD5E1' }}>🏥</div>
        )}
        {/* Discount badge */}
        {discountPct > 0 && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--color-status-danger)', color: '#fff', fontSize: 10, fontWeight: 600,
            padding: '3px 8px', borderRadius: 6 }}>-{discountPct}%</div>
        )}
        {/* Quick add button on hover */}
        <button
          onClick={e => { e.stopPropagation(); addToCart({ ...product, price: finalPrice }, 1); }}
          style={{ position: 'absolute', bottom: 10, right: 10, background: 'var(--color-brand-teal)',
            color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px',
            fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--color-brand-teal-hover)'; }}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--color-brand-teal)'}
          className="quick-add-btn">
          + Cart
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {brandName && (
          <div style={{ fontSize: 10, color: 'var(--color-brand-teal)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {brandName}
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, marginBottom: 6, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          color: '#1F2937' }}>
          {product.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-brand-navy)' }}>
            {finalPrice > 0 ? `৳${finalPrice.toLocaleString()}` : 'Contact for price'}
          </span>
          {originalPrice > finalPrice && (
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', textDecoration: 'line-through' }}>
              ৳{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

// Countdown owns its own state so the 1s tick never re-renders the deal cards
// (previously the section held timeLeft and re-rendered the whole grid every
// second — a major main-thread churn source).
const FlashDealCountdown = memo(function FlashDealCountdown({ endTime }) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();
      if (difference <= 0) return { h: 0, m: 0, s: 0 };
      return {
        h: Math.floor(difference / (1000 * 60 * 60)),
        m: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    const updateTime = () => {
      const next = calculateTimeLeft();
      setTimeLeft(next);
      if (next.h === 0 && next.m === 0 && next.s === 0) {
        window.dispatchEvent(new Event('flashDealExpired'));
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginRight: 2 }}>Ends in</span>
      {[
        { val: timeLeft.h, label: 'hrs' },
        { val: timeLeft.m, label: 'min' },
        { val: timeLeft.s, label: 'sec' },
      ].map((t, i) => (
        <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: i > 0 ? 4 : 0 }}>
          {i > 0 && <span style={{ color: 'var(--color-brand-teal-light)', fontWeight: 600, fontSize: 16 }}>:</span>}
          <div style={{
            background: 'rgba(255,255,255,0.1)', borderRadius: 8,
            padding: '6px 10px', textAlign: 'center', minWidth: 46,
          }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-brand-teal-light)', lineHeight: 1 }}>
              {String(t.val).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{t.label}</div>
          </div>
        </div>
      ))}
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
      const timestamp = new Date().getTime();
      const response = await fetch(`${API}/flash-deals/active?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      
      if (data.success && data.data?.flashDeals?.length > 0) {
        setFlashDeals([data.data.flashDeals[0]]);
      } else {
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
    void Promise.resolve().then(fetchFlashDeals);

    const handleDealExpired = () => {
      fetchFlashDeals();
    };
    window.addEventListener('flashDealExpired', handleDealExpired);

    return () => {
      window.removeEventListener('flashDealExpired', handleDealExpired);
    };
  }, [fetchFlashDeals]);

  // Stable handler so FlashDealProductCard's memo can actually skip re-renders
  const goToDeal = useCallback((productId) => {
    if (productId) router.push(`/products/${productId}`);
  }, [router]);

  if (loading) {
    return (
      <section style={{ background: 'var(--color-brand-navy)', padding: '24px 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Loading Flash Deals...</div>
        </div>
      </section>
    );
  }

  if (flashDeals.length === 0) {
    return null;
  }

  const currentDeal = flashDeals[0];

  return (
    <section style={{ background: 'var(--color-brand-navy)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header row */}
        <div style={{ marginBottom: 20 }}>
          {/* Title + countdown stacked on mobile */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-brand-teal-light)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                FLASH DEALS
              </div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 600,
                color: '#fff', margin: 0 }}>Deal of the Day</h2>
            </div>
            <button onClick={() => router.push('/flash-deals')}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)', padding: '7px 16px', borderRadius: 8,
                fontSize: 12, cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}>
              See all deals →
            </button>
          </div>

          {/* Countdown timer — isolated so the 1s tick only re-renders digits */}
          <FlashDealCountdown endTime={currentDeal.endTime} />
        </div>

        {/* Deal product cards — 2 cols on mobile, 4 on desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
          className="deal-grid"
        >
          {currentDeal.products.slice(0, 4).map((item, index) => (
            <FlashDealProductCard
              key={item.product?._id || index}
              item={item}
              onClick={goToDeal}
            />
          ))}
        </div>
      </div>

      <style>{`
        div:hover .quick-add-btn { opacity: 1 !important; }
        @media (min-width: 768px) {
          .deal-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </section>
  );
}
