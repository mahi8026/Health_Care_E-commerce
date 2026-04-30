'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const FALLBACK_CATEGORIES = [
  { name: 'Diagnostic Equipment', slug: 'diagnostic', icon: '🩺', desc: 'ECG, Ultrasound, Monitors', color: '#EFF6FF', iconColor: '#2563EB' },
  { name: 'Surgical Instruments', slug: 'surgical', icon: '🔬', desc: 'Scissors, Forceps, Scalpels', color: '#F0FDF4', iconColor: '#16A34A' },
  { name: 'Laboratory Reagents', slug: 'reagents', icon: '🧪', desc: 'HbA1c, CBC, Troponin Kits', color: '#FAF5FF', iconColor: '#9333EA' },
  { name: 'Hospital Machines', slug: 'hospital', icon: '🏥', desc: 'Ventilators, Dialysis, ICU', color: '#FFF7ED', iconColor: '#EA580C' },
  { name: 'Lab Equipment', slug: 'lab-equipment', icon: '🔭', desc: 'Centrifuges, Microscopes, PCR', color: '#F0FDFA', iconColor: '#0D9488' },
  { name: 'PPE & Safety', slug: 'ppe', icon: '🛡️', desc: 'Masks, Gloves, Gowns', color: '#FFF1F2', iconColor: '#E11D48' },
  { name: 'Dental Equipment', slug: 'dental', icon: '🦷', desc: 'Chairs, Drills, Instruments', color: '#FFFBEB', iconColor: '#D97706' },
  { name: 'Implants & Ortho', slug: 'implants', icon: '🦴', desc: 'Bone Plates, Screws, Joints', color: '#F8FAFC', iconColor: '#475569' },
];

const POPULAR_SEARCHES = ['ECG Machine', 'N95 Mask', 'HbA1c Kit', 'Pulse Oximeter'];

const WHY_US = [
  { icon: '🏆', title: 'DGDA Registered', desc: 'All products are DGDA-cleared and meet Bangladesh regulatory standards.' },
  { icon: '��', title: 'Fast Delivery', desc: 'Same-day dispatch for orders before 12 PM. Free delivery in Dhaka metro.' },
  { icon: '🔧', title: 'Free Installation', desc: 'Professional installation and staff training included for all equipment.' },
  { icon: '📞', title: '24/7 Support', desc: 'Dedicated technical support team available round the clock.' },
  { icon: '💳', title: 'Flexible Payment', desc: 'Bank transfer, bKash, Nagad, and B2B credit terms available.' },
  { icon: '🔄', title: '30-Day Returns', desc: 'Hassle-free returns and replacement policy on all products.' },
];

// Skeleton loader component
function Skeleton({ w = '100%', h = 20, r = 8 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }} />
  );
}

// Product Card Component
function ProductCard({ product, onNavigateToProduct }) {
  const imageData = product.images?.[0];
  const imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const ratingVal = typeof product.rating === 'object' ? product.rating?.average : (product.rating || 0);
  const reviewCount = product.reviewCount || product.rating?.count || 0;
  const discount = product.oldPrice && product.price < product.oldPrice 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) 
    : 0;

  return (
    <div
      onClick={() => onNavigateToProduct && onNavigateToProduct(product._id || product.id)}
      style={{
        cursor: 'pointer', background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 220,
        transition: 'all 0.2s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: 180, background: '#F9FAFB', overflow: 'hidden' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} loading='lazy'
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 48 }}>🏥</div>
        )}
        {discount > 0 && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: '#DC2626', color: '#fff', padding: '4px 8px',
            borderRadius: 6, fontSize: 11, fontWeight: 700
          }}>
            Save {discount}%
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); }}
          style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(255,255,255,0.9)', border: 'none',
            width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          ❤️
        </button>
      </div>
      <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {brandName && (
          <div style={{ fontSize: 10, color: '#0E8A6E', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
            {brandName}
          </div>
        )}
        <div style={{
          fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 8,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {product.name}
        </div>
        {ratingVal > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <svg key={s} width='12' height='12' viewBox='0 0 24 24' fill={s <= Math.round(ratingVal) ? '#F59E0B' : '#E5E7EB'}>
                  <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
                </svg>
              ))}
            </div>
            <span style={{ fontSize: 10, color: '#6B7280' }}>({reviewCount})</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 'auto' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0B2545' }}>৳{product.price?.toLocaleString()}</span>
          {product.oldPrice > product.price && (
            <span style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>
              ৳{product.oldPrice?.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Animated counter hook
function useCountUp(target, duration = 1500, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started || !target) return;
    let start = 0;
    const steps = 60;
    const step = target / steps;
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(Math.floor(start));
      if (start >= target) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, started, duration]);
  return count;
}


// ══════════════════════════════════════════════════════════════════════════════
// MAIN HOMEPAGE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function HomePage({ onNavigate, onNavigateToProduct, onRegisterClick, initialFeaturedProducts = [] }) {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [typewriterText, setTypewriterText] = useState('Diagnostic Equipment');
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState(initialFeaturedProducts);
  const [featuredLoading, setFeaturedLoading] = useState(initialFeaturedProducts.length === 0);
  const [dealProducts, setDealProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [diagnosticProducts, setDiagnosticProducts] = useState([]);
  const [reagentProducts, setReagentProducts] = useState([]);
  const [hospitalProducts, setHospitalProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [promo, setPromo] = useState(null);
  const [stats, setStats] = useState({ totalProducts: 0, totalBrands: 0, totalOrders: 0, totalB2BClients: 0 });
  const [statsStarted, setStatsStarted] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [popularSearches, setPopularSearches] = useState(POPULAR_SEARCHES);
  const [settings, setSettings] = useState({
    freeDeliveryThreshold: 50000,
    returnPolicyDays: 30,
    b2bMaxDiscount: 22,
    b2bCreditDays: 90,
    certifications: ['DGDA Registered', 'ISO 13485 Certified'],
    supportHours: '24/7',
    contactPhone: '+880 1800-MED-CORE',
    contactEmail: 'info@medcorebd.com',
  });
  const [serviceStatus, setServiceStatus] = useState('operational');
  const [retryCount, setRetryCount] = useState(0);
  const statsRef = useRef(null);

  // Animated counters
  const productsCount = useCountUp(stats.totalProducts, 1500, statsStarted);
  const brandsCount = useCountUp(stats.totalBrands, 1500, statsStarted);
  const ordersCount = useCountUp(stats.totalOrders, 1500, statsStarted);
  const clientsCount = useCountUp(stats.totalB2BClients, 1500, statsStarted);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = useCallback((view) => {
    if (onNavigate) return onNavigate(view);
    const map = {
      diagnostics: '/products?category=Diagnostic+Equipment',
      surgical: '/products?category=Surgical+Instruments',
      machines: '/products?category=Hospital+Machines',
      'lab-equipment': '/products?category=Lab+Equipment',
      reagent: '/products?category=Laboratory+Reagents',
      product: '/products',
      b2b: '/b2b',
    };
    router.push(map[view] || '/');
  }, [onNavigate, router]);

  const goToProduct = useCallback((id) => {
    if (onNavigateToProduct) return onNavigateToProduct(id);
    router.push(`/products/${id}`);
  }, [onNavigateToProduct, router]);

  const goToRegister = useCallback(() => {
    if (onRegisterClick) return onRegisterClick();
    router.push('/register');
  }, [onRegisterClick, router]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  }, [searchQuery, router]);

  // ── Typewriter effect ──────────────────────────────────────────────────────
  useEffect(() => {
    const words = ['Diagnostic Equipment', 'Surgical Instruments', 'Laboratory Reagents'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % words.length;
      setTypewriterText(words[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Countdown timer (dynamic based on promo end date) ────────────────────────
  useEffect(() => {
    if (!promo?.endDate) {
      // Default countdown if no promo
      setCountdown({ hours: 11, minutes: 45, seconds: 22 });
      const timer = setInterval(() => {
        setCountdown(prev => {
          let { hours, minutes, seconds } = prev;
          if (seconds > 0) {
            seconds--;
          } else if (minutes > 0) {
            minutes--;
            seconds = 59;
          } else if (hours > 0) {
            hours--;
            minutes = 59;
            seconds = 59;
          } else {
            hours = 23;
            minutes = 59;
            seconds = 59;
          }
          return { hours, minutes, seconds };
        });
      }, 1000);
      return () => clearInterval(timer);
    }

    // Calculate countdown from promo end date
    const endTime = new Date(promo.endDate).getTime();
    const updateCountdown = () => {
      const now = Date.now();
      const diff = endTime - now;
      
      if (diff <= 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ hours, minutes, seconds });
    };
    
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [promo]);

  // ── Stats counter trigger ──────────────────────────────────────────────────
  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStatsStarted(true);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Retry function with exponential backoff ───────────────────────────────
  const retryWithBackoff = useCallback(async (fn, attempt = 0) => {
    try {
      const result = await fn();
      
      // Check if response indicates service unavailable
      if (result.status === 503) {
        throw { response: { status: 503 }, code: 'DB_UNAVAILABLE' };
      }
      
      // Success - restore service status
      if (serviceStatus === 'degraded') {
        setServiceStatus('operational');
        setRetryCount(0);
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          if (serviceStatus === 'operational') {
            setServiceStatus('operational');
          }
        }, 3000);
      }
      
      return result;
    } catch (error) {
      // Check for 503 error or DB_UNAVAILABLE code
      const is503 = error?.response?.status === 503 || error?.code === 'DB_UNAVAILABLE';
      
      if (is503 && attempt < 5) {
        const delay = Math.min(2 ** attempt * 2000, 30000);
        setServiceStatus('degraded');
        setRetryCount(attempt + 1);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(fn, attempt + 1);
      }
      
      throw error;
    }
  }, [serviceStatus]);

  // ── Parallel data fetch ────────────────────────────────────────────────────
  useEffect(() => {
    const safe = async (p) => {
      try {
        const response = await p;
        
        // Check for 503 status
        if (response.status === 503) {
          setServiceStatus('degraded');
          return { success: false, data: null, status: 503 };
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        // Check if error is 503
        if (error?.response?.status === 503 || error?.status === 503) {
          setServiceStatus('degraded');
        }
        return { success: false, data: null };
      }
    };

    const fetchData = async () => {
      const results = await Promise.all([
        safe(fetch(`${API}/products?isFeatured=true&limit=8`)),
        safe(fetch(`${API}/categories`)),
        safe(fetch(`${API}/products/category-counts`)),
        safe(fetch(`${API}/stats`)),
        safe(fetch(`${API}/coupons/active-promo`)),
        safe(fetch(`${API}/products?sortBy=newest&limit=10`)),
        safe(fetch(`${API}/manufacturers`)),
        safe(fetch(`${API}/products?badge=sale&limit=8`)),
        safe(fetch(`${API}/products?category=Diagnostic+Equipment&limit=4`)),
        safe(fetch(`${API}/products?category=Laboratory+Reagents&limit=4`)),
        safe(fetch(`${API}/products?category=Hospital+Machines&limit=4`)),
        safe(fetch(`${API}/settings`)),
        safe(fetch(`${API}/search/trending`)),
      ]);

      const [featured, cats, counts, statsData, promoData, newest, mfrs, deals, diagnostic, reagents, hospital, settingsData, trendingData] = results;

      // Check if any request returned 503
      const has503 = results.some(r => r.status === 503);
      
      if (has503) {
        // Use fallback data
        setCategories(FALLBACK_CATEGORIES);
        setPopularSearches(POPULAR_SEARCHES);
        setCategoriesLoading(false);
        setFeaturedLoading(false);
        
        // Retry after delay
        const retryDelay = Math.min(2 ** retryCount * 2000, 30000);
        setTimeout(() => {
          if (retryCount < 5) {
            setRetryCount(prev => prev + 1);
            fetchData();
          }
        }, retryDelay);
        return;
      }

      // Process successful responses
      const fp = featured.data?.products || featured.products || [];
      if (fp.length > 0) setFeaturedProducts(fp);
      setFeaturedLoading(false);

      const catList = cats.data?.categories || cats.categories || [];
      setCategories(catList.length > 0 ? catList : FALLBACK_CATEGORIES);
      setCategoryCounts(counts.data || {});
      setCategoriesLoading(false);

      if (statsData.data) setStats(statsData.data);
      setPromo(promoData.data?.coupon || null);

      const na = newest.data?.products || newest.products || [];
      setNewArrivals(na);

      const mfrList = mfrs.data?.manufacturers || mfrs.manufacturers || [];
      setBrands(mfrList);

      const dealList = deals.data?.products || deals.products || [];
      setDealProducts(dealList);

      const diagList = diagnostic.data?.products || diagnostic.products || [];
      setDiagnosticProducts(diagList);

      const reagList = reagents.data?.products || reagents.products || [];
      setReagentProducts(reagList);

      const hospList = hospital.data?.products || hospital.products || [];
      setHospitalProducts(hospList);

      // Update settings if API returns data
      if (settingsData.data || settingsData.settings) {
        setSettings(prev => ({ ...prev, ...(settingsData.data || settingsData.settings) }));
      }

      // Update popular searches if API returns data
      if (trendingData.data?.searches || trendingData.searches) {
        setPopularSearches(trendingData.data?.searches || trendingData.searches);
      }

      // Service restored
      if (serviceStatus === 'degraded') {
        setServiceStatus('operational');
        setRetryCount(0);
      }
    };

    fetchData().catch(() => {
      setFeaturedLoading(false);
      setCategoriesLoading(false);
      setCategories(FALLBACK_CATEGORIES);
      setPopularSearches(POPULAR_SEARCHES);
    });
  }, [retryCount, serviceStatus]);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
        .scroll-container { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; scroll-behavior: smooth; }
        .scroll-container::-webkit-scrollbar { height: 6px; }
        .scroll-container::-webkit-scrollbar-track { background: #F3F4F6; border-radius: 10px; }
        .scroll-container::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 10px; }
        .scroll-container::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
        .category-circle { transition: all 0.3s; }
        .category-circle:hover { transform: translateY(-4px); box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
        @media(max-width:768px){
          .hero-split{flex-direction:column!important;}
          .hero-right{display:none!important;}
          .cat-grid{grid-template-columns:repeat(2,1fr)!important;}
          .prod-grid{grid-template-columns:repeat(2,1fr)!important;}
          .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
          .b2b-split{flex-direction:column!important;}
        }
        @media(max-width:480px){
          .cat-grid{grid-template-columns:1fr!important;}
          .prod-grid{grid-template-columns:1fr!important;}
          .stats-grid{grid-template-columns:1fr!important;}
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SERVICE STATUS BANNER */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {serviceStatus === 'degraded' && (
        <div style={{
          background: '#FEF3C7',
          color: '#92400E',
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}>
          <span>⚠️</span>
          <span>Service temporarily unavailable. Using cached data. Retrying... (Attempt {retryCount}/5)</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: TOP TICKER BAR */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#0B2545', color: '#fff', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 24px', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 32, fontSize: 11, whiteSpace: 'nowrap' }}>
              <span>🏥 DGDA Registered Products</span>
              <span>🚚 Free Delivery over ৳{settings.freeDeliveryThreshold.toLocaleString()}</span>
              <span>🔧 Free Installation</span>
              <span>↺ {settings.returnPolicyDays}-Day Returns</span>
              <span>📞 {settings.supportHours} Support</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
            <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>📱 Get App</button>
            <button onClick={goToRegister} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>Sell on MedCore</button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: HERO - SPLIT LAYOUT */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #0B2545 0%, #0d2d52 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>
          <div className='hero-split' style={{ display: 'flex', gap: 32, alignItems: 'stretch' }}>
            {/* LEFT: Hero Content */}
            <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(14,138,110,0.15)', border: '1px solid rgba(77,219,184,0.3)', borderRadius: 999, padding: '6px 14px', marginBottom: 20, width: 'fit-content' }}>
                <span style={{ width: 6, height: 6, background: '#4DDBB8', borderRadius: '50%', animation: 'pulse 2s ease infinite' }} />
                <span style={{ fontSize: 10, color: '#4DDBB8', fontWeight: 600 }}>
                  {settings.certifications.join(' · ')} · {stats.totalBrands > 0 ? `${stats.totalBrands}+` : '29+'} Global Brands
                </span>
              </div>
              
              <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
                Bangladesh's Most Trusted<br />
                <span style={{ color: '#4DDBB8' }}>Medical Equipment Supplier</span>
              </h1>
              
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginBottom: 24, lineHeight: 1.6, maxWidth: 560 }}>
                Premium diagnostic devices, surgical instruments, laboratory reagents and hospital machines from world-leading brands.
              </p>

              {/* Search Bar */}
              <div style={{ display: 'flex', gap: 0, background: '#fff', borderRadius: 10, overflow: 'hidden', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  style={{ padding: '14px 16px', border: 'none', borderRight: '1px solid #E5E7EB', fontSize: 13, color: '#374151', cursor: 'pointer', background: '#F9FAFB' }}
                >
                  <option>All Categories</option>
                  {FALLBACK_CATEGORIES.map(cat => (
                    <option key={cat.slug}>{cat.name}</option>
                  ))}
                </select>
                <input
                  placeholder='Search ECG machine, HbA1c kit, trocar set...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  style={{ flex: 1, padding: '14px 16px', border: 'none', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                />
                <button
                  onClick={handleSearch}
                  style={{ padding: '14px 32px', background: '#0E8A6E', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0c7a61'}
                  onMouseLeave={e => e.currentTarget.style.background = '#0E8A6E'}
                >
                  Search
                </button>
              </div>

              {/* Popular Searches */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Popular:</span>
                {popularSearches.map(term => (
                  <button
                    key={term}
                    onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                    style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '5px 12px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  >
                    {term}
                  </button>
                ))}
              </div>

              {/* Trust Badges */}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>✓</span>
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>DGDA Registered</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🚚</span>
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>Free Delivery ৳{(settings.freeDeliveryThreshold / 1000).toFixed(0)}K+</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🔧</span>
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>Free Installation</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>↺</span>
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>{settings.returnPolicyDays}-Day Returns</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>💳</span>
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>B2B Credit Available</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Promo Banners */}
            <div className='hero-right' style={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* B2B Program Banner */}
              <div style={{ background: 'linear-gradient(135deg, #0E8A6E, #0c7a61)', borderRadius: 12, padding: 20, border: '1px solid rgba(77,219,184,0.3)' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>B2B PROGRAM</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Up to {settings.b2bMaxDiscount}% discount</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 12 }}>For hospitals & clinics</div>
                <button
                  onClick={goToRegister}
                  style={{ background: '#fff', color: '#0E8A6E', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%' }}
                >
                  Register now →
                </button>
              </div>

              {/* Flash Sale Banner */}
              <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, color: '#FCA5A5', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>LIMITED TIME OFFER</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>MEDCORE10</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 12 }}>10% off your first order</div>
                <div style={{ display: 'flex', gap: 8, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
                  <span>{String(countdown.hours).padStart(2, '0')}</span>
                  <span>:</span>
                  <span>{String(countdown.minutes).padStart(2, '0')}</span>
                  <span>:</span>
                  <span>{String(countdown.seconds).padStart(2, '0')}</span>
                </div>
              </div>

              {/* Free Installation Banner */}
              <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>DHAKA METRO</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Free Installation</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>Staff training included</div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: POLICY ICONS ROW */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
          {[
            { icon: '📦', text: 'DGDA Registered' },
            { icon: '🚚', text: `Free Delivery ৳${(settings.freeDeliveryThreshold / 1000).toFixed(0)}K+` },
            { icon: '🔧', text: 'Free Installation' },
            { icon: '↺', text: `${settings.returnPolicyDays}-Day Returns` },
            { icon: '💳', text: 'B2B Credit Available' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderLeft: i > 0 ? '1px solid #E5E7EB' : 'none' }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: CATEGORY NAVIGATION (Circular Icons) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div className='scroll-container' style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 8 }}>
            {(categories.length > 0 ? categories : FALLBACK_CATEGORIES).map((cat, i) => {
              const fallback = FALLBACK_CATEGORIES.find(f => f.name === cat.name);
              const icon = cat.icon || fallback?.icon || '📦';
              const bgColor = fallback?.color || '#F0FDF4';
              const slug = cat.slug || cat.name;
              return (
                <div
                  key={i}
                  className='category-circle'
                  onClick={() => router.push(`/products?category=${encodeURIComponent(cat.name || slug)}`)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 80 }}
                >
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    {icon}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', textAlign: 'center', maxWidth: 80 }}>{cat.name}</span>
                </div>
              );
            })}
            <div
              className='category-circle'
              onClick={() => goTo('product')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 80 }}
            >
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                →
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', textAlign: 'center' }}>View All</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: DEAL OF THE DAY */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
          {/* LEFT: Deal Box */}
          <div style={{ flex: '0 0 280px', background: 'linear-gradient(135deg, #DC2626, #991B1B)', borderRadius: 16, padding: 32, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, opacity: 0.9 }}>TODAY ONLY</div>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, lineHeight: 1.1 }}>Deal of the Day</div>
            <div style={{ display: 'flex', gap: 8, fontSize: 28, fontWeight: 700, fontFamily: 'monospace', marginBottom: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: 8 }}>{String(countdown.hours).padStart(2, '0')}</div>
              <span>:</span>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: 8 }}>{String(countdown.minutes).padStart(2, '0')}</div>
              <span>:</span>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: 8 }}>{String(countdown.seconds).padStart(2, '0')}</div>
            </div>
            <button
              onClick={() => goTo('product')}
              style={{ background: '#fff', color: '#DC2626', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}
            >
              See all deals →
            </button>
          </div>

          {/* RIGHT: Deal Products */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className='scroll-container'>
              {dealProducts.length > 0 ? (
                dealProducts.slice(0, 4).map(product => (
                  <ProductCard key={product._id} product={product} onNavigateToProduct={goToProduct} />
                ))
              ) : (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ minWidth: 220, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 14 }}>
                    <Skeleton w='100%' h={180} r={8} />
                    <div style={{ marginTop: 12 }}><Skeleton h={14} /></div>
                    <div style={{ marginTop: 8 }}><Skeleton h={12} w='70%' /></div>
                    <div style={{ marginTop: 12 }}><Skeleton h={20} w='50%' /></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: SHOP BY CATEGORY - Image Grid */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '56px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 12, color: '#0E8A6E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>OUR CATALOG</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, color: '#0B2545', marginBottom: 8 }}>Shop by category</h2>
            <button onClick={() => goTo('product')} style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>

          <div className='cat-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {(categories.length > 0 ? categories : FALLBACK_CATEGORIES).slice(0, 5).map((cat, i) => {
              const fallback = FALLBACK_CATEGORIES.find(f => f.name === cat.name);
              const icon = cat.icon || fallback?.icon || '📦';
              const bgColor = fallback?.color || '#F0FDF4';
              const iconColor = fallback?.iconColor || '#0E8A6E';
              const slug = cat.slug || cat.name;
              const count = categoryCounts[cat.name] || categoryCounts[slug] || 0;
              return (
                <div
                  key={i}
                  onClick={() => router.push(`/products?category=${encodeURIComponent(cat.name || slug)}`)}
                  style={{ background: bgColor, borderRadius: 16, padding: 24, cursor: 'pointer', transition: 'all 0.3s', position: 'relative', overflow: 'hidden', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12 }}>{fallback?.desc || cat.desc || ''}</div>
                    <div style={{ display: 'inline-block', background: iconColor, color: '#fff', fontSize: 10, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
                      {count > 0 ? `${count} products` : 'CE Certified'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 7: FLASH DEALS Horizontal Carousel */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>FLASH SALE</p>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, color: '#0B2545' }}>Flash deals on top picks!</h2>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#DC2626' }}>
            Ends in {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
          </div>
        </div>

        <div className='scroll-container'>
          {featuredLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ minWidth: 220, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 14 }}>
                <Skeleton w='100%' h={180} r={8} />
                <div style={{ marginTop: 12 }}><Skeleton h={14} /></div>
                <div style={{ marginTop: 8 }}><Skeleton h={12} w='70%' /></div>
                <div style={{ marginTop: 12 }}><Skeleton h={20} w='50%' /></div>
              </div>
            ))
          ) : featuredProducts.length > 0 ? (
            featuredProducts.map(product => (
              <ProductCard key={product._id} product={product} onNavigateToProduct={goToProduct} />
            ))
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>No flash deals available</div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 8: FEATURED PRODUCTS BY CATEGORY */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      
      {/* Diagnostic Equipment */}
      <section style={{ background: '#fff', padding: '56px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
            {/* Category Banner */}
            <div style={{ flex: '0 0 280px', background: 'linear-gradient(135deg, #2563EB, #1E40AF)', borderRadius: 16, padding: 32, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, opacity: 0.9 }}>CURATED</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>Top diagnostic equipment</div>
              <div style={{ fontSize: 13, marginBottom: 20, opacity: 0.9 }}>ECG, Ultrasound & Monitors</div>
              <div style={{ fontSize: 11, marginBottom: 16, opacity: 0.8 }}>CE Certified · DGDA Cleared</div>
              <button
                onClick={() => goTo('diagnostics')}
                style={{ background: '#fff', color: '#2563EB', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Shop All →
              </button>
            </div>

            {/* Products */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className='scroll-container'>
                {diagnosticProducts.length > 0 ? (
                  diagnosticProducts.map(product => (
                    <ProductCard key={product._id} product={product} onNavigateToProduct={goToProduct} />
                  ))
                ) : (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ minWidth: 220, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 14 }}>
                      <Skeleton w='100%' h={180} r={8} />
                      <div style={{ marginTop: 12 }}><Skeleton h={14} /></div>
                      <div style={{ marginTop: 8 }}><Skeleton h={12} w='70%' /></div>
                      <div style={{ marginTop: 12 }}><Skeleton h={20} w='50%' /></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Laboratory Reagents */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
          <div style={{ flex: '0 0 280px', background: 'linear-gradient(135deg, #9333EA, #7E22CE)', borderRadius: 16, padding: 32, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, opacity: 0.9 }}>BEST-SELLING</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>Laboratory Reagents</div>
            <div style={{ fontSize: 13, marginBottom: 20, opacity: 0.9 }}>HbA1c, CBC, Troponin kits</div>
            <div style={{ fontSize: 11, marginBottom: 16, opacity: 0.8 }}>Clinical · Molecular</div>
            <button
              onClick={() => goTo('reagent')}
              style={{ background: '#fff', color: '#9333EA', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Shop All →
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className='scroll-container'>
              {reagentProducts.length > 0 ? (
                reagentProducts.map(product => (
                  <ProductCard key={product._id} product={product} onNavigateToProduct={goToProduct} />
                ))
              ) : (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ minWidth: 220, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 14 }}>
                    <Skeleton w='100%' h={180} r={8} />
                    <div style={{ marginTop: 12 }}><Skeleton h={14} /></div>
                    <div style={{ marginTop: 8 }}><Skeleton h={12} w='70%' /></div>
                    <div style={{ marginTop: 12 }}><Skeleton h={20} w='50%' /></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Hospital Machines */}
      <section style={{ background: '#fff', padding: '56px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
            <div style={{ flex: '0 0 280px', background: 'linear-gradient(135deg, #EA580C, #C2410C)', borderRadius: 16, padding: 32, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, opacity: 0.9 }}>HOSPITAL GRADE</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>ICU Equipment</div>
              <div style={{ fontSize: 13, marginBottom: 20, opacity: 0.9 }}>Ventilators, Dialysis</div>
              <div style={{ fontSize: 11, marginBottom: 16, opacity: 0.8 }}>FDA Approved</div>
              <button
                onClick={() => goTo('machines')}
                style={{ background: '#fff', color: '#EA580C', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Shop All →
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className='scroll-container'>
                {hospitalProducts.length > 0 ? (
                  hospitalProducts.map(product => (
                    <ProductCard key={product._id} product={product} onNavigateToProduct={goToProduct} />
                  ))
                ) : (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ minWidth: 220, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 14 }}>
                      <Skeleton w='100%' h={180} r={8} />
                      <div style={{ marginTop: 12 }}><Skeleton h={14} /></div>
                      <div style={{ marginTop: 8 }}><Skeleton h={12} w='70%' /></div>
                      <div style={{ marginTop: 12 }}><Skeleton h={20} w='50%' /></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 9: NEW ARRIVALS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 12, color: '#0E8A6E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>JUST ARRIVED</p>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, color: '#0B2545' }}>Explore new arrivals</h2>
          </div>
          <button onClick={() => goTo('product')} style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
        </div>

        <div className='scroll-container'>
          {newArrivals.length > 0 ? (
            newArrivals.map(product => (
              <ProductCard key={product._id} product={{ ...product, badge: 'new' }} onNavigateToProduct={goToProduct} />
            ))
          ) : (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ minWidth: 220, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 14 }}>
                <Skeleton w='100%' h={180} r={8} />
                <div style={{ marginTop: 12 }}><Skeleton h={14} /></div>
                <div style={{ marginTop: 8 }}><Skeleton h={12} w='70%' /></div>
                <div style={{ marginTop: 12 }}><Skeleton h={20} w='50%' /></div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 10: TOP BRANDS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '56px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 12, color: '#0E8A6E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>TRUSTED PARTNERS</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, color: '#0B2545' }}>Top medical equipment brands</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            {brands.length > 0 ? (
              brands.slice(0, 8).map((brand, i) => {
                const brandName = typeof brand === 'string' ? brand : brand.name;
                const productCount = typeof brand === 'object' ? brand.productCount : 0;
                const initials = brandName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                const colors = ['#2563EB', '#9333EA', '#0E8A6E', '#EA580C', '#DC2626', '#0D9488', '#7C3AED', '#059669'];
                const bgColor = colors[i % colors.length];
                
                return (
                  <div
                    key={i}
                    onClick={() => router.push(`/products?brand=${encodeURIComponent(brandName)}`)}
                    style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = bgColor;
                      e.currentTarget.style.boxShadow = `0 4px 16px ${bgColor}20`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: bgColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{brandName}</div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>{productCount > 0 ? `${productCount} products` : '2 products'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <svg key={s} width='14' height='14' viewBox='0 0 24 24' fill='#F59E0B'>
                          <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
                        </svg>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Skeleton w={48} h={48} r={8} />
                    <div style={{ flex: 1 }}>
                      <Skeleton h={14} w='80%' />
                      <div style={{ marginTop: 4 }}><Skeleton h={11} w='50%' /></div>
                    </div>
                  </div>
                  <Skeleton h={14} w='60%' />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 11: STATS COUNTER ROW */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section ref={statsRef} style={{ background: 'linear-gradient(135deg, #0B2545, #0d2d52)', color: '#fff', padding: '56px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div className='stats-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 8, color: '#4DDBB8' }}>
                {statsStarted ? `${productsCount.toLocaleString()}+` : '0'}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Products</div>
            </div>
            <div>
              <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 8, color: '#4DDBB8' }}>
                {statsStarted ? `${brandsCount}+` : '0'}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Global Brands</div>
            </div>
            <div>
              <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 8, color: '#4DDBB8' }}>
                {statsStarted ? `${clientsCount.toLocaleString()}+` : '0'}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>B2B Clients</div>
            </div>
            <div>
              <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 8, color: '#4DDBB8' }}>
                {statsStarted ? `${ordersCount.toLocaleString()}+` : '0'}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Orders Fulfilled</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 12: B2B PROGRAM BANNER */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 24px' }}>
        <div className='b2b-split' style={{ display: 'flex', gap: 32, background: 'linear-gradient(135deg, #0E8A6E, #0c7a61)', borderRadius: 20, overflow: 'hidden', color: '#fff' }}>
          {/* LEFT */}
          <div style={{ flex: 1, padding: 48 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, opacity: 0.9 }}>EXCLUSIVE BENEFITS</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 20, lineHeight: 1.2 }}>For Hospitals & Clinics</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
              {[
                `✓ Up to ${settings.b2bMaxDiscount}% bulk discount`,
                `✓ ${settings.b2bCreditDays}-day credit terms`,
                '✓ Dedicated account manager',
                '✓ Priority technical support',
                '✓ Free installation & training',
                '✓ Customized quotations',
              ].map((item, i) => (
                <div key={i} style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={goToRegister}
                style={{ background: '#fff', color: '#0E8A6E', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Register for B2B
              </button>
              <button
                onClick={() => goTo('b2b')}
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Learn More
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: '0 0 320px', background: 'rgba(0,0,0,0.1)', padding: 48, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { label: 'Active Clients', value: stats.totalB2BClients > 0 ? `${stats.totalB2BClients.toLocaleString()}+` : '1,200+' },
              { label: 'Max Discount', value: `${settings.b2bMaxDiscount}%` },
              { label: 'Credit Terms', value: `${settings.b2bCreditDays} Days` },
              { label: 'Support', value: settings.supportHours },
            ].map((stat, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 13: WHY MEDCORE BD */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '56px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, color: '#0B2545', marginBottom: 12 }}>Why MedCore BD</h2>
            <p style={{ fontSize: 15, color: '#6B7280', maxWidth: 600, margin: '0 auto' }}>
              Your trusted partner for medical equipment in Bangladesh
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {WHY_US.map((item, i) => (
              <div
                key={i}
                style={{ background: '#fff', border: '1px solid #E5E7EB', borderLeft: '4px solid #0E8A6E', borderRadius: 12, padding: 24, transition: 'all 0.2s' }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 14: NEWSLETTER + APP DOWNLOAD */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #0E8A6E, #0c7a61)', padding: '48px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Newsletter */}
            <div style={{ flex: 1, minWidth: 300 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>✉️ Subscribe to our newsletter</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 20 }}>Get latest products, offers & medical news</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder='Enter your email address'
                  style={{ flex: 1, padding: '12px 16px', border: 'none', borderRadius: 8, fontSize: 14, outline: 'none' }}
                />
                <button style={{ background: '#0B2545', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Subscribe
                </button>
              </div>
            </div>

            {/* App Download */}
            <div style={{ flex: '0 0 auto' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12 }}>📱 Download our App</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  App Store
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Play Store
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 15: SEO TEXT BLOCK */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '56px 0' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0B2545', marginBottom: 20 }}>
            MedCore BD: Bangladesh's Most Trusted Medical Equipment Supplier
          </h2>
          
          <div style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p>
              <strong>MedCore BD</strong> is Bangladesh's leading supplier of medical equipment, diagnostic devices, surgical instruments, laboratory reagents, and hospital machines. We are proud to be <strong>DGDA registered</strong> and <strong>ISO 13485 certified</strong>, ensuring that all our products meet the highest international quality standards.
            </p>
            
            <p>
              Our extensive catalog includes over <strong>{stats.totalProducts > 0 ? `${stats.totalProducts.toLocaleString()}+` : '500+'} products</strong> from <strong>{stats.totalBrands > 0 ? `${stats.totalBrands}+` : '29+'} global brands</strong> including Siemens Healthineers, GE Healthcare, Philips, Abbott Laboratories, Roche Diagnostics, Beckman Coulter, Medtronic, and Mindray. We serve over <strong>{stats.totalB2BClients > 0 ? `${stats.totalB2BClients.toLocaleString()}+` : '1,200+'} hospitals, clinics, and diagnostic centers</strong> across Bangladesh with reliable products and exceptional service.
            </p>
            
            <p>
              <strong>Product Categories:</strong> Our comprehensive range covers Diagnostic Equipment (ECG machines, ultrasound systems, patient monitors), Surgical Instruments (scissors, forceps, scalpels, trocars), Laboratory Reagents (HbA1c kits, CBC reagents, troponin tests), Hospital Machines (ventilators, dialysis machines, ICU equipment), Lab Equipment (centrifuges, microscopes, PCR machines), PPE & Safety products, Dental Equipment, and Orthopedic Implants.
            </p>
            
            <p>
              <strong>B2B Services:</strong> We offer exclusive benefits for hospitals and clinics including up to {settings.b2bMaxDiscount}% bulk discounts, {settings.b2bCreditDays}-day credit terms, dedicated account managers, priority technical support, free installation and staff training, and customized quotations. Our B2B program is designed to support healthcare institutions with flexible payment options and comprehensive after-sales service.
            </p>
            
            <p>
              <strong>Why Choose MedCore BD:</strong> Free delivery on orders over ৳{settings.freeDeliveryThreshold.toLocaleString()} within Dhaka metro area, professional installation and staff training included, {settings.returnPolicyDays}-day hassle-free return policy, {settings.supportHours} technical support, DGDA-cleared products, CE and FDA certified equipment, and flexible payment methods including bKash, Nagad, bank transfer, and B2B credit terms.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 16: FOOTER */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#0B2545', color: '#fff', padding: '56px 0 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          {/* Main Footer Content */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 40, marginBottom: 40 }}>
            {/* Company Info */}
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 28 }}>M</span>
                <span>MedCore BD</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 16 }}>
                Bangladesh's most trusted medical equipment supplier. DGDA registered, ISO certified.
              </p>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>
                📞 +880 1800-MED-CORE
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                ✉️ info@medcorebd.com
              </div>
            </div>

            {/* Company Links */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Company</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['About Us', 'Blog', 'Careers', 'Contact'].map(link => (
                  <button
                    key={link}
                    onClick={() => router.push(`/${link.toLowerCase().replace(' ', '-')}`)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', textAlign: 'left', padding: 0, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#4DDBB8'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>

            {/* My Account Links */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>My Account</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Sign In / Register', path: '/login' },
                  { label: 'Orders', path: '/orders' },
                  { label: 'Wishlist', path: '/wishlist' },
                  { label: 'B2B Portal', path: '/b2b' },
                ].map(link => (
                  <button
                    key={link.label}
                    onClick={() => router.push(link.path)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', textAlign: 'left', padding: 0, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#4DDBB8'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Service Links */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Customer Service</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Payment Methods', path: '/payment-methods' },
                  { label: 'Shipping Policy', path: '/shipping' },
                  { label: 'Return & Refund', path: '/returns' },
                  { label: 'Track Order', path: '/track' },
                ].map(link => (
                  <button
                    key={link.label}
                    onClick={() => router.push(link.path)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', textAlign: 'left', padding: 0, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#4DDBB8'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              © 2026 MedCore BD. All rights reserved.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Payment:</span>
              {['bKash', 'Nagad', 'Stripe', 'Bank'].map(method => (
                <div
                  key={method}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '4px 10px', fontSize: 10, fontWeight: 600 }}
                >
                  {method}
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
