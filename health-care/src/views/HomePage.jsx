'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const FALLBACK_CATEGORIES = [
  { name: 'Diagnostic Equipment', slug: 'Diagnostic Equipment', icon: '🩺', desc: 'ECG, Ultrasound, Monitors', color: '#EFF6FF', iconColor: '#2563EB' },
  { name: 'Surgical Instruments', slug: 'Surgical Instruments', icon: '🔬', desc: 'Scissors, Forceps, Scalpels', color: '#F0FDF4', iconColor: '#16A34A' },
  { name: 'Laboratory Reagents', slug: 'Laboratory Reagents', icon: '🧪', desc: 'HbA1c, CBC, Troponin Kits', color: '#FAF5FF', iconColor: '#9333EA' },
  { name: 'Hospital Machines', slug: 'Hospital Machines', icon: '🏥', desc: 'Ventilators, Dialysis, ICU', color: '#FFF7ED', iconColor: '#EA580C' },
  { name: 'Lab Equipment', slug: 'Lab Equipment', icon: '🔭', desc: 'Centrifuges, Microscopes, PCR', color: '#F0FDFA', iconColor: '#0D9488' },
  { name: 'PPE & Safety', slug: 'PPE', icon: '🛡️', desc: 'Masks, Gloves, Gowns', color: '#FFF1F2', iconColor: '#E11D48' },
  { name: 'Dental Equipment', slug: 'Dental Equipment', icon: '🦷', desc: 'Chairs, Drills, Instruments', color: '#FFFBEB', iconColor: '#D97706' },
  { name: 'Implants & Ortho', slug: 'Implants', icon: '🦴', desc: 'Bone Plates, Screws, Joints', color: '#F8FAFC', iconColor: '#475569' },
];

const POPULAR_SEARCHES = ['ECG Machine', 'N95 Mask', 'HbA1c Kit', 'Trocar Set', 'Pulse Oximeter'];

const FALLBACK_BRANDS = [
  'Siemens Healthineers','GE Healthcare','Philips','Abbott Laboratories',
  'Roche Diagnostics','Beckman Coulter','Medtronic','Mindray',
  'BD Medical','Olympus','Stryker','Johnson & Johnson',
];

const WHY_US = [
  { icon: '🏆', title: 'DGDA Registered', desc: 'All products are DGDA-cleared and meet Bangladesh regulatory standards.' },
  { icon: '🚚', title: 'Fast Delivery', desc: 'Same-day dispatch for orders before 12 PM. Free delivery in Dhaka metro.' },
  { icon: '🔧', title: 'Free Installation', desc: 'Professional installation and staff training included for all equipment.' },
  { icon: '📞', title: '24/7 Support', desc: 'Dedicated technical support team available round the clock.' },
  { icon: '💳', title: 'Flexible Payment', desc: 'Bank transfer, bKash, Nagad, and B2B credit terms available.' },
  { icon: '🔄', title: '30-Day Returns', desc: 'Hassle-free returns and replacement policy on all products.' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: '🔍', title: 'Browse & Search', desc: 'Find products by category, brand, or specification using our advanced search.' },
  { step: '02', icon: '🛒', title: 'Add to Cart', desc: 'Select quantity, variants, and warranty options. Request a formal quotation for B2B.' },
  { step: '03', icon: '💳', title: 'Secure Checkout', desc: 'Pay via bKash, Nagad, bank transfer, or B2B credit. All transactions encrypted.' },
  { step: '04', icon: '🚚', title: 'Fast Delivery', desc: 'Same-day dispatch from our Dhaka warehouse. Free installation included.' },
];
// Skeleton loader
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

// Inline ProductCard for homepage
function ProductCard({ product, onNavigateToProduct }) {
  const imageData = product.images?.[0];
  const imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const ratingVal = typeof product.rating === 'object' ? product.rating?.average : (product.rating || 0);
  const reviewCount = product.reviewCount || product.rating?.count || 0;
  const isNew = product.badge === 'new' || (product.createdAt && (Date.now() - new Date(product.createdAt)) < 30 * 24 * 60 * 60 * 1000);
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div
      onClick={() => onNavigateToProduct && onNavigateToProduct(product._id || product.id)}
      style={{ cursor: 'pointer', background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        transition: 'box-shadow 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ position: 'relative', width: '100%', height: 180, background: '#F9FAFB', overflow: 'hidden', flexShrink: 0 }}>
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} loading='lazy'
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
            onError={e => { e.currentTarget.style.display = 'none'; if(e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div style={{ display: imageUrl ? 'none' : 'flex', position: 'absolute', inset: 0,
          alignItems: 'center', justifyContent: 'center', fontSize: 52, background: '#F3F4F6' }}>🏥</div>
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {isNew && <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: '#E1F5EE', color: '#065F46' }}>✨ NEW</span>}
          {isLowStock && <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: '#FEE2E2', color: '#991B1B' }}>🔥 Only {product.stock} left</span>}
          {product.badge === 'bestseller' && <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: '#FEF3C7', color: '#92400E' }}>⭐ BESTSELLER</span>}
          {product.badge === 'sale' && <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: '#FCEBEB', color: '#991B1B' }}>🔥 SALE</span>}
        </div>
        {product.stock === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600, background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 20 }}>Out of Stock</span>
          </div>
        )}
      </div>
      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, color: '#0E8A6E', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{brandName}</div>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 8, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</div>
        {ratingVal > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 1 }}>
              {[1,2,3,4,5].map(s => (
                <svg key={s} width='10' height='10' viewBox='0 0 24 24' fill={s <= Math.round(ratingVal) ? '#F59E0B' : '#E5E7EB'}>
                  <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/>
                </svg>
              ))}
            </div>
            <span style={{ fontSize: 10, color: '#6B7280' }}>{ratingVal} ({reviewCount})</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0B2545' }}>৳{product.price?.toLocaleString()}</span>
          {product.oldPrice > product.price && (
            <span style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through' }}>৳{product.oldPrice?.toLocaleString()}</span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onNavigateToProduct && onNavigateToProduct(product._id || product.id); }}
          style={{ width: '100%', padding: '8px', background: '#0B2545', color: '#fff', border: 'none',
            borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#0d2d52'}
          onMouseLeave={e => e.currentTarget.style.background = '#0B2545'}
        >View Product</button>
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

// ── Main HomePage ────────────────────────────────────────────────────────────
export default function HomePage({ onNavigate, onNavigateToProduct, onRegisterClick, initialFeaturedProducts = [] }) {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [typewriterText, setTypewriterText] = useState('Medical Equipment');
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState(initialFeaturedProducts);
  const [featuredLoading, setFeaturedLoading] = useState(initialFeaturedProducts.length === 0);
  const [activeTab, setActiveTab] = useState('all');
  const [newArrivals, setNewArrivals] = useState([]);
  const [brands, setBrands] = useState(FALLBACK_BRANDS);
  const [promo, setPromo] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [stats, setStats] = useState({ totalProducts: 0, totalBrands: 0, totalOrders: 0, totalB2BClients: 0 });
  const [statsStarted, setStatsStarted] = useState(false);
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
      reagent: '/reagent-store',
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
    const words = ['Medical Equipment', 'Surgical Instruments', 'Laboratory Reagents'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % words.length;
      setTypewriterText(words[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Stats counter trigger ──────────────────────────────────────────────────
  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStatsStarted(true); observer.disconnect(); }
    }, { threshold: 0.3 });
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Parallel data fetch ────────────────────────────────────────────────────
  useEffect(() => {
    const safe = (p) => p.catch(() => ({ success: false, data: null }));
    Promise.all([
      safe(fetch(`${API}/products?isFeatured=true&limit=6`).then(r => r.json())),
      safe(fetch(`${API}/categories`).then(r => r.json())),
      safe(fetch(`${API}/products/category-counts`).then(r => r.json())),
      safe(fetch(`${API}/stats`).then(r => r.json())),
      safe(fetch(`${API}/coupons/active-promo`).then(r => r.json())),
      safe(fetch(`${API}/reviews/featured`).then(r => r.json())),
      safe(fetch(`${API}/products?sortBy=newest&limit=8`).then(r => r.json())),
      safe(fetch(`${API}/manufacturers`).then(r => r.json())),
    ]).then(([featured, cats, counts, statsData, promoData, reviewsData, newest, mfrs]) => {
      const fp = featured.data?.products || featured.products || [];
      if (fp.length > 0) setFeaturedProducts(fp);
      setFeaturedLoading(false);
      const catList = cats.data?.categories || cats.categories || [];
      setCategories(catList.length > 0 ? catList : FALLBACK_CATEGORIES);
      setCategoryCounts(counts.data || {});
      setCategoriesLoading(false);
      if (statsData.data) setStats(statsData.data);
      setPromo(promoData.data?.coupon || null);
      setTestimonials(reviewsData.data?.reviews || []);
      const na = newest.data?.products || newest.products || [];
      setNewArrivals(na);
      const mfrList = mfrs.data?.manufacturers || mfrs.manufacturers || [];
      if (mfrList.length > 0) setBrands(mfrList.map(m => m.name));
    }).catch(() => {
      setFeaturedLoading(false);
      setCategoriesLoading(false);
      setCategories(FALLBACK_CATEGORIES);
    });
  }, []);

  // ── Tab filter for featured products ──────────────────────────────────────
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setFeaturedLoading(true);
    const params = tab === 'all' ? 'isFeatured=true&limit=6' : `isFeatured=true&category=${encodeURIComponent(tab)}&limit=6`;
    fetch(`${API}/products?${params}`)
      .then(r => r.json())
      .then(data => setFeaturedProducts(data.data?.products || data.products || []))
      .catch(() => {})
      .finally(() => setFeaturedLoading(false));
  }, []);
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes typewriter { 0%,100%{opacity:1} 50%{opacity:0.7} }
        .advantage-card { animation: fadeInUp 0.5s ease both; }
        .advantage-card:nth-child(1){animation-delay:0.05s}
        .advantage-card:nth-child(2){animation-delay:0.1s}
        .advantage-card:nth-child(3){animation-delay:0.15s}
        .advantage-card:nth-child(4){animation-delay:0.2s}
        .advantage-card:nth-child(5){animation-delay:0.25s}
        .advantage-card:nth-child(6){animation-delay:0.3s}
        .marquee-track { display:flex; animation:marquee 22s linear infinite; width:max-content; }
        .marquee-track:hover { animation-play-state:paused; }
        .hero-search:focus { outline:none; }
        .pill-tag:hover { background:rgba(255,255,255,0.2)!important; cursor:pointer; }
        .cat-card:hover { border-color:#0E8A6E!important; box-shadow:0 4px 16px rgba(14,138,110,0.12)!important; }
        .cat-card:hover .cat-arrow { opacity:1!important; }
        .tab-btn { transition:all 0.2s; }
        .tab-btn:hover { background:#F3F4F6!important; }
        .tab-btn.active { background:#0B2545!important; color:#fff!important; }
        @media(max-width:768px){
          .hero-grid{grid-template-columns:1fr!important;}
          .hero-right{display:none!important;}
          .cat-grid{grid-template-columns:repeat(2,1fr)!important;}
          .prod-grid{grid-template-columns:repeat(2,1fr)!important;}
          .why-grid{grid-template-columns:repeat(2,1fr)!important;}
          .stats-grid{grid-template-columns:repeat(2,1fr)!important;}
          .how-grid{grid-template-columns:repeat(2,1fr)!important;}
          .b2b-grid{grid-template-columns:1fr!important;}
          .cta-flex{flex-direction:column!important;text-align:center!important;}
          .trust-flex{justify-content:center!important;}
        }
        @media(max-width:480px){
          .cat-grid{grid-template-columns:1fr!important;}
          .prod-grid{grid-template-columns:1fr!important;}
          .how-grid{grid-template-columns:1fr!important;}
          .stats-grid{grid-template-columns:1fr!important;}
        }
      `}</style>
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{ background: '#0B2545', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position:'absolute',inset:0,opacity:0.04,backgroundImage:'radial-gradient(circle at 1px 1px,white 1px,transparent 0)',backgroundSize:'32px 32px' }} />
        <div style={{ position:'absolute',top:0,right:0,width:600,height:600,background:'#0E8A6E',borderRadius:'50%',opacity:0.08,transform:'translate(33%,-33%)' }} />
        <div style={{ position:'absolute',bottom:0,left:0,width:400,height:400,background:'#4DDBB8',borderRadius:'50%',opacity:0.05,transform:'translate(-33%,33%)' }} />
        <div style={{ position:'relative',maxWidth:1152,margin:'0 auto',padding:'72px 24px' }}>
          <div className='hero-grid' style={{ display:'grid',gridTemplateColumns:'1fr 400px',gap:48,alignItems:'center' }}>
            {/* Left */}
            <div>
              <div style={{ display:'inline-flex',alignItems:'center',gap:8,background:'rgba(14,138,110,0.2)',border:'1px solid rgba(14,138,110,0.3)',borderRadius:999,padding:'6px 16px',marginBottom:24 }}>
                <span style={{ width:8,height:8,background:'#4DDBB8',borderRadius:'50%',display:'inline-block',animation:'typewriter 2s ease infinite' }} />
                <span style={{ fontSize:11,color:'#4DDBB8',fontWeight:600 }}>DGDA Registered · ISO 13485 Certified</span>
              </div>
              <h1 style={{ fontSize:'clamp(28px,4vw,42px)',fontWeight:700,lineHeight:1.15,marginBottom:16,fontFamily:'var(--font-lora)' }}>
                Bangladesh's Most Trusted<br />
                <span style={{ color:'#4DDBB8',transition:'opacity 0.4s' }}>{typewriterText}</span> Supplier
              </h1>
              <p style={{ fontSize:14,color:'rgba(255,255,255,0.72)',marginBottom:28,lineHeight:1.7,maxWidth:480 }}>
                Premium diagnostic devices, surgical instruments, laboratory reagents, and hospital machines from world-leading brands. Serving hospitals and clinics nationwide.
              </p>
              <div style={{ display:'flex',gap:12,marginBottom:24,flexWrap:'wrap' }}>
                <button onClick={() => goTo('product')}
                  style={{ padding:'12px 28px',background:'#0E8A6E',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#0c7a61'}
                  onMouseLeave={e=>e.currentTarget.style.background='#0E8A6E'}
                >Browse Products</button>
                <button onClick={goToRegister}
                  style={{ padding:'12px 28px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.18)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                >Register for B2B →</button>
              </div>
              {/* Search bar */}
              <div style={{ display:'flex',gap:0,background:'rgba(255,255,255,0.1)',borderRadius:8,padding:'4px 4px 4px 14px',border:'1px solid rgba(255,255,255,0.2)',maxWidth:440,marginBottom:12 }}>
                <input className='hero-search'
                  placeholder='Search ECG machine, HbA1c reagent, trocar...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  style={{ flex:1,background:'transparent',border:'none',color:'#fff',fontSize:12,fontFamily:'inherit',padding:'4px 0' }}
                />
                <button onClick={handleSearch}
                  style={{ background:'#0E8A6E',color:'#fff',border:'none',padding:'8px 18px',borderRadius:6,fontSize:12,fontWeight:500,cursor:'pointer',flexShrink:0 }}
                >Search</button>
              </div>
              {/* Popular searches */}
              <div style={{ display:'flex',gap:6,flexWrap:'wrap',alignItems:'center' }}>
                <span style={{ fontSize:10,color:'rgba(255,255,255,0.45)' }}>Popular:</span>
                {POPULAR_SEARCHES.map(term => (
                  <span key={term} className='pill-tag'
                    onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                    style={{ fontSize:10,color:'rgba(255,255,255,0.7)',border:'0.5px solid rgba(255,255,255,0.25)',borderRadius:20,padding:'3px 10px',cursor:'pointer',transition:'background 0.2s' }}
                  >{term}</span>
                ))}
              </div>
              {/* Hero stats */}
              <div style={{ display:'flex',gap:32,marginTop:28 }}>
                {stats.totalProducts > 0 ? (
                  <><div><div style={{ fontSize:22,fontWeight:700 }}>{stats.totalProducts.toLocaleString()}+</div><div style={{ fontSize:11,color:'rgba(255,255,255,0.55)' }}>Products</div></div>
                  <div><div style={{ fontSize:22,fontWeight:700 }}>{stats.totalBrands}+</div><div style={{ fontSize:11,color:'rgba(255,255,255,0.55)' }}>Global Brands</div></div>
                  <div><div style={{ fontSize:22,fontWeight:700 }}>{stats.totalB2BClients.toLocaleString()}+</div><div style={{ fontSize:11,color:'rgba(255,255,255,0.55)' }}>B2B Clients</div></div></>
                ) : (
                  <><div><Skeleton w={80} h={22} /><div style={{ fontSize:11,color:'rgba(255,255,255,0.55)',marginTop:4 }}>Products</div></div>
                  <div><Skeleton w={60} h={22} /><div style={{ fontSize:11,color:'rgba(255,255,255,0.55)',marginTop:4 }}>Global Brands</div></div>
                  <div><Skeleton w={70} h={22} /><div style={{ fontSize:11,color:'rgba(255,255,255,0.55)',marginTop:4 }}>B2B Clients</div></div></>
                )}
              </div>
            </div>
            {/* Right — category cards */}
            <div className='hero-right' style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              {[
                { icon:'🩺',title:'Diagnostic',sub:'ECG · Ultrasound · Monitors',view:'diagnostics' },
                { icon:'💉',title:'Surgical',sub:'Instruments · Implants',view:'surgical' },
                { icon:'🧪',title:'Reagents',sub:'Clinical · Molecular',view:'reagent' },
                { icon:'🏥',title:'Hospital',sub:'ICU · Ventilators · Dialysis',view:'machines' },
              ].map(c => (
                <div key={c.title} onClick={() => goTo(c.view)}
                  style={{ background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:16,cursor:'pointer',transition:'all 0.2s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.14)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.transform='none'; }}
                >
                  <div style={{ fontSize:28,marginBottom:8 }}>{c.icon}</div>
                  <div style={{ fontSize:13,fontWeight:600,marginBottom:4 }}>{c.title}</div>
                  <div style={{ fontSize:10,color:'rgba(255,255,255,0.5)' }}>{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* ── TRUST BAR ──────────────────────────────────────────────────────── */}
      <section style={{ background:'#fff',borderBottom:'1px solid #E5E7EB' }}>
        <div className='trust-flex' style={{ maxWidth:1152,margin:'0 auto',padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
          {[
            { icon:'✅',text:'DGDA Registered Products' },
            { icon:'��',text:'Free Delivery over ৳50,000' },
            { icon:'🔧',text:'Free Installation in Dhaka' },
            { icon:'🔄',text:'30-Day Return Policy' },
            { icon:'📞',text:'24/7 Technical Support' },
          ].map((t,i) => (
            <div key={t.text} style={{ display:'flex',alignItems:'center',gap:8,padding:'0 16px',borderLeft:i>0?'1px solid #E5E7EB':'none' }}>
              <span style={{ fontSize:18 }}>{t.icon}</span>
              <span style={{ fontSize:12,fontWeight:500,color:'#111827' }}>{t.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROMO BANNER ────────────────────────────────────────────────────── */}
      {promo && (
        <section style={{ background:'linear-gradient(135deg,#0E8A6E,#085041)',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'center',gap:16,flexWrap:'wrap' }}>
          <span style={{ fontSize:16 }}>🏷️</span>
          <span style={{ color:'#fff',fontSize:13,fontWeight:500 }}>
            Use code{' '}
            <strong style={{ background:'rgba(255,255,255,0.2)',padding:'2px 8px',borderRadius:4,fontSize:14 }}>{promo.code}</strong>
            {' '}for{' '}
            {promo.type === 'percentage' ? `${promo.value}% off` : `৳${promo.value} off`}
            {promo.description ? ` — ${promo.description}` : ''}
          </span>
          <span style={{ fontSize:11,color:'rgba(255,255,255,0.65)' }}>
            Expires: {new Date(promo.endDate).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
          </span>
          <button onClick={() => goTo('product')}
            style={{ background:'#fff',color:'#0E8A6E',border:'none',padding:'5px 14px',borderRadius:16,fontSize:12,fontWeight:600,cursor:'pointer' }}
          >Shop now →</button>
        </section>
      )}

      {/* ── CATEGORIES ──────────────────────────────────────────────────────── */}
      <section style={{ maxWidth:1152,margin:'0 auto',padding:'56px 24px' }}>
        <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:32 }}>
          <div>
            <p style={{ fontSize:12,color:'#0E8A6E',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>Our Catalog</p>
            <h2 style={{ fontSize:'clamp(22px,3vw,28px)',fontWeight:700,fontFamily:'var(--font-lora)' }}>Shop by Category</h2>
          </div>
          <button onClick={() => goTo('product')} style={{ fontSize:12,color:'#0E8A6E',fontWeight:500,background:'none',border:'none',cursor:'pointer' }}>View all products →</button>
        </div>
        <div className='cat-grid' style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16 }}>
          {categoriesLoading ? (
            Array.from({length:8}).map((_,i) => (
              <div key={i} style={{ background:'#fff',borderRadius:12,border:'1px solid #E5E7EB',padding:20 }}>
                <Skeleton w={48} h={48} r={12} />
                <div style={{ marginTop:12 }}><Skeleton h={14} /></div>
                <div style={{ marginTop:8 }}><Skeleton h={11} w='70%' /></div>
              </div>
            ))
          ) : (
            (categories.length > 0 ? categories : FALLBACK_CATEGORIES).slice(0,8).map((cat) => {
              const slug = cat.slug || cat.name;
              const count = categoryCounts[cat.name] || categoryCounts[slug] || 0;
              const fallback = FALLBACK_CATEGORIES.find(f => f.name === cat.name || f.slug === slug);
              const icon = cat.icon || fallback?.icon || '📦';
              const iconColor = fallback?.iconColor || '#0E8A6E';
              const bgColor = fallback?.color || '#F0FDF4';
              return (
                <div key={cat._id || cat.name} className='cat-card'
                  onClick={() => router.push(`/products?category=${encodeURIComponent(cat.name || slug)}`)}
                  style={{ background:'#fff',borderRadius:12,border:'1px solid #E5E7EB',padding:20,cursor:'pointer',transition:'all 0.2s',position:'relative' }}
                >
                  <div style={{ width:48,height:48,borderRadius:12,background:bgColor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:12 }}>{icon}</div>
                  <h3 style={{ fontSize:13,fontWeight:600,marginBottom:4 }}>{cat.name}</h3>
                  <p style={{ fontSize:11,color:'#6B7280',marginBottom:10 }}>{cat.desc || cat.description || ''}</p>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                    <span style={{ fontSize:11,color:'#9CA3AF' }}>{count > 0 ? `${count}+ products` : 'Browse →'}</span>
                    <svg className='cat-arrow' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#0E8A6E' strokeWidth='2' style={{ opacity:0,transition:'opacity 0.2s' }}>
                      <path d='M5 12h14M12 5l7 7-7 7'/>
                    </svg>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
      {/* ── FEATURED PRODUCTS ───────────────────────────────────────────────── */}
      <section style={{ background:'#fff',padding:'56px 0' }}>
        <div style={{ maxWidth:1152,margin:'0 auto',padding:'0 24px' }}>
          <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24 }}>
            <div>
              <p style={{ fontSize:12,color:'#0E8A6E',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>Hand-picked</p>
              <h2 style={{ fontSize:'clamp(22px,3vw,28px)',fontWeight:700,fontFamily:'var(--font-lora)' }}>Featured Products</h2>
            </div>
            <button onClick={() => goTo('product')} style={{ fontSize:12,color:'#0E8A6E',fontWeight:500,background:'none',border:'none',cursor:'pointer' }}>View all →</button>
          </div>
          {/* Tab filter */}
          <div style={{ display:'flex',gap:8,marginBottom:24,flexWrap:'wrap' }}>
            {[
              { key:'all',label:'All Products' },
              { key:'Diagnostic Equipment',label:'Diagnostic' },
              { key:'Surgical Instruments',label:'Surgical' },
              { key:'Laboratory Reagents',label:'Reagents' },
              { key:'Hospital Machines',label:'Machines' },
            ].map(tab => (
              <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.key)}
                style={{ padding:'8px 16px',borderRadius:8,border:'1px solid #E5E7EB',background:activeTab === tab.key ? '#0B2545' : '#fff',color:activeTab === tab.key ? '#fff' : '#111827',fontSize:12,fontWeight:500,cursor:'pointer' }}
              >{tab.label}</button>
            ))}
          </div>
          {featuredLoading ? (
            <div style={{ display:'flex',justifyContent:'center',padding:'64px 0' }}><Spinner /></div>
          ) : featuredProducts.length === 0 ? (
            <div style={{ textAlign:'center',padding:'64px 0',color:'#6B7280' }}>No products available</div>
          ) : (
            <div className='prod-grid' style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20 }}>
              {featuredProducts.slice(0,6).map(product => (
                <ProductCard key={product._id || product.id} product={product} onNavigateToProduct={goToProduct} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── NEW ARRIVALS ─────────────────────────────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section style={{ background:'#F9FAFB',padding:'40px 0',overflow:'hidden' }}>
          <div style={{ maxWidth:1152,margin:'0 auto',padding:'0 24px',marginBottom:20 }}>
            <p style={{ fontSize:12,color:'#0E8A6E',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>Just Arrived</p>
            <h2 style={{ fontSize:'clamp(22px,3vw,28px)',fontWeight:700,fontFamily:'var(--font-lora)' }}>New Arrivals</h2>
          </div>
          <div style={{ display:'flex',gap:16,overflowX:'auto',padding:'0 24px',scrollbarWidth:'none' }}>
            {newArrivals.map(product => {
              const imageData = product.images?.[0];
              const imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
              return (
                <div key={product._id} onClick={() => goToProduct(product._id)}
                  style={{ minWidth:200,background:'#fff',borderRadius:12,border:'1px solid #E5E7EB',overflow:'hidden',cursor:'pointer',flexShrink:0 }}
                >
                  <div style={{ width:200,height:160,background:'#F3F4F6',position:'relative' }}>
                    {imageUrl ? <img src={imageUrl} alt={product.name} loading='lazy' style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:40 }}>🏥</div>}
                    <span style={{ position:'absolute',top:8,left:8,fontSize:9,padding:'3px 8px',borderRadius:20,fontWeight:600,background:'#E1F5EE',color:'#065F46' }}>✨ NEW</span>
                  </div>
                  <div style={{ padding:12 }}>
                    <div style={{ fontSize:12,fontWeight:600,marginBottom:4,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{product.name}</div>
                    <div style={{ fontSize:14,fontWeight:700,color:'#0B2545' }}>৳{product.price?.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      {/* ── BRANDS MARQUEE ──────────────────────────────────────────────────── */}
      <section style={{ borderTop:'1px solid #E5E7EB',borderBottom:'1px solid #E5E7EB',background:'#fff',padding:'28px 0',overflow:'hidden' }}>
        <p style={{ textAlign:'center',fontSize:11,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:500,marginBottom:20 }}>Authorised distributor of world-leading brands</p>
        <div style={{ overflow:'hidden' }}>
          <div className='marquee-track'>
            {[...brands,...brands].map((brand,i) => (
              <div key={i} style={{ padding:'0 40px',whiteSpace:'nowrap',fontSize:14,fontWeight:600,color:'#6B7280',display:'flex',alignItems:'center' }}>
                {typeof brand === 'object' && brand.logo?.url
                  ? <img src={brand.logo.url} alt={brand.name || brand} loading='lazy' style={{ height:28,objectFit:'contain' }} />
                  : (typeof brand === 'string' ? brand : brand.name)
                }
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY MEDCORE BD ──────────────────────────────────────────────────── */}
      <section style={{ maxWidth:1152,margin:'0 auto',padding:'56px 24px' }}>
        <div style={{ textAlign:'center',marginBottom:40 }}>
          <p style={{ fontSize:12,color:'#0E8A6E',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>Why MedCore BD</p>
          <h2 style={{ fontSize:'clamp(22px,3vw,28px)',fontWeight:700,fontFamily:'var(--font-lora)' }}>The MedCore Advantage</h2>
        </div>
        <div className='why-grid' style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20 }}>
          {WHY_US.map((w,i) => (
            <div key={w.title} className='advantage-card'
              style={{ background:'#fff',borderRadius:12,border:'1px solid #E5E7EB',padding:24,transition:'box-shadow 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
            >
              <div style={{ fontSize:36,marginBottom:12 }}>{w.icon}</div>
              <h3 style={{ fontSize:14,fontWeight:600,marginBottom:8 }}>{w.title}</h3>
              <p style={{ fontSize:12,color:'#6B7280',lineHeight:1.6 }}>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE STATS COUNTER ──────────────────────────────────────────────── */}
      <section ref={statsRef} style={{ background:'#0B2545',padding:'48px 24px' }}>
        <div style={{ maxWidth:1152,margin:'0 auto' }}>
          <div className='stats-grid' style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:24 }}>
            {[
              { value:productsCount,suffix:'+',label:'Products Available',icon:'📦' },
              { value:brandsCount,suffix:'+',label:'Global Brands',icon:'🏭' },
              { value:clientsCount,suffix:'+',label:'B2B Clients',icon:'🏥' },
              { value:ordersCount,suffix:'+',label:'Orders Fulfilled',icon:'🚚' },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center',padding:'24px 16px',background:'rgba(255,255,255,0.06)',borderRadius:12,border:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize:28,marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontSize:'clamp(28px,4vw,40px)',fontWeight:700,color:'#4DDBB8',lineHeight:1 }}>
                  {s.value > 0 ? s.value.toLocaleString() + s.suffix : '—'}
                </div>
                <div style={{ fontSize:12,color:'rgba(255,255,255,0.6)',marginTop:8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── B2B PROGRAM ─────────────────────────────────────────────────────── */}
      <section style={{ maxWidth:1152,margin:'0 auto',padding:'56px 24px' }}>
        <div style={{ position:'relative',background:'linear-gradient(135deg,#0B2545,#0d3a6e)',borderRadius:20,padding:48,color:'#fff',overflow:'hidden' }}>
          <div style={{ position:'absolute',top:0,right:0,width:320,height:320,background:'#0E8A6E',borderRadius:'50%',opacity:0.1,transform:'translate(33%,-33%)' }} />
          <div className='b2b-grid' style={{ position:'relative',display:'grid',gridTemplateColumns:'1fr auto',gap:32,alignItems:'center' }}>
            <div>
              <div style={{ display:'inline-flex',alignItems:'center',gap:8,background:'rgba(14,138,110,0.2)',border:'1px solid rgba(14,138,110,0.3)',borderRadius:999,padding:'4px 12px',marginBottom:16 }}>
                <span style={{ fontSize:10,color:'#4DDBB8',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em' }}>B2B Program</span>
              </div>
              <h3 style={{ fontSize:'clamp(20px,3vw,28px)',fontWeight:700,marginBottom:12,fontFamily:'var(--font-lora)' }}>Exclusive Benefits for Hospitals & Clinics</h3>
              <p style={{ fontSize:13,color:'rgba(255,255,255,0.72)',marginBottom:24,maxWidth:480,lineHeight:1.7 }}>
                Join {stats.totalB2BClients > 0 ? `${stats.totalB2BClients.toLocaleString()}+` : '1,200+'} healthcare institutions already saving with our B2B program. Get bulk discounts, flexible credit terms, and a dedicated account manager.
              </p>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:24,maxWidth:440 }}>
                {['8–22% bulk discounts','30–90 day credit terms','Dedicated account manager','Priority order processing','Free installation & training','Custom quotations'].map(f => (
                  <div key={f} style={{ display:'flex',alignItems:'center',gap:8,fontSize:12,color:'rgba(255,255,255,0.8)' }}>
                    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='#4DDBB8' strokeWidth='2.5'><polyline points='20 6 9 17 4 12'/></svg>
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ display:'flex',gap:12,flexWrap:'wrap' }}>
                <button onClick={goToRegister}
                  style={{ padding:'12px 24px',background:'#0E8A6E',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#0c7a61'}
                  onMouseLeave={e=>e.currentTarget.style.background='#0E8A6E'}
                >Register for B2B →</button>
                <button onClick={() => goTo('b2b')}
                  style={{ padding:'12px 24px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.18)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                >Learn more</button>
              </div>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:12,minWidth:160 }}>
              {[
                { value: stats.totalB2BClients > 0 ? `${stats.totalB2BClients.toLocaleString()}+` : '1,200+', label:'Active B2B Clients' },
                { value:'22%',label:'Max Bulk Discount' },
                { value:'90 days',label:'Credit Terms' },
                { value:'24/7',label:'Dedicated Support' },
              ].map(s => (
                <div key={s.label} style={{ background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:16,textAlign:'center' }}>
                  <div style={{ fontSize:22,fontWeight:700 }}>{s.value}</div>
                  <div style={{ fontSize:10,color:'rgba(255,255,255,0.55)',marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section style={{ background:'#F9FAFB',padding:'56px 0' }}>
          <div style={{ maxWidth:1152,margin:'0 auto',padding:'0 24px' }}>
            <div style={{ textAlign:'center',marginBottom:40 }}>
              <p style={{ fontSize:12,color:'#0E8A6E',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>What Our Clients Say</p>
              <h2 style={{ fontSize:'clamp(22px,3vw,28px)',fontWeight:700,fontFamily:'var(--font-lora)' }}>Customer Testimonials</h2>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20 }}>
              {testimonials.map((review,i) => (
                <div key={review._id || i} style={{ background:'#fff',borderRadius:12,border:'1px solid #E5E7EB',padding:24 }}>
                  <div style={{ fontSize:32,color:'#0E8A6E',lineHeight:1,marginBottom:12 }}>&ldquo;</div>
                  <p style={{ fontSize:13,color:'#374151',lineHeight:1.7,marginBottom:16 }}>{review.comment?.slice(0,180)}{review.comment?.length > 180 ? '...' : ''}</p>
                  <div style={{ display:'flex',gap:2,marginBottom:12 }}>
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} width='12' height='12' viewBox='0 0 24 24' fill={s <= review.rating ? '#F59E0B' : '#E5E7EB'}>
                        <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/>
                      </svg>
                    ))}
                  </div>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontSize:13,fontWeight:600 }}>{review.user?.name || 'Verified Customer'}</div>
                      {review.user?.companyName && <div style={{ fontSize:11,color:'#6B7280' }}>{review.user.companyName}</div>}
                    </div>
                    <span style={{ fontSize:10,padding:'3px 8px',borderRadius:20,background:'#E1F5EE',color:'#065F46',fontWeight:600 }}>✓ Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section style={{ background:'#fff',padding:'56px 0' }}>
        <div style={{ maxWidth:1152,margin:'0 auto',padding:'0 24px' }}>
          <div style={{ textAlign:'center',marginBottom:40 }}>
            <p style={{ fontSize:12,color:'#0E8A6E',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>Simple Process</p>
            <h2 style={{ fontSize:'clamp(22px,3vw,28px)',fontWeight:700,fontFamily:'var(--font-lora)' }}>How It Works</h2>
          </div>
          <div className='how-grid' style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:24,position:'relative' }}>
            <div style={{ position:'absolute',top:32,left:'12.5%',right:'12.5%',height:1,background:'#E5E7EB' }} />
            {HOW_IT_WORKS.map(s => (
              <div key={s.step} style={{ textAlign:'center',position:'relative' }}>
                <div style={{ width:64,height:64,background:'#E1F5EE',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 16px',position:'relative',zIndex:1 }}>{s.icon}</div>
                <div style={{ fontSize:10,color:'#0E8A6E',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>{s.step}</div>
                <h3 style={{ fontSize:14,fontWeight:600,marginBottom:8 }}>{s.title}</h3>
                <p style={{ fontSize:12,color:'#6B7280',lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center',marginTop:40 }}>
            <button onClick={() => goTo('product')}
              style={{ padding:'12px 32px',background:'#0B2545',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.background='#0d2d52'}
              onMouseLeave={e=>e.currentTarget.style.background='#0B2545'}
            >Start Shopping →</button>
          </div>
        </div>
      </section>
      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section style={{ background:'linear-gradient(135deg,#0E8A6E 0%,#085041 100%)',padding:'48px 0',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',right:0,top:0,bottom:0,width:300,background:'rgba(255,255,255,0.04)',clipPath:'polygon(30% 0,100% 0,100% 100%,0% 100%)' }} />
        <div className='cta-flex' style={{ maxWidth:1152,margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:24,flexWrap:'wrap' }}>
          <div>
            <h3 style={{ fontSize:'clamp(20px,3vw,26px)',fontWeight:700,color:'#fff',marginBottom:8,fontFamily:'var(--font-lora)' }}>Ready to order? We're here to help.</h3>
            <p style={{ fontSize:13,color:'rgba(255,255,255,0.8)' }}>Call us at +880 1800-MED or chat on WhatsApp for instant assistance.</p>
          </div>
          <div style={{ display:'flex',gap:12,flexWrap:'wrap' }}>
            <button onClick={() => goTo('product')}
              style={{ padding:'12px 24px',background:'#fff',color:'#0E8A6E',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.background='#f0fdf9'}
              onMouseLeave={e=>e.currentTarget.style.background='#fff'}
            >Browse Products</button>
            <a href='https://wa.me/8801800000000' target='_blank' rel='noopener noreferrer'
              style={{ padding:'12px 24px',background:'#25D366',color:'#fff',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:8,textDecoration:'none' }}
            >
              <svg width='14' height='14' viewBox='0 0 24 24' fill='white'><path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z'/><path d='M11.999 2C6.477 2 2 6.477 2 12c0 1.99.583 3.842 1.59 5.399L2 22l4.74-1.556A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 11.999 2zm.001 18a7.965 7.965 0 01-4.184-1.186l-.299-.178-3.104 1.019 1.044-3.018-.197-.312A7.996 7.996 0 014 12c0-4.411 3.588-8 8-8s8 3.589 8 8c0 4.412-3.589 8-8 8z'/></svg>
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}