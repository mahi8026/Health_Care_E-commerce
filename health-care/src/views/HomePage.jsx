'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaStethoscope, 
  FaSyringe, 
  FaFlask, 
  FaHospital, 
  FaMicroscope, 
  FaShieldAlt, 
  FaTooth, 
  FaBone,
  FaTruck,
  FaSnowflake,
  FaTag,
  FaCheckCircle,
  FaTools,
  FaPhoneAlt,
  FaCreditCard,
  FaUndo,
  FaSearch,
  FaShoppingCart,
  FaBox,
  FaIndustry
} from 'react-icons/fa';
import { API } from '@/constants/api';

// ══════════════════════════════════════════════════════════════════════════════
// FALLBACK DATA & CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const FALLBACK_CATEGORIES = [
  { name: 'Diagnostic Equipment', icon: <FaStethoscope />, desc: 'ECG · Ultrasound · Monitors', color: '#EFF6FF' },
  { name: 'Surgical Instruments', icon: <FaSyringe />, desc: 'Instruments · Implants', color: '#F0FDF4' },
  { name: 'Laboratory Reagents', icon: <FaFlask />, desc: 'Clinical · Molecular', color: '#FAF5FF' },
  { name: 'Hospital Machines', icon: <FaHospital />, desc: 'ICU · Ventilators · Dialysis', color: '#FFF7ED' },
  { name: 'Lab Equipment', icon: <FaMicroscope />, desc: 'Centrifuges · Microscopes', color: '#F0FDFA' },
  { name: 'PPE & Safety', icon: <FaShieldAlt />, desc: 'Masks · Gloves · Gowns', color: '#FFF1F2' },
  { name: 'Dental Equipment', icon: <FaTooth />, desc: 'Chairs · Drills', color: '#FFFBEB' },
  { name: 'Implants & Ortho', icon: <FaBone />, desc: 'Bone Plates · Screws', color: '#F8FAFC' },
];

const ANNOUNCEMENTS = [
  { icon: <FaTruck />, text: 'Free delivery on orders over ৳50,000 — Dhaka, Chittagong & Sylhet' },
  { icon: <FaSnowflake />, text: 'Cold chain delivery available for temperature-sensitive reagents' },
  { icon: <FaTag />, text: 'B2B institutions get up to 30% bulk discount — Register today' },
];

const WHY_US = [
  { icon: <FaCheckCircle />, title: 'DGDA Registered', desc: 'All products are DGDA-cleared and meet Bangladesh regulatory standards.' },
  { icon: <FaTruck />, title: 'Fast Delivery', desc: 'Same-day dispatch for orders before 12 PM. Free delivery in Dhaka metro.' },
  { icon: <FaTools />, title: 'Free Installation', desc: 'Professional installation and staff training included for all equipment.' },
  { icon: <FaPhoneAlt />, title: '24/7 Support', desc: 'Dedicated technical support team available round the clock.' },
  { icon: <FaCreditCard />, title: 'Flexible Payment', desc: 'Bank transfer, bKash, Nagad, and B2B credit terms available.' },
  { icon: <FaUndo />, title: '30-Day Returns', desc: 'Hassle-free returns and replacement policy on all products.' },
];

const HOW_IT_WORKS = [
  { step: 1, icon: <FaSearch />, title: 'Browse & Search', desc: 'Find products from 50+ global brands' },
  { step: 2, icon: <FaShoppingCart />, title: 'Add to Cart', desc: 'Get instant quotes and bulk pricing' },
  { step: 3, icon: <FaCreditCard />, title: 'Secure Checkout', desc: 'Multiple payment options available' },
  { step: 4, icon: <FaTruck />, title: 'Fast Delivery', desc: 'Free installation & training included' },
];

// ══════════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function Skeleton({ w = '100%', h = 20, r = 8 }) {
  return (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
  );
}

function ProductCard({ product, onClick }) {
  const img = product.images?.[0]?.url || product.images?.[0];
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const ratingVal = typeof product.rating === 'object' ? product.rating?.average : (product.rating || 0);
  const reviewCount = product.reviewCount || product.rating?.count || 0;
  const discount = product.discountPct || (product.oldPrice && product.price < product.oldPrice 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) 
    : 0);
  
  // Calculate savings amount
  const price = product.price || 0;
  const oldPrice = product.oldPrice || 0;
  const savings = oldPrice > price ? oldPrice - price : 0;
  const hasDiscount = savings > 0 && discount > 0;

  return (
    <div className="product-card-hover" onClick={onClick}
      style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E7EB', cursor: 'pointer' }}>
      <div style={{ position: 'relative', height: 180, background: '#F9FAFB' }}>
        {img ? (
          <img src={img} alt={product.name} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 52 }}>🏥</div>
        )}
        {hasDiscount && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: '#7C3AED',
            color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            Save: {savings.toLocaleString()}৳ (-{discount}%)
          </div>
        )}
      </div>
      <div style={{ padding: 14 }}>
        {brandName && (
          <div style={{ fontSize: 10, color: '#0E8A6E', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
            {brandName}
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 8,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </div>
        {ratingVal > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} style={{ color: s <= Math.round(ratingVal) ? '#F59E0B' : '#E5E7EB', fontSize: 14 }}>★</span>
              ))}
            </div>
            <span style={{ fontSize: 10, color: '#6B7280' }}>({reviewCount})</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0B2545' }}>
            ৳{product.price?.toLocaleString()}
          </span>
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

export default function HomePage() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [typewriterText, setTypewriterText] = useState('Diagnostic Equipment');
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [dealProducts, setDealProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [brands, setBrands] = useState([]);
  const [promo, setPromo] = useState(null);
  const [stats, setStats] = useState({ totalProducts: 0, totalBrands: 50, totalOrders: 0, totalB2BClients: 1200 });
  const [statsStarted, setStatsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  const [testimonials, setTestimonials] = useState([]);
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState('idle');
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState('Search ECG machine...');
  const [labEquipmentProducts, setLabEquipmentProducts] = useState([]);
  
  const statsRef = useRef(null);

  // Animated counters
  const productsCount = useCountUp(stats.totalProducts, 1500, statsStarted);
  const brandsCount = useCountUp(stats.totalBrands, 1500, statsStarted);
  const ordersCount = useCountUp(stats.totalOrders, 1500, statsStarted);
  const clientsCount = useCountUp(stats.totalB2BClients, 1500, statsStarted);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Announcement rotation
  useEffect(() => {
    const t = setInterval(() => setAnnouncementIdx(i => (i + 1) % ANNOUNCEMENTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Sticky navbar
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Typewriter effect
  useEffect(() => {
    const words = ['Diagnostic Equipment', 'Surgical Instruments', 'Laboratory Reagents', 'Hospital Machines'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % words.length;
      setTypewriterText(words[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Hero slider auto-play
  useEffect(() => {
    if (isSliderHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, [isSliderHovered]);

  // Search placeholder cycling
  useEffect(() => {
    const placeholders = ['Search ECG machine...', 'Search HbA1c reagent...', 'Search trocar set...', 'Search pulse oximeter...'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % placeholders.length;
      setSearchPlaceholder(placeholders[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer - counts to midnight
  useEffect(() => {
    const getTimeUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);  // next midnight
      const diff = midnight - now;
      return {
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      };
    };
    
    setTimeLeft(getTimeUntilMidnight()); // set immediately on mount
    
    const t = setInterval(() => {
      setTimeLeft(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Stats counter trigger
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

  // Fetch data
  useEffect(() => {
    const safe = async (p) => {
      try {
        const response = await p;
        const data = await response.json();
        return data;
      } catch {
        return { success: false, data: null };
      }
    };

    Promise.all([
      safe(fetch(`${API}/products?isFeatured=true&limit=24`)),
      safe(fetch(`${API}/products?limit=24`)), // Fallback: all products
      safe(fetch(`${API}/categories`)),
      safe(fetch(`${API}/products/category-counts`)),
      safe(fetch(`${API}/stats`)),
      safe(fetch(`${API}/coupons/active-promo`)),
      safe(fetch(`${API}/products?sortBy=newest&limit=10`)),
      safe(fetch(`${API}/manufacturers`)),
      safe(fetch(`${API}/products?hasDiscount=true&limit=4&sortBy=discountPct`)),
      safe(fetch(`${API}/reviews?isApproved=true&limit=3`)),
      safe(fetch(`${API}/products?category=Lab Equipment&limit=4`)), // Lab equipment products
    ]).then(([featured, allProducts, cats, counts, statsData, promoData, newest, mfrs, deals, reviews, labEquip]) => {
      const fp = featured.data?.products || featured.products || [];
      const ap = allProducts.data?.products || allProducts.products || [];
      // Use featured products if available, otherwise use all products
      const productsToShow = fp.length >= 12 ? fp : ap;
      setFeaturedProducts(productsToShow);
      setFeaturedLoading(false);

      const catList = cats.data?.categories || cats.categories || [];
      setCategories(catList.length > 0 ? catList : FALLBACK_CATEGORIES);
      setCategoryCounts(counts.data || {});

      if (statsData.data) setStats(statsData.data);
      setPromo(promoData.data?.coupon || null);

      const na = newest.data?.products || newest.products || [];
      setNewArrivals(na);

      const mfrList = mfrs.data?.manufacturers || mfrs.manufacturers || [];
      setBrands(mfrList);

      const dealList = deals.data?.products || deals.products || [];
      setDealProducts(dealList);

      const reviewList = reviews.data?.reviews || reviews.reviews || [];
      setTestimonials(reviewList);

      const labEquipList = labEquip.data?.products || labEquip.products || [];
      setLabEquipmentProducts(labEquipList);
    }).catch(() => {
      setFeaturedLoading(false);
      setCategories(FALLBACK_CATEGORIES);
    });

    // Check user auth
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.user) setUser(data.user);
        })
        .catch(() => {});
    }

    // Get cart count
    const cartData = localStorage.getItem('cart');
    if (cartData) {
      try {
        const cart = JSON.parse(cartData);
        setCartCount(cart.items?.length || 0);
      } catch {}
    }
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  }, [searchQuery, router]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setFeaturedLoading(true);
    const featuredUrl = tab === 'all' 
      ? `${API}/products?isFeatured=true&limit=24`
      : `${API}/products?category=${encodeURIComponent(tab)}&isFeatured=true&limit=24`;
    const fallbackUrl = tab === 'all' 
      ? `${API}/products?limit=24`
      : `${API}/products?category=${encodeURIComponent(tab)}&limit=24`;
    
    // Try featured first, fallback to all products if not enough
    Promise.all([
      fetch(featuredUrl).then(r => r.json()),
      fetch(fallbackUrl).then(r => r.json())
    ]).then(([featuredData, fallbackData]) => {
      const featured = featuredData.data?.products || featuredData.products || [];
      const fallback = fallbackData.data?.products || fallbackData.products || [];
      const products = featured.length >= 12 ? featured : fallback;
      setFeaturedProducts(products);
      setFeaturedLoading(false);
    }).catch(() => setFeaturedLoading(false));
  }, []);

  const handleSubscribe = useCallback(async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setSubscribeStatus('error');
      return;
    }
    setSubscribeStatus('loading');
    try {
      const response = await fetch(`${API}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setSubscribeStatus('success');
        setEmail('');
      } else {
        setSubscribeStatus('error');
      }
    } catch {
      setSubscribeStatus('error');
    }
  }, [email]);

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Global Styles */}
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.3); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes drift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(30px, -30px); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
        .marquee-wrap { overflow: hidden; }
        .marquee-track { display: flex; animation: marquee 25s linear infinite; width: max-content; }
        .marquee-track:hover { animation-play-state: paused; }
        .product-card-hover { transition: box-shadow 0.2s, transform 0.2s; }
        .product-card-hover:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.12); transform: translateY(-3px); }
        .cat-tile { transition: all 0.2s; }
        .cat-tile:hover { border-color: #0E8A6E !important; }
        .cat-tile:hover .cat-tile-arrow { opacity: 1 !important; transform: translateX(3px) !important; }
        .section-in { animation: fadeInUp 0.5s ease both; }
        .tab-active { background: #0B2545 !important; color: #fff !important; }
        .pill-hover:hover { background: rgba(255,255,255,0.2) !important; }
        .btn-primary-hover:hover { background: #0a1f3d !important; }
        .btn-teal-hover:hover { background: #0c7a61 !important; transform: scale(1.02); }
        .trust-item { transition: transform 0.2s; }
        .trust-item:hover { transform: translateY(-2px); }
        .hero-content > * { animation: slideIn 0.6s ease forwards; opacity: 0; }
        .hero-content > *:nth-child(1) { animation-delay: 0.1s; }
        .hero-content > *:nth-child(2) { animation-delay: 0.2s; }
        .hero-content > *:nth-child(3) { animation-delay: 0.3s; }
        .hero-content > *:nth-child(4) { animation-delay: 0.4s; }
        .hero-content > *:nth-child(5) { animation-delay: 0.5s; }
        .hero-content > *:nth-child(6) { animation-delay: 0.6s; }
        .hero-content > *:nth-child(7) { animation-delay: 0.7s; }
        .floating-card { animation: float 3s ease-in-out infinite; }
        .orb-drift { animation: drift 20s ease-in-out infinite; }
        .slide-active { animation: scaleIn 0.6s ease forwards; }
        .typewriter-text { animation: fadeSlide 0.5s ease forwards; }
        .hero-grid-container { width: 100%; }
        /* Custom scrollbar for category navigation */
        *::-webkit-scrollbar { height: 6px; }
        *::-webkit-scrollbar-track { background: #F3F4F6; border-radius: 10px; }
        *::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 10px; }
        *::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
        @media (max-width: 1024px) {
          .hero-grid-container { grid-template-columns: 1fr !important; gap: 40px !important; }
          .hero-right-panel { display: none !important; }
          .prod-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .cat-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .prod-grid-4 { grid-template-columns: 1fr !important; }
          .stats-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .trust-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .b2b-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* WORLD-CLASS HERO SECTION WITH ANIMATED SLIDER */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: '#0B2545',
        position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 0 80px'
      }}>
        {/* Dot grid texture */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)',
          backgroundSize: '28px 28px', pointerEvents: 'none', zIndex: 1 }} />
        {/* Animated glow orbs */}
        <div className="orb-drift" style={{ position: 'absolute', top: '-10%', right: '25%', width: 500, height: 500,
          background: 'radial-gradient(circle, #0E8A6E 0%, transparent 70%)', opacity: 0.12, pointerEvents: 'none', zIndex: 1 }} />
        <div className="orb-drift" style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: 400, height: 400,
          background: 'radial-gradient(circle, #4DDBB8 0%, transparent 70%)', opacity: 0.07, pointerEvents: 'none', animationDelay: '-10s', zIndex: 1 }} />

        <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: '0 24px',
          position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60,
          alignItems: 'center', zIndex: 2 }}
          className="hero-grid-container">

          {/* ═══════════════════ LEFT SIDE: CONTENT PANEL ═══════════════════ */}
          <div className="hero-content" style={{ position: 'relative', zIndex: 3 }}>
            
            {/* Trust badge with pulsing dot */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24,
              background: 'rgba(14,138,110,0.12)', border: '1px solid rgba(77,219,184,0.25)',
              borderRadius: 999, padding: '8px 20px' }}>
              <span style={{ width: 8, height: 8, background: '#4DDBB8', borderRadius: '50%',
                display: 'inline-block', animation: 'pulse-dot 2s ease infinite' }} />
              <span style={{ fontSize: 11, color: '#4DDBB8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                DGDA Registered · ISO 13485 · Trusted by {stats.totalB2BClients > 0 ? `${stats.totalB2BClients.toLocaleString()}+` : '1,200+'} Hospitals
              </span>
            </div>

            {/* Main Headline (3 lines) */}
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 4vw, 52px)',
              fontWeight: 400, lineHeight: 1.15, color: '#fff', marginBottom: 20 }}>
              Bangladesh's Most Trusted<br />
              <span key={typewriterText} className="typewriter-text" style={{ color: '#4DDBB8', display: 'inline-block',
                fontWeight: 700, minWidth: '18ch' }}>{typewriterText}</span><br />
              <span style={{ color: '#fff', fontWeight: 400 }}>Supplier</span>
            </h1>

            {/* Sub-description */}
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8,
              marginBottom: 32, maxWidth: 560 }}>
              Premium diagnostic devices, surgical instruments, laboratory reagents and hospital machines
              from <strong style={{ color: '#fff' }}>{stats.totalBrands > 0 ? `${stats.totalBrands}+` : '50+'} world-leading brands</strong>.
              Serving hospitals and clinics nationwide with DGDA-cleared genuine products.
            </p>

            {/* CTA Buttons row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
              <button className="btn-teal-hover" onClick={() => router.push('/products')}
                style={{ padding: '14px 32px', background: '#0E8A6E', color: '#fff', border: 'none',
                  borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(14,138,110,0.3)' }}>
                Browse Products →
              </button>
              <button onClick={() => router.push('/register?type=b2b')}
                style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}>
                Register B2B Account
              </button>
              <button onClick={() => router.push('/quote')}
                style={{ padding: '14px 24px', background: 'transparent', border: 'none',
                  color: '#4DDBB8', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                Get a Quote <span style={{ fontSize: 16 }}>→</span>
              </button>
            </div>

            {/* Large Search Bar with Category Dropdown */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.12)', borderRadius: 12,
              overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', marginBottom: 16,
              backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <select style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff',
                fontSize: 13, padding: '14px 16px', outline: 'none', fontFamily: 'inherit',
                cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="">All Categories</option>
                <option value="diagnostic">Diagnostic</option>
                <option value="surgical">Surgical</option>
                <option value="reagents">Reagents</option>
                <option value="hospital">Hospital</option>
              </select>
              <input placeholder={searchPlaceholder}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff',
                  fontSize: 14, padding: '14px 18px', outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={handleSearch}
                style={{ background: '#0E8A6E', color: '#fff', border: 'none', padding: '14px 28px',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#0c7a61'}
                onMouseLeave={e => e.currentTarget.style.background = '#0E8A6E'}>
                Search
              </button>
            </div>

            {/* Popular search pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 32 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Popular:</span>
              {['ECG Machine', 'N95 Mask', 'HbA1c Kit', 'Trocar Set', 'Pulse Oximeter', 'Centrifuge'].map(t => (
                <span key={t} className="pill-hover"
                  onClick={() => router.push(`/search?q=${encodeURIComponent(t)}`)}
                  style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 20, padding: '5px 14px', cursor: 'pointer', transition: 'all 0.2s',
                    background: 'rgba(255,255,255,0.05)' }}>
                  {t}
                </span>
              ))}
            </div>

          </div>

          {/* ═══════════════════ RIGHT SIDE: ANIMATED SLIDER PANEL ═══════════════════ */}
          <div className="hero-right-panel" style={{ position: 'relative', height: '600px', maxHeight: '80vh', zIndex: 3 }}
            onMouseEnter={() => setIsSliderHovered(true)}
            onMouseLeave={() => setIsSliderHovered(false)}>
            
            {/* Slide counter */}
            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10,
              color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600,
              background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: 20,
              backdropFilter: 'blur(10px)' }}>
              {String(currentSlide + 1).padStart(2, '0')} / 04
            </div>

            {/* SLIDE 1: Diagnostic Equipment */}
            {currentSlide === 0 && (
              <div className="slide-active" style={{ position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, #0d3162 0%, #0B2545 100%)',
                borderRadius: 24, padding: 40, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center' }}>
                
                {/* Central illustration */}
                <div style={{ position: 'relative', marginBottom: 40 }}>
                  <div style={{ width: 300, height: 300, borderRadius: '50%',
                    border: '2px solid rgba(77,219,184,0.3)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 60px rgba(77,219,184,0.2)' }}>
                    <div style={{ fontSize: 80 }}>🩺</div>
                  </div>
                  
                  {/* Floating cards */}
                  <div className="floating-card" style={{ position: 'absolute', top: 20, left: -40,
                    background: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: 11,
                    fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    animationDelay: '0s' }}>
                    ❤️ Heart Rate: 72 bpm
                  </div>
                  <div className="floating-card" style={{ position: 'absolute', top: 30, right: -30,
                    background: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: 11,
                    fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    animationDelay: '1s' }}>
                    ✓ SpO2: 98%
                  </div>
                  <div className="floating-card" style={{ position: 'absolute', bottom: 20, left: '50%',
                    transform: 'translateX(-50%)', background: '#10B981', color: '#fff',
                    padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)', animationDelay: '0.5s' }}>
                    ✓ ECG Normal
                  </div>
                </div>

                {/* Content */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#4DDBB8', fontWeight: 600, marginBottom: 8,
                    textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    🩺 Diagnostic Equipment
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                    ECG · Ultrasound · Patient Monitors
                  </h3>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
                    Siemens · GE · Philips · Mindray
                  </div>
                  <button onClick={() => router.push('/products?category=Diagnostic+Equipment')}
                    style={{ padding: '10px 24px', background: '#0E8A6E', color: '#fff',
                      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    Shop Diagnostic →
                  </button>
                </div>
              </div>
            )}

            {/* SLIDE 2: Laboratory Reagents */}
            {currentSlide === 1 && (
              <div className="slide-active" style={{ position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, #2d1b69 0%, #0B2545 100%)',
                borderRadius: 24, padding: 40, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center' }}>
                
                <div style={{ position: 'relative', marginBottom: 40 }}>
                  <div style={{ width: 300, height: 300, borderRadius: '50%',
                    border: '2px solid rgba(147,51,234,0.3)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 60px rgba(147,51,234,0.2)' }}>
                    <div style={{ fontSize: 80 }}>🧪</div>
                  </div>
                  
                  <div className="floating-card" style={{ position: 'absolute', top: 30, left: -30,
                    background: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: 11,
                    fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    ✓ HbA1c: 5.2% Normal
                  </div>
                  <div className="floating-card" style={{ position: 'absolute', top: 40, right: -40,
                    background: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: 11,
                    fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    animationDelay: '1s' }}>
                    CBC Results Ready
                  </div>
                  <div className="floating-card" style={{ position: 'absolute', bottom: 30, left: '50%',
                    transform: 'translateX(-50%)', background: '#10B981', color: '#fff',
                    padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    animationDelay: '0.5s' }}>
                    Troponin: Negative
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#A78BFA', fontWeight: 600, marginBottom: 8,
                    textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    🧪 Laboratory Reagents
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                    HbA1c · CBC · Troponin · PCR Kits
                  </h3>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
                    Roche · Abbott · Beckman · Randox
                  </div>
                  <button onClick={() => router.push('/products?category=Laboratory+Reagents')}
                    style={{ padding: '10px 24px', background: '#8B5CF6', color: '#fff',
                      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    Shop Reagents →
                  </button>
                </div>
              </div>
            )}

            {/* SLIDE 3: Hospital Machines */}
            {currentSlide === 2 && (
              <div className="slide-active" style={{ position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, #1a0a00 0%, #0B2545 100%)',
                borderRadius: 24, padding: 40, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center' }}>
                
                <div style={{ position: 'relative', marginBottom: 40 }}>
                  <div style={{ width: 300, height: 300, borderRadius: '50%',
                    border: '2px solid rgba(251,146,60,0.3)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 60px rgba(251,146,60,0.2)' }}>
                    <div style={{ fontSize: 80 }}>🏥</div>
                  </div>
                  
                  <div className="floating-card" style={{ position: 'absolute', top: 20, left: -40,
                    background: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: 11,
                    fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    ✓ Ventilator: Ready
                  </div>
                  <div className="floating-card" style={{ position: 'absolute', top: 30, right: -30,
                    background: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: 11,
                    fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    animationDelay: '1s' }}>
                    ICU Bed 1: Monitored
                  </div>
                  <div className="floating-card" style={{ position: 'absolute', bottom: 20, left: '50%',
                    transform: 'translateX(-50%)', background: '#10B981', color: '#fff',
                    padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    animationDelay: '0.5s' }}>
                    O2 Saturation: 99%
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#FB923C', fontWeight: 600, marginBottom: 8,
                    textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    🏥 Hospital Machines
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                    Ventilators · Dialysis · ICU Equipment
                  </h3>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
                    Dräger · Fresenius · Medtronic · Mindray
                  </div>
                  <button onClick={() => router.push('/products?category=Hospital+Machines')}
                    style={{ padding: '10px 24px', background: '#EA580C', color: '#fff',
                      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    Shop Hospital →
                  </button>
                </div>
              </div>
            )}

            {/* SLIDE 4: Surgical Instruments */}
            {currentSlide === 3 && (
              <div className="slide-active" style={{ position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, #0a1f0a 0%, #0B2545 100%)',
                borderRadius: 24, padding: 40, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center' }}>
                
                <div style={{ position: 'relative', marginBottom: 40 }}>
                  <div style={{ width: 300, height: 300, borderRadius: '50%',
                    border: '2px solid rgba(16,185,129,0.3)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 60px rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize: 80 }}>💉</div>
                  </div>
                  
                  <div className="floating-card" style={{ position: 'absolute', top: 30, left: -30,
                    background: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: 11,
                    fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    ✓ Sterile: Certified
                  </div>
                  <div className="floating-card" style={{ position: 'absolute', top: 40, right: -40,
                    background: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: 11,
                    fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    animationDelay: '1s' }}>
                    CE Marked
                  </div>
                  <div className="floating-card" style={{ position: 'absolute', bottom: 30, left: '50%',
                    transform: 'translateX(-50%)', background: '#10B981', color: '#fff',
                    padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    animationDelay: '0.5s' }}>
                    ISO 13485
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#34D399', fontWeight: 600, marginBottom: 8,
                    textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    💉 Surgical Instruments
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                    Forceps · Trocars · Implants · Sutures
                  </h3>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
                    Ethicon · Stryker · Aesculap · Medtronic
                  </div>
                  <button onClick={() => router.push('/products?category=Surgical+Instruments')}
                    style={{ padding: '10px 24px', background: '#10B981', color: '#fff',
                      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    Shop Surgical →
                  </button>
                </div>
              </div>
            )}

            {/* Dot indicators */}
            <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 8, zIndex: 10 }}>
              {[0, 1, 2, 3].map(i => (
                <button key={i} onClick={() => setCurrentSlide(i)}
                  style={{ width: currentSlide === i ? 32 : 10, height: 10,
                    borderRadius: 999, border: 'none', cursor: 'pointer',
                    background: currentSlide === i ? '#4DDBB8' : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.3s' }} />
              ))}
            </div>

            {/* Navigation arrows */}
            <button onClick={() => setCurrentSlide(prev => (prev - 1 + 4) % 4)}
              style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 20,
                cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)',
                opacity: isSliderHovered ? 1 : 0 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
              ‹
            </button>
            <button onClick={() => setCurrentSlide(prev => (prev + 1) % 4)}
              style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 20,
                cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)',
                opacity: isSliderHovered ? 1 : 0 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
              ›
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: TRUST BAR */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
          {[
            { icon: <FaCheckCircle size={28} />, title: 'DGDA Registered', sub: 'All products certified' },
            { icon: <FaTruck size={28} />, title: 'Free Delivery', sub: 'Orders over ৳50,000' },
            { icon: <FaTools size={28} />, title: 'Free Installation', sub: 'Dhaka metro area' },
            { icon: <FaUndo size={28} />, title: '30-Day Returns', sub: 'Hassle-free policy' },
            { icon: <FaPhoneAlt size={28} />, title: '24/7 Support', sub: 'Technical assistance' },
          ].map(t => (
            <div key={t.title} className="trust-item" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8, color: '#0E8A6E' }}>{t.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{t.title}</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>{t.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: CATEGORY NAVIGATION (Othoba-style circular icons) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '32px 0', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Our Catalog</p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, margin: 0 }}>
                Shop by Category
              </h2>
            </div>
          </div>
          
          {/* Horizontal scrollable category circles */}
          <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 8,
            scrollbarWidth: 'thin', scrollbarColor: '#E5E7EB transparent' }}>
            {[
              { name: 'Lab Reagents', emoji: '🧪', color: '#FAF5FF', path: '/products?category=Laboratory+Reagents' },
              { name: 'Hospital Machines', emoji: '🏥', color: '#FFF7ED', path: '/products?category=Hospital+Machines' },
              { name: 'Lab Equipment', emoji: '🔬', color: '#F0FDFA', path: '/products?category=Lab+Equipment' },
              { name: 'PPE & Safety', emoji: '🛡️', color: '#FFF1F2', path: '/products?category=PPE' },
              { name: 'Implants', emoji: '🦴', color: '#F8FAFC', path: '/products?category=Implants' },
              { name: 'Diagnostic', emoji: '🩺', color: '#EFF6FF', path: '/products?category=Diagnostic+Equipment' },
              { name: 'Surgical', emoji: '💉', color: '#F0FDF4', path: '/products?category=Surgical+Instruments' },
            ].map(cat => (
              <div key={cat.name} onClick={() => router.push(cat.path)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  minWidth: 100, cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                {/* Circular icon */}
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: cat.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, marginBottom: 10, border: '2px solid #E5E7EB',
                  transition: 'all 0.2s' }}>
                  {cat.emoji}
                </div>
                {/* Category name */}
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151',
                  textAlign: 'center', lineHeight: 1.3 }}>
                  {cat.name}
                </span>
              </div>
            ))}
            
            {/* View All button */}
            <div onClick={() => router.push('/products')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                minWidth: 100, cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0E8A6E, #4DDBB8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, marginBottom: 10, border: '2px solid #0E8A6E',
                color: '#fff', fontWeight: 700 }}>
                →
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0E8A6E',
                textAlign: 'center' }}>
                View All
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: PROMO BANNER (conditional) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {promo && (
        <div style={{ background: 'linear-gradient(90deg, #085041, #0E8A6E, #085041)',
          padding: '14px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 20, flexWrap: 'wrap', position: 'relative' }}>
          <span style={{ fontSize: 20 }}>🏷️</span>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
            Limited time: Use code{' '}
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px',
              borderRadius: 5, fontWeight: 800, fontSize: 16, letterSpacing: '0.05em' }}>
              {promo.code}
            </span>
            {' '}for {promo.type === 'percentage' ? `${promo.value}% off` : `৳${promo.value} off`}
            {promo.description ? ` — ${promo.description}` : ''}
          </div>
          <button onClick={() => { navigator.clipboard.writeText(promo.code); alert('Code copied!'); }}
            style={{ background: '#fff', color: '#0E8A6E', border: 'none', padding: '6px 14px',
              borderRadius: 16, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Copy code
          </button>
          <button onClick={() => router.push('/products')}
            style={{ background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.6)',
              padding: '6px 14px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Shop now →
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 7: DEAL OF THE DAY */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {dealProducts.length > 0 && (
        <section style={{ background: '#0B2545', padding: '32px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: '#4DDBB8', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  🔥 Flash Deals
                </div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700,
                  color: '#fff', margin: 0 }}>Deal of the Day</h2>
              </div>
              {/* Countdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Ends in:</span>
                {[
                  { val: timeLeft.h, label: 'hrs' },
                  { val: timeLeft.m, label: 'min' },
                  { val: timeLeft.s, label: 'sec' },
                ].map((t, i) => (
                  <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: i > 0 ? 6 : 0 }}>
                    {i > 0 && <span style={{ color: '#4DDBB8', fontWeight: 700, fontSize: 18 }}>:</span>}
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8,
                      padding: '8px 12px', textAlign: 'center', minWidth: 52 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#4DDBB8', lineHeight: 1 }}>
                        {String(t.val).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{t.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/products?sortBy=discount')}
                style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: 8,
                  fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                See all deals →
              </button>
            </div>

            {/* 4 deal product cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {dealProducts.slice(0, 4).map(product => (
                <ProductCard key={product._id} product={product} onClick={() => router.push(`/products/${product._id}`)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 8: FEATURED PRODUCTS (tabbed) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#F8FAFC', padding: '48px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Hand-picked</p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, margin: 0 }}>Featured Products</h2>
            </div>
            <button onClick={() => router.push('/products')}
              style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
              View all →
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All Products' },
              { key: 'Diagnostic Equipment', label: '🩺 Diagnostic' },
              { key: 'Surgical Instruments', label: '💉 Surgical' },
              { key: 'Laboratory Reagents', label: '🧪 Reagents' },
              { key: 'Hospital Machines', label: '🏥 Machines' },
            ].map(tab => (
              <button key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={activeTab === tab.key ? 'tab-active' : ''}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #E5E7EB',
                  background: activeTab === tab.key ? '#0B2545' : '#fff',
                  color: activeTab === tab.key ? '#fff' : '#374151',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Products grid */}
          {featuredLoading
            ? <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
                <div style={{ width: 36, height: 36, border: '3px solid #E5E7EB',
                  borderTopColor: '#0B2545', borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite' }} />
                <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
              </div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {featuredProducts.map(p => (
                  <ProductCard key={p._id} product={p} onClick={() => router.push(`/products/${p._id}`)} />
                ))}
              </div>
          }
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 9: NEW ARRIVALS (horizontal scroll) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section style={{ padding: '40px 0', background: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 24px', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Just Arrived</p>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, margin: 0 }}>
                  New Arrivals
                </h2>
              </div>
              <button onClick={() => router.push('/products?sortBy=newest')}
                style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 500, background: 'none',
                  border: 'none', cursor: 'pointer' }}>View all →</button>
            </div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 24px 16px',
              scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {newArrivals.map(p => {
                const img = p.images?.[0]?.url || p.images?.[0];
                return (
                  <div key={p._id} className="product-card-hover"
                    onClick={() => router.push(`/products/${p._id}`)}
                    style={{ minWidth: 180, maxWidth: 180, background: '#fff', borderRadius: 12,
                      border: '1px solid #E5E7EB', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ height: 160, background: '#F9FAFB', position: 'relative', overflow: 'hidden' }}>
                      {img
                        ? <img src={img} alt={p.name} loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                            height: '100%', fontSize: 40 }}>🏥</div>
                      }
                      <span style={{ position: 'absolute', top: 8, left: 8, background: '#0E8A6E',
                        color: '#fff', fontSize: 9, padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>
                        ✨ NEW
                      </span>
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0B2545' }}>
                        ৳{p.price?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 10: TOP LAB EQUIPMENT (Curated) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#F8FAFC', padding: '48px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>CURATED</p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, margin: 0 }}>
                Top lab equipment
              </h2>
            </div>
            <button onClick={() => router.push('/products?category=Lab+Equipment')}
              style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 600, background: 'none',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              Shop all <span style={{ fontSize: 16 }}>→</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
            {/* Left: Category card */}
            <div style={{ background: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)',
              borderRadius: 16, padding: '28px 24px', display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', border: '1px solid #99F6E4' }}>
              <div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔬</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B2545', marginBottom: 8 }}>
                  LAB EQUIPMENT
                </h3>
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>
                  Centrifuges, Balances &<br />PCR Systems
                </p>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>ISO Certified</span> · Lab Grade
                </div>
              </div>
              <button onClick={() => router.push('/products?category=Lab+Equipment')}
                style={{ width: '100%', padding: '12px', background: '#0D9488', color: '#fff',
                  border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#0F766E'}
                onMouseLeave={e => e.currentTarget.style.background = '#0D9488'}>
                Shop All →
              </button>
            </div>

            {/* Right: Product grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {labEquipmentProducts.slice(0, 4).map(product => {
                const img = product.images?.[0]?.url || product.images?.[0];
                const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
                return (
                  <div key={product._id} className="product-card-hover"
                    onClick={() => router.push(`/products/${product._id}`)}
                    style={{ background: '#fff', borderRadius: 12, overflow: 'hidden',
                      border: '1px solid #E5E7EB', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', height: 160, background: '#F9FAFB' }}>
                      {img ? (
                        <img src={img} alt={product.name} loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                          height: '100%', fontSize: 48 }}>🔬</div>
                      )}
                    </div>
                    <div style={{ padding: 14 }}>
                      {brandName && (
                        <div style={{ fontSize: 10, color: '#0D9488', fontWeight: 600,
                          textTransform: 'uppercase', marginBottom: 4 }}>
                          {brandName}
                        </div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 8,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden', minHeight: 36 }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0B2545' }}>
                        ৳{product.price?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Show message if no products found */}
              {labEquipmentProducts.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔬</div>
                  <p style={{ fontSize: 14, marginBottom: 8 }}>No lab equipment products available yet</p>
                  <button onClick={() => router.push('/products')}
                    style={{ fontSize: 13, color: '#0E8A6E', fontWeight: 600, background: 'none',
                      border: '1px solid #0E8A6E', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
                    Browse All Products
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 11: BRAND MARQUEE */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB',
        background: '#F8FAFC', padding: '24px 0' }}>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
          Authorised distributor of world-leading brands
        </p>
        <div className="marquee-wrap">
          <div className="marquee-track">
            {[...brands, ...brands].map((brand, i) => (
              <div key={i} style={{ padding: '0 40px', fontSize: 14, fontWeight: 600,
                color: '#374151', whiteSpace: 'nowrap', borderRight: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', height: 36 }}>
                {typeof brand === 'object' && brand.logo?.url
                  ? <img src={brand.logo.url} alt={brand.name} style={{ height: 24, objectFit: 'contain' }} />
                  : (typeof brand === 'string' ? brand : brand.name)
                }
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 12: WHY MEDCORE BD */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: '#0E8A6E', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Why MedCore BD</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, margin: 0 }}>
            The MedCore Advantage
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', marginTop: 10, maxWidth: 500, margin: '10px auto 0' }}>
            Trusted by over {stats.totalB2BClients > 0 ? `${stats.totalB2BClients.toLocaleString()}+` : '1,200+'} hospitals and clinics across Bangladesh for genuine medical supplies
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {WHY_US.map((w, i) => (
            <div key={w.title} className="section-in"
              style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB',
                padding: '28px 24px', animationDelay: `${i * 0.08}s`, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0E8A6E'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(14,138,110,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ fontSize: 40, marginBottom: 16, color: '#0E8A6E' }}>{w.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{w.title}</h3>
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 13: ANIMATED STATS COUNTER */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section ref={statsRef} style={{ background: '#0B2545', padding: '56px 24px' }}>
        <div className="stats-grid-4" style={{ maxWidth: 1200, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { count: productsCount, suffix: '+', label: 'Products Available', icon: <FaBox size={28} /> },
            { count: brandsCount, suffix: '+', label: 'Global Brands', icon: <FaIndustry size={28} /> },
            { count: clientsCount, suffix: '+', label: 'B2B Clients', icon: <FaHospital size={28} /> },
            { count: ordersCount, suffix: '+', label: 'Orders Fulfilled', icon: <FaTruck size={28} /> },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '28px 16px',
              background: 'rgba(255,255,255,0.05)', borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 32, marginBottom: 12, color: '#4DDBB8' }}>{s.icon}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 44, fontWeight: 700,
                color: '#4DDBB8', lineHeight: 1 }}>
                {s.count > 0 ? `${s.count.toLocaleString()}${s.suffix}` : '—'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 10 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 14: B2B PROGRAM BANNER */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #0B2545 0%, #0d3162 100%)',
          borderRadius: 24, padding: '48px', overflow: 'hidden', position: 'relative' }}>
          {/* Background decoration */}
          <div style={{ position: 'absolute', top: '-20%', right: '10%', width: 400, height: 400,
            background: 'radial-gradient(circle, #0E8A6E, transparent 70%)', opacity: 0.15 }} />
          <div className="b2b-cols" style={{ position: 'relative', display: 'grid',
            gridTemplateColumns: '1fr 220px', gap: 40, alignItems: 'center' }}>
            {/* Left */}
            <div>
              <span style={{ fontSize: 11, background: 'rgba(77,219,184,0.2)', color: '#4DDBB8',
                padding: '4px 14px', borderRadius: 999, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em' }}>B2B Program</span>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700,
                color: '#fff', margin: '14px 0 12px' }}>
                Exclusive Benefits for<br />Hospitals & Clinics
              </h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 24, lineHeight: 1.8 }}>
                Join {stats.totalB2BClients > 0 ? `${stats.totalB2BClients.toLocaleString()}+` : '1,200+'} healthcare institutions saving with our B2B program.
                Get bulk discounts, flexible credit terms, and a dedicated account manager.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 460, marginBottom: 28 }}>
                {['8–22% bulk discounts', '30–90 day credit terms',
                  'Dedicated account manager', 'Priority order processing',
                  'Free installation & training', 'Custom quotations'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                    <span style={{ color: '#4DDBB8', fontWeight: 700 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn-teal-hover"
                  onClick={() => router.push('/register?type=b2b')}
                  style={{ padding: '13px 28px', background: '#0E8A6E', color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Register for B2B →
                </button>
                <button onClick={() => router.push('/b2b')}
                  style={{ padding: '13px 24px', background: 'rgba(255,255,255,0.1)',
                    border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff',
                    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                  Learn more
                </button>
              </div>
            </div>
            {/* Right stat boxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { val: stats.totalB2BClients > 0 ? `${stats.totalB2BClients.toLocaleString()}+` : '1,200+', label: 'Active B2B Clients' },
                { val: '30%', label: 'Max Bulk Discount' },
                { val: '90 days', label: 'Credit Terms' },
                { val: '24/7', label: 'Dedicated Support' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                  padding: '14px 18px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{s.label}</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#4DDBB8' }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* FOOTER - Add your footer component here */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
    </div>
  );
}
